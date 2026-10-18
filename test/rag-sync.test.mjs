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
import { syncDocuments, queryRAG, chunkText, removeDocuments, countDocuments } from '../server/rag.js'
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
// aliases for the external-source tests below, where a local `rows` variable shadows the helper
const rows_ = rows
const exec_ = run

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

// ---------------------------------------------------------------------------
// Documents from an external source (the Government Service Portal): matched on
// the source's own id, kept apart from the hand-written corpus, and dated.
// ---------------------------------------------------------------------------
const P1 = { source: 'NIMC', title: 'NIMC (NIN Pre Enrollment)', url: 'https://services.gov.ng/service-provider/nimc/nin', externalId: 'service:nimc/nin',
  content: '# NIN\n## About\nPre-enrol online, then visit an enrolment centre.\n## Fee and processing time\n- Fee: the portal lists the fee as ₦1,000.' }
const P2 = { source: 'FRSC', title: 'FRSC (Renewal of Driver’s License)', url: 'https://services.gov.ng/service-provider/frsc/renewal', externalId: 'service:frsc/renewal',
  content: '# Renewal\n## About\nRenew your driver’s licence.' }
const PORTAL = { origin: 'portal', touchChecked: true }

for (const [name, make] of Object.entries(makers)) {
  describe(`${name}: external sources`, () => {
    test('inserts with origin and external id, and retrieval returns them with a checked-on date', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, [P1, P2], { apply: true, ...PORTAL })
        const rows = await rows_(client, 'SELECT source, origin, external_id, fetched_at FROM rag_documents ORDER BY id')
        assert.deepEqual(rows.map(r => [r.source, r.origin, r.external_id]), [['NIMC', 'portal', 'service:nimc/nin'], ['FRSC', 'portal', 'service:frsc/renewal']])
        const hit = (await queryRAG(client, 'how do I pre-enrol for a NIN', 3)).results[0]
        assert.equal(hit.source, 'NIMC')
        assert.equal(hit.origin, 'portal')
        assert.match(hit.checkedAt, /^\d{4}-\d{2}-\d{2}T/)
      } finally { close() }
    })

    test('running it twice changes nothing, and re-dates the unchanged documents', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, [P1, P2], { apply: true, ...PORTAL })
        const before = await rows_(client, 'SELECT id, fetched_at, updated_at FROM rag_documents ORDER BY id')
        await new Promise(r => setTimeout(r, 15))
        const again = await syncDocuments(client, [P1, P2], { apply: true, ...PORTAL })
        assert.deepEqual([again.inserted, again.updated, again.rechunked, again.unchanged, again.touched], [0, 0, 0, 2, 2])
        const after = await rows_(client, 'SELECT id, fetched_at, updated_at FROM rag_documents ORDER BY id')
        assert.deepEqual(after.map(r => r.id), before.map(r => r.id), 'same rows')
        for (let i = 0; i < 2; i++) {
          assert.ok(after[i].fetched_at > before[i].fetched_at, 'checked-on date moved forward')
          assert.equal(after[i].updated_at, before[i].updated_at, 'content date did not')
        }
      } finally { close() }
    })

    test('a renamed service (same external id) is updated in place, not duplicated', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, [P1, P2], { apply: true, ...PORTAL })
        const renamed = { ...P1, title: 'NIMC (NIN Pre-Enrolment)', content: P1.content.replace('₦1,000', '₦1,500') }
        const dry = await syncDocuments(client, [renamed, P2], PORTAL)
        assert.deepEqual([dry.inserted, dry.updated, dry.unchanged], [0, 1, 1])
        assert.deepEqual(dry.extra, [], 'the old title is not reported as missing')
        await syncDocuments(client, [renamed, P2], { apply: true, ...PORTAL })
        const rows = await rows_(client, 'SELECT title, content FROM rag_documents ORDER BY id')
        assert.equal(rows.length, 2)
        assert.equal(rows[0].title, 'NIMC (NIN Pre-Enrolment)')
        assert.match(rows[0].content, /₦1,500/)
      } finally { close() }
    })

    test('portal documents and hand-written ones do not see each other', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, SOURCE, { apply: true })                    // hand-written
        await syncDocuments(client, [P1, P2], { apply: true, ...PORTAL })       // portal
        const handwritten = await syncDocuments(client, SOURCE)
        assert.deepEqual([handwritten.unchanged, handwritten.extra.length], [2, 0], 'portal rows are not "extra" to the hand-written sync')
        const portal = await syncDocuments(client, [P1, P2], PORTAL)
        assert.deepEqual([portal.unchanged, portal.extra.length], [2, 0], 'hand-written rows are not "extra" to the portal sync')
        assert.equal((await rows_(client, 'SELECT COUNT(*) c FROM rag_documents'))[0].c, 4)
      } finally { close() }
    })

    test('a service dropped by the portal is reported and left in place', async () => {
      const { client, close } = await make()
      try {
        await syncDocuments(client, [P1, P2], { apply: true, ...PORTAL })
        const r = await syncDocuments(client, [P1], { apply: true, ...PORTAL })
        assert.deepEqual(r.extra.map(e => e.source), ['FRSC'])
        assert.equal((await rows_(client, 'SELECT COUNT(*) c FROM rag_documents'))[0].c, 2)
      } finally { close() }
    })

    test('an older database without the provenance columns is upgraded, and its documents are kept', async () => {
      const { client, close } = await make()
      try {
        await exec_(client, `CREATE TABLE rag_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL, title TEXT NOT NULL,
          url TEXT, content TEXT NOT NULL, fetched_at TEXT NOT NULL, updated_at TEXT NOT NULL)`)
        await exec_(client, `CREATE TABLE rag_chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL, text TEXT NOT NULL,
          embedding TEXT, token_count INTEGER, section TEXT, chunk_index INTEGER, created_at TEXT NOT NULL)`)
        await exec_(client, `INSERT INTO rag_documents (source, title, url, content, fetched_at, updated_at) VALUES ('CAC','Old doc',NULL,'# Old\\nhello','x','x')`)

        // a dry run works on the old shape without altering it
        const dry = await syncDocuments(client, [P1], PORTAL)
        assert.equal(dry.inserted, 1)
        const cols = (await rows_(client, 'PRAGMA table_info(rag_documents)')).map(c => c.name)
        assert.ok(!cols.includes('origin'), 'dry run changed nothing')

        await syncDocuments(client, [P1], { apply: true, ...PORTAL })
        const upgraded = (await rows_(client, 'PRAGMA table_info(rag_documents)')).map(c => c.name)
        assert.ok(upgraded.includes('origin') && upgraded.includes('external_id'))
        const rows = await rows_(client, 'SELECT source, origin FROM rag_documents ORDER BY id')
        assert.deepEqual(rows.map(r => [r.source, r.origin]), [['CAC', null], ['NIMC', 'portal']], 'the old hand-written row is untouched')
      } finally { close() }
    })
  })
}

// ---------------------------------------------------------------------------
// Removal: the only deletion in the corpus tooling, narrow and reversible.
// ---------------------------------------------------------------------------
for (const [name, make] of Object.entries(makers)) {
  describe(`${name}: removeDocuments`, () => {
    const seed = async (client) => {
      await syncDocuments(client, SOURCE, { apply: true })                    // two hand-written
      await syncDocuments(client, [P1, P2], { apply: true, ...PORTAL })       // two portal
    }
    const count = async (client, table) => Number((await rows_(client, `SELECT COUNT(*) c FROM ${table}`))[0].c)

    test('a dry run reports what would go and changes nothing', async () => {
      const { client, close } = await make()
      try {
        await seed(client)
        const before = [await count(client, 'rag_documents'), await count(client, 'rag_chunks')]
        const r = await removeDocuments(client, { origin: null })
        assert.equal(r.documents, 2)
        assert.ok(r.chunks > 0)
        assert.equal(r.removed, false)
        assert.deepEqual(r.rows.map(d => d.source).sort(), ['CAC', 'FIRS'])
        assert.ok(r.rows.every(d => typeof d.content === 'string' && d.content), 'rows carry content, so they can be backed up')
        assert.deepEqual([await count(client, 'rag_documents'), await count(client, 'rag_chunks')], before)
      } finally { close() }
    })

    test('removes the hand-written documents and their chunks, and leaves the portal ones intact', async () => {
      const { client, close } = await make()
      try {
        await seed(client)
        const portalChunksBefore = Number((await rows_(client, "SELECT COUNT(*) c FROM rag_chunks WHERE document_id IN (SELECT id FROM rag_documents WHERE origin = 'portal')"))[0].c)
        const r = await removeDocuments(client, { origin: null, apply: true })
        assert.equal(r.removed, true)
        assert.equal(await countDocuments(client, null), 0)
        assert.equal(await countDocuments(client, 'portal'), 2)
        assert.equal(await count(client, 'rag_documents'), 2)
        assert.equal(await count(client, 'rag_chunks'), portalChunksBefore, 'only the removed documents\' chunks went')
        assert.equal((await rows_(client, 'SELECT COUNT(*) c FROM rag_chunks WHERE document_id NOT IN (SELECT id FROM rag_documents)'))[0].c, 0, 'no orphaned chunks')
      } finally { close() }
    })

    test('removing the portal origin leaves the hand-written documents alone', async () => {
      const { client, close } = await make()
      try {
        await seed(client)
        await removeDocuments(client, { origin: 'portal', apply: true })
        assert.equal(await countDocuments(client, 'portal'), 0)
        assert.equal(await countDocuments(client, null), 2)
      } finally { close() }
    })

    test('removed documents are no longer retrieved', async () => {
      const { client, close } = await make()
      try {
        await seed(client)
        assert.equal((await queryRAG(client, 'submit the form and pay', 3)).results[0]?.source, 'CAC')
        await removeDocuments(client, { origin: null, apply: true })
        const after = (await queryRAG(client, 'submit the form and pay', 3)).results
        assert.ok(after.every(r => r.origin === 'portal'))
      } finally { close() }
    })

    test('nothing to remove, or no tables at all, is not an error', async () => {
      const { client, close } = await make()
      try {
        assert.deepEqual(await removeDocuments(client, { origin: null, apply: true }), { documents: 0, chunks: 0, rows: [], removed: false })
        assert.equal(await countDocuments(client, null), 0)
        await syncDocuments(client, [P1], { apply: true, ...PORTAL })
        assert.equal((await removeDocuments(client, { origin: null, apply: true })).documents, 0)
        assert.equal(await countDocuments(client, 'portal'), 1)
      } finally { close() }
    })

    test('works on a database from before the provenance columns (everything in it is hand-written)', async () => {
      const { client, close } = await make()
      try {
        await exec_(client, `CREATE TABLE rag_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL, title TEXT NOT NULL,
          url TEXT, content TEXT NOT NULL, fetched_at TEXT NOT NULL, updated_at TEXT NOT NULL)`)
        await exec_(client, `CREATE TABLE rag_chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL, text TEXT NOT NULL,
          embedding TEXT, token_count INTEGER, section TEXT, chunk_index INTEGER, created_at TEXT NOT NULL)`)
        await exec_(client, `INSERT INTO rag_documents (source, title, url, content, fetched_at, updated_at) VALUES ('CAC','Old',NULL,'# Old','x','x')`)
        await exec_(client, `INSERT INTO rag_chunks (document_id, text, created_at) VALUES (1,'Old','x')`)
        assert.equal(await countDocuments(client, null), 1)
        const r = await removeDocuments(client, { origin: null, apply: true })
        assert.equal(r.removed, true)
        assert.equal(await count(client, 'rag_documents'), 0)
        assert.equal(await count(client, 'rag_chunks'), 0)
      } finally { close() }
    })
  })
}
