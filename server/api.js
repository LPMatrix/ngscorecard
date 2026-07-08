import { Router } from 'express'
import * as q from './queries.js'

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
    if (!q.VALID_ADMINS.has(req.params.admin)) {
      res.status(400).json({ error: 'Unknown administration' })
      return false
    }
    return true
  }

  router.get('/presidents', async (_req, res) => {
    res.json(await q.getPresidents())
  })

  router.get('/:admin/promises', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getPromises(req.params.admin))
  })

  router.get('/:admin/inherited', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getInherited(req.params.admin))
  })

  router.get('/:admin/fraud', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getFraud(req.params.admin))
  })

  router.get('/:admin/orders', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getOrders(req.params.admin))
  })

  router.get('/:admin/ministers', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getMinisters(req.params.admin))
  })

  router.get('/:admin/bills', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getBills(req.params.admin))
  })

  router.get('/:admin/appointments', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getAppointments(req.params.admin))
  })

  router.get('/:admin/judgments', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getJudgments(req.params.admin))
  })

  router.get('/:admin/history', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getHistory(req.params.admin))
  })

  router.get('/:admin/budget', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getBudget(req.params.admin))
  })

  router.get('/:admin/governors', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getGovernors(req.params.admin))
  })

  router.get('/:admin/indicators', async (req, res) => {
    if (!guard(req, res)) return
    res.json(await q.getIndicators(req.params.admin))
  })

  return router
}
