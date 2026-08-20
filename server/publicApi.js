import { Router, json } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { registerDataRoutes } from './dataRoutes.js'
import { getOrCreateApiKey, findApiKey, touchApiKey } from './apiKeys.js'

const FREE_TIER_LIMIT = 60 // requests per minute per key

// Public, versioned API: GET /api/v1/:admin/:category, GET /api/v1/presidents.
// Requires an X-API-Key header (self-serve, free — see POST /api/v1/keys)
// and is rate-limited per key. Mirrors the internal routes in dataRoutes.js
// exactly, so the two never drift apart.
export function createPublicApiRouter() {
  const router = Router()

  router.use((_req, res, next) => {
    if (!res.json) {
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      }
    }
    next()
  })

  // Loose IP-based limit just on key issuance, to deter spam signups —
  // this is the one route that doesn't require a key yet.
  const keyIssueLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
  })

  router.post('/keys', keyIssueLimiter, json(), async (req, res) => {
    const email = (req.body?.email || '').trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email is required' })
    }
    const row = await getOrCreateApiKey(email)
    res.status(201).json({
      key: row.key,
      tier: row.tier,
      rateLimit: `${FREE_TIER_LIMIT} requests/minute`,
      note: 'Send this key as the X-API-Key header on every request. Keep it private — anyone with it can use your quota.',
    })
  })

  router.get('/', (_req, res) => {
    res.json({
      name: 'NGScorecard public API',
      version: 'v1',
      auth: 'X-API-Key header, obtained via POST /api/v1/keys with a JSON body { "email": "you@example.com" }',
      rateLimit: `${FREE_TIER_LIMIT} requests/minute per key`,
      endpoints: [
        'GET /api/v1/presidents',
        'GET /api/v1/:admin/promises',
        'GET /api/v1/:admin/inherited',
        'GET /api/v1/:admin/fraud',
        'GET /api/v1/:admin/orders',
        'GET /api/v1/:admin/ministers',
        'GET /api/v1/:admin/bills',
        'GET /api/v1/:admin/appointments',
        'GET /api/v1/:admin/judgments',
        'GET /api/v1/:admin/budget',
        'GET /api/v1/:admin/governors',
        'GET /api/v1/:admin/indicators',
      ],
      adminKeys: 'GET /api/v1/presidents returns the list of valid :admin keys (e.g. "tinubu", "otti").',
    })
  })

  async function requireApiKey(req, res, next) {
    const key = req.header('X-API-Key')
    if (!key) {
      return res.status(401).json({ error: 'Missing X-API-Key header. Get a free key: POST /api/v1/keys' })
    }
    const record = await findApiKey(key)
    if (!record || record.revoked) {
      return res.status(401).json({ error: 'Invalid or revoked API key' })
    }
    req.apiKey = record
    touchApiKey(record.id).catch(() => {}) // best-effort usage tracking, never blocks the request
    next()
  }

  const dataLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: FREE_TIER_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.apiKey?.key ?? ipKeyGenerator(req.ip),
    message: { error: `Rate limit exceeded: ${FREE_TIER_LIMIT} requests/minute per API key` },
  })

  router.use(requireApiKey, dataLimiter)
  registerDataRoutes(router)

  return router
}
