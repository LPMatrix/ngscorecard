import * as q from './queries.js'

// Registers the read-only administration-data routes on the given router.
// Shared by the internal (unauthenticated, used by the frontend) and public
// (API-key + rate-limited) routers so both stay in sync automatically.
export function registerDataRoutes(router) {
  // Wraps an async route handler so DB errors return 503 JSON instead of
  // crashing the process with an unhandled rejection.
  function wrap(fn) {
    return async (req, res) => {
      try {
        await fn(req, res)
      } catch (e) {
        console.error('[db]', req.method, req.path, e.message)
        if (!res.headersSent) res.status(503).json({ error: 'Database unavailable' })
      }
    }
  }

  async function guard(req, res) {
    if (!(await q.isValidAdmin(req.params.admin))) {
      res.status(400).json({ error: 'Unknown administration' })
      return false
    }
    return true
  }

  router.get('/presidents', wrap(async (_req, res) => {
    res.json(await q.getPresidents())
  }))

  // Recurring commitments (themes). Fixed segments — registered before the
  // /:admin/* routes so "themes" is never read as an administration key.
  router.get('/themes', wrap(async (_req, res) => {
    res.json(await q.getThemesWithCounts())
  }))

  router.get('/themes/:slug', wrap(async (req, res) => {
    const lineage = await q.getThemeLineage(req.params.slug)
    if (!lineage) { res.status(404).json({ error: 'Unknown theme' }); return }
    res.json(lineage)
  }))

  // One indicator's series across every administration that has it (e.g.
  // "igr" for every state), keyed by the canonical registry, not the
  // per-admin :admin route below — registered first so "indicators" is
  // never read as an administration key.
  router.get('/indicators/:key', wrap(async (req, res) => {
    const series = await q.getIndicatorSeries(req.params.key, {
      level: req.query.level,
      state: req.query.state,
    })
    if (!series) { res.status(404).json({ error: 'Unknown indicator key' }); return }
    res.json(series)
  }))

  router.get('/:admin/promises', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getPromises(req.params.admin))
  }))

  router.get('/:admin/inherited', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getInherited(req.params.admin))
  }))

  router.get('/:admin/fraud', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getFraud(req.params.admin))
  }))

  router.get('/:admin/orders', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getOrders(req.params.admin))
  }))

  router.get('/:admin/ministers', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getMinisters(req.params.admin))
  }))

  router.get('/:admin/bills', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getBills(req.params.admin))
  }))

  router.get('/:admin/appointments', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getAppointments(req.params.admin))
  }))

  router.get('/:admin/judgments', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getJudgments(req.params.admin))
  }))

  router.get('/:admin/budget', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getBudget(req.params.admin))
  }))

  router.get('/:admin/projects', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getProjects(req.params.admin))
  }))

  router.get('/:admin/governors', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getGovernors(req.params.admin))
  }))

  router.get('/:admin/indicators', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getIndicators(req.params.admin))
  }))

  router.get('/:admin/manifesto', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(q.getManifesto(req.params.admin))
  }))

  router.get('/:admin/history', wrap(async (req, res) => {
    if (!(await guard(req, res))) return
    res.json(await q.getEntryHistory(req.params.admin))
  }))
}
