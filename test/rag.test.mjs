// Retrieval tests. Run with `npm test`.
//
// The libSQL cases use a real @libsql/client on a throwaway file database, so
// they exercise the same async path as Turso. That path is the one that
// silently failed before: execute() was not awaited, retrieval threw inside a
// catch, and the assistant answered from model memory with no documents.
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { createClient } from '@libsql/client'
import { addDocument, queryRAG, clearRagCache } from '../server/rag.js'

const SCHEMA = [
  `CREATE TABLE rag_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL, title TEXT NOT NULL,
    url TEXT, content TEXT NOT NULL, fetched_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE rag_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL, text TEXT NOT NULL,
    embedding TEXT, token_count INTEGER, section TEXT, chunk_index INTEGER, created_at TEXT NOT NULL,
    FOREIGN KEY (document_id) REFERENCES rag_documents(id))`,
]

const DOCS = [
  {
    source: 'CAC',
    title: 'Company Registration with the CAC',
    url: 'https://example.test/cac',
    content: '# Requirements\nTo register a business name you submit the application form and a valid ID. The name must be approved before incorporation. Fees depend on share capital.',
  },
  {
    source: 'FIRS',
    title: 'Value Added Tax Guide',
    url: 'https://example.test/vat',
    content: '# Rates\nVAT is charged at 7.5 percent on taxable goods and services. Registered businesses file returns monthly.',
  },
  {
    source: 'Lagos State',
    title: 'Lagos State Land Use Charge',
    url: 'https://example.test/luc',
    content: '# Payment\nProperty owners in Lagos pay the land use charge annually. Demand notices are issued each January.',
  },
]

const makers = {
  'better-sqlite3': async () => {
    const db = new Database(':memory:')
    for (const sql of SCHEMA) db.prepare(sql).run()
    return { client: db, close: async () => db.close() }
  },
  'libsql (async, as on Turso)': async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rag-test-'))
    const client = createClient({ url: `file:${join(dir, 'rag.db')}` })
    for (const sql of SCHEMA) await client.execute(sql)
    return { client, close: async () => { client.close(); rmSync(dir, { recursive: true, force: true }) } }
  },
}

for (const [name, make] of Object.entries(makers)) {
  describe(name, () => {
    let ctx
    before(async () => {
      ctx = await make()
      for (const doc of DOCS) await addDocument(ctx.client, doc)
    })
    after(async () => ctx.close())

    test('returns the matching document for a plain question', async () => {
      const { results } = await queryRAG(ctx.client, 'What is the VAT rate?')
      assert.ok(results.length > 0, 'expected at least one result')
      assert.equal(results[0].source, 'FIRS')
      assert.equal(results[0].url, 'https://example.test/vat')
      assert.equal(results[0].similarity, 100)
    })

    test('ranks by relevance, not by insertion order', async () => {
      const { results } = await queryRAG(ctx.client, 'register a business name with the CAC')
      assert.equal(results[0].source, 'CAC')
    })

    test('stores a real document id on every chunk', async () => {
      const rows = ctx.client.prepare
        ? ctx.client.prepare('SELECT document_id FROM rag_chunks').all()
        : (await ctx.client.execute('SELECT document_id FROM rag_chunks')).rows
      assert.ok(rows.length >= DOCS.length)
      for (const row of rows) assert.ok(Number(row.document_id) > 0)
    })

    test('returns nothing when no document is relevant', async () => {
      const { results } = await queryRAG(ctx.client, 'quantum chromodynamics lattice')
      assert.deepEqual(results, [])
    })

    test('returns nothing for a question made only of stopwords', async () => {
      const { results } = await queryRAG(ctx.client, 'what is the')
      assert.deepEqual(results, [])
    })

    test('respects topK', async () => {
      const { results } = await queryRAG(ctx.client, 'pay charge tax business', 1)
      assert.equal(results.length, 1)
    })

    test('a chosen state boosts its own documents', async () => {
      const without = await queryRAG(ctx.client, 'pay annually charge tax')
      const withState = await queryRAG(ctx.client, 'pay annually charge tax', 5, { state: 'Lagos' })
      assert.equal(withState.results[0].source, 'Lagos State')
      assert.ok(withState.results.length >= without.results.length)
    })

    test('a newly added document is searchable straight away', async () => {
      await addDocument(ctx.client, {
        source: 'NBS', title: 'Inflation Release', url: null,
        content: '# CPI\nHeadline inflation was reported by the statistics bureau.',
      })
      clearRagCache(ctx.client) // addDocument already does this; the call is idempotent
      const { results } = await queryRAG(ctx.client, 'headline inflation statistics')
      assert.equal(results[0].source, 'NBS')
    })
  })
}
