import { Router, json } from 'express'
import { eq, desc, count } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'
import * as q from './queries.js'
import { checkPassword, setAdminCookie, clearAdminCookie, isAuthed, requireAdmin } from './adminAuth.js'

// Admin table listings are paginated so a table with hundreds of rows (e.g.
// promises, ministers) never ships as one giant unpaginated response.
const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 500

function parsePagination(req) {
  let pageSize = parseInt(req.query.pageSize, 10)
  if (!Number.isFinite(pageSize) || pageSize <= 0) pageSize = DEFAULT_PAGE_SIZE
  pageSize = Math.min(pageSize, MAX_PAGE_SIZE)
  let page = parseInt(req.query.page, 10)
  if (!Number.isFinite(page) || page <= 0) page = 1
  return { page, pageSize, offset: (page - 1) * pageSize }
}

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

// Tables where every rated row must carry a source (schema already declares
// `source`/`sourceLabel` NOT NULL). We enforce it at the write boundary too,
// with a clear message — and, on updates, specifically block changing a
// rating while leaving the row unsourced. Mirrors the methodology: "nothing
// is rated without a linked reference."
const SOURCE_REQUIRED = new Set(['promises', 'inherited', 'fraud', 'orders', 'bills'])
const RATING_FIELDS = ['status', 'responseVerdict']
const isBlank = (v) => v == null || (typeof v === 'string' && v.trim() === '')

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

  router.get('/keys', async (req, res) => {
    const { page, pageSize, offset } = parsePagination(req)
    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(t.apiKeys).orderBy(desc(t.apiKeys.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(t.apiKeys),
    ])
    res.json({ rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) })
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
    const { page, pageSize, offset } = parsePagination(req)
    const where = adminCol && req.query.administration
      ? eq(table[adminCol], req.query.administration)
      : undefined

    let rowsQuery = db.select().from(table)
    let countQuery = db.select({ value: count() }).from(table)
    if (where) {
      rowsQuery = rowsQuery.where(where)
      countQuery = countQuery.where(where)
    }

    const [rows, [{ value: total }]] = await Promise.all([
      rowsQuery.orderBy(table.id).limit(pageSize).offset(offset),
      countQuery,
    ])

    res.json({ rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) })
  })

  router.post('/:table', resolveTable, async (req, res) => {
    const { table } = req.tableEntry
    const { id, ...values } = req.body || {}
    if (SOURCE_REQUIRED.has(req.params.table) && (isBlank(values.source) || isBlank(values.sourceLabel))) {
      return res.status(422).json({ error: 'A source URL and a source label are required for every rated entry.' })
    }
    const [row] = await db.insert(table).values(values).returning()
    res.status(201).json(row)
  })

  router.put('/:table/:id', resolveTable, async (req, res) => {
    const { table } = req.tableEntry
    const { id, ...values } = req.body || {}

    // Block changing a rating while the row would be left without a source.
    if (SOURCE_REQUIRED.has(req.params.table) && RATING_FIELDS.some(f => f in values)) {
      const [cur] = await db
        .select({ source: table.source, sourceLabel: table.sourceLabel })
        .from(table).where(eq(table.id, Number(req.params.id))).limit(1)
      const source      = 'source'      in values ? values.source      : cur?.source
      const sourceLabel = 'sourceLabel' in values ? values.sourceLabel : cur?.sourceLabel
      if (isBlank(source) || isBlank(sourceLabel)) {
        return res.status(422).json({ error: 'This entry has no source. Add a source URL and label in the same edit that changes the rating.' })
      }
    }

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
