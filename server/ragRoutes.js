import express from 'express'
import { queryRAG } from './rag.js'
import { db } from './db.js'
import { Anthropic } from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export function createRagRouter() {
  const router = express.Router()

  router.post('/ask', async (req, res) => {
    try {
      const { question } = req.body

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'question is required' })
      }

      const rawClient = db._rawClient

      // Retrieve relevant documents (graceful if tables don't exist)
      let sources = []
      if (rawClient) {
        try {
          const result = queryRAG(rawClient, question, 5)
          sources = result.results
        } catch (e) {
          // RAG tables may not exist yet (especially in new Turso deployments)
          // Continue without documents - Claude can answer based on training data
          console.warn('RAG retrieval not available:', e.code || e.message)
        }
      }

      // Use Claude to synthesize an answer
      const context = sources.length > 0
        ? `\n\nRelevant government documents:\n${sources.map(s => `- ${s.title} (${s.source}, ${s.similarity}% relevant): ${s.text}`).join('\n')}`
        : '\n\n(No specific documents retrieved - answer based on training data)'

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `You are a helpful Nigerian government services assistant. Answer this question about government procedures, policies, or services in Nigeria.\n\nQuestion: ${question}\n${context}\n\nProvide a clear, accurate answer. If you reference specific documents, mention the source.`
          }
        ]
      })

      const answer = message.content[0].type === 'text' ? message.content[0].text : 'Unable to generate answer'

      const formatted = {
        question: question,
        answer: answer,
        sources: sources.map(s => ({
          title: s.title,
          source: s.source,
          url: s.url,
          relevance: s.similarity
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
