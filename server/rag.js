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

  // origin and the checked-on date exist once the provenance columns have been
  // added; an older database without them still works, just without provenance.
  let rows
  try {
    rows = await all(dbClient, `
      SELECT c.id, c.document_id AS documentId, c.text, c.section, c.chunk_index AS chunkIndex,
             d.title, d.source, d.url, d.origin, d.fetched_at AS checkedAt
      FROM rag_chunks c
      JOIN rag_documents d ON c.document_id = d.id
    `)
  } catch (e) {
    if (!/no such column/i.test(e.message)) throw e
    rows = await all(dbClient, `
      SELECT c.id, c.document_id AS documentId, c.text, c.section, c.chunk_index AS chunkIndex,
             d.title, d.source, d.url
      FROM rag_chunks c
      JOIN rag_documents d ON c.document_id = d.id
    `)
  }

  const docs = rows.map(row => {
    const tokens = tokenize(`${row.title} ${row.section || ''} ${row.text}`)
    const tf = new Map()
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1)
    return { row, tf, length: tokens.length }
  })

  const df = new Map()
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1)
  const avgLength = docs.reduce((n, d) => n + d.length, 0) / Math.max(docs.length, 1)

  // every chunk of each document, in reading order, so a whole document can be
  // handed to the model once any part of it has been found
  const byDocument = new Map()
  for (const { row } of docs) {
    if (!byDocument.has(row.documentId)) byDocument.set(row.documentId, [])
    byDocument.get(row.documentId).push(row)
  }
  for (const rows of byDocument.values()) rows.sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0) || a.id - b.id)

  const corpus = { docs, df, avgLength, byDocument }
  corpusCache.set(dbClient, { at: Date.now(), corpus })
  return corpus
}

export function clearRagCache(dbClient) {
  if (dbClient) corpusCache.delete(dbClient)
}

const K1 = 1.5
const B = 0.75
// Search terms added by query expansion (formal words for what the user said in
// everyday ones) count for half as much as the user's own words, so expansion can
// bring a document into view without outvoting the question itself.
const EXPANSION_WEIGHT = 0.5
// A chunk from the state the user picked outranks an equally good national one.
const STATE_BOOST = 1.5

// BM25 over title + section + text. Scores are unbounded, so `similarity` is
// each result's score as a percentage of the best result, not an absolute;
// use `coverage` to judge whether a result actually answers the question.
function rankChunks(corpus, queryText, { state, expansion } = {}) {
  const { docs, df, avgLength } = corpus
  const queryTerms = [...new Set(tokenize(queryText))]
  // Expansion only widens a real question; a question with nothing searchable in
  // it ("what is the") finds nothing, however it is expanded.
  if (!docs.length || !queryTerms.length) return { scored: [], best: 1 }

  const own = new Set(queryTerms)
  const extra = [...new Set(tokenize(Array.isArray(expansion) ? expansion.join(' ') : expansion ?? ''))].filter(t => !own.has(t))
  const terms = [...queryTerms.map(t => [t, 1]), ...extra.map(t => [t, EXPANSION_WEIGHT])]

  const n = docs.length
  const wanted = state ? String(state).toLowerCase() : ''
  const idfOf = (term) => {
    const d = df.get(term) || 0
    return Math.log(1 + (n - d + 0.5) / (d + 0.5))
  }
  // A term that appears nowhere in the corpus still counts against coverage:
  // "VAT" matching nothing is exactly the sign the documents don't answer it.
  const totalIdf = terms.reduce((sum, [term, w]) => sum + w * idfOf(term), 0)

  const scored = []
  for (const d of docs) {
    let score = 0
    let matchedIdf = 0
    for (const [term, w] of terms) {
      const f = d.tf.get(term)
      if (!f) continue
      const idf = idfOf(term)
      matchedIdf += w * idf
      score += w * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + B * (d.length / avgLength))))
    }
    if (score <= 0) continue
    if (wanted && `${d.row.title} ${d.row.source}`.toLowerCase().includes(wanted)) score *= STATE_BOOST
    scored.push({ row: d.row, score, coverage: matchedIdf / totalIdf })
  }

  scored.sort((a, b) => b.score - a.score)
  return { scored, best: scored[0]?.score || 1 }
}

// The best chunks, one result per chunk.
export async function queryRAG(dbClient, queryText, topK = 5, { state, expansion } = {}) {
  const { scored, best } = rankChunks(await loadCorpus(dbClient), queryText, { state, expansion })

  const results = scored.slice(0, topK).map(({ row, score, coverage }) => ({
    text: row.text,
    title: row.title,
    source: row.source,
    url: row.url,
    origin: row.origin ?? null,
    checkedAt: row.checkedAt ?? null,
    section: row.section,
    chunkIndex: row.chunkIndex,
    similarity: Math.round((score / best) * 100),
    // 0-1: how much of the question's (rarity-weighted) vocabulary this chunk
    // contains. Unlike `similarity` this is absolute, so it can say "no good match".
    coverage: Math.round(coverage * 100) / 100
  }))

  return { query: queryText, results }
}

// Characters of one document handed to the model (about 1,500 tokens). Typical
// documents are far smaller, so most are passed whole.
const DOCUMENT_CHAR_BUDGET = 6000

// The best documents, one result per document. Ranking is still by chunk (small
// pieces rank precisely), but what is returned is the whole parent document: a
// question about "steps and requirements" often matches the steps chunk and not
// the requirements chunk, and the answer needs both. A document is ordered by
// its best chunk, `coverage` and `similarity` are that chunk's, and each document
// appears once. A document over the character budget keeps its best-matching
// chunks (in reading order) and is marked `truncated`.
export async function queryDocuments(dbClient, queryText, { maxDocs = 3, state, expansion, charBudget = DOCUMENT_CHAR_BUDGET } = {}) {
  const corpus = await loadCorpus(dbClient)
  const { scored, best } = rankChunks(corpus, queryText, { state, expansion })

  const picked = new Map() // documentId -> { best, scores: chunkIndex -> score }
  for (const entry of scored) {
    const id = entry.row.documentId
    if (!picked.has(id)) {
      if (picked.size >= maxDocs) continue
      picked.set(id, { best: entry, scores: new Map() })
    }
    picked.get(id).scores.set(entry.row.chunkIndex, entry.score)
  }

  const results = []
  for (const [id, { best: top, scores }] of picked) {
    const all_ = corpus.byDocument.get(id) ?? [top.row]
    const total = all_.reduce((n, r) => n + r.text.length, 0)

    let chosen = all_
    let truncated = false
    if (total > charBudget) {
      truncated = true
      chosen = []
      let used = 0
      const byRelevance = [...all_].sort((a, b) => (scores.get(b.chunkIndex) ?? 0) - (scores.get(a.chunkIndex) ?? 0) || (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0))
      for (const r of byRelevance) {
        if (chosen.length && used + r.text.length > charBudget) continue
        chosen.push(r)
        used += r.text.length
      }
      chosen.sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0) || a.id - b.id)
    }

    results.push({
      text: chosen.map(r => r.text).join('\n'),
      title: top.row.title,
      source: top.row.source,
      url: top.row.url,
      origin: top.row.origin ?? null,
      checkedAt: top.row.checkedAt ?? null,
      chunks: chosen.length,
      truncated,
      similarity: Math.round((top.score / best) * 100),
      coverage: Math.round(top.coverage * 100) / 100,
    })
  }

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
// deleting wholesale. Documents are matched on (source, title), or, when a
// source document has an `externalId`, on (origin, externalId) so that a rename
// at the source updates the row in place instead of adding a second copy:
//   insert     not in the database yet
//   update     content, url or title differs from the source
//   rechunk    unchanged, but stored chunks differ from what the current chunker
//              produces (e.g. after a chunker change)
//   unchanged  nothing to do
// A source document can list earlier titles in `replaces`; if no row has its
// current title but one has an old title, that row is updated in place (and
// renamed) instead of a second copy being inserted beside it.
// `origin` names what `docs` represents (null for the hand-written corpus,
// 'portal' for the Government Service Portal). Only stored documents with that
// same origin take part, so each kind of source can be synced without reporting
// the other's documents as missing.
// Documents that exist in the database but not in `docs` are reported and left
// alone, as are duplicate rows for one key (the first is treated as canonical).
// With touchChecked, documents found unchanged still get their checked-on date
// (fetched_at) moved to now, which is what "verified again today" means.
// Running it twice in a row changes nothing the second time. With apply:false
// it only reports. Each document is written in one transaction/batch.
export async function syncDocuments(dbClient, docs, { apply = false, origin = null, touchChecked = false } = {}) {
  let existing
  let tablesMissing = false
  try {
    try {
      existing = await all(dbClient, 'SELECT id, source, title, url, content, origin, external_id FROM rag_documents ORDER BY id')
    } catch (e) {
      if (!/no such column/i.test(e.message)) throw e
      // a database from before the provenance columns: everything in it is hand-written
      existing = (await all(dbClient, 'SELECT id, source, title, url, content FROM rag_documents ORDER BY id'))
        .map(row => ({ ...row, origin: null, external_id: null }))
    }
  } catch (e) {
    if (!/no such table/i.test(e.message)) throw e
    existing = []
    tablesMissing = true
  }
  existing = existing.filter(row => (row.origin ?? null) === origin)
  docs = docs.map(d => ({ ...d, origin }))

  const keyOf = (d) => {
    const ext = d.externalId ?? d.external_id
    return ext ? JSON.stringify(['ext', origin, ext]) : JSON.stringify(['st', d.source, d.title])
  }
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
    const changed = row.content !== doc.content || (row.url ?? null) !== (doc.url ?? null) ||
      row.title !== doc.title || row.source !== doc.source
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
    touched: 0,
    extra, duplicates,
    plan: plan.map(({ doc, chunkRows, ...rest }) => rest),
  }
  if (!apply) return result

  // always: creates missing tables and adds the provenance columns to older ones
  const { ensureRagSchema } = await import('./ragSchema.js')
  await ensureRagSchema(dbClient)

  const now = new Date().toISOString()
  for (const p of plan) {
    if (p.action === 'unchanged') continue
    const { doc, chunkRows } = p

    if (p.action === 'insert') {
      const insertDoc = `INSERT INTO rag_documents (source, title, url, content, origin, external_id, fetched_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      const docArgs = [doc.source, doc.title, doc.url ?? null, doc.content, doc.origin ?? null, doc.externalId ?? null, now, now]
      if (dbClient.prepare) {
        dbClient.transaction(() => {
          const id = Number(dbClient.prepare(insertDoc).run(...docArgs).lastInsertRowid)
          const ins = dbClient.prepare(INSERT_CHUNK)
          chunkArgs(id, chunkRows, now).forEach(args => ins.run(...args))
        })()
      } else {
        // The chunk rows find their parent by key inside the same batch, so the
        // document and all its chunks commit together or not at all.
        const byExternal = doc.externalId != null
        const parent = byExternal
          ? '(SELECT id FROM rag_documents WHERE origin IS ? AND external_id = ? ORDER BY id DESC LIMIT 1)'
          : '(SELECT id FROM rag_documents WHERE source = ? AND title = ? ORDER BY id DESC LIMIT 1)'
        const parentArgs = byExternal ? [doc.origin ?? null, doc.externalId] : [doc.source, doc.title]
        const chunkSql = INSERT_CHUNK.replace('VALUES (?,', `VALUES (${parent},`)
        await dbClient.batch([
          { sql: insertDoc, args: docArgs },
          ...chunkRows.map((c, i) => ({
            sql: chunkSql,
            args: [...parentArgs, c.text, null, c.tokens, c.section, i, now],
          })),
        ], 'write')
      }
      continue
    }

    // update / rechunk: replace this document's chunks (and its row, for update)
    const rows = chunkArgs(p.id, chunkRows, now)
    const updateDoc = 'UPDATE rag_documents SET source = ?, title = ?, content = ?, url = ?, origin = ?, external_id = ?, fetched_at = ?, updated_at = ? WHERE id = ?'
    const updateArgs = [doc.source, doc.title, doc.content, doc.url ?? null, doc.origin ?? null, doc.externalId ?? null, now, now, p.id]
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

  // Unchanged documents were read again and found the same: say so.
  if (touchChecked) {
    const unchanged = plan.filter(p => p.action === 'unchanged')
    const touch = 'UPDATE rag_documents SET fetched_at = ? WHERE id = ?'
    if (unchanged.length) {
      if (dbClient.prepare) {
        const stmt = dbClient.prepare(touch)
        dbClient.transaction(() => unchanged.forEach(p => stmt.run(now, p.id)))()
      } else {
        await dbClient.batch(unchanged.map(p => ({ sql: touch, args: [now, p.id] })), 'write')
      }
    }
    result.touched = unchanged.length
  }

  clearRagCache(dbClient)
  return result
}

// Number of stored documents with a given origin (null = the hand-written ones).
export async function countDocuments(dbClient, origin = null) {
  let rows
  try {
    rows = await all(dbClient, 'SELECT origin FROM rag_documents')
  } catch (e) {
    if (/no such table/i.test(e.message)) return 0
    if (!/no such column/i.test(e.message)) throw e
    rows = (await all(dbClient, 'SELECT id FROM rag_documents')).map(() => ({ origin: null }))
  }
  return rows.filter(r => (r.origin ?? null) === origin).length
}

// Remove every document of one origin, together with its chunks. This is the one
// place anything is deleted, and it is deliberately narrow: a single origin
// (null for the hand-written corpus, 'portal' for the portal), reported before
// it is done (apply:false), and returned in full so a caller can keep a backup.
// All the deletes go in one transaction/batch, so it happens entirely or not at all.
export async function removeDocuments(dbClient, { origin = null, apply = false } = {}) {
  let rows
  try {
    try {
      rows = await all(dbClient, 'SELECT id, source, title, url, content, origin, external_id, fetched_at, updated_at FROM rag_documents ORDER BY id')
    } catch (e) {
      if (!/no such column/i.test(e.message)) throw e
      rows = (await all(dbClient, 'SELECT id, source, title, url, content, fetched_at, updated_at FROM rag_documents ORDER BY id'))
        .map(r => ({ ...r, origin: null, external_id: null }))
    }
  } catch (e) {
    if (!/no such table/i.test(e.message)) throw e
    return { documents: 0, chunks: 0, rows: [], removed: false }
  }
  rows = rows.filter(r => (r.origin ?? null) === origin)

  let chunks = 0
  for (const r of rows) {
    chunks += Number((await all(dbClient, 'SELECT COUNT(*) AS c FROM rag_chunks WHERE document_id = ?', [r.id]))[0].c)
  }
  const result = { documents: rows.length, chunks, rows, removed: false }
  if (!apply || rows.length === 0) return result

  if (dbClient.prepare) {
    const delChunks = dbClient.prepare('DELETE FROM rag_chunks WHERE document_id = ?')
    const delDoc = dbClient.prepare('DELETE FROM rag_documents WHERE id = ?')
    dbClient.transaction(() => rows.forEach(r => { delChunks.run(r.id); delDoc.run(r.id) }))()
  } else {
    await dbClient.batch(rows.flatMap(r => [
      { sql: 'DELETE FROM rag_chunks WHERE document_id = ?', args: [r.id] },
      { sql: 'DELETE FROM rag_documents WHERE id = ?', args: [r.id] },
    ]), 'write')
  }
  clearRagCache(dbClient)
  return { ...result, removed: true }
}

// Stored documents of one origin (without their chunks), newest schema first and
// falling back to "none" on a database from before provenance existed.
export async function listDocuments(dbClient, { origin = 'portal' } = {}) {
  try {
    const rows = await all(dbClient, 'SELECT id, source, title, url, content, origin, external_id, fetched_at FROM rag_documents ORDER BY id')
    return rows.filter(r => (r.origin ?? null) === origin)
  } catch (e) {
    if (/no such (table|column)/i.test(e.message)) return []
    throw e
  }
}
