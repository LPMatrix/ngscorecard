import { Router, json } from 'express'
import { eq, desc } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'
import * as q from './queries.js'
import { checkPassword, setAdminCookie, clearAdminCookie, isAuthed, requireAdmin } from './adminAuth.js'

// Whitelist of tables the admin UI is allowed to touch, and which column
// scopes them to one administration (if any). Keeps /api/admin/:table from
// becoming an arbitrary-table read/write endpoint.
const TABLES = {
  presidents:       { table: t.presidents,       adminCol: null },
  promises:         { table: t.promises,         adminCol: 'administration' },
  inherited:        { table: t.inherited,        adminCol: 'administration' },
  fraud:            { table: t.fraud,            adminCol: 'administration' },
  orders:           { table: t.orders,           adminCol: 'administration' },
  ministers:        { table: t.ministers,        adminCol: 'administration' },
  bills:            { table: t.bills,            adminCol: 'administration' },
  appointments:     { table: t.appointments,     adminCol: 'administration' },
  judgments:        { table: t.judgments,        adminCol: 'administration' },
  budget:           { table: t.budget,           adminCol: 'administration' },
  budgetMinistries: { table: t.budgetMinistries, adminCol: 'administration' },
  indicators:       { table: t.indicators,       adminCol: 'administration' },
  indicatorPoints:  { table: t.indicatorPoints,  adminCol: 'administration' },
  governors:        { table: t.governors,        adminCol: 'administration' },
}

function resolveTable(req, res, next) {
  const entry = TABLES[req.params.table]
  if (!entry) return res.status(404).json({ error: `Unknown table "${req.params.table}"` })
  req.tableEntry = entry
  next()
}

export function createAdminRouter() {
  const router = Router()
  router.use(json())

  router.post('/login', (req, res) => {
    if (!checkPassword(req.body?.password)) {
      return res.status(401).json({ error: 'Wrong password' })
    }
    setAdminCookie(res)
    res.json({ ok: true })
  })

  router.post('/logout', (_req, res) => {
    clearAdminCookie(res)
    res.json({ ok: true })
  })

  router.get('/session', (req, res) => {
    res.json({ authenticated: isAuthed(req) })
  })

  router.use(requireAdmin)

  router.get('/tables', (_req, res) => {
    res.json(
      Object.entries(TABLES).map(([name, { adminCol }]) => ({ name, scopedToAdmin: !!adminCol }))
    )
  })

  router.get('/keys', async (_req, res) => {
    const rows = await db.select().from(t.apiKeys).orderBy(desc(t.apiKeys.createdAt))
    res.json(rows)
  })

  router.post('/keys/:id/revoke', async (req, res) => {
    await db.update(t.apiKeys).set({ revoked: true }).where(eq(t.apiKeys.id, Number(req.params.id)))
    res.json({ ok: true })
  })

  router.post('/keys/:id/unrevoke', async (req, res) => {
    await db.update(t.apiKeys).set({ revoked: false }).where(eq(t.apiKeys.id, Number(req.params.id)))
    res.json({ ok: true })
  })

  router.delete('/keys/:id', async (req, res) => {
    await db.delete(t.apiKeys).where(eq(t.apiKeys.id, Number(req.params.id)))
    res.status(204).end()
  })

  router.get('/administrations', async (_req, res) => {
    res.json(await q.getPresidents())
  })

  router.get('/:table', resolveTable, async (req, res) => {
    const { table, adminCol } = req.tableEntry
    if (adminCol && req.query.administration) {
      return res.json(await db.select().from(table).where(eq(table[adminCol], req.query.administration)))
    }
    res.json(await db.select().from(table))
  })

  router.post('/:table', resolveTable, async (req, res) => {
    const { table } = req.tableEntry
    const { id, ...values } = req.body || {}
    const [row] = await db.insert(table).values(values).returning()
    res.status(201).json(row)
  })

  router.put('/:table/:id', resolveTable, async (req, res) => {
    const { table } = req.tableEntry
    const { id, ...values } = req.body || {}
    const [row] = await db.update(table).set(values).where(eq(table.id, Number(req.params.id))).returning()
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  })

  router.delete('/:table/:id', resolveTable, async (req, res) => {
    const { table } = req.tableEntry
    await db.delete(table).where(eq(table.id, Number(req.params.id)))
    res.status(204).end()
  })

  return router
}
