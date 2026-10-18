// The fact-checker and the pattern detector, with a fake database and a fake
// model. They call the model through OpenRouter (server/openrouter.js); what is
// pinned here is the request shape, and that each file keeps its own behaviour:
// an API error propagates, a reply that is not JSON falls back to a safe default.
// Needs --experimental-test-module-mocks (set in the npm test script).
import { test, describe, mock, before } from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const PROMISES = [
  { id: 1, administration: 'tinubu', title: 'Complete the Lagos-Calabar coastal highway', promise: 'Build the highway', category: 'infrastructure', status: 'partial', assessment: 'Section 1 open' },
  { id: 2, administration: 'tinubu', title: 'Fix power supply', promise: 'Reliable electricity', category: 'energy', status: 'broken', assessment: null },
]
const chain = (rows) => { const q = { from: () => q, where: () => q, limit: () => q, then: (ok, err) => Promise.resolve(rows).then(ok, err) }; return q }

let calls = []
let replies = []

let lie, pattern, tracker
before(async () => {
  const real = await import('../server/openrouter.js')
  mock.module(pathToFileURL(path.resolve('server/openrouter.js')).href, {
    namedExports: {
      ...real,
      chatText: async (opts) => {
        calls.push(opts)
        const next = replies.shift()
        if (next instanceof Error) throw next
        return next ?? ''
      },
    },
  })
  mock.module(pathToFileURL(path.resolve('server/db.js')).href, { namedExports: { db: { select: () => chain(PROMISES), all: async () => [] } } })
  lie = await import('../server/lieDetector.js')
  pattern = await import('../server/patternDetector.js')
  tracker = await import('../server/realTimeTracker.js')
})

const reset = (...r) => { calls = []; replies = r }

describe('lieDetector.factCheckStatement', () => {
  test('extracts claims, checks each against the records, and summarises the verdicts', async () => {
    reset(
      '```json\n{"claims":[{"text":"We completed the highway","keywords":["highway"]}]}\n```',
      'Here you go: {"verdict":"misleading","reason":"Only section 1 is open","matched_promise_ids":[1]}',
    )
    const out = await lie.factCheckStatement('We completed the highway.')
    assert.equal(out.claims_checked, 1)
    assert.equal(out.results[0].verdict, 'misleading')
    assert.deepEqual(out.results[0].matched_promises.map(p => p.id), [1])
    assert.deepEqual(out.summary, { true: 0, misleading: 1, false: 0, unverifiable: 0 })
  })

  test('both model calls are system + user requests with an OpenRouter model id', async () => {
    reset('{"claims":[{"text":"x","keywords":["highway"]}]}', '{"verdict":"true","reason":"r","matched_promise_ids":[1]}')
    await lie.factCheckStatement('We completed the highway.')
    assert.equal(calls.length, 2)
    for (const c of calls) {
      assert.equal(typeof c.system, 'string')
      assert.equal(typeof c.user, 'string')
      assert.match(c.model, /^[a-z0-9-]+\/[a-z0-9.-]+$/)
    }
    assert.equal(calls[0].user, 'We completed the highway.')
    assert.match(calls[1].user, /CLAIM: "x"[\s\S]*Promise #1/)
  })

  test('a statement with no checkable claims says so, with no second model call', async () => {
    reset('{"claims":[]}')
    const out = await lie.factCheckStatement('We love our country.')
    assert.equal(out.claims_checked, 0)
    assert.match(out.message, /No verifiable factual claims/)
    assert.equal(calls.length, 1)
  })

  test('a claim with no matching record is unverifiable and costs no model call', async () => {
    reset('{"claims":[{"text":"We built a bullet train","keywords":["zeppelin"]}]}')
    const out = await lie.factCheckStatement('We built a bullet train.')
    assert.equal(out.results[0].verdict, 'unverifiable')
    assert.equal(calls.length, 1, 'only the extraction call was made')
  })

  test('a reply that is not JSON falls back instead of throwing', async () => {
    reset('{"claims":[{"text":"x","keywords":["highway"]}]}', 'I am unable to assess that claim.')
    const out = await lie.factCheckStatement('We completed the highway.')
    assert.equal(out.results[0].verdict, 'unverifiable')
    assert.equal(out.results[0].reason, 'Parse error')
  })

  test('an extraction reply that is not JSON means no claims, not an error', async () => {
    reset('this is prose, not JSON')
    assert.equal((await lie.factCheckStatement('anything')).claims_checked, 0)
  })

  test('an API failure is not swallowed: the caller sees it', async () => {
    reset(new Error('401 Missing Authentication header'))
    await assert.rejects(lie.factCheckStatement('We completed the highway.'), /401/)
  })
})

describe('patternDetector.generateInsights', () => {
  const sectors = [{ category: 'energy', total: 10, kept_rate: 10, broken_rate: 70 }]
  const admins = [{ administration: 'tinubu', total: 50, kept_rate: 20, broken_rate: 30 }]
  const anomalies = { sector_anomalies: [{ category: 'energy', type: 'underperformer', kept_rate: 10, deviation: 30 }], admin_anomalies: [] }

  test('returns the insights from a fenced JSON reply, and sends the figures in the prompt', async () => {
    reset('```json\n{"insights":["Energy is the worst sector at 10% kept"]}\n```')
    const out = await pattern.generateInsights(sectors, admins, anomalies)
    assert.deepEqual(out, ['Energy is the worst sector at 10% kept'])
    assert.equal(calls.length, 1)
    assert.match(calls[0].user, /energy: 10 promises, 10% kept, 70% broken/)
    assert.match(calls[0].user, /tinubu: 50 promises/)
    assert.match(calls[0].user, /energy sector is an underperformer/)
    assert.match(calls[0].model, /^[a-z0-9-]+\/[a-z0-9.-]+$/)
  })

  test('a reply that is not JSON gives no insights rather than an error', async () => {
    reset('Sorry, here are some thoughts instead.')
    assert.deepEqual(await pattern.generateInsights(sectors, admins, anomalies), [])
  })

  test('JSON without an insights list gives an empty list', async () => {
    reset('{"other":1}')
    assert.deepEqual(await pattern.generateInsights(sectors, admins, anomalies), [])
  })

  test('with no data it says so and makes no model call', async () => {
    reset()
    assert.equal(await pattern.generateInsights([], [], { sector_anomalies: [], admin_anomalies: [] }), 'Not enough data to generate insights yet.')
    assert.equal(calls.length, 0)
  })

  test('an API failure is not swallowed', async () => {
    reset(new Error('503 upstream'))
    await assert.rejects(pattern.generateInsights(sectors, admins, anomalies), /503/)
  })
})

describe('realTimeTracker', () => {
  test('loads without the Anthropic SDK or any API key, and exports its feed list', () => {
    assert.ok(Array.isArray(tracker.DEFAULT_FEEDS) && tracker.DEFAULT_FEEDS.length > 0)
    assert.equal(typeof tracker.scanFeeds, 'function')
  })
})
