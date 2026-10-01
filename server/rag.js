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

// Chunk text into smaller pieces (roughly 500 tokens per chunk)
export function chunkText(text, maxChunkSize = 500) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const chunks = []
  let currentChunk = ''
  let currentTokenCount = 0

  for (const sentence of sentences) {
    const sentenceTokens = Math.ceil(sentence.length / 4) // rough estimate: 1 token ≈ 4 chars
    if (currentTokenCount + sentenceTokens > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
      currentTokenCount = sentenceTokens
    } else {
      currentChunk += sentence
      currentTokenCount += sentenceTokens
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

// RAG query: retrieve relevant chunks using keyword matching
export function queryRAG(db, queryText, topK = 5) {
  // Get all chunks
  const chunks = db.prepare(`
    SELECT
      c.id, c.text,
      d.title, d.source, d.url
    FROM rag_chunks c
    JOIN rag_documents d ON c.document_id = d.id
  `).all()

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

  // Return top-K results with 0-100 relevance score
  const results = scored.slice(0, topK).map(r => ({
    text: r.text,
    title: r.title,
    source: r.source,
    url: r.url,
    similarity: Math.round(r.relevance * 100)
  }))

  return { query: queryText, results }
}

// Add document and chunks to RAG database
export function addDocument(db, { source, title, url, content }) {
  const now = new Date().toISOString()

  // Insert document
  const docResult = db.prepare(`
    INSERT INTO rag_documents (source, title, url, content, fetched_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(source, title, url, content, now, now)

  const documentId = docResult.lastInsertRowid

  // Chunk content
  const chunks = chunkText(content)

  // Insert chunks (without embeddings for now)
  const chunkStmt = db.prepare(`
    INSERT INTO rag_chunks (document_id, text, embedding, token_count, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (let i = 0; i < chunks.length; i++) {
    const tokenCount = Math.ceil(chunks[i].length / 4)
    chunkStmt.run(
      documentId,
      chunks[i],
      null, // No embeddings for basic version
      tokenCount,
      now
    )
  }

  return documentId
}
