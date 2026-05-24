import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

const VALID_ADMINS = new Set(['tinubu', 'buhari', 'jonathan', 'yaradua', 'obasanjo'])

export function createApiRouter() {
  const router = Router()

  // Patch res.json for environments (e.g. Vite's connect server) that
  // don't wrap the native ServerResponse in an Express Response.
  router.use((_req, res, next) => {
    if (!res.json) {
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      }
    }
    next()
  })

  function guard(req, res) {
    if (!VALID_ADMINS.has(req.params.admin)) {
      res.status(400).json({ error: 'Unknown administration' })
      return false
    }
    return true
  }

  router.get('/presidents', async (_req, res) => {
    const rows = await db.select().from(t.presidents)
    res.json(rows.map(p => ({
      ...p,
      term: p.termEnd ? `${p.termStart}–${p.termEnd}` : `${p.termStart}–present`,
    })))
  })

  router.get('/:admin/promises', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.promises).where(eq(t.promises.administration, req.params.admin)))
  })

  router.get('/:admin/inherited', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.inherited).where(eq(t.inherited.administration, req.params.admin)))
  })

  router.get('/:admin/fraud', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.fraud).where(eq(t.fraud.administration, req.params.admin)))
  })

  router.get('/:admin/orders', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.orders).where(eq(t.orders.administration, req.params.admin)))
  })

  router.get('/:admin/ministers', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.ministers).where(eq(t.ministers.administration, req.params.admin)))
  })

  router.get('/:admin/bills', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.bills).where(eq(t.bills.administration, req.params.admin)))
  })

  router.get('/:admin/appointments', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.appointments).where(eq(t.appointments.administration, req.params.admin)))
  })

  router.get('/:admin/judgments', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.judgments).where(eq(t.judgments.administration, req.params.admin)))
  })

  router.get('/:admin/history', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.history).where(eq(t.history.administration, req.params.admin)))
  })

  router.get('/:admin/budget', async (req, res) => {
    if (!guard(req, res)) return
    const { admin } = req.params
    const [budgets, ministries] = await Promise.all([
      db.select().from(t.budget).where(eq(t.budget.administration, admin)),
      db.select().from(t.budgetMinistries).where(eq(t.budgetMinistries.administration, admin)),
    ])
    const byYear = {}
    for (const m of ministries) {
      if (!byYear[m.budgetYear]) byYear[m.budgetYear] = []
      byYear[m.budgetYear].push({ name: m.name, allocationBn: m.allocationBn, releasedPct: m.releasedPct, note: m.note })
    }
    res.json(budgets.map(b => ({ ...b, ministries: byYear[b.year] || [] })))
  })

  router.get('/:admin/governors', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await db.select().from(t.governors).where(eq(t.governors.administration, req.params.admin)))
  })

  router.get('/:admin/indicators', async (req, res) => {
    if (!guard(req, res)) return
    const { admin } = req.params
    const [inds, pts] = await Promise.all([
      db.select().from(t.indicators).where(eq(t.indicators.administration, admin)),
      db.select().from(t.indicatorPoints).where(eq(t.indicatorPoints.administration, admin)),
    ])
    const byId = {}
    for (const p of pts) {
      if (!byId[p.indicatorId]) byId[p.indicatorId] = []
      byId[p.indicatorId].push({ label: p.label, value: p.value })
    }
    res.json(inds.map(({ id, key, ...rest }) => ({ id: key, ...rest, points: byId[id] || [] })))
  })

  return router
}
