import express from 'express'
import { queryRAG } from './rag.js'
import { db } from './db.js'
import OpenAI from 'openai'

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://ngscorecard.ng',
    'X-Title': 'NGScorecard',
  }
})

export function createRagRouter() {
  const router = express.Router()

  router.post('/ask', async (req, res) => {
    try {
      const { question, state } = req.body

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'question is required' })
      }

      const rawClient = db._rawClient

      // Retrieve relevant documents (graceful if tables don't exist)
      let sources = []
      if (rawClient) {
        try {
          const result = await queryRAG(rawClient, question, 5)
          sources = result.results

          // If state specified, prioritize state-specific documents
          if (state && sources.length > 0) {
            sources = sources.sort((a, b) => {
              const aIsState = a.title.includes(state) || a.source.includes(state) ? 0 : 1
              const bIsState = b.title.includes(state) || b.source.includes(state) ? 0 : 1
              return aIsState - bIsState
            })
          }
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

      // Check if API key is configured
      if (!process.env.OPENROUTER_API_KEY) {
        return res.status(503).json({
          error: 'AI synthesis not available',
          sources: sources.map(s => ({
            title: s.title,
            source: s.source,
            url: s.url,
            relevance: s.similarity
          })),
          message: 'System is retrieving relevant documents but AI synthesis is not configured. Retrieved documents above may help answer your question.'
        })
      }

      try {
        const response = await openrouter.chat.completions.create({
          model: 'anthropic/claude-3-5-sonnet',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `You are a helpful Nigerian government services assistant. Answer this question about government procedures, policies, or services in Nigeria.\n\nQuestion: ${question}\n${context}\n\nProvide a clear, accurate answer. If you reference specific documents, mention the source.`
            }
          ]
        })

        const answer = response.choices[0].message.content || 'Unable to generate answer'

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
      } catch (apiError) {
        console.error('OpenRouter API error:', apiError.message)
        res.status(503).json({
          error: 'Answer synthesis temporarily unavailable',
          sources: sources.map(s => ({
            title: s.title,
            source: s.source,
            url: s.url,
            relevance: s.similarity
          }))
        })
      }
    } catch (error) {
      console.error('RAG error:', error)
      res.status(500).json({ error: 'Failed to process question' })
    }
  })

  return router
}
