import { Router } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import * as q from './queries.js'
import { renderReportPng } from './ogReport.js'

// GET /api/og/report/<admin>.png — the share image for a term report card.
// Mounted ahead of the general /api router (see server/apiApp.js). Public,
// unauthenticated and cacheable: the CDN serves repeats, and the limiter only
// bites on cache misses (e.g. a caller varying the query string to bust it).
export function createOgRouter() {
  const router = Router()

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
  })

  router.get('/report/:file', limiter, async (req, res) => {
    const m = /^([a-z0-9-]+)\.png$/.exec(req.params.file)
    if (!m) return res.status(404).type('text/plain').send('Not found')
    try {
      const admin = await q.getPresident(m[1])
      if (!admin) return res.status(404).type('text/plain').send('Unknown administration')
      const [promises, fraud, budget] = await Promise.all([
        q.getPromises(admin.key), q.getFraud(admin.key), q.getBudget(admin.key),
      ])
      const png = await renderReportPng({ admin, promises, fraud, budget })
      res.set({
        'Content-Type': 'image/png',
        // Ratings change slowly: an hour in browsers, a day on the CDN, and a
        // stale image is served while a fresh one regenerates.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      })
      res.send(png)
    } catch (e) {
      console.error('[og/report]', e)
      res.status(500).type('text/plain').send('Could not render image')
    }
  })

  return router
}
