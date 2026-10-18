// Starter questions come from the corpus, and only ones that work are offered.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { buildSuggestions, pickSuggestions, serviceName } from '../server/ragSuggestions.js'
import { queryRAG, listDocuments, syncDocuments } from '../server/rag.js'
import { buildCorpusDb, corpusDocuments } from '../evals/rag/lib.mjs'
import { createRagRouter } from '../server/ragRoutes.js'

describe('serviceName', () => {
  test('drops the agency prefix and the brackets', () => {
    assert.equal(serviceName('FRSC (Renewal of Driver’s License)', 'FRSC'), 'Renewal of Driver’s License')
  })
  test('leaves a title that is not in that shape alone', () => {
    assert.equal(serviceName('Company Registration', 'CAC'), 'Company Registration')
    assert.equal(serviceName(undefined, 'CAC'), '')
  })
})

describe('buildSuggestions', () => {
  const docs = corpusDocuments().map(d => ({ ...d, external_id: d.externalId }))

  test('chooses documented services: a real fee, real steps, no boilerplate, one per agency', () => {
    const out = buildSuggestions(docs, { count: 8 })
    assert.equal(out.length, 8)
    assert.equal(new Set(out.map(o => o.source)).size, out.length, 'one per agency')
    const byTitle = new Map(docs.map(d => [`${d.source}|${d.title}`, d]))
    for (const o of out) {
      const d = byTitle.get(`${o.source}|${o.title}`)
      assert.match(d.content, /The portal lists the fee as ₦/)
      assert.doesNotMatch(d.content, /flagship initiative overseen by/)
      assert.ok(d.external_id.startsWith('service:'))
    }
  })

  test('never suggests an agency profile, and is deterministic', () => {
    const a = buildSuggestions(docs, { count: 6 })
    assert.deepEqual(a, buildSuggestions(docs, { count: 6 }))
    assert.ok(a.every(o => !/about and contact/.test(o.title)))
  })

  test('nothing to suggest from an empty corpus', () => {
    assert.deepEqual(buildSuggestions([]), [])
  })

  test('the question is built from the service\'s own name', () => {
    const [first] = buildSuggestions(docs, { count: 1 })
    assert.equal(first.question, `What are the steps and requirements for ${serviceName(first.title, first.source)}?`)
  })
})

describe('pickSuggestions', () => {
  let db
  before(async () => { db = await buildCorpusDb() })
  const docs = corpusDocuments().map(d => ({ ...d, external_id: d.externalId }))

  test('every suggestion offered retrieves its own service in the top 3 on the real corpus', async () => {
    const search = async (q) => (await queryRAG(db, q, 5)).results
    const picked = await pickSuggestions(docs, search, { count: 3 })
    assert.equal(picked.length, 3)
    for (const p of picked) {
      const top3 = (await search(p.question)).slice(0, 3)
      assert.ok(top3.some(r => r.title === p.title && r.source === p.source), `${p.question} -> ${top3.map(r => r.title).join(' | ')}`)
    }
  })

  test('a candidate whose question does not find its service is skipped', async () => {
    const wanted = buildSuggestions(docs, { count: 5 })
    const broken = wanted[0]
    const search = async (q) => q === broken.question
      ? [{ title: 'something else', source: 'X' }]
      : [{ title: wanted.find(w => w.question === q).title, source: wanted.find(w => w.question === q).source }]
    const picked = await pickSuggestions(docs, search, { count: 3, pool: 5 })
    assert.ok(!picked.some(p => p.question === broken.question))
    assert.equal(picked.length, 3)
  })

  test('if nothing works, nothing is offered', async () => {
    assert.deepEqual(await pickSuggestions(docs, async () => []), [])
  })
})

describe('GET /api/rag/suggestions', () => {
  const get = async (db) => {
    const app = express()
    app.use('/api/rag', createRagRouter({ db }))
    const s = await new Promise(r => { const x = app.listen(0, () => r(x)) })
    try {
      const res = await fetch(`http://127.0.0.1:${s.address().port}/api/rag/suggestions`)
      return { status: res.status, body: await res.json() }
    } finally { s.close() }
  }

  test('returns working suggestions from the stored portal documents, labels and questions only', async () => {
    const raw = await buildCorpusDb()
    // the eval database has no provenance columns; load the same documents the way the real sync does
    const { default: Database } = await import('better-sqlite3')
    const real = new Database(':memory:')
    await syncDocuments(real, corpusDocuments(), { apply: true, origin: 'portal' })
    const { status, body } = await get({ _rawClient: real, _ragReady: Promise.resolve() })
    assert.equal(status, 200)
    assert.equal(body.suggestions.length, 3)
    for (const s of body.suggestions) assert.deepEqual(Object.keys(s).sort(), ['label', 'question'])
    assert.equal((await listDocuments(real)).length > 100, true)
    raw.close(); real.close()
  })

  test('with no portal documents loaded the page simply gets no suggestions', async () => {
    const { default: Database } = await import('better-sqlite3')
    const empty = new Database(':memory:')
    const { status, body } = await get({ _rawClient: empty, _ragReady: Promise.resolve() })
    assert.equal(status, 200)
    assert.deepEqual(body, { suggestions: [] })
    empty.close()
  })
})
