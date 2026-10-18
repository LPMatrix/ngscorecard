/**
 * Routes for AI Tools
 * Outcome Verifier: POST /outcome/verify, POST /outcome/approve
 * Promise Classifier: POST /classify, POST /classify/historical
 */

import express from 'express'
import { verifyPromiseOutcome, updatePromiseStatus } from './outcomeVerifier.js'
import { classifyPromise, findSimilarHistoricalPromises } from './promiseClassifier.js'
import { getPatternReport, getSectorPatterns, getAdminComparison } from './patternDetector.js'
import { scanFeeds, getQueue, dismissQueueItem, DEFAULT_FEEDS } from './realTimeTracker.js'
import { factCheckStatement } from './lieDetector.js'

const router = express.Router()

/**
 * POST /outcome/verify
 * Body: { promiseId, articleText or articleUrl }
 * Returns: { confidence, suggested_status, reasoning, claims, evidence_quotes, promise }
 */
router.post('/verify', async (req, res) => {
  try {
    const { promiseId, articleText, articleUrl } = req.body

    if (!promiseId) {
      return res.status(400).json({ error: 'promiseId is required' })
    }

    if (!articleText && !articleUrl) {
      return res.status(400).json({ error: 'articleText or articleUrl is required' })
    }

    let text = articleText
    if (articleUrl) {
      try {
        const response = await fetch(articleUrl)
        const html = await response.text()
        // Simple HTML to text
        text = html
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<style[^>]*>.*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 5000)
      } catch (e) {
        return res.status(400).json({ error: `Failed to fetch article: ${e.message}` })
      }
    }

    const result = await verifyPromiseOutcome(promiseId, text)
    res.json(result)
  } catch (err) {
    console.error('Verify error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /outcome/approve
 * Body: { promiseId, newStatus, sourceUrl, note }
 * Returns: { success, promise_id, old_status, new_status }
 */
router.post('/approve', async (req, res) => {
  try {
    const { promiseId, newStatus, sourceUrl, note } = req.body

    if (!promiseId || !newStatus) {
      return res.status(400).json({ error: 'promiseId and newStatus are required' })
    }

    const result = await updatePromiseStatus(promiseId, newStatus, sourceUrl || 'web-form', note || '')
    res.json(result)
  } catch (err) {
    console.error('Approve error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /classify
 * Classify a new promise and find similar/contradictory promises
 * Body: { promiseText, administration }
 * Returns: { suggested_category, similar_promises, contradictions, confidence_category, reasoning }
 */
router.post('/classify', async (req, res) => {
  try {
    const { promiseText, administration } = req.body

    if (!promiseText || !administration) {
      return res.status(400).json({ error: 'promiseText and administration are required' })
    }

    const result = await classifyPromise(administration, promiseText)
    res.json(result)
  } catch (err) {
    console.error('Classify error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /classify/historical
 * Find similar promises across all administrations
 * Body: { promiseText }
 * Returns: [{ id, title, administration, category, status, promise }, ...]
 */
router.post('/classify/historical', async (req, res) => {
  try {
    const { promiseText } = req.body

    if (!promiseText) {
      return res.status(400).json({ error: 'promiseText is required' })
    }

    const similar = await findSimilarHistoricalPromises(promiseText, 5)
    res.json(similar)
  } catch (err) {
    console.error('Historical classify error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /patterns
 * Full pattern report with AI insights
 * Query: ?administration=tinubu (optional — omit for all admins)
 */
router.get('/patterns', async (req, res) => {
  try {
    const { administration } = req.query
    const report = await getPatternReport(administration || null)
    res.json(report)
  } catch (err) {
    console.error('Patterns error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /patterns/sectors
 * Sector breakdown only (fast, no Claude)
 * Query: ?administration=tinubu (optional)
 */
router.get('/patterns/sectors', async (req, res) => {
  try {
    const { administration } = req.query
    const sectors = await getSectorPatterns(administration || null)
    res.json(sectors)
  } catch (err) {
    console.error('Sectors error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /patterns/admins
 * Administration comparison (fast, no Claude)
 */
router.get('/patterns/admins', async (req, res) => {
  try {
    const admins = await getAdminComparison()
    res.json(admins)
  } catch (err) {
    console.error('Admins error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /factcheck
 * Fact-check a government statement against the promise database
 * Body: { statementText, administration? }
 * Returns: { claims_checked, summary, results: [{ claim, verdict, reason, matched_promises }] }
 */
router.post('/factcheck', async (req, res) => {
  try {
    const { statementText, administration } = req.body
    if (!statementText) return res.status(400).json({ error: 'statementText is required' })
    const result = await factCheckStatement(statementText, administration || null)
    res.json(result)
  } catch (err) {
    console.error('Fact-check error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /tracker/queue — return pending promise queue
 */
router.get('/tracker/queue', (req, res) => {
  try {
    res.json(getQueue())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /tracker/scan — scan feeds for new promises
 * Body (optional): { feeds: ["url1", "url2"] }
 */
router.post('/tracker/scan', async (req, res) => {
  try {
    const result = await scanFeeds(req.body.feeds || null)
    res.json(result)
  } catch (err) {
    console.error('Scan error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * DELETE /tracker/queue/:id — dismiss a queue item
 */
router.delete('/tracker/queue/:id', (req, res) => {
  try {
    res.json(dismissQueueItem(req.params.id))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /tracker/feeds — list default feeds being monitored
 */
router.get('/tracker/feeds', (req, res) => {
  res.json(DEFAULT_FEEDS)
})

export default router
