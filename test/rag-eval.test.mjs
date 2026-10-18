// Guards the eval itself (dataset integrity), the offline retrieval gate, and
// the generation scorer. The gate is what stops a retrieval change from
// quietly making answers worse: it fails `npm test` below the committed baseline.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { REWRITE_MODEL } from '../server/ragFollowUp.js'
import {
  loadDataset, loadBaseline, corpusDocuments, buildCorpusDb,
  runRetrieval, runGeneration, compareToBaseline, assertedForbidden,
} from '../evals/rag/lib.mjs'

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ')
const dataset = loadDataset()
const docs = corpusDocuments()
const sources = new Set(docs.map(d => d.source))
const docsOf = (code) => docs.filter(d => d.source === code)

describe('eval dataset integrity', () => {
  test('the corpus is real portal data, with unique ids and nothing written by hand', () => {
    assert.ok(docs.length >= 100, 'a corpus big enough for retrieval to mean something')
    const ids = docs.map(d => d.externalId)
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(docs.every(d => d.origin === 'portal' && d.url.startsWith('https://services.gov.ng/')))
  })

  test('case ids are unique and types are known', () => {
    const ids = dataset.cases.map(c => c.id)
    assert.equal(new Set(ids).size, ids.length)
    for (const c of dataset.cases) assert.ok(['answerable', 'unanswerable'].includes(c.type), c.id)
  })

  test('every expected source exists in the corpus', () => {
    for (const c of dataset.cases.filter(c => c.type === 'answerable')) {
      assert.ok(c.expectedSources.length > 0, `${c.id} has no expectedSources`)
      for (const s of c.expectedSources) assert.ok(sources.has(s), `${c.id}: unknown source "${s}"`)
    }
  })

  test('evidence is answer text that really appears in an expected document', () => {
    // A typo here would otherwise show up as a phantom retrieval failure.
    for (const c of dataset.cases.filter(c => c.type === 'answerable')) {
      const found = c.expectedSources.some(s => docsOf(s).some(d => norm(d.content).includes(norm(c.evidence))))
      assert.ok(found, `${c.id}: evidence "${c.evidence}" not found in ${c.expectedSources.join('/')}`)
    }
  })

  test('forbidden patterns compile and unanswerable cases expect no source', () => {
    for (const c of dataset.cases.filter(c => c.type === 'unanswerable')) {
      assert.equal(c.expectedSources, undefined, c.id)
      for (const p of c.forbidden ?? []) assert.doesNotThrow(() => new RegExp(p, 'i'), `${c.id}: ${p}`)
    }
  })

  test('follow-up cases carry a well-formed history', () => {
    const followUps = dataset.cases.filter(c => c.category === 'follow-up')
    assert.ok(followUps.length >= 8, 'enough follow-up cases to matter')
    assert.ok(followUps.some(c => c.type === 'unanswerable'), 'including ones that must be declined')
    for (const c of followUps) {
      assert.ok(Array.isArray(c.history) && c.history.length >= 2, `${c.id}: history`)
      for (const m of c.history) {
        assert.ok(['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content, `${c.id}: bad history item`)
      }
      assert.equal(c.history[0].role, 'user', `${c.id}: a conversation starts with the user`)
    }
  })

  test('the set is balanced enough to mean something', () => {
    const n = (t) => dataset.cases.filter(c => c.type === t).length
    assert.ok(n('answerable') >= 40)
    assert.ok(n('unanswerable') >= 10)
    assert.ok(dataset.cases.some(c => c.category === 'near-miss'))
    assert.ok(dataset.cases.some(c => c.category === 'paraphrase'))
  })
})

describe('retrieval gate', () => {
  let db, retrieval
  before(async () => {
    db = await buildCorpusDb()
    retrieval = await runRetrieval({ db, dataset })
  })

  test('scores are not below the committed baseline', () => {
    const regressions = compareToBaseline(retrieval.summary, loadBaseline())
    assert.deepEqual(regressions, [],
      'Retrieval got worse. If intended, run `npm run eval:rag -- --write-baseline` and say why in the commit.')
  })

  test('summary exposes the numbers the CLI prints', () => {
    const s = retrieval.summary
    for (const k of ['hitAt1', 'hitAtK', 'mrr', 'evidenceAtK', 'floors', 'categories']) {
      assert.ok(k in s, k)
    }
    assert.ok(s.hitAtK >= s.hitAt1)
  })

  describe('generation scorer (scripted model, no network)', () => {
    const scripted = (content) => ({
      chat: { completions: { create: async () => ({ choices: [{ message: { content } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }) } },
    })

    test('a model that always declines passes unanswerable cases and fails answerable ones', async () => {
      const r = await runGeneration({ db, dataset, client: scripted('NOT_FOUND'), only: ['cac-bn-fee', 'world-cup', 'vat-rate'] })
      const by = Object.fromEntries(r.cases.map(c => [c.id, c]))
      assert.equal(by['cac-bn-fee'].pass, false)
      assert.match(by['cac-bn-fee'].problems.join(' '), /could not find/)
      assert.equal(by['world-cup'].pass, true)
      assert.equal(by['vat-rate'].pass, true)
    })

    test('a model that states a figure the documents lack is caught on a near-miss', async () => {
      const r = await runGeneration({ db, dataset, client: scripted('The VAT rate is 7.5% [1].'), only: ['vat-rate'] })
      assert.equal(r.cases[0].pass, false)
      assert.match(r.cases[0].problems[0], /do not contain/)
    })

    test('a correct, cited answer passes and token usage is tallied', async () => {
      const r = await runGeneration({
        db, dataset, only: ['cac-bn-fee'],
        client: scripted('The portal lists the fee as ₦3,000 [1].'),
      })
      const c = r.cases[0]
      // the scripted answer cites [1]; whichever excerpt that is must be CAC for a pass
      assert.equal(c.grounded, true, JSON.stringify(c))
      assert.equal(r.summary.modelCalls, 2, 'one call to prepare the question for searching, one to answer')
      assert.equal(r.summary.promptTokens, 10)
      assert.equal(c.cited, true)
    })

    test('follow-up cases run the rewrite and then the answer, and are scored like any other', async () => {
      const client = { chat: { completions: { create: async (body) => ({
        choices: [{ message: { content: body.model === REWRITE_MODEL ? JSON.stringify({ question: 'How much does it cost to register a business name with the CAC?', keywords: ['business name', 'fee'] }) : 'The portal lists the fee as ₦3,000 [1].' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }) } } }
      const r = await runGeneration({ db, dataset, client, only: ['fu-bn-cost'] })
      assert.equal(r.summary.modelCalls, 2, 'one rewrite + one answer')
      assert.equal(r.cases[0].pass, true, JSON.stringify(r.cases[0].problems))
    })

    test('a model that repeats a false earlier turn as fact is caught on the injected-history case', async () => {
      const client = { chat: { completions: { create: async (body) => ({
        choices: [{ message: { content: body.model === REWRITE_MODEL ? JSON.stringify({ question: 'How much does a CAC business name cost?', keywords: [] }) : 'A business name costs 90,000 naira [1].' } }],
      }) } } }
      const r = await runGeneration({ db, dataset, client, only: ['fu-injected-history'] })
      assert.equal(r.cases[0].pass, false)
      assert.ok(r.cases[0].problems.some(p => /contradict or do not contain/.test(p)), JSON.stringify(r.cases[0].problems))
    })

    test('an uncited answer to an answerable question is flagged', async () => {
      const r = await runGeneration({ db, dataset, client: scripted('The fee is ₦3,000.'), only: ['cac-bn-fee'] })
      assert.equal(r.cases[0].pass, false)
      assert.match(r.cases[0].problems.join(' '), /citation/)
    })
  })
})

describe('assertedForbidden', () => {
  const pats = ['90,000', 'six months']

  test('a figure stated as fact is caught', () => {
    assert.deepEqual(assertedForbidden('A business name costs 90,000 naira and takes six months.', pats), ['90,000', 'six months'])
    assert.deepEqual(assertedForbidden('The fee is ₦3,000. It also costs 90,000.', pats), ['90,000'])
  })

  test('a figure that is quoted only to disown it is not', () => {
    for (const ok of [
      'The fee is ₦3,000 [2]. The ₦90,000 figure in my earlier reply is not in the documents, so please disregard it.',
      'My earlier answer, which said 90,000 naira and six months, is not supported by the documents.',
      'This differs from the 90,000 figure given earlier.',
      'The portal does not list a fee of 90,000 for this service.',
    ]) assert.deepEqual(assertedForbidden(ok, pats), [], ok)
  })

  test('the disowning has to be in the same sentence as the figure', () => {
    assert.deepEqual(assertedForbidden('Please disregard anything odd. The fee is 90,000 naira.', pats), ['90,000'])
  })

  test('no patterns, or no answer, is nothing to flag', () => {
    assert.deepEqual(assertedForbidden('anything', []), [])
    assert.deepEqual(assertedForbidden(undefined, pats), [])
  })

  test('the scorer applies it: a correct answer that retracts the false figure passes', async () => {
    const db = await buildCorpusDb()
    const client = { chat: { completions: { create: async (body) => ({ choices: [{ message: { content:
      body.model === REWRITE_MODEL
        ? JSON.stringify({ question: 'How much does a CAC business name cost?', keywords: [] })
        : 'The portal lists the fee as ₦3,000 [1]. The ₦90,000 figure in my earlier reply is not in the documents, so please disregard it.' } }] }) } } }
    const r = await runGeneration({ db, dataset: loadDataset(), client, only: ['fu-injected-history'] })
    assert.equal(r.cases[0].pass, true, JSON.stringify(r.cases[0].problems))
  })
})
