import express from 'express'
import { queryRAG } from './rag.js'
import { db } from './db.js'

export function createRagRouter() {
  const router = express.Router()

  router.post('/ask', async (req, res) => {
    try {
      const { question } = req.body

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'question is required' })
      }

      const rawClient = db._rawClient
      if (!rawClient) {
        return res.status(500).json({ error: 'Database not initialized' })
      }

      const result = queryRAG(rawClient, question, 5)

      // Format results for response (results already have similarity score)
      const formatted = {
        question: result.query,
        sources: result.results
      }

      res.json(formatted)
    } catch (error) {
      console.error('RAG error:', error)
      res.status(500).json({ error: 'Failed to process question' })
    }
  })

  return router
}
