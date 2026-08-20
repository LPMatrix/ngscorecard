import { Router, json } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { registerDataRoutes } from './dataRoutes.js'
import { getOrCreateApiKey, findApiKey, touchApiKey } from './apiKeys.js'
import * as q from './queries.js'

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
      docs: 'https://ngscorecard.com/developers',
      version: 'v1',
      auth: 'X-API-Key header, obtained via POST /api/v1/keys with a JSON body { "email": "you@example.com" }',
      rateLimit: `${FREE_TIER_LIMIT} requests/minute per key`,
      endpoints: [
        'GET /api/v1/presidents — the 5 federal presidents only',
        'GET /api/v1/governors — the state governors only (not to be confused with /:admin/governors below)',
        'GET /api/v1/:admin/promises',
        'GET /api/v1/:admin/inherited',
        'GET /api/v1/:admin/fraud',
        'GET /api/v1/:admin/orders',
        'GET /api/v1/:admin/ministers',
        'GET /api/v1/:admin/bills',
        'GET /api/v1/:admin/appointments',
        'GET /api/v1/:admin/judgments',
        'GET /api/v1/:admin/budget',
        'GET /api/v1/:admin/governors — historical state governors listed under a federal president\'s own profile; unrelated to GET /api/v1/governors above',
        'GET /api/v1/:admin/indicators',
      ],
      adminKeys: 'GET /api/v1/presidents (federal) and GET /api/v1/governors (state) together list every valid :admin key (e.g. "tinubu", "otti").',
      widget: {
        description: 'A no-key-required, CORS-open summary endpoint powering the embeddable widget — see /widget.js.',
        endpoint: 'GET /api/v1/widget/:admin/summary',
        embed: '<div data-ngscorecard-admin="tinubu"></div><script src="https://ngscorecard.com/widget.js" async></script>',
        rateLimit: '30 requests/minute per IP',
      },
    })
  })

  // Public, unauthenticated, CORS-open summary for the embeddable widget
  // (see /widget.js) — deliberately separate from the keyed data routes
  // below: a script embedded on a third-party site can't safely carry a
  // secret API key, and this only exposes an aggregate count, not the raw
  // dataset. Rate-limited by caller IP (i.e. each site visitor's own
  // browser), not by admin/site, since that's who's actually calling it.
  const widgetLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
  })

  router.get('/widget/:admin/summary', widgetLimiter, async (req, res) => {
    res.header('Access-Control-Allow-Origin', '*')
    const { admin } = req.params
    if (!(await q.isValidAdmin(admin))) {
      return res.status(404).json({ error: 'Unknown administration' })
    }
    const [administrations, promises] = await Promise.all([q.getPresidents(), q.getPromises(admin)])
    const info = administrations.find(a => a.key === admin)
    const counts = { kept: 0, partial: 0, broken: 0, pending: 0 }
    for (const p of promises) {
      if (p.status in counts) counts[p.status]++
    }
    res.json({
      admin,
      name: info?.name,
      fullName: info?.fullName,
      term: info?.term,
      tagline: info?.tagline,
      total: promises.length,
      counts,
      url: `https://ngscorecard.com/?admin=${admin}`,
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

  // Registered ahead of registerDataRoutes()'s own generic /presidents route
  // below, so these — filtered by level — win for these exact paths. Kept
  // out of dataRoutes.js deliberately: the internal frontend route
  // (GET /api/presidents, no key required) still needs the full unfiltered
  // registry for its own Federal/State nav toggle, so that shared route
  // stays as-is. Only the public API gets the split.
  router.get('/presidents', async (_req, res) => {
    res.json(await q.getFederalPresidents())
  })

  router.get('/governors', async (_req, res) => {
    res.json(await q.getStateGovernorAdmins())
  })

  registerDataRoutes(router)

  return router
}
