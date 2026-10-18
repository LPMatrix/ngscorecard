// queryDocuments: rank by chunk, return whole parent documents, once each.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { createClient } from '@libsql/client'
import { addDocument, queryDocuments, queryRAG } from '../server/rag.js'
import { hasUsableSources } from '../server/ragPrompt.js'

const SCHEMA = [
  `CREATE TABLE rag_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL, title TEXT NOT NULL,
    url TEXT, content TEXT NOT NULL, fetched_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE rag_chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL, text TEXT NOT NULL,
    embedding TEXT, token_count INTEGER, section TEXT, chunk_index INTEGER, created_at TEXT NOT NULL)`,
]

const filler = (word, n = 9) => `${word} `.repeat(n).trim()
// Long enough that each section becomes its own chunk (chunks merge up to ~800 characters).
const section = (title, body) => `## ${title}\n${body} ${'This sentence pads the section so it fills most of a chunk. '.repeat(10)}`

const PASSPORT = {
  source: 'NIS', title: 'NIS (Application for International Passport)', url: 'https://example.test/passport',
  content: ['# Passport',
    section('How to apply', 'Complete the online form, pay the fee and book a biometric appointment. Collect the booklet at the enrolment office.'),
    section('Requirements', 'You must have a NIN. Bring a birth certificate and a local government certificate of origin.'),
    section('Enquiries', 'Write to the immigration service helpdesk.')].join('\n'),
}
const LICENCE = {
  source: 'FRSC', title: 'FRSC (Renewal of Driver’s License)', url: 'https://example.test/licence',
  content: ['# Licence',
    section('Renewal steps', 'Apply online, pay at the bank and give your biometrics at the licence centre.'),
    section('Fee', 'The portal lists the fee as ₦25,000.')].join('\n'),
}
const HUGE = {
  source: 'NPA', title: 'NPA (Harbour Services)', url: 'https://example.test/harbour',
  content: ['# Harbour', ...Array.from({ length: 14 }, (_, i) => section(`Section ${i}`, `${filler('harbour')} part${i} ${i === 11 ? 'berthing charges are listed here' : ''}`))].join('\n'),
}

const makers = {
  'better-sqlite3': async () => {
    const db = new Database(':memory:')
    for (const sql of SCHEMA) db.prepare(sql).run()
    return { client: db, close: () => db.close() }
  },
  'libsql': async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rag-docs-'))
    const client = createClient({ url: `file:${join(dir, 'd.db')}` })
    for (const sql of SCHEMA) await client.execute(sql)
    return { client, close: () => { client.close(); rmSync(dir, { recursive: true, force: true }) } }
  },
}

for (const [name, make] of Object.entries(makers)) {
  describe(name, () => {
    let ctx
    before(async () => {
      ctx = await make()
      for (const d of [PASSPORT, LICENCE, HUGE]) await addDocument(ctx.client, d)
    })
    after(() => ctx.close())

    test('a question that matches only one chunk still gets the whole document back', async () => {
      // "apply" and "biometric" live in the steps chunk; the requirements chunk shares nothing with the question
      const chunkHits = (await queryRAG(ctx.client, 'how do I apply for an international passport with a biometric appointment', 1)).results
      assert.ok(!/birth certificate/.test(chunkHits[0].text), 'the best chunk alone lacks the requirements')

      const { results } = await queryDocuments(ctx.client, 'how do I apply for an international passport with a biometric appointment', { maxDocs: 1 })
      assert.equal(results.length, 1)
      assert.equal(results[0].title, PASSPORT.title)
      assert.match(results[0].text, /biometric appointment/)
      assert.match(results[0].text, /You must have a NIN/, 'the requirements chunk came along')
      assert.match(results[0].text, /immigration service helpdesk/, 'and the rest of the document')
      assert.equal(results[0].truncated, false)
    })

    test('chunks come back in reading order, not rank order', async () => {
      const { results } = await queryDocuments(ctx.client, 'requirements birth certificate NIN', { maxDocs: 1 })
      const t = results[0].text
      assert.ok(t.indexOf('## How to apply') < t.indexOf('## Requirements') && t.indexOf('## Requirements') < t.indexOf('## Enquiries'))
    })

    test('each document appears once, best first, and maxDocs is respected', async () => {
      const q = 'pay the fee online and give biometrics'
      const { results } = await queryDocuments(ctx.client, q, { maxDocs: 3 })
      const titles = results.map(r => r.title)
      assert.equal(new Set(titles).size, titles.length, 'no document twice')
      assert.ok(results.length >= 2)
      const capped = await queryDocuments(ctx.client, q, { maxDocs: 1 })
      assert.equal(capped.results.length, 1)
      assert.equal(capped.results[0].title, titles[0])
    })

    test('similarity and coverage describe the best chunk, and similarity is relative to the best result', async () => {
      const { results } = await queryDocuments(ctx.client, 'renew driver licence fee', { maxDocs: 3 })
      assert.equal(results[0].title, LICENCE.title)
      assert.equal(results[0].similarity, 100)
      assert.ok(results[0].coverage > 0 && results[0].coverage <= 1)
      assert.ok(results.every((r, i) => i === 0 || r.similarity <= results[i - 1].similarity))
      assert.equal(hasUsableSources(results), true)
    })

    test('a document over the character budget keeps its best chunks, in order, and says so', async () => {
      const budget = 1500
      const { results } = await queryDocuments(ctx.client, 'berthing charges harbour', { maxDocs: 1, charBudget: budget })
      const r = results[0]
      assert.equal(r.title, HUGE.title)
      assert.equal(r.truncated, true)
      assert.match(r.text, /berthing charges are listed here/, 'the chunk that matched is kept')
      assert.ok(r.text.length <= budget + 900, `${r.text.length} characters`)
      assert.ok(r.chunks < 14)
      const idx = [...r.text.matchAll(/## Section (\d+)/g)].map(m => Number(m[1]))
      assert.deepEqual(idx, [...idx].sort((a, b) => a - b), 'reading order preserved')
    })

    test('with a roomy budget the same document is returned whole', async () => {
      const { results } = await queryDocuments(ctx.client, 'berthing charges harbour', { maxDocs: 1, charBudget: 100000 })
      assert.equal(results[0].truncated, false)
      assert.equal([...results[0].text.matchAll(/## Section \d+/g)].length, 14)
    })

    test('nothing relevant gives no results, not an error', async () => {
      assert.deepEqual((await queryDocuments(ctx.client, 'quantum chromodynamics lattice')).results, [])
      assert.deepEqual((await queryDocuments(ctx.client, 'what is the')).results, [])
    })

    test('the existing chunk-level query is unchanged', async () => {
      const { results } = await queryRAG(ctx.client, 'renew driver licence fee', 3)
      assert.ok(results.length >= 1 && 'chunkIndex' in results[0])
    })
  })
}

// ---------------------------------------------------------------------------
// Query expansion: formal terms added to a search at half weight.
// ---------------------------------------------------------------------------
const DOC_USER_WORD = { source: 'A', title: 'A (Passport office)', url: 'https://example.test/a',
  content: '# Passport\nApply for your passport at the immigration office. ' + 'Bring two photographs. '.repeat(12) }
const DOC_FORMAL = { source: 'B', title: 'B (Border service)', url: 'https://example.test/b',
  content: '# Border\nTravel documents are issued by the border service to citizens. ' + 'Fees are paid at the counter. '.repeat(12) }
const DOC_NOISE = { source: 'C', title: 'C (Roads)', url: 'https://example.test/c',
  content: '# Roads\nThe ministry maintains federal roads and bridges. ' + 'Potholes are repaired in the dry season. '.repeat(12) }

for (const [name, make] of Object.entries(makers)) {
  describe(`${name}: query expansion`, () => {
    let ctx
    before(async () => {
      ctx = await make()
      for (const d of [DOC_USER_WORD, DOC_FORMAL, DOC_NOISE]) await addDocument(ctx.client, d)
    })
    after(() => ctx.close())

    test('terms the question does not contain bring in a document the question alone misses', async () => {
      const plain = await queryDocuments(ctx.client, 'how do I get an identity booklet to leave the country', { maxDocs: 3 })
      assert.ok(!plain.results.some(r => r.source === 'B'))
      const widened = await queryDocuments(ctx.client, 'how do I get an identity booklet to leave the country', { maxDocs: 3, expansion: ['travel documents', 'border'] })
      assert.equal(widened.results[0].source, 'B')
    })

    test('the user\'s own words outrank expansion terms', async () => {
      const { results } = await queryDocuments(ctx.client, 'passport', { maxDocs: 3, expansion: ['travel', 'documents'] })
      assert.deepEqual(results.map(r => r.source).slice(0, 2), ['A', 'B'], 'the document with the user\'s word first, the expansion-only one after')
    })

    test('expansion cannot rescue a question with nothing searchable in it', async () => {
      assert.deepEqual((await queryDocuments(ctx.client, 'what is the', { expansion: ['passport', 'travel'] })).results, [])
    })

    test('expansion terms that repeat the question\'s own words change nothing', async () => {
      const a = (await queryDocuments(ctx.client, 'passport photographs', { maxDocs: 3 })).results
      const b = (await queryDocuments(ctx.client, 'passport photographs', { maxDocs: 3, expansion: ['passport', 'Photographs'] })).results
      assert.deepEqual(b.map(r => [r.source, r.similarity, r.coverage]), a.map(r => [r.source, r.similarity, r.coverage]))
    })

    test('coverage counts expansion terms at half weight: a match through them is real but weaker', async () => {
      const own = (await queryDocuments(ctx.client, 'border service travel documents', { maxDocs: 1 })).results[0]
      const viaExpansion = (await queryDocuments(ctx.client, 'identity booklet', { maxDocs: 1, expansion: ['border service', 'travel documents'] })).results[0]
      assert.equal(viaExpansion.source, 'B')
      assert.ok(viaExpansion.coverage > 0 && viaExpansion.coverage < own.coverage, `${viaExpansion.coverage} vs ${own.coverage}`)
    })

    test('terms that match nothing do not help an unanswerable question, and lower its coverage', async () => {
      const bare = await queryDocuments(ctx.client, 'who won the football world cup')
      const padded = await queryDocuments(ctx.client, 'who won the football world cup', { expansion: ['fifa', 'soccer', 'tournament'] })
      assert.deepEqual(bare.results, [])
      assert.deepEqual(padded.results, [])
    })

    test('the chunk-level query takes the same expansion', async () => {
      const { results } = await queryRAG(ctx.client, 'identity booklet', 3, { expansion: 'border service' })
      assert.equal(results[0].source, 'B')
    })

    test('a string works as well as a list', async () => {
      const { results } = await queryDocuments(ctx.client, 'identity booklet', { maxDocs: 1, expansion: 'border service travel' })
      assert.equal(results[0].source, 'B')
    })
  })
}
