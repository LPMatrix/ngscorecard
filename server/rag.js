import { pipeline } from '@xenova/transformers'

// Singleton embedding model
let embeddingPipeline = null

async function getEmbedder() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  return embeddingPipeline
}

// Generate embedding for text
export async function embed(text) {
  const embedder = await getEmbedder()
  const result = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(result.data)
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

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// RAG query: retrieve relevant chunks and return with metadata
export async function queryRAG(db, queryText, topK = 5) {
  const queryEmbedding = await embed(queryText)

  // Get all chunks with their embeddings
  const chunks = db.prepare(`
    SELECT
      c.id, c.text, c.embedding,
      d.title, d.source, d.url
    FROM rag_chunks c
    JOIN rag_documents d ON c.document_id = d.id
  `).all()

  if (!chunks.length) {
    return { query: queryText, results: [] }
  }

  // Score each chunk by similarity
  const scored = chunks.map(chunk => {
    const chunkEmbedding = JSON.parse(chunk.embedding || '[]')
    const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)
    return { ...chunk, similarity }
  }).sort((a, b) => b.similarity - a.similarity)

  // Return top-K results
  const results = scored.slice(0, topK).map(r => ({
    text: r.text,
    title: r.title,
    source: r.source,
    url: r.url,
    similarity: r.similarity
  }))

  return { query: queryText, results }
}

// Add document and chunks to RAG database
export async function addDocument(db, { source, title, url, content }) {
  const now = new Date().toISOString()

  // Insert document
  const docResult = db.prepare(`
    INSERT INTO rag_documents (source, title, url, content, fetched_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(source, title, url, content, now, now)

  const documentId = docResult.lastInsertRowid

  // Chunk and embed content
  const chunks = chunkText(content)
  const embeddings = await Promise.all(chunks.map(chunk => embed(chunk)))

  // Insert chunks
  const chunkStmt = db.prepare(`
    INSERT INTO rag_chunks (document_id, text, embedding, token_count, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (let i = 0; i < chunks.length; i++) {
    const tokenCount = Math.ceil(chunks[i].length / 4)
    chunkStmt.run(
      documentId,
      chunks[i],
      JSON.stringify(embeddings[i]),
      tokenCount,
      now
    )
  }

  return documentId
}
