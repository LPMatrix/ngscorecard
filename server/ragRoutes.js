import express from 'express'
import { queryRAG } from './rag.js'
import { createDb } from './db.js'

export function createRagRouter() {
  const router = express.Router()

  router.post('/ask', async (req, res) => {
    try {
      const { question } = req.body

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'question is required' })
      }

      const db = await createDb()
      const result = await queryRAG(db, question, 5)

      // Format results for response
      const formatted = {
        question: result.query,
        sources: result.results.map(r => ({
          text: r.text,
          title: r.title,
          source: r.source,
          url: r.url,
          relevance: Math.round(r.similarity * 100) // 0-100 score
        }))
      }

      res.json(formatted)
    } catch (error) {
      console.error('RAG error:', error)
      res.status(500).json({ error: 'Failed to process question' })
    }
  })

  return router
}
