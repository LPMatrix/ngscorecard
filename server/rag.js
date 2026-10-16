// Retrieval for the Q&A assistant: chunk, store, and rank government documents.
//
// Works against both clients the app uses: better-sqlite3 (local dev, sync) and
// @libsql/client (Turso, async). Every call goes through all()/run() below so
// the libSQL promises are always awaited; skipping the await there used to make
// retrieval throw inside a catch and silently fall back to model memory.

// Simple tokenizer for keyword extraction
const STOPWORDS = new Set([
  'is', 'it', 'in', 'on', 'at', 'to', 'of', 'be', 'by', 'as', 'an', 'or', 'if', 'do', 'so',
  'no', 'we', 'my', 'me', 'am', 'up',
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our',
  'out', 'has', 'have', 'had', 'how', 'what', 'when', 'where', 'who', 'why', 'which', 'will',
  'with', 'this', 'that', 'from', 'they', 'been', 'does', 'did', 'its', 'any', 'get', 'about',
  'into', 'than', 'then', 'there', 'their', 'them', 'your', 'should', 'would', 'could',
])

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w))
    .map(stem)
}

// Plural folding only ("taxes" -> "tax", "services" -> "service"). Kept this
// small on purpose: both the question and the documents go through it, so it
// only has to be consistent, not linguistically complete.
function stem(w) {
  if (w.length <= 3) return w
  if (/(x|ch|sh|z|ss)es$/.test(w)) return w.slice(0, -2)
  if (w.endsWith('s') && !/(ss|us|is)$/.test(w)) return w.slice(0, -1)
  return w
}

// --- client helpers ---------------------------------------------------------

async function all(dbClient, sql, args = []) {
  if (dbClient.prepare) return dbClient.prepare(sql).all(...args)
  const result = await dbClient.execute({ sql, args })
  return result.rows.map(row =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
  )
}

async function run(dbClient, sql, args = []) {
  if (dbClient.prepare) {
    return Number(dbClient.prepare(sql).run(...args).lastInsertRowid)
  }
  const result = await dbClient.execute({ sql, args })
  return Number(result.lastInsertRowid)
}

// --- chunking ---------------------------------------------------------------

const approxTokens = (text) => Math.ceil(text.length / 4) // rough: 1 token ~ 4 chars

// Target chunk size. Small documents are split at headings into many tiny
// pieces, and a question usually needs several of them (the steps, the fee, the
// timeline), so neighbouring sections are merged up to this size. Measured with
// `npm run eval:rag` on 120/200/300/500: 200 had the best ranking (MRR 0.91) and
// 200-500 tied on answer-text recall (92%), so the smaller size also keeps
// prompts short. Treat it as a plateau, not a sharp optimum; re-measure if the
// corpus changes shape (longer documents, different structure).
export const DEFAULT_CHUNK_TOKENS = 200

// Split a document into sections at markdown headings. A section keeps its
// heading line(s); a heading with no body of its own (a "# Title" straight
// above "## Overview") is carried into the next section, and text before the
// first heading becomes "Main".
function extractSections(text) {
  const sections = []
  let name = 'Main'
  let headingLines = []
  let body = []
  let carried = []

  const flush = () => {
    const lines = body.map(l => l.trim()).filter(Boolean)
    if (lines.length) {
      sections.push({ name: headingLines.length ? name : 'Main', headings: [...carried, ...headingLines], body: lines })
      carried = []
    } else if (headingLines.length) {
      carried.push(...headingLines)
    }
    headingLines = []
    body = []
  }

  for (const raw of String(text ?? '').split('\n')) {
    const heading = raw.match(/^#+\s+(.+)$/)
    if (heading) {
      flush()
      name = heading[1].trim()
      headingLines = [raw.trim()]
    } else {
      body.push(raw)
    }
  }
  flush()

  return { sections, trailingHeadings: carried }
}

// A sentence ends at . ! ? followed by whitespace and then something that
// starts a sentence. Periods inside "lirs.gov.ng", "7.5" or "1." list markers
// are therefore not boundaries.
const SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/

// Break one over-long line into pieces no larger than maxTokens. Prefers
// sentence boundaries, falls back to words. Never drops text.
function splitLongLine(line, maxTokens) {
  const pieces = []
  let current = ''

  const push = (part) => {
    if (current && approxTokens(current) + approxTokens(part) + 1 > maxTokens) {
      pieces.push(current)
      current = ''
    }
    current = current ? `${current} ${part}` : part
  }

  for (const sentence of line.split(SENTENCE_BOUNDARY)) {
    if (approxTokens(sentence) <= maxTokens) {
      push(sentence)
      continue
    }
    for (const word of sentence.split(/\s+/)) push(word)
  }
  if (current) pieces.push(current)
  return pieces
}

// Chunk text into pieces of at most ~maxChunkSize tokens.
//  - Each line (a list item or paragraph) is kept whole, and a section's
//    heading stays with its body, so a chunk reads "Step 3: Submit Application"
//    followed by what the step says.
//  - Whole sections are packed together until the size limit, so related
//    sections (steps, fees, timeline) land in the same chunk.
//  - A section larger than the limit is split by lines, with its heading
//    repeated on every piece; only a single line longer than the limit is
//    split further.
//  - No text is dropped.
// `section` on a chunk is the first section it contains.
export function chunkText(text, maxChunkSize = DEFAULT_CHUNK_TOKENS) {
  const { sections, trailingHeadings } = extractSections(text)
  const chunks = []

  let current = null // { section, lines, tokens }
  const flush = () => {
    if (current) chunks.push({ text: current.lines.join('\n'), section: current.section, tokens: current.tokens })
    current = null
  }
  const add = (section, lines) => {
    const tokens = lines.reduce((n, l) => n + approxTokens(l), 0)
    if (current && current.tokens + tokens > maxChunkSize) flush()
    if (!current) current = { section, lines: [], tokens: 0 }
    current.lines.push(...lines)
    current.tokens += tokens
  }

  for (const section of sections) {
    // Lines are split to fit beside the heading, which is repeated on every
    // piece of an oversized section (floor of half the limit for absurdly long headings).
    const headingTokens = section.headings.reduce((n, l) => n + approxTokens(l), 0)
    const budget = Math.max(maxChunkSize - headingTokens, Math.ceil(maxChunkSize / 2))
    const units = section.body.flatMap(line =>
      approxTokens(line) > budget ? splitLongLine(line, budget) : [line])
    const whole = [...section.headings, ...units]

    if (whole.reduce((n, l) => n + approxTokens(l), 0) <= maxChunkSize) {
      add(section.name, whole)
      continue
    }

    // Oversized section: its own chunks, heading repeated on each.
    flush()
    let piece = []
    let count = 0
    for (const unit of units) {
      const tokens = approxTokens(unit)
      if (piece.length && headingTokens + count + tokens > maxChunkSize) {
        chunks.push({ text: [...section.headings, ...piece].join('\n'), section: section.name, tokens: headingTokens + count })
        piece = []
        count = 0
      }
      piece.push(unit)
      count += tokens
    }
    if (piece.length) {
      chunks.push({ text: [...section.headings, ...piece].join('\n'), section: section.name, tokens: headingTokens + count })
    }
  }
  flush()

  // Headings with nothing after them (end of document) still belong to the text.
  if (trailingHeadings.length) {
    const extra = trailingHeadings.join('\n')
    if (chunks.length) {
      const last = chunks[chunks.length - 1]
      last.text += `\n${extra}`
      last.tokens += approxTokens(extra)
    } else {
      chunks.push({ text: extra, section: 'Main', tokens: approxTokens(extra) })
    }
  }

  return chunks
}

// --- retrieval --------------------------------------------------------------

// The corpus is small, so ranking happens in process rather than in SQL. Chunks
// are cached briefly so a burst of questions costs one table read, not one each
// (on Turso every row read is billed).
const CACHE_TTL_MS = 60 * 1000
const corpusCache = new WeakMap()

async function loadCorpus(dbClient) {
  const hit = corpusCache.get(dbClient)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.corpus

  const rows = await all(dbClient, `
    SELECT c.id, c.text, c.section, c.chunk_index AS chunkIndex,
           d.title, d.source, d.url
    FROM rag_chunks c
    JOIN rag_documents d ON c.document_id = d.id
  `)

  const docs = rows.map(row => {
    const tokens = tokenize(`${row.title} ${row.section || ''} ${row.text}`)
    const tf = new Map()
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1)
    return { row, tf, length: tokens.length }
  })

  const df = new Map()
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1)
  const avgLength = docs.reduce((n, d) => n + d.length, 0) / Math.max(docs.length, 1)

  const corpus = { docs, df, avgLength }
  corpusCache.set(dbClient, { at: Date.now(), corpus })
  return corpus
}

export function clearRagCache(dbClient) {
  if (dbClient) corpusCache.delete(dbClient)
}

const K1 = 1.5
const B = 0.75
// A chunk from the state the user picked outranks an equally good national one.
const STATE_BOOST = 1.5

// BM25 over title + section + text. Scores are unbounded, so `similarity` is
// each result's score as a percentage of the best result, not an absolute;
// use `coverage` to judge whether a result actually answers the question.
export async function queryRAG(dbClient, queryText, topK = 5, { state } = {}) {
  const { docs, df, avgLength } = await loadCorpus(dbClient)
  const queryTerms = [...new Set(tokenize(queryText))]
  if (!docs.length || !queryTerms.length) return { query: queryText, results: [] }

  const n = docs.length
  const wanted = state ? String(state).toLowerCase() : ''
  const idfOf = (term) => {
    const d = df.get(term) || 0
    return Math.log(1 + (n - d + 0.5) / (d + 0.5))
  }
  // A term that appears nowhere in the corpus still counts against coverage:
  // "VAT" matching nothing is exactly the sign the documents don't answer it.
  const totalIdf = queryTerms.reduce((sum, term) => sum + idfOf(term), 0)

  const scored = []
  for (const d of docs) {
    let score = 0
    let matchedIdf = 0
    for (const term of queryTerms) {
      const f = d.tf.get(term)
      if (!f) continue
      const idf = idfOf(term)
      matchedIdf += idf
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + B * (d.length / avgLength))))
    }
    if (score <= 0) continue
    if (wanted && `${d.row.title} ${d.row.source}`.toLowerCase().includes(wanted)) score *= STATE_BOOST
    scored.push({ row: d.row, score, coverage: matchedIdf / totalIdf })
  }

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]?.score || 1

  const results = scored.slice(0, topK).map(({ row, score, coverage }) => ({
    text: row.text,
    title: row.title,
    source: row.source,
    url: row.url,
    section: row.section,
    chunkIndex: row.chunkIndex,
    similarity: Math.round((score / best) * 100),
    // 0-1: how much of the question's (rarity-weighted) vocabulary this chunk
    // contains. Unlike `similarity` this is absolute, so it can say "no good match".
    coverage: Math.round(coverage * 100) / 100
  }))

  return { query: queryText, results }
}

// --- ingestion --------------------------------------------------------------

const INSERT_CHUNK = `
  INSERT INTO rag_chunks (document_id, text, embedding, token_count, section, chunk_index, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`

const chunkArgs = (documentId, chunks, now) =>
  chunks.map((c, i) => [documentId, c.text, null, c.tokens, c.section, i, now])

// Insert already-chunked rows. Transactional on better-sqlite3, a single
// batch (one round trip, atomic) on libSQL.
async function insertChunks(dbClient, rows) {
  if (!rows.length) return
  if (dbClient.prepare) {
    const stmt = dbClient.prepare(INSERT_CHUNK)
    dbClient.transaction(() => rows.forEach(args => stmt.run(...args)))()
  } else {
    await dbClient.batch(rows.map(args => ({ sql: INSERT_CHUNK, args })), 'write')
  }
}

// Add a document and its chunks. Async for both clients; callers must await it
// (the ingest scripts close the database as soon as their loop ends).
export async function addDocument(dbClient, { source, title, url, content }) {
  const now = new Date().toISOString()

  const documentId = await run(dbClient, `
    INSERT INTO rag_documents (source, title, url, content, fetched_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [source, title, url ?? null, content, now, now])

  await insertChunks(dbClient, chunkArgs(documentId, chunkText(content), now))

  clearRagCache(dbClient)
  return documentId
}

// Rebuild every document's chunks from its stored `content`, so a chunker fix
// reaches data that was ingested with the old one without refetching anything.
// Per document the delete and re-insert are one transaction/batch. With
// apply:false nothing is written; the result says what would change.
export async function rechunkAll(dbClient, { apply = false } = {}) {
  const docs = await all(dbClient, 'SELECT id, content FROM rag_documents ORDER BY id')
  const now = new Date().toISOString()
  const stats = { documents: docs.length, changed: 0, chunksBefore: 0, chunksAfter: 0 }

  for (const doc of docs) {
    const before = await all(dbClient,
      'SELECT text, section FROM rag_chunks WHERE document_id = ? ORDER BY chunk_index, id', [doc.id])
    const after = chunkText(doc.content)
    stats.chunksBefore += before.length
    stats.chunksAfter += after.length

    const same = before.length === after.length &&
      before.every((b, i) => b.text === after[i].text && b.section === after[i].section)
    if (same) continue
    stats.changed++
    if (!apply) continue

    const rows = chunkArgs(doc.id, after, now)
    if (dbClient.prepare) {
      const del = dbClient.prepare('DELETE FROM rag_chunks WHERE document_id = ?')
      const ins = dbClient.prepare(INSERT_CHUNK)
      dbClient.transaction(() => {
        del.run(doc.id)
        rows.forEach(args => ins.run(...args))
      })()
    } else {
      await dbClient.batch([
        { sql: 'DELETE FROM rag_chunks WHERE document_id = ?', args: [doc.id] },
        ...rows.map(args => ({ sql: INSERT_CHUNK, args })),
      ], 'write')
    }
  }

  if (apply) clearRagCache(dbClient)
  return stats
}

// Bring the database in line with a list of source documents without ever
// deleting wholesale. Documents are matched on (source, title):
//   insert     not in the database yet
//   update     content, url or title differs from the source
//   rechunk    unchanged, but stored chunks differ from what the current chunker
//              produces (e.g. after a chunker change)
//   unchanged  nothing to do
// A source document can list earlier titles in `replaces`; if no row has its
// current title but one has an old title, that row is updated in place (and
// renamed) instead of a second copy being inserted beside it.
// Documents that exist in the database but not in `docs` are reported and left
// alone, as are duplicate rows for one key (the first is treated as canonical).
// Running it twice in a row changes nothing the second time. With apply:false
// it only reports. Each document is written in one transaction/batch.
export async function syncDocuments(dbClient, docs, { apply = false } = {}) {
  let existing
  let tablesMissing = false
  try {
    existing = await all(dbClient, 'SELECT id, source, title, url, content FROM rag_documents ORDER BY id')
  } catch (e) {
    if (!/no such table/i.test(e.message)) throw e
    existing = []
    tablesMissing = true
  }

  const keyOf = (d) => JSON.stringify([d.source, d.title])
  const byKey = new Map()
  const duplicates = []
  for (const row of existing) {
    const key = keyOf(row)
    if (byKey.has(key)) duplicates.push({ source: row.source, title: row.title, id: row.id })
    else byKey.set(key, row)
  }

  // Resolve each source document to its stored row: current title first, then
  // any title it replaces.
  const matched = new Map() // source doc -> { row, renamedFrom }
  for (const doc of docs) {
    const own = byKey.get(keyOf(doc))
    if (own) { matched.set(doc, { row: own }); continue }
    for (const oldTitle of doc.replaces ?? []) {
      const old = byKey.get(keyOf({ source: doc.source, title: oldTitle }))
      if (old) { matched.set(doc, { row: old, renamedFrom: oldTitle }); break }
    }
  }
  const matchedIds = new Set([...matched.values()].map(m => m.row.id))
  const extra = [...byKey.values()]
    .filter(row => !matchedIds.has(row.id))
    .map(row => ({ source: row.source, title: row.title, id: row.id }))

  const plan = []
  for (const doc of docs) {
    const chunks = chunkText(doc.content)
    const hit = matched.get(doc)
    if (!hit) { plan.push({ source: doc.source, title: doc.title, action: 'insert', chunks: chunks.length, doc, chunkRows: chunks }); continue }

    const { row, renamedFrom } = hit
    const changed = row.content !== doc.content || (row.url ?? null) !== (doc.url ?? null) || row.title !== doc.title
    let action = changed ? 'update' : 'unchanged'
    if (!changed) {
      const stored = await all(dbClient,
        'SELECT text, section FROM rag_chunks WHERE document_id = ? ORDER BY chunk_index, id', [row.id])
      const same = stored.length === chunks.length && stored.every((c, i) => c.text === chunks[i].text && c.section === chunks[i].section)
      if (!same) action = 'rechunk'
    }
    plan.push({ source: doc.source, title: doc.title, action, id: row.id, chunks: chunks.length, renamedFrom, doc, chunkRows: chunks })
  }

  const count = (a) => plan.filter(p => p.action === a).length
  const result = {
    tablesMissing,
    inserted: count('insert'), updated: count('update'), rechunked: count('rechunk'), unchanged: count('unchanged'),
    extra, duplicates,
    plan: plan.map(({ doc, chunkRows, ...rest }) => rest),
  }
  if (!apply) return result

  if (tablesMissing) {
    const { ensureRagSchema } = await import('./ragSchema.js')
    await ensureRagSchema(dbClient)
  }

  const now = new Date().toISOString()
  for (const p of plan) {
    if (p.action === 'unchanged') continue
    const { doc, chunkRows } = p

    if (p.action === 'insert') {
      const insertDoc = `INSERT INTO rag_documents (source, title, url, content, fetched_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
      const docArgs = [doc.source, doc.title, doc.url ?? null, doc.content, now, now]
      if (dbClient.prepare) {
        dbClient.transaction(() => {
          const id = Number(dbClient.prepare(insertDoc).run(...docArgs).lastInsertRowid)
          const ins = dbClient.prepare(INSERT_CHUNK)
          chunkArgs(id, chunkRows, now).forEach(args => ins.run(...args))
        })()
      } else {
        // The chunk rows find their parent by key inside the same batch, so the
        // document and all its chunks commit together or not at all.
        const parent = '(SELECT id FROM rag_documents WHERE source = ? AND title = ? ORDER BY id DESC LIMIT 1)'
        const chunkSql = INSERT_CHUNK.replace('VALUES (?,', `VALUES (${parent},`)
        await dbClient.batch([
          { sql: insertDoc, args: docArgs },
          ...chunkRows.map((c, i) => ({
            sql: chunkSql,
            args: [doc.source, doc.title, c.text, null, c.tokens, c.section, i, now],
          })),
        ], 'write')
      }
      continue
    }

    // update / rechunk: replace this document's chunks (and its row, for update)
    const rows = chunkArgs(p.id, chunkRows, now)
    const updateDoc = 'UPDATE rag_documents SET title = ?, content = ?, url = ?, updated_at = ? WHERE id = ?'
    const updateArgs = [doc.title, doc.content, doc.url ?? null, now, p.id]
    if (dbClient.prepare) {
      dbClient.transaction(() => {
        if (p.action === 'update') dbClient.prepare(updateDoc).run(...updateArgs)
        dbClient.prepare('DELETE FROM rag_chunks WHERE document_id = ?').run(p.id)
        const ins = dbClient.prepare(INSERT_CHUNK)
        rows.forEach(args => ins.run(...args))
      })()
    } else {
      await dbClient.batch([
        ...(p.action === 'update' ? [{ sql: updateDoc, args: updateArgs }] : []),
        { sql: 'DELETE FROM rag_chunks WHERE document_id = ?', args: [p.id] },
        ...rows.map(args => ({ sql: INSERT_CHUNK, args })),
      ], 'write')
    }
  }

  clearRagCache(dbClient)
  return result
}
