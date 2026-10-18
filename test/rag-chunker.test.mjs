import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { createClient } from '@libsql/client'
import { chunkText, addDocument, rechunkAll } from '../server/rag.js'
import { corpusDocuments } from '../evals/rag/lib.mjs'

const norm = (s) => s.replace(/\s+/g, ' ').trim()
const joined = (text, max) => norm(chunkText(text, max).map(c => c.text).join(' '))

describe('chunkText', () => {
  test('keeps a final line that has no terminal punctuation', () => {
    // The old splitter dropped everything after the last period in a section.
    const text = '## How to Register\n1. Online: Visit lirs.gov.ng\n2. Submit business details\n4. Receive LIRS PIN'
    const out = joined(text)
    assert.ok(out.includes('Receive LIRS PIN'))
    assert.ok(out.includes('Submit business details'))
  })

  test('does not split inside domains, decimals or list markers', () => {
    const text = '## Rates\nVAT is 7.5 percent. Register at taxes.firs.gov.ng today.'
    const chunks = chunkText(text, 10) // tiny limit forces sentence-level splitting
    const all = chunks.map(c => c.text).join(' ')
    assert.ok(all.includes('7.5 percent'))
    assert.ok(all.includes('taxes.firs.gov.ng'))
    for (const c of chunks) assert.ok(!/^\.?\d?\.?$/.test(c.text.trim()), `orphan fragment: "${c.text}"`)
  })

  test('keeps list items on their own lines, under their heading', () => {
    const [chunk] = chunkText('## Steps\n1. First\n2. Second\n3. Third')
    assert.equal(chunk.text, '## Steps\n1. First\n2. Second\n3. Third')
    assert.equal(chunk.section, 'Steps')
  })

  test('keeps text that comes before the first heading', () => {
    // small limit so the two sections cannot merge
    const chunks = chunkText('Intro paragraph about the agency.\n\n## Details\nFees apply.', 10)
    assert.deepEqual(chunks.map(c => c.section), ['Main', 'Details'])
    assert.ok(chunks[0].text.includes('Intro paragraph'))
  })

  test('text with no headings becomes one Main section', () => {
    const chunks = chunkText('Just a plain paragraph. It has two sentences.')
    assert.equal(chunks.length, 1)
    assert.equal(chunks[0].section, 'Main')
  })

  test('splits an over-long line without losing words, and respects the limit', () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`)
    const text = `## Long\n${words.join(' ')}`
    const chunks = chunkText(text, 50)
    assert.ok(chunks.length > 1)
    for (const c of chunks) assert.ok(c.tokens <= 50, `chunk of ${c.tokens} tokens exceeds the limit`)
    // every word survives, in order (the heading is repeated on each piece)
    const got = chunks.map(c => c.text.replace(/^## Long\n/, '')).join(' ').split(/\s+/)
    assert.deepEqual(got, words)
  })

  test('splits a section that exceeds the limit by lines, repeating its heading', () => {
    const line = 'x'.repeat(120) // 30 tokens
    const text = `## S\n${[line, line, line, line].join('\n')}`
    const chunks = chunkText(text, 70)
    assert.equal(chunks.length, 2)
    assert.ok(chunks.every(c => c.tokens <= 70))
    assert.ok(chunks.every(c => c.text.startsWith('## S\n')))
  })

  test('merges neighbouring sections so one chunk can answer a multi-part question', () => {
    const text = '# Reg\n## Step 1: Check the name\nSearch the database.\n## Step 2: Submit\nPay the fee of 20,000.\n## Timeline\n3-5 days'
    const chunks = chunkText(text, 200)
    assert.equal(chunks.length, 1)
    for (const part of ['Step 1: Check the name', 'Search the database', 'Step 2: Submit', '20,000', '3-5 days']) {
      assert.ok(chunks[0].text.includes(part), part)
    }
    assert.equal(chunks[0].section, 'Step 1: Check the name') // first section in the chunk
  })

  test('starts a new chunk rather than splitting a section that still fits on its own', () => {
    const body = 'y'.repeat(300) // 75 tokens
    const text = `## A\n${body}\n## B\n${body}\n## C\n${body}`
    const chunks = chunkText(text, 160)
    assert.deepEqual(chunks.map(c => c.section), ['A', 'C'])
    assert.ok(chunks[0].text.includes('## B'), 'A and B merge')
    assert.ok(!chunks[0].text.includes('## C'))
  })

  test('a heading with no body of its own travels with the next section', () => {
    const [chunk] = chunkText('# Agency\n## Overview\nWhat it does.', 200)
    assert.equal(chunk.text, '# Agency\n## Overview\nWhat it does.')
  })

  test('a heading at the very end is kept, not dropped', () => {
    const [chunk] = chunkText('## Body\nText here.\n## Contact', 200)
    assert.ok(chunk.text.endsWith('## Contact'))
  })

  test('empty and whitespace-only input yields no chunks', () => {
    assert.deepEqual(chunkText(''), [])
    assert.deepEqual(chunkText('   \n\n  '), [])
    assert.deepEqual(chunkText(undefined), [])
  })

  // A line longer than the chunk limit is split into pieces (with its heading
  // repeated between them), so it need not reappear as one unbroken string. What
  // must hold is that every word of it is still there, in order.
  const wordsSurvive = (out, line) => {
    let pos = 0
    for (const word of line.split(/\s+/)) {
      const i = out.indexOf(word, pos)
      if (i === -1) return word
      pos = i + word.length
    }
    return null
  }

  test('loses no text, headings included, from any document in the corpus', () => {
    let lines = 0
    for (const doc of corpusDocuments()) {
      const out = joined(doc.content)
      for (const line of doc.content.split('\n').map(l => l.trim())) {
        if (!line) continue
        lines++
        const missing = out.includes(norm(line)) ? null : wordsSurvive(out, norm(line))
        assert.equal(missing, null, `[${doc.externalId}] lost "${missing}" from: ${line.slice(0, 80)}`)
      }
    }
    assert.ok(lines > 3000) // guard against the loop silently checking nothing
  })

  test('chunks merge sections: there are clearly fewer chunks than headings', () => {
    let chunks = 0
    let headings = 0
    for (const doc of corpusDocuments()) {
      chunks += chunkText(doc.content).length
      headings += (doc.content.match(/^#+\s/gm) || []).length
    }
    assert.ok(chunks < headings * 0.8, `${chunks} chunks for ${headings} headings`)
  })
})

describe('rechunkAll', () => {
  const DOC = {
    source: 'LIRS', title: 'Lagos Internal Revenue Service', url: null,
    content: '# T\n## How to Register\n1. Online: Visit lirs.gov.ng\n2. Submit details\n4. Receive LIRS PIN',
  }
  const SCHEMA = [
    `CREATE TABLE rag_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL, title TEXT NOT NULL,
      url TEXT, content TEXT NOT NULL, fetched_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE rag_chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL, text TEXT NOT NULL,
      embedding TEXT, token_count INTEGER, section TEXT, chunk_index INTEGER, created_at TEXT NOT NULL)`,
  ]

  const texts = async (client) => {
    if (client.prepare) return client.prepare('SELECT text FROM rag_chunks ORDER BY id').all().map(r => r.text)
    return (await client.execute('SELECT text FROM rag_chunks ORDER BY id')).rows.map(r => r.text)
  }
  const exec = async (client, sql, args = []) =>
    client.prepare ? client.prepare(sql).run(...args) : client.execute({ sql, args })

  // Seed a document with the lossy chunks the old chunker produced.
  const seedStale = async (client) => {
    await addDocument(client, DOC)
    await exec(client, 'DELETE FROM rag_chunks')
    await exec(client, `INSERT INTO rag_chunks (document_id, text, section, chunk_index, created_at)
                        VALUES (1, '1. Online: Visit lirs.gov.ng', 'How to Register', 0, 'x')`)
  }

  const cases = {
    'better-sqlite3': async () => {
      const db = new Database(':memory:')
      for (const sql of SCHEMA) db.prepare(sql).run()
      return { client: db, close: () => db.close() }
    },
    'libsql': async () => {
      const dir = mkdtempSync(join(tmpdir(), 'rechunk-'))
      const client = createClient({ url: `file:${join(dir, 'r.db')}` })
      for (const sql of SCHEMA) await client.execute(sql)
      return { client, close: () => { client.close(); rmSync(dir, { recursive: true, force: true }) } }
    },
  }

  for (const [name, make] of Object.entries(cases)) {
    test(`${name}: dry run reports changes and writes nothing`, async () => {
      const { client, close } = await make()
      try {
        await seedStale(client)
        const before = await texts(client)
        const stats = await rechunkAll(client)
        assert.equal(stats.changed, 1)
        assert.deepEqual(await texts(client), before)
      } finally { close() }
    })

    test(`${name}: apply restores the dropped lines, and a second run changes nothing`, async () => {
      const { client, close } = await make()
      try {
        await seedStale(client)
        assert.ok(!(await texts(client)).join(' ').includes('Receive LIRS PIN'))
        const first = await rechunkAll(client, { apply: true })
        assert.equal(first.changed, 1)
        assert.ok((await texts(client)).join(' ').includes('Receive LIRS PIN'))
        const second = await rechunkAll(client, { apply: true })
        assert.equal(second.changed, 0)
      } finally { close() }
    })
  }
})
