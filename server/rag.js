import { pipeline } from '@xenova/transformers'

// Lazy-loaded cross-encoder reranker
let rerankerInstance = null
let rerankerReady = false

async function getReranker() {
  if (rerankerInstance) return rerankerInstance
  if (rerankerReady === false) {
    try {
      rerankerInstance = await pipeline('feature-extraction', 'Xenova/qnli-distilroberta-base')
      rerankerReady = true
    } catch (error) {
      console.error('Failed to load reranker model:', error.message)
      rerankerReady = true // Mark as tried to avoid repeated failures
    }
  }
  return rerankerInstance
}

// Simple tokenizer for keyword extraction
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
}

// Calculate TF-IDF score between query and document text
function calculateRelevance(query, text) {
  const queryTokens = new Set(tokenize(query))
  const textTokens = tokenize(text)

  let matches = 0
  for (const token of textTokens) {
    if (queryTokens.has(token)) matches++
  }

  // Normalize by text length
  const relevance = matches / Math.max(textTokens.length, 1)
  return relevance
}

// Extract sections from structured text (e.g., "## Section Name")
function extractSections(text) {
  const sections = []
  const lines = text.split('\n')
  let currentSection = null
  let currentContent = []

  for (const line of lines) {
    const sectionMatch = line.match(/^#+\s+(.+)$/)
    if (sectionMatch) {
      if (currentSection && currentContent.length > 0) {
        sections.push({
          name: currentSection,
          content: currentContent.join('\n').trim()
        })
      }
      currentSection = sectionMatch[1]
      currentContent = []
    } else if (currentSection !== null) {
      currentContent.push(line)
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections.push({
      name: currentSection,
      content: currentContent.join('\n').trim()
    })
  }

  return sections.length > 0 ? sections : [{ name: 'Main', content: text }]
}

// Chunk text into smaller pieces while preserving structure
export function chunkText(text, maxChunkSize = 500) {
  const sections = extractSections(text)
  const chunks = []

  for (const section of sections) {
    const sentences = section.content.match(/[^.!?]+[.!?]+/g) || [section.content]
    let currentChunk = ''
    let currentTokenCount = 0

    for (const sentence of sentences) {
      const sentenceTokens = Math.ceil(sentence.length / 4) // rough estimate: 1 token ≈ 4 chars
      if (currentTokenCount + sentenceTokens > maxChunkSize && currentChunk) {
        chunks.push({
          text: currentChunk.trim(),
          section: section.name,
          tokens: currentTokenCount
        })
        currentChunk = sentence
        currentTokenCount = sentenceTokens
      } else {
        currentChunk += sentence
        currentTokenCount += sentenceTokens
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        section: section.name,
        tokens: currentTokenCount
      })
    }
  }

  return chunks
}

// Rerank chunks using cross-encoder semantic relevance
// Only reranks if we have many chunks (> 5) to optimize performance
async function rerankerChunks(queryText, chunks) {
  try {
    const reranker = await getReranker()
    if (!reranker) return chunks // Fallback if reranker not available

    // Only rerank if we have many chunks
    if (chunks.length <= 5) return chunks

    console.log(`Reranking ${chunks.length} chunks with cross-encoder...`)

    // Compute similarity scores between query and each chunk
    const pairs = chunks.map(chunk => [queryText, chunk.text])
    const scores = await reranker(pairs, { pooling: 'mean_sqrt_freq_idf' })

    // Add scores to chunks and sort
    const scored = chunks.map((chunk, i) => ({
      ...chunk,
      rerankerScore: scores.data[i]
    }))
      .sort((a, b) => b.rerankerScore - a.rerankerScore)

    return scored
  } catch (error) {
    console.error('Reranking failed, using original order:', error.message)
    return chunks // Graceful degradation: use original order
  }
}

// RAG query: retrieve relevant chunks using keyword matching with metadata
// Works with both better-sqlite3 and LibSQL clients
// Optionally reranks results using cross-encoder when many chunks retrieved
export async function queryRAG(dbClient, queryText, topK = 5) {
  let chunks = []

  // Handle both better-sqlite3 and LibSQL APIs
  if (dbClient.prepare) {
    // better-sqlite3 API
    chunks = dbClient.prepare(`
      SELECT
        c.id, c.text, c.section, c.chunk_index,
        d.title, d.source, d.url
      FROM rag_chunks c
      JOIN rag_documents d ON c.document_id = d.id
    `).all()
  } else if (dbClient.execute) {
    // LibSQL API
    const result = dbClient.execute(`
      SELECT
        c.id, c.text, c.section, c.chunk_index,
        d.title, d.source, d.url
      FROM rag_chunks c
      JOIN rag_documents d ON c.document_id = d.id
    `)
    chunks = result.rows.map(row => ({
      id: row[0],
      text: row[1],
      section: row[2],
      chunkIndex: row[3],
      title: row[4],
      source: row[5],
      url: row[6]
    }))
  }

  if (!chunks.length) {
    return { query: queryText, results: [] }
  }

  // Score each chunk by keyword relevance
  const scored = chunks.map(chunk => ({
    ...chunk,
    relevance: calculateRelevance(queryText, chunk.text)
  }))
    .filter(chunk => chunk.relevance > 0) // Only keep relevant results
    .sort((a, b) => b.relevance - a.relevance)

  // Get more candidates if we have them, for reranking
  const candidates = scored.slice(0, Math.min(topK * 2, scored.length))

  // Rerank if we have many candidates
  let final = candidates
  if (candidates.length > 5) {
    final = await rerankerChunks(queryText, candidates)
  }

  // Return top-K results with 0-100 relevance score and metadata
  const results = final.slice(0, topK).map(r => ({
    text: r.text,
    title: r.title,
    source: r.source,
    url: r.url,
    section: r.section,
    chunkIndex: r.chunkIndex,
    similarity: Math.round((r.rerankerScore ?? r.relevance ?? 0) * 100)
  }))

  return { query: queryText, results }
}

// Add document and chunks to RAG database with metadata preservation
// Works with both better-sqlite3 and LibSQL clients
export function addDocument(dbClient, { source, title, url, content, state }) {
  const now = new Date().toISOString()

  // Insert document
  if (dbClient.prepare) {
    // better-sqlite3
    const docResult = dbClient.prepare(`
      INSERT INTO rag_documents (source, title, url, content, fetched_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(source, title, url, content, now, now)

    const documentId = docResult.lastInsertRowid
    const chunks = chunkText(content)
    const chunkStmt = dbClient.prepare(`
      INSERT INTO rag_chunks (document_id, text, embedding, token_count, section, chunk_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    for (let i = 0; i < chunks.length; i++) {
      chunkStmt.run(
        documentId,
        chunks[i].text,
        null,
        chunks[i].tokens,
        chunks[i].section,
        i,
        now
      )
    }

    return documentId
  } else if (dbClient.execute) {
    // LibSQL
    const docResult = dbClient.execute({
      sql: `
        INSERT INTO rag_documents (source, title, url, content, fetched_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [source, title, url, content, now, now]
    })

    const documentId = docResult.lastInsertRowid
    const chunks = chunkText(content)

    for (let i = 0; i < chunks.length; i++) {
      dbClient.execute({
        sql: `
          INSERT INTO rag_chunks (document_id, text, embedding, token_count, section, chunk_index, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          documentId,
          chunks[i].text,
          null,
          chunks[i].tokens,
          chunks[i].section,
          i,
          now
        ]
      })
    }

    return documentId
  }
}
