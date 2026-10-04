import { Router, json } from 'express'
import { readFileSync } from 'fs'
import path from 'path'
import { eq, desc, count, and } from 'drizzle-orm'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { db } from './db.js'
import * as t from './schema.js'
import * as q from './queries.js'
import {
  authenticate, setAdminCookie, clearAdminCookie, loadSession, requireAdmin, requireOwner,
  hashPassword, generateTemporaryPassword, verifyUserPassword, userSubject, ENV_OWNER_ID, MIN_PASSWORD_LENGTH,
} from './adminAuth.js'

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
  projects:         { table: t.projects,         adminCol: 'administration' },
  corrections:      { table: t.corrections,      adminCol: null }, // reader-submitted moderation queue
  donations:        { table: t.donations,        adminCol: null }, // Paystack ledger, written by server/paystackRoutes.js
}

// Roles. The owner can do everything. An editor does the research work (every
// content table, the corrections queue, bulk import) but cannot see donor
// records, issue or revoke API keys, manage the team, or read the audit log.
// The donations table is a ledger written only by Paystack's webhook, so nobody
// edits it by hand, owner included.
const OWNER_ONLY_TABLES = new Set(['donations'])
const READ_ONLY_TABLES = new Set(['donations'])

function resolveTable(req, res, next) {
  const entry = TABLES[req.params.table]
  if (!entry) return res.status(404).json({ error: `Unknown table "${req.params.table}"` })
  if (OWNER_ONLY_TABLES.has(req.params.table) && req.admin.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' })
  }
  if (READ_ONLY_TABLES.has(req.params.table) && !['GET', 'HEAD'].includes(req.method)) {
    return res.status(405).json({ error: 'This table is read-only' })
  }
  req.tableEntry = entry
  next()
}

// Private accountability log (see adminAudit in schema.js). Destructive
// actions pass strict: true so a failure to record them aborts the action
// rather than letting a row vanish with no way back. Everything else is
// best-effort: a logging hiccup shouldn't block a legitimate edit.
async function audit(req, action, { table = null, rowId = null, administration = null, before = null, after = null, strict = false } = {}) {
  try {
    await db.insert(t.adminAudit).values({
      at: new Date().toISOString(),
      actorEmail: req.admin.email,
      actorRole: req.admin.role,
      action,
      tableName: table,
      rowId,
      administration,
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: after ? JSON.stringify(after) : null,
    })
  } catch (e) {
    console.error('admin audit write failed:', e.message)
    if (strict) throw new Error('Could not record this action in the audit log, so it was not carried out.')
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const publicUser = ({ passwordHash, ...rest }) => rest

// Tables where every rated row must carry a source (schema already declares
// `source`/`sourceLabel` NOT NULL). We enforce it at the write boundary too,
// with a clear message — and, on updates, specifically block changing a
// rating while leaving the row unsourced. Mirrors the methodology: "nothing
// is rated without a linked reference."
const SOURCE_REQUIRED = new Set(['promises', 'inherited', 'fraud', 'orders', 'bills'])
const RATING_FIELDS = ['status', 'responseVerdict']
const isBlank = (v) => v == null || (typeof v === 'string' && v.trim() === '')
const isHttpUrl = (v) => {
  try {
    const u = new URL(String(v))
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch { return false }
}

// Substantive fields whose changes are written to entry_history — "correct in
// the open" (PRINCIPLES.md). Timestamps, titles, categories and dates are not
// logged. An optional `__note` on the request body is attached as the reason.
const HISTORY_FIELDS = {
  promises:     ['status', 'assessment', 'promise', 'sourceTier'],
  inherited:    ['status', 'resolution', 'problem', 'sourceTier'],
  fraud:        ['status', 'responseVerdict', 'outcome', 'allegation', 'sourceTier'],
  orders:       ['status', 'effect', 'directive', 'sourceTier'],
  ministers:    ['status', 'performance', 'mandate', 'sourceTier'],
  bills:        ['status', 'outcome', 'summary', 'sourceTier'],
  judgments:    ['status', 'outcome', 'issue', 'sourceTier'],
  appointments: ['status', 'note'],
  projects:     ['status', 'outcome', 'summary', 'sourceTier'],
}
const historyKind = (f) =>
  f === 'sourceTier' ? 'reclassify' : RATING_FIELDS.includes(f) ? 'rating_change' : 'correction'
const norm = (v) => (v == null ? '' : String(v))

export function createAdminRouter() {
  const router = Router()
  router.use(json())

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10, // 10 attempts / 15 min / IP, counting failures only
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: { error: 'Too many sign-in attempts. Try again in a few minutes.' },
  })

  router.post('/login', loginLimiter, async (req, res) => {
    const subject = await authenticate(req.body?.email, req.body?.password)
    if (!subject) return res.status(401).json({ error: 'Wrong email or password' })
    setAdminCookie(res, subject)
    if (subject.id !== ENV_OWNER_ID) {
      await db.update(t.adminUsers).set({ lastLoginAt: new Date().toISOString() }).where(eq(t.adminUsers.id, subject.id)).catch(() => {})
    }
    req.admin = subject
    await audit(req, 'login')
    res.json({ ok: true })
  })

  router.post('/logout', (_req, res) => {
    clearAdminCookie(res)
    res.json({ ok: true })
  })

  router.get('/session', async (req, res) => {
    const admin = await loadSession(req)
    if (!admin) return res.json({ authenticated: false })
    res.json({
      authenticated: true,
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword,
        isEnvOwner: admin.id === ENV_OWNER_ID,
      },
    })
  })

  router.use(requireAdmin)

  router.get('/tables', (req, res) => {
    res.json(
      Object.entries(TABLES)
        .filter(([name]) => req.admin.role === 'owner' || !OWNER_ONLY_TABLES.has(name))
        .map(([name, { adminCol }]) => ({ name, scopedToAdmin: !!adminCol }))
    )
  })

  router.get('/keys', requireOwner, async (req, res) => {
    const { page, pageSize, offset } = parsePagination(req)
    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(t.apiKeys).orderBy(desc(t.apiKeys.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(t.apiKeys),
    ])
    res.json({ rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) })
  })

  router.post('/keys/:id/revoke', requireOwner, async (req, res) => {
    await db.update(t.apiKeys).set({ revoked: true }).where(eq(t.apiKeys.id, Number(req.params.id)))
    await audit(req, 'key_revoke', { table: 'api_keys', rowId: Number(req.params.id) })
    res.json({ ok: true })
  })

  router.post('/keys/:id/unrevoke', requireOwner, async (req, res) => {
    await db.update(t.apiKeys).set({ revoked: false }).where(eq(t.apiKeys.id, Number(req.params.id)))
    await audit(req, 'key_unrevoke', { table: 'api_keys', rowId: Number(req.params.id) })
    res.json({ ok: true })
  })

  router.delete('/keys/:id', requireOwner, async (req, res) => {
    const id = Number(req.params.id)
    const [row] = await db.select().from(t.apiKeys).where(eq(t.apiKeys.id, id)).limit(1)
    if (!row) return res.status(404).json({ error: 'Not found' })
    try {
      await audit(req, 'key_delete', { table: 'api_keys', rowId: id, before: { ...row, key: '[redacted]' }, strict: true })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
    await db.delete(t.apiKeys).where(eq(t.apiKeys.id, id))
    res.status(204).end()
  })

  router.get('/administrations', async (_req, res) => {
    res.json(await q.getPresidents())
  })

  router.get('/registry', async (_req, res) => {
    const file = path.join(process.cwd(), 'data/seed/indicators.json')
    res.json(JSON.parse(readFileSync(file, 'utf8')))
  })

  router.get('/history/:administration', async (req, res) => {
    res.json(await q.getEntryHistory(req.params.administration))
  })

  router.get('/audit', async (_req, res) => {
    const presidents = await q.getPresidents()
    const allIndicators = await db.select().from(t.indicators)
    const allPoints = await db.select().from(t.indicatorPoints)
    const byAdmin = new Map()
    for (const ind of allIndicators) {
      const arr = byAdmin.get(ind.administration) ?? []
      arr.push(ind)
      byAdmin.set(ind.administration, arr)
    }
    const pointsByAdmin = new Map()
    for (const pt of allPoints) {
      const arr = pointsByAdmin.get(pt.administration) ?? []
      arr.push(pt)
      pointsByAdmin.set(pt.administration, arr)
    }
    const registry = JSON.parse(readFileSync(path.join(process.cwd(), 'data/seed/indicators.json'), 'utf8'))
    const registryByKey = new Map(registry.map(r => [r.key, r]))
    const stateCore = registry.filter(r => r.level === 'state' && r.tier === 'core').map(r => r.key)
    function era(admin) {
      if (admin.level !== 'state') return null
      const start = parseInt(String(admin.termStart).slice(0, 4), 10)
      if (Number.isNaN(start)) return 'state-current'
      if (start < 1999) return 'state-pre1999'
      if (start < 2007) return 'state-1999-2007'
      if (start < 2023) return 'state-2007-2023'
      return 'state-current'
    }
    const eraCoverage = {}
    const eraTotals = {}
    const missingByKey = {}
    for (const admin of presidents.filter(p => p.level === 'state')) {
      const e = era(admin)
      if (!e) continue
      eraTotals[e] = (eraTotals[e] ?? 0) + 1
      const have = new Set((byAdmin.get(admin.key) ?? []).filter(i => i.registryKey).map(i => i.registryKey))
      for (const key of stateCore) {
        eraCoverage[e] ??= {}
        eraCoverage[e][key] ??= { published: 0, notPublished: 0, missing: 0 }
        const ind = (byAdmin.get(admin.key) ?? []).find(i => i.registryKey === key)
        if (ind && ind.status === 'not-published') eraCoverage[e][key].notPublished++
        else if (ind) eraCoverage[e][key].published++
        else {
          eraCoverage[e][key].missing++
          missingByKey[key] ??= []
          missingByKey[key].push(admin.key)
        }
      }
    }
    const drift = { noRegistryKey: 0, missingHib: 0, fewPoints: 0 }
    for (const ind of allIndicators) {
      if (!ind.registryKey) drift.noRegistryKey++
      if (ind.registryKey && registryByKey.get(ind.registryKey) && ind.higherIsBetter == null && registryByKey.get(ind.registryKey).higherIsBetter != null) drift.missingHib++
    }
    for (const admin of presidents) {
      const pts = pointsByAdmin.get(admin.key) ?? []
      if (pts.length > 0 && pts.length < 2) drift.fewPoints++
    }
    res.json({ eraCoverage, eraTotals, missingByKey, drift, totalAdmins: presidents.length })
  })

  // ---- Account: change your own password (any signed-in database user) ----
  router.post('/password', async (req, res) => {
    if (req.admin.id === ENV_OWNER_ID) {
      return res.status(400).json({ error: 'The owner password is set by the ADMIN_PASSWORD environment variable.' })
    }
    const current = String(req.body?.current || '')
    const next = String(req.body?.next || '')
    if (next.length < MIN_PASSWORD_LENGTH) {
      return res.status(422).json({ error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` })
    }
    if (next === current) return res.status(422).json({ error: 'Choose a different password from the current one.' })
    if (!(await verifyUserPassword(req.admin.id, current))) {
      return res.status(401).json({ error: 'Current password is incorrect.' })
    }
    const [user] = await db.update(t.adminUsers)
      .set({ passwordHash: await hashPassword(next), mustChangePassword: false })
      .where(eq(t.adminUsers.id, req.admin.id)).returning()
    // The old session is now invalid (its tag came from the old hash), so
    // issue a fresh one and the person stays signed in.
    setAdminCookie(res, userSubject(user))
    await audit(req, 'password_change')
    res.json({ ok: true })
  })

  // ---- Team (owner only) ----
  router.get('/users', requireOwner, async (_req, res) => {
    const rows = await db.select().from(t.adminUsers).orderBy(t.adminUsers.id)
    const envEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    res.json([
      ...(envEmail ? [{ id: ENV_OWNER_ID, email: envEmail, name: 'Owner (environment login)', role: 'owner', active: true, mustChangePassword: false, createdAt: null, lastLoginAt: null }] : []),
      ...rows.map(publicUser),
    ])
  })

  router.post('/users', requireOwner, async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const name = String(req.body?.name || '').trim().slice(0, 100)
    const role = req.body?.role === 'owner' ? 'owner' : 'editor'
    if (!EMAIL_RE.test(email) || email.length > 200) return res.status(422).json({ error: 'Enter a valid email address.' })
    if (!name) return res.status(422).json({ error: 'Enter the person\'s name.' })
    if (email === (process.env.ADMIN_EMAIL || '').trim().toLowerCase()) {
      return res.status(422).json({ error: 'That email is the environment owner login.' })
    }
    const [taken] = await db.select({ id: t.adminUsers.id }).from(t.adminUsers).where(eq(t.adminUsers.email, email)).limit(1)
    if (taken) return res.status(409).json({ error: 'An account with that email already exists.' })

    const temporaryPassword = generateTemporaryPassword()
    const [user] = await db.insert(t.adminUsers).values({
      email, name, role,
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: req.admin.email,
    }).returning()
    await audit(req, 'user_create', { table: 'admin_users', rowId: user.id, after: { email, name, role } })
    res.status(201).json({ user: publicUser(user), temporaryPassword })
  })

  router.post('/users/:id/reset', requireOwner, async (req, res) => {
    const id = Number(req.params.id)
    const [existing] = await db.select().from(t.adminUsers).where(eq(t.adminUsers.id, id)).limit(1)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const temporaryPassword = generateTemporaryPassword()
    await db.update(t.adminUsers)
      .set({ passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true })
      .where(eq(t.adminUsers.id, id))
    await audit(req, 'user_reset_password', { table: 'admin_users', rowId: id, after: { email: existing.email } })
    res.json({ ok: true, temporaryPassword })
  })

  router.post('/users/:id/active', requireOwner, async (req, res) => {
    const id = Number(req.params.id)
    const active = Boolean(req.body?.active)
    const [existing] = await db.select().from(t.adminUsers).where(eq(t.adminUsers.id, id)).limit(1)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (id === req.admin.id) return res.status(422).json({ error: 'You can\'t deactivate your own account.' })
    await db.update(t.adminUsers).set({ active }).where(eq(t.adminUsers.id, id))
    await audit(req, active ? 'user_activate' : 'user_deactivate', { table: 'admin_users', rowId: id, after: { email: existing.email } })
    res.json({ ok: true })
  })

  // ---- Activity log (owner only) ----
  router.get('/activity', requireOwner, async (req, res) => {
    const { page, pageSize, offset } = parsePagination(req)
    const filters = []
    if (typeof req.query.actor === 'string' && req.query.actor) filters.push(eq(t.adminAudit.actorEmail, req.query.actor))
    if (typeof req.query.table === 'string' && req.query.table) filters.push(eq(t.adminAudit.tableName, req.query.table))
    if (typeof req.query.action === 'string' && req.query.action) filters.push(eq(t.adminAudit.action, req.query.action))
    const where = filters.length ? and(...filters) : undefined
    let rowsQuery = db.select().from(t.adminAudit)
    let countQuery = db.select({ value: count() }).from(t.adminAudit)
    if (where) { rowsQuery = rowsQuery.where(where); countQuery = countQuery.where(where) }
    const [rows, [{ value: total }]] = await Promise.all([
      rowsQuery.orderBy(desc(t.adminAudit.id)).limit(pageSize).offset(offset),
      countQuery,
    ])
    res.json({ rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) })
  })

  // Put a deleted row back exactly as it was (original id included), as long
  // as nothing has taken that id since.
  router.post('/activity/:id/restore', requireOwner, async (req, res) => {
    const [entry] = await db.select().from(t.adminAudit).where(eq(t.adminAudit.id, Number(req.params.id))).limit(1)
    if (!entry || entry.action !== 'delete' || !entry.beforeJson) {
      return res.status(422).json({ error: 'Only a delete entry with a saved row can be restored.' })
    }
    const target = TABLES[entry.tableName]
    if (!target || READ_ONLY_TABLES.has(entry.tableName)) return res.status(422).json({ error: 'This table cannot be restored from here.' })
    const row = JSON.parse(entry.beforeJson)
    const [clash] = await db.select().from(target.table).where(eq(target.table.id, row.id)).limit(1)
    if (clash) return res.status(409).json({ error: 'A row with that id already exists, so there is nothing to restore.' })
    await db.insert(target.table).values(row)
    await audit(req, 'restore', { table: entry.tableName, rowId: row.id, administration: entry.administration, after: row })
    res.json({ ok: true })
  })

  router.post('/bulk/:table', resolveTable, async (req, res) => {
    const rows = req.body
    if (!Array.isArray(rows) || !rows.length) return res.status(422).json({ error: 'Expected a non-empty JSON array' })
    if (rows.length > 500) return res.status(422).json({ error: 'Bulk limit is 500 rows per request' })
    const { table } = req.tableEntry
    const tableName = req.params.table
    for (const row of rows) {
      if (SOURCE_REQUIRED.has(tableName) && (isBlank(row.source) || isBlank(row.sourceLabel))) {
        return res.status(422).json({ error: 'Each row needs source and sourceLabel for this table' })
      }
      if ('source' in row && !isBlank(row.source) && !isHttpUrl(row.source)) {
        return res.status(422).json({ error: 'Source must be an http(s) URL' })
      }
    }
    const inserted = []
    for (const row of rows) {
      const { id, __note, ...values } = row
      const [created] = await db.insert(table).values(values).returning()
      inserted.push(created)
    }
    await audit(req, 'bulk_create', { table: tableName, after: { count: inserted.length, ids: inserted.map(r => r.id) } })
    res.status(201).json({ inserted: inserted.length, rows: inserted })
  })

  router.post('/corrections/:id/apply', async (req, res) => {
    const id = Number(req.params.id)
    const [correction] = await db.select().from(t.corrections).where(eq(t.corrections.id, id)).limit(1)
    if (!correction) return res.status(404).json({ error: 'Correction not found' })
    const entry = correction.entryTable && TABLES[correction.entryTable]
    if (!entry || !entry.adminCol || correction.entryId == null) {
      return res.status(422).json({ error: 'Correction is not attached to an editable administration entry' })
    }
    const note = typeof req.body?.adminNote === 'string' ? req.body.adminNote.trim() : ''
    await db.update(t.corrections).set({ status: 'actioned', adminNote: note || `Applied by ${req.admin.name}` }).where(eq(t.corrections.id, id))
    await audit(req, 'apply_correction', { table: 'corrections', rowId: id, administration: correction.administration })
    res.json({ ok: true, correctionId: id, entryTable: correction.entryTable, entryId: correction.entryId })
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
    const { id, __note, ...values } = req.body || {}
    if (SOURCE_REQUIRED.has(req.params.table) && (isBlank(values.source) || isBlank(values.sourceLabel))) {
      return res.status(422).json({ error: 'A source URL and a source label are required for every rated entry.' })
    }
    if ('source' in values && !isBlank(values.source) && !isHttpUrl(values.source)) {
      return res.status(422).json({ error: 'Source must be an http(s) URL.' })
    }
    const [row] = await db.insert(table).values(values).returning()
    await audit(req, 'create', { table: req.params.table, rowId: row.id, administration: row.administration ?? null, after: row })
    res.status(201).json(row)
  })

  router.put('/:table/:id', resolveTable, async (req, res) => {
    const { table } = req.tableEntry
    const tableName = req.params.table
    const id = Number(req.params.id)
    const { id: _dropId, __note, ...values } = req.body || {}
    const note = typeof __note === 'string' && __note.trim() ? __note.trim() : null
    if ('source' in values && !isBlank(values.source) && !isHttpUrl(values.source)) {
      return res.status(422).json({ error: 'Source must be an http(s) URL.' })
    }

    const logged = HISTORY_FIELDS[tableName] || []
    const touchesRating = RATING_FIELDS.some(f => f in values)
    const [cur] = await db.select().from(table).where(eq(table.id, id)).limit(1)
    if (!cur) return res.status(404).json({ error: 'Not found' })

    // Block changing a rating while the row would be left without a source.
    if (SOURCE_REQUIRED.has(tableName) && touchesRating) {
      const source      = 'source'      in values ? values.source      : cur.source
      const sourceLabel = 'sourceLabel' in values ? values.sourceLabel : cur.sourceLabel
      if (isBlank(source) || isBlank(sourceLabel)) {
        return res.status(422).json({ error: 'This entry has no source. Add a source URL and label in the same edit that changes the rating.' })
      }
    }

    // Diff the logged fields for the public change history.
    const historyRows = []
    for (const f of logged) {
      if (!(f in values) || norm(values[f]) === norm(cur[f])) continue
      historyRows.push({
        entryTable: tableName, entryId: id, administration: cur.administration ?? null,
        kind: historyKind(f), field: f,
        oldValue: cur[f] == null ? null : String(cur[f]),
        newValue: values[f] == null ? null : String(values[f]),
        note, changedAt: new Date().toISOString(),
      })
    }

    const [row] = await db.update(table).set(values).where(eq(table.id, id)).returning()
    if (!row) return res.status(404).json({ error: 'Not found' })
    if (historyRows.length) await db.insert(t.entryHistory).values(historyRows)
    await audit(req, 'update', { table: tableName, rowId: id, administration: cur.administration ?? null, before: cur, after: row })
    res.json(row)
  })

  router.delete('/:table/:id', resolveTable, async (req, res) => {
    const { table } = req.tableEntry
    const id = Number(req.params.id)
    const [cur] = await db.select().from(table).where(eq(table.id, id)).limit(1)
    if (!cur) return res.status(404).json({ error: 'Not found' })
    // The full row is written to the audit log before it is deleted, so a
    // mistaken delete can be undone from Activity log → Restore.
    try {
      await audit(req, 'delete', { table: req.params.table, rowId: id, administration: cur.administration ?? null, before: cur, strict: true })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
    await db.delete(table).where(eq(table.id, id))
    res.status(204).end()
  })

  return router
}
