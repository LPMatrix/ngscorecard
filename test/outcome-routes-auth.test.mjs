// The AI-tool routes change promise statuses and spend model credit, so they
// must refuse anyone who is not a signed-in admin. adminAuth and the tool
// modules are stubbed: this checks the gate, not the tools.
import { test, describe, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

let signedIn = false
const calls = []
const record = (name) => async (...a) => { calls.push(name); return { ok: true, name } }
mock.module('../server/adminAuth.js', {
  namedExports: {
    requireAdmin: (req, res, next) => {
      if (!signedIn) return res.status(401).json({ error: 'Not authenticated' })
      if (req.method !== 'GET' && req.get('x-csrf-token') !== 'good') return res.status(403).json({ error: 'Invalid CSRF token' })
      next()
    },
  },
})
mock.module('../server/outcomeVerifier.js', { namedExports: { verifyPromiseOutcome: record('verify'), updatePromiseStatus: record('approve') } })
mock.module('../server/promiseClassifier.js', { namedExports: { classifyPromise: record('classify'), findSimilarHistoricalPromises: record('historical') } })
mock.module('../server/patternDetector.js', { namedExports: { getPatternReport: record('patterns'), getSectorPatterns: record('sectors'), getAdminComparison: record('admins') } })
mock.module('../server/realTimeTracker.js', { namedExports: { scanFeeds: record('scan'), getQueue: () => [], dismissQueueItem: () => true, DEFAULT_FEEDS: [] } })
mock.module('../server/lieDetector.js', { namedExports: { factCheckStatement: record('factcheck') } })
const { default: router } = await import('../server/outcomeRoutes.js')

let server, base
before(async () => {
  const app = express()
  app.use(express.json())
  app.use('/api/outcome', router)
  await new Promise(r => { server = app.listen(0, r) })
  base = `http://127.0.0.1:${server.address().port}/api/outcome`
})
after(() => server.close())

const post = (p, body = {}, headers = {}) => fetch(`${base}${p}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })

describe('AI tool routes', () => {
  test('every route refuses an anonymous caller and runs nothing', async () => {
    const attempts = [
      post('/verify', { promiseId: 1, articleText: 'x' }), post('/approve', { promiseId: 1, newStatus: 'kept' }),
      post('/classify', { promiseText: 'x', administration: 'a' }), post('/classify/historical', { promiseText: 'x' }),
      post('/factcheck', { statementText: 'x' }), post('/tracker/scan'),
      fetch(`${base}/patterns`), fetch(`${base}/patterns/sectors`), fetch(`${base}/patterns/admins`),
      fetch(`${base}/tracker/queue`), fetch(`${base}/tracker/feeds`), fetch(`${base}/tracker/queue/abc`, { method: 'DELETE' }),
    ]
    const statuses = (await Promise.all(attempts)).map(r => r.status)
    assert.ok(statuses.every(s => s === 401), statuses.join(','))
    assert.deepEqual(calls, [])
  })

  test('a signed-in admin without the CSRF token cannot change anything', async () => {
    signedIn = true
    try {
      assert.equal((await post('/approve', { promiseId: 1, newStatus: 'kept' })).status, 403)
      assert.equal((await post('/approve', { promiseId: 1, newStatus: 'kept' }, { 'x-csrf-token': 'wrong' })).status, 403)
      assert.deepEqual(calls, [])
    } finally { signedIn = false }
  })

  test('a signed-in admin with the token can use the tools', async () => {
    signedIn = true
    try {
      const res = await post('/approve', { promiseId: 1, newStatus: 'kept' }, { 'x-csrf-token': 'good' })
      assert.equal(res.status, 200)
      assert.deepEqual(calls, ['approve'])
      assert.equal((await fetch(`${base}/tracker/queue`)).status, 200)
    } finally { signedIn = false }
  })
})
