import express from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { getOpenRouter } from './openrouter.js'
import { queryRAG } from './rag.js'
import { hasUsableSources, NO_ANSWER_MESSAGE } from './ragPrompt.js'
import { synthesize } from './ragAnswer.js'
import { sanitizeHistory, rewriteQuestion } from './ragFollowUp.js'

// Every question can trigger a paid model call, so this endpoint is capped per
// caller. Vercel overwrites x-vercel-forwarded-for with the real client address;
// elsewhere fall back to req.ip. Counters are held in memory, so each server
// instance keeps its own count; that blunts a single abuser but is not a global
// spend cap.
const MAX_QUESTION_CHARS = 500
const MAX_STATE_CHARS = 40

const callerKey = (req) => {
  const vercelIp = req.headers['x-vercel-forwarded-for']
  const ip = (Array.isArray(vercelIp) ? vercelIp[0] : vercelIp)?.split(',')[0].trim()
  return ipKeyGenerator(ip || req.ip || '')
}

const limiterOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: callerKey,
  validate: { xForwardedForHeader: false, trustProxy: false },
}

const burstLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 60 * 1000,
  limit: 6,
  message: { error: 'You are asking too quickly. Wait a minute and try again.' },
})

const hourlyLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 60 * 60 * 1000,
  limit: 40,
  message: { error: 'Question limit reached for this hour. Please try again later.' },
})

// Dependencies are injectable so tests can run the route without Turso or a
// paid model call: `db` is the app database, `openai` any client exposing
// chat.completions.create.
export function createRagRouter({ db: injectedDb, openai } = {}) {
  const router = express.Router()

  const getDb = async () => injectedDb ?? (await import('./db.js')).db
  const sourceList = (sources) =>
    sources.map(s => ({ id: s.id, title: s.title, source: s.source, url: s.url, relevance: s.similarity }))

  router.post('/ask', burstLimiter, hourlyLimiter, async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {}
      const question = typeof body.question === 'string' ? body.question.trim() : ''
      const state = typeof body.state === 'string' ? body.state.trim().slice(0, MAX_STATE_CHARS) : ''

      if (!question) {
        return res.status(400).json({ error: 'question is required' })
      }
      if (question.length > MAX_QUESTION_CHARS) {
        return res.status(400).json({
          error: `Questions are limited to ${MAX_QUESTION_CHARS} characters.`,
        })
      }

      const history = sanitizeHistory(body.history)
      const client = openai ?? (process.env.OPENROUTER_API_KEY ? getOpenRouter() : null)

      // A follow-up ("And for minors?") cannot be searched as typed, so retrieval
      // runs on a standalone version of it. With no history this costs nothing:
      // the question is searched exactly as typed and no extra model call is made.
      const { query: searchQuery, how } = await rewriteQuestion(client, question, history)

      // Retrieval. A failure here is an outage, not "no answer": say so rather
      // than telling the user the documents don't cover their question.
      let sources
      try {
        const db = await getDb()
        await db._ragReady
        sources = (await queryRAG(db._rawClient, searchQuery, 5, { state })).results
      } catch (e) {
        console.error('RAG retrieval failed:', e.code || e.message)
        return res.status(503).json({ error: 'Document search is temporarily unavailable. Please try again shortly.' })
      }

      // Shown to the user when the model rewrote their follow-up, so a wrong
      // reading of "it" or "that" is visible rather than silently answered.
      const searchedFor = how === 'rewritten' ? searchQuery : undefined

      // Nothing relevant retrieved: say so without calling the model. This is
      // the "I don't know" path; the model is never asked to answer from memory.
      if (!hasUsableSources(sources)) {
        return res.json({ question, answer: NO_ANSWER_MESSAGE, grounded: false, cited: false, sources: [], ...(searchedFor ? { searchedFor } : {}) })
      }

      if (!client) {
        return res.status(503).json({
          error: 'AI synthesis not available',
          sources: sourceList(sources.map((s, i) => ({ ...s, id: i + 1 }))),
          message: 'System is retrieving relevant documents but AI synthesis is not configured. Retrieved documents above may help answer your question.'
        })
      }

      try {
        const parsed = await synthesize(client, question, sources, history)
        return res.json({
          question,
          answer: parsed.answer,
          grounded: parsed.grounded,
          cited: parsed.cited,
          sources: sourceList(parsed.sources),
          ...(searchedFor ? { searchedFor } : {}),
        })
      } catch (apiError) {
        console.error('OpenRouter API error:', apiError.message)
        return res.status(503).json({
          error: 'Answer synthesis temporarily unavailable',
          sources: sourceList(sources.map((s, i) => ({ ...s, id: i + 1 }))),
        })
      }
    } catch (error) {
      console.error('RAG error:', error)
      res.status(500).json({ error: 'Failed to process question' })
    }
  })

  return router
}
