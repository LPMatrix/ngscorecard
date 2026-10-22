// Admin table search and status filter, and the overview endpoint, against an
// in-memory database with the real migrations. The admin login is stubbed.
import { test, describe, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import express from 'express'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core'
import * as schema from '../server/schema.js'
import { ensureNewsletterSchema } from '../server/newsletterSchema.js'

const sqlite = new Database(':memory:')
for (const file of ['0000_light_ink.sql', '0001_ambiguous_warpath.sql']) {
  for (const stmt of fs.readFileSync(new URL(`../drizzle/${file}`, import.meta.url), 'utf8').split('--> statement-breakpoint')) {
    if (stmt.trim()) { try { sqlite.exec(stmt) } catch { /* a later migration may re-create a column */ } }
  }
}
// The migrations predate some columns the app adds at startup (server/db.js), so
// bring each existing table up to what the schema declares, as nullable columns.
for (const table of Object.values(schema).filter(v => v instanceof SQLiteTable)) {
  const { name, columns } = getTableConfig(table)
  const have = new Set(sqlite.prepare(`PRAGMA table_info(${name})`).all().map(c => c.name))
  if (!have.size) continue
  for (const col of columns.filter(c => !have.has(c.name))) sqlite.exec(`ALTER TABLE ${name} ADD COLUMN ${col.name} ${col.getSQLType()}`)
}
sqlite.exec(`CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, administration TEXT NOT NULL, title TEXT NOT NULL,
  category TEXT NOT NULL, status TEXT NOT NULL, state TEXT, location TEXT, started TEXT, target_completion TEXT, completed_date TEXT,
  budget_allocated_bn REAL, amount_spent_bn REAL, physical_completion_pct REAL, contractor TEXT, summary TEXT NOT NULL, outcome TEXT NOT NULL,
  source TEXT NOT NULL, source_label TEXT NOT NULL, updated TEXT NOT NULL, source_tier TEXT)`)
sqlite.exec(`CREATE TABLE IF NOT EXISTS admin_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL, action TEXT NOT NULL, table_name TEXT, row_id INTEGER, administration TEXT, before_json TEXT, after_json TEXT)`)
await ensureNewsletterSchema(sqlite)
const testDb = drizzle(sqlite, { schema })

let role = 'owner'
mock.module('../server/db.js', { namedExports: { db: testDb } })
mock.module('../server/adminAuth.js', {
  namedExports: {
    authenticate: async () => null, setAdminCookie() {}, clearAdminCookie() {}, loadSession: async () => null,
    requireAdmin: (req, _res, next) => { req.admin = { email: 'o@x.org', role, name: 'O' }; next() },
    requireOwner: (req, res, next) => { req.admin = { email: 'o@x.org', role, name: 'O' }; return role === 'owner' ? next() : res.status(403).json({ error: 'Owner access required' }) },
    hashPassword: async () => '', generateTemporaryPassword: () => '', verifyUserPassword: async () => false,
    userSubject: () => '', ENV_OWNER_ID: -1, MIN_PASSWORD_LENGTH: 12,
  },
})
const { createAdminRouter, monthsSince } = await import('../server/adminRoutes.js')

const promise = (title, status, extra = {}) => testDb.insert(schema.promises).values({
  administration: 'tinubu', title, category: 'Economy', status, promise: `Promise: ${title}`, assessment: 'Assessed.',
  source: 'https://example.org/a', sourceLabel: 'Example', updated: '2026-10-01', ...extra,
}).run()

let server, base
before(async () => {
  const app = express()
  app.use('/api/admin', createAdminRouter())
  await new Promise(r => { server = app.listen(0, r) })
  base = `http://127.0.0.1:${server.address().port}/api/admin`
})
const get = async (p) => (await fetch(`${base}${p}`)).json()

describe('monthsSince', () => {
  const now = new Date('2026-10-20T12:00:00Z')
  test('reads the date shapes the admin uses', () => {
    assert.equal(monthsSince('2026-10-01', now), 0)
    assert.equal(monthsSince('2026-01-15', now), 9)
    assert.equal(monthsSince('January 2026', now), 9)
    assert.equal(monthsSince('Jan 2025', now), 21)
    assert.equal(monthsSince('2026', now), 9)
  })
  test('gives up on anything else', () => {
    for (const bad of ['', null, 'soon', 'Smarch 2026', '10/2026']) assert.equal(monthsSince(bad, now), null)
  })
})

describe('admin list search and filters', () => {
  before(async () => {
    await promise('Remove fuel subsidy', 'kept')
    await promise('Complete the Second Niger Bridge', 'partial')
    await promise('Build 50% affordable housing', 'broken', { assessment: 'Far short of the 50_percent target.' })
    await promise('Fix the refineries', 'broken')
  })

  test('search finds a word in any text column, ignoring case', async () => {
    assert.deepEqual((await get('/promises?q=NIGER')).rows.map(r => r.title), ['Complete the Second Niger Bridge'])
    assert.deepEqual((await get('/promises?q=assessed')).total, 3)
  })

  test('every word typed must match', async () => {
    assert.equal((await get('/promises?q=fuel+subsidy')).total, 1)
    assert.equal((await get('/promises?q=fuel+refineries')).total, 0)
  })

  test('% and _ are searched literally, not as wildcards', async () => {
    assert.deepEqual((await get('/promises?q=50%25')).rows.map(r => r.title), ['Build 50% affordable housing'])
    assert.equal((await get('/promises?q=%25')).total, 1)
    assert.equal((await get('/promises?q=50_percent')).total, 1)
    assert.equal((await get('/promises?q=_')).total, 1, 'only the row that really contains an underscore')
  })

  test('an empty or blank search returns everything', async () => {
    assert.equal((await get('/promises?q=')).total, 4)
    assert.equal((await get('/promises?q=%20%20')).total, 4)
  })

  test('status filter, alone and with search and administration', async () => {
    assert.equal((await get('/promises?status=broken')).total, 2)
    assert.deepEqual((await get('/promises?status=broken&q=refineries')).rows.map(r => r.title), ['Fix the refineries'])
    assert.equal((await get('/promises?status=broken&administration=nobody')).total, 0)
  })

  test('a status filter on a table with no status column is ignored, not an error', async () => {
    const res = await fetch(`${base}/presidents?status=kept`)
    assert.equal(res.status, 200)
  })

  test('search text cannot break the query', async () => {
    for (const q of ["'; DROP TABLE promises; --", '"', '\\', '%%%']) {
      assert.equal((await fetch(`${base}/promises?q=${encodeURIComponent(q)}`)).status, 200, q)
    }
    assert.equal((await get('/promises')).total, 4)
  })
})

describe('overview', () => {
  before(() => {
    sqlite.prepare(`INSERT INTO corrections (kind, body, status, created_at) VALUES ('error','x','new','2026-10-01'),('error','y','new','2026-10-02'),('other','z','actioned','2026-10-03')`).run()
    sqlite.prepare(`INSERT INTO presidents (key,name,full_name,term_start,reviewed,level,is_current) VALUES ('old','Old','Old One','2020-01-01','January 2025','federal',1),('fresh','Fresh','Fresh One','2023-01-01',?, 'federal',1),('gone','Gone','Gone One','2000-01-01','2001-01-01','federal',0)`)
      .run(new Date().toISOString().slice(0, 10))
    sqlite.prepare(`INSERT INTO entry_history (entry_table, entry_id, administration, kind, field, old_value, new_value, changed_at) VALUES ('promises',1,'tinubu','rating_change','status','pending','kept',?)`).run(new Date().toISOString())
    sqlite.prepare(`INSERT INTO subscribers (email,status,token,created_at) VALUES ('a@x.org','confirmed','t1','2026-10-01'),('b@x.org','pending','t2','2026-10-01')`).run()
    sqlite.prepare(`INSERT INTO admin_audit (at, actor_email, actor_role, action, before_json) VALUES ('2026-10-01','o@x.org','owner','update','{"big":"row"}')`).run()
  })

  test('counts what needs attention', async () => {
    const o = await get('/overview')
    assert.deepEqual(o.corrections, { new: 2, actioned: 1 })
    assert.deepEqual(o.promisesByStatus, { kept: 1, partial: 1, broken: 2 })
    assert.equal(o.totals.promises, 4)
    assert.equal(o.changesLast7Days, 1)
    assert.equal(o.recentChanges.length, 1)
  })

  test('flags current profiles whose review is nine or more months old, and not retired ones', async () => {
    const o = await get('/overview')
    assert.equal(o.reviewDue.count, 1)
    assert.deepEqual(o.reviewDue.oldest.map(p => p.key), ['old'])
  })

  test('the owner also gets the newsletter counts and recent activity, without saved rows', async () => {
    const o = await get('/overview')
    assert.deepEqual(o.subscribers, { pending: 1, confirmed: 1, unsubscribed: 0 })
    assert.equal(o.recentActivity.length, 1)
    assert.ok(!('beforeJson' in o.recentActivity[0]))
  })

  test('an editor gets the content half only', async () => {
    role = 'editor'
    try {
      const o = await get('/overview')
      assert.ok(o.corrections && o.reviewDue)
      assert.ok(!('subscribers' in o))
      assert.ok(!('recentActivity' in o))
    } finally { role = 'owner' }
  })
})

after(() => { server.close(); sqlite.close() })
