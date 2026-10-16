// syncDocuments: converge a database on a source list, idempotently, without
// deleting anything. Run against both clients; the libSQL one exercises the
// single-batch writes Turso uses.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { createClient } from '@libsql/client'
import { syncDocuments, queryRAG, chunkText } from '../server/rag.js'
import { ensureRagSchema } from '../server/ragSchema.js'

const A = { source: 'CAC', title: 'Business Registration', url: 'https://example.test/cac',
  content: '# CAC\n## Step 1\nCheck the name.\n## Step 2\nSubmit the form and pay 20,000.' }
const B = { source: 'FIRS', title: 'TIN', url: 'https://example.test/tin',
  content: '# FIRS\n## Register\nApply online for a TIN.\n## Cost\nFree.' }
const SOURCE = [A, B]

const makers = {
  'better-sqlite3': async () => {
    const db = new Database(':memory:')
    return { client: db, close: () => db.close() }
  },
  'libsql': async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sync-'))
    const client = createClient({ url: `file:${join(dir, 's.db')}` })
    return { client, close: () => { client.close(); rmSync(dir, { recursive: true, force: true }) } }
  },
}

const rows = async (client, sql, args = []) =>
  client.prepare ? client.prepare(sql).all(...args) : (await client.execute({ sql, args })).rows.map(r => ({ ...r }))
const run = async (client, sql, args = []) =>
  client.prepare ? client.prepare(sql).run(...args) : client.execute({ sql, args })

for (const [name, make] of Object.entries(makers)) {
  describe(name, () => {
    test('dry run on a database with no tables reports inserts and writes nothing', async () => {
      const { client, close } = await make()
      try {
        const r = await syncDocuments(client, SOURCE)
        assert.equal(r.tablesMissing, true)
        assert.equal(r.inserted, 2)
        const tables = await rows(client, "SELECT name FROM sqlite_master WHERE type='table'")
        assert.deepEqual(tables.filter(t => t.name.startsWith('rag_')), [])
      } finally { close() }
    })

    test('apply creates tables, inserts documents with chunks, and is searchable', async () => {
      const { client, close } = await make()
      try {
        const r = await syncDocuments(client, SOURCE, { apply: true })
        assert.equal(r.inserted, 2)
        const docs = await rows(client, 'SELECT id, source FROM rag_documents ORDER BY id')
        assert.deepEqual(docs.map(d => d.source), ['CAC', 'FIRS'])
        const chunks = await rows(client, 'SELECT document_id, text FROM rag_chunks')
        assert.equal(chunks.length, chunkText(A.content).length + chunkText(B.content).length)
        for (const c of chunks) assert.ok(docs.some(d => Number(d.id) === Number(c.document_id)), 'chunk has a real parent')
        const hit = (await queryRAG(client, 'how much to submit the form', 3)).results[0]
        assert.equal(hit.source, 'CAC')
      } finally { close() }
    })

    test('running twice changes nothing the second time', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, SOURCE, { apply: true })
        const before = await rows(client, 'SELECT id FROM rag_chunks ORDER BY id')
        const again = await syncDocuments(client, SOURCE, { apply: true })
        assert.deepEqual([again.inserted, again.updated, again.rechunked, again.unchanged], [0, 0, 0, 2])
        assert.deepEqual(await rows(client, 'SELECT id FROM rag_chunks ORDER BY id'), before, 'same chunk rows, none rewritten')
        assert.equal((await rows(client, 'SELECT COUNT(*) c FROM rag_documents'))[0].c, 2)
      } finally { close() }
    })

    test('changed content updates that document only and rebuilds its chunks', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, SOURCE, { apply: true })
        const fresh = { ...A, content: A.content.replace('20,000', '25,000') }
        const dry = await syncDocuments(client, [fresh, B])
        assert.deepEqual([dry.updated, dry.unchanged], [1, 1])
        assert.match((await rows(client, 'SELECT content FROM rag_documents WHERE source = ?', ['CAC']))[0].content, /20,000/, 'dry run wrote nothing')

        await syncDocuments(client, [fresh, B], { apply: true })
        const stored = await rows(client, 'SELECT id, content FROM rag_documents ORDER BY id')
        assert.match(stored[0].content, /25,000/)
        const cacText = (await rows(client, 'SELECT text FROM rag_chunks WHERE document_id = ?', [stored[0].id])).map(r => r.text).join(' ')
        assert.ok(cacText.includes('25,000') && !cacText.includes('20,000'))
        assert.equal(stored.length, 2)
      } finally { close() }
    })

    test('stale chunks on an unchanged document are rebuilt', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, SOURCE, { apply: true })
        const id = (await rows(client, 'SELECT id FROM rag_documents WHERE source = ?', ['FIRS']))[0].id
        await run(client, 'DELETE FROM rag_chunks WHERE document_id = ?', [id])
        const r = await syncDocuments(client, SOURCE, { apply: true })
        assert.deepEqual([r.rechunked, r.unchanged], [1, 1])
        assert.ok((await rows(client, 'SELECT COUNT(*) c FROM rag_chunks WHERE document_id = ?', [id]))[0].c > 0)
      } finally { close() }
    })

    test('documents missing from the source are reported and never deleted', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, SOURCE, { apply: true })
        const r = await syncDocuments(client, [A], { apply: true })
        assert.deepEqual(r.extra.map(e => e.source), ['FIRS'])
        assert.equal((await rows(client, 'SELECT COUNT(*) c FROM rag_documents'))[0].c, 2)
        assert.ok((await rows(client, "SELECT COUNT(*) c FROM rag_chunks"))[0].c > 0)
      } finally { close() }
    })

    test('a renamed document listed in `replaces` is updated in place, not duplicated', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, SOURCE, { apply: true })
        const idBefore = (await rows(client, 'SELECT id FROM rag_documents WHERE source = ?', ['FIRS']))[0].id
        const renamed = { ...B, title: 'Tax Identification Number', replaces: ['TIN'], content: B.content.replace('Free.', 'No charge.') }

        const dry = await syncDocuments(client, [A, renamed])
        assert.equal(dry.updated, 1)
        assert.equal(dry.inserted, 0)
        assert.equal(dry.plan.find(p => p.source === 'FIRS').renamedFrom, 'TIN')
        assert.deepEqual(dry.extra, [])

        await syncDocuments(client, [A, renamed], { apply: true })
        const docs = await rows(client, 'SELECT id, title FROM rag_documents ORDER BY id')
        assert.equal(docs.length, 2, 'no second copy')
        const firs = docs.find(d => Number(d.id) === Number(idBefore))
        assert.equal(firs.title, 'Tax Identification Number')
        const text = (await rows(client, 'SELECT text FROM rag_chunks WHERE document_id = ?', [idBefore])).map(r => r.text).join(' ')
        assert.ok(text.includes('No charge.') && !text.includes('Free.'))

        const again = await syncDocuments(client, [A, renamed], { apply: true })
        assert.deepEqual([again.inserted, again.updated, again.rechunked, again.unchanged], [0, 0, 0, 2])
      } finally { close() }
    })

    test('a rename without `replaces` inserts the new title and only reports the old row', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, SOURCE, { apply: true })
        const r = await syncDocuments(client, [A, { ...B, title: 'Tax Identification Number' }], { apply: true })
        assert.equal(r.inserted, 1)
        assert.deepEqual(r.extra.map(e => e.title), ['TIN'])
        assert.equal((await rows(client, 'SELECT COUNT(*) c FROM rag_documents'))[0].c, 3, 'old row is never deleted')
      } finally { close() }
    })

    test('duplicate rows are flagged and left alone', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, SOURCE, { apply: true })
        await run(client, `INSERT INTO rag_documents (source, title, url, content, fetched_at, updated_at)
                           VALUES ('CAC', 'Business Registration', NULL, 'stray copy', 'x', 'x')`)
        const r = await syncDocuments(client, SOURCE, { apply: true })
        assert.equal(r.duplicates.length, 1)
        assert.equal((await rows(client, 'SELECT COUNT(*) c FROM rag_documents'))[0].c, 3, 'nothing deleted')
        assert.deepEqual([r.inserted, r.updated], [0, 0])
      } finally { close() }
    })
  })
}

describe('ensureRagSchema', () => {
  for (const [name, make] of Object.entries(makers)) {
    test(`${name}: upgrades an old chunks table by adding only the missing columns`, async () => {
      const { client, close } = await make()
      try {
        await run(client, 'CREATE TABLE rag_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL, title TEXT NOT NULL, url TEXT, content TEXT NOT NULL, fetched_at TEXT NOT NULL, updated_at TEXT NOT NULL)')
        await run(client, 'CREATE TABLE rag_chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL, text TEXT NOT NULL, embedding TEXT, token_count INTEGER, created_at TEXT NOT NULL)')
        await ensureRagSchema(client)
        await ensureRagSchema(client) // safe to repeat
        const cols = (await rows(client, 'PRAGMA table_info(rag_chunks)')).map(c => c.name)
        assert.ok(cols.includes('section') && cols.includes('chunk_index'))
      } finally { close() }
    })
  }
})
