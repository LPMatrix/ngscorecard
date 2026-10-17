// The promise tools (outcome verifier, promise classifier) with a fake database
// and a fake OpenRouter client: checks the request shape and that each kind of
// model reply (fenced JSON, prose before JSON, missing fields, garbage) is
// handled. Needs --experimental-test-module-mocks (set in the npm test script).
import { test, describe, mock, before } from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const ROWS = [
  { id: 1, administration: 'tinubu', title: 'Fix power supply', category: 'energy', status: 'partial', promise: 'Reliable electricity', datePromised: '2023-05-29' },
  { id: 2, administration: 'tinubu', title: 'Build rail links', category: 'transport', status: 'pending', promise: 'New rail lines', datePromised: '2023-05-29' },
  { id: 3, administration: 'buhari', title: 'Fix power supply', category: 'energy', status: 'broken', promise: 'Reliable electricity', datePromised: '2015-05-29' },
]

// a minimal drizzle-like chain: select().from().where().limit() is awaitable
const chain = (rows) => {
  const q = { from: () => q, where: () => q, limit: () => q, then: (ok, err) => Promise.resolve(rows).then(ok, err) }
  return q
}

let verifier, classifier
before(async () => {
  const dbUrl = pathToFileURL(path.resolve('server/db.js')).href
  mock.module(dbUrl, { namedExports: { db: { select: () => chain(ROWS), update: () => chain([]), insert: () => chain([]) } } })
  verifier = await import('../server/outcomeVerifier.js')
  classifier = await import('../server/promiseClassifier.js')
})

const clientReplying = (content, record = []) => ({
  chat: { completions: { create: async (body) => { record.push(body); return { choices: [{ message: { content } }] } } } },
})

describe('outcome verifier', () => {
  test('sends a system + user chat request and returns the parsed result with the promise attached', async () => {
    const record = []
    const reply = '```json\n{"claims":["Road 60% complete"],"confidence":"medium","suggested_status":"partial","reasoning":"r","evidence_quotes":["60 percent"]}\n```'
    const out = await verifier.verifyPromiseOutcome(1, 'The project is 60 percent complete.', { client: clientReplying(reply, record) })
    assert.equal(out.suggested_status, 'partial')
    assert.deepEqual(out.claims, ['Road 60% complete'])
    assert.deepEqual(out.promise, { id: 1, title: 'Fix power supply', current_status: 'partial' })
    const body = record[0]
    assert.deepEqual(body.messages.map(m => m.role), ['system', 'user'])
    assert.match(body.messages[1].content, /Title: Fix power supply/)
    assert.match(body.messages[1].content, /The project is 60 percent complete\./)
    assert.match(body.model, /^[a-z0-9-]+\/[a-z0-9.-]+$/, 'an OpenRouter model id')
    assert.ok(!('system' in body))
  })

  test('a model that does not return JSON is a clear error', async () => {
    await assert.rejects(
      verifier.verifyPromiseOutcome(1, 'text', { client: clientReplying('I could not determine that.') }),
      /did not return JSON/)
  })
})

describe('promise classifier', () => {
  test('classifies, and enriches similar promises and contradictions from the database', async () => {
    const reply = 'Sure!\n{"suggested_category":"energy","confidence_category":"high","similar_promise_ids":[1],"contradictions":[{"id":2,"reason":"competes for budget"}],"reasoning":"r"}'
    const out = await classifier.classifyPromise('tinubu', 'Expand the grid', { client: clientReplying(reply) })
    assert.equal(out.suggested_category, 'energy')
    assert.deepEqual(out.similar_promises.map(p => p.id), [1])
    assert.deepEqual(out.contradictions, [{ id: 2, title: 'Build rail links', reason: 'competes for budget' }])
  })

  test('fields the model leaves out mean "none", not a crash', async () => {
    const out = await classifier.classifyPromise('tinubu', 'Expand the grid', {
      client: clientReplying('{"suggested_category":"energy","confidence_category":"low","reasoning":"unsure"}'),
    })
    assert.deepEqual(out.similar_promises, [])
    assert.deepEqual(out.contradictions, [])
  })

  test('similar-promise lookup returns matches, and returns [] rather than throwing on a bad reply', async () => {
    const good = await classifier.findSimilarHistoricalPromises('Fix electricity', 5, { client: clientReplying('{"similar_ids":[1,3]}') })
    assert.deepEqual(good.map(p => p.id), [1, 3])
    const orig = console.warn; console.warn = () => {}
    try {
      assert.deepEqual(await classifier.findSimilarHistoricalPromises('x', 5, { client: clientReplying('no idea') }), [])
      assert.deepEqual(await classifier.findSimilarHistoricalPromises('x', 5, { client: clientReplying('{"similar_ids":"nope"}') }), [])
      const failing = { chat: { completions: { create: async () => { throw new Error('503') } } } }
      assert.deepEqual(await classifier.findSimilarHistoricalPromises('x', 5, { client: failing }), [])
    } finally { console.warn = orig }
  })
})
