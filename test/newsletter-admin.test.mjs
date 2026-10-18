// The owner-only subscriber list and CSV, with the database in memory and the
// admin login stubbed (auth itself is not what is under test here).
import { test, describe, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../server/schema.js'
import { ensureNewsletterSchema } from '../server/newsletterSchema.js'

const sqlite = new Database(':memory:')
await ensureNewsletterSchema(sqlite)
sqlite.prepare(`CREATE TABLE admin_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL, action TEXT NOT NULL, table_name TEXT, row_id INTEGER, administration TEXT, before_json TEXT, after_json TEXT)`).run()
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
const { createAdminRouter } = await import('../server/adminRoutes.js')

const ins = (email, status, source = 'footer') => sqlite.prepare(
  `INSERT INTO subscribers (email,status,token,source,created_at,confirmed_at) VALUES (?,?,?,?,?,?)`,
).run(email, status, `tok-${email}`, source, '2026-10-18T10:00:00Z', status === 'confirmed' ? '2026-10-18T10:05:00Z' : null)

let server, base
describe('admin newsletter', () => {
  before(async () => {
    ins('a@x.org', 'confirmed'); ins('b@x.org', 'pending'); ins('c@x.org', 'unsubscribed'); ins('=cmd|x@x.org', 'confirmed', 'a,"b"')
    const app = express()
    app.use('/api/admin', createAdminRouter())
    await new Promise(r => { server = app.listen(0, r) })
    base = `http://127.0.0.1:${server.address().port}/api/admin`
  })
  after(() => server.close())

  test('lists subscribers with counts, and never returns the token', async () => {
    const body = await (await fetch(`${base}/subscribers`)).json()
    assert.equal(body.total, 4)
    assert.deepEqual(body.counts, { pending: 1, confirmed: 2, unsubscribed: 1 })
    assert.ok(body.rows.every(r => !('token' in r)))
    assert.ok(!JSON.stringify(body).includes('tok-'))
  })

  test('filters by status', async () => {
    const body = await (await fetch(`${base}/subscribers?status=pending`)).json()
    assert.deepEqual(body.rows.map(r => r.email), ['b@x.org'])
  })

  test('the CSV defaults to confirmed only, has no token, and neutralises spreadsheet formulas', async () => {
    const res = await fetch(`${base}/subscribers.csv`)
    assert.match(res.headers.get('content-type'), /text\/csv/)
    assert.match(res.headers.get('content-disposition'), /subscribers-confirmed\.csv/)
    const csv = await res.text()
    const lines = csv.trim().split('\n')
    assert.equal(lines[0], 'email,status,source,createdAt,confirmedAt,unsubscribedAt')
    assert.equal(lines.length, 3)
    assert.ok(lines[1].startsWith('a@x.org,confirmed,footer,'))
    assert.ok(lines[2].startsWith(`'=cmd|x@x.org,confirmed,"a,""b""",`), lines[2])
    assert.ok(!csv.includes('tok-'))
    assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM admin_audit WHERE action='subscribers_export'").get().n, 1)
  })

  test('?status=all includes everyone', async () => {
    const lines = (await (await fetch(`${base}/subscribers.csv?status=all`)).text()).trim().split('\n')
    assert.equal(lines.length, 5)
  })

  test('editors cannot see readers\' addresses', async () => {
    role = 'editor'
    assert.equal((await fetch(`${base}/subscribers`)).status, 403)
    assert.equal((await fetch(`${base}/subscribers.csv`)).status, 403)
    role = 'owner'
  })
})
