#!/usr/bin/env node
// Remove all documents of one origin from the RAG corpus, with their chunks.
// Used to retire the old hand-written documents now that the corpus comes from
// the Government Service Portal. The only script that deletes anything.
//
//   npm run rag:remove -- --origin none           dry run: what would be removed (hand-written documents)
//   npm run rag:remove -- --origin none --apply   back them up, then remove them
//   npm run rag:remove -- --origin portal         the same for the portal documents
//   npm run rag:remove -- --db <file> ...         a specific local SQLite file
//
// `--origin` is required; there is no default, so nothing is removed by accident.
// Before deleting, every document is written to data/backups/ as JSON (content
// included) so it can be restored. Removing the hand-written documents is refused
// while the portal has none loaded, so the corpus cannot be left empty by mistake
// (override with --force-empty). Targets Turso when TURSO_DATABASE_URL is set,
// otherwise data/ngscorecard.db; the target is printed first.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { removeDocuments, countDocuments } from '../server/rag.js'

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null }

const originArg = val('--origin')
if (!originArg || originArg.startsWith('--')) {
  console.error('Say which documents to remove: --origin none (the hand-written ones) or --origin portal.')
  process.exit(2)
}
const origin = originArg === 'none' ? null : originArg
const apply = has('--apply')
const dbFile = val('--db') ? path.resolve(val('--db')) : null

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let client
let target
if (!dbFile && process.env.TURSO_DATABASE_URL) {
  const { createClient } = await import('@libsql/client')
  client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  target = `Turso (${new URL(process.env.TURSO_DATABASE_URL.replace(/^libsql:/, 'https:')).host})`
} else {
  const { default: Database } = await import('better-sqlite3')
  const file = dbFile ?? path.join(__dirname, '../data/ngscorecard.db')
  client = new Database(file)
  target = `local file ${file}`
}

console.log(`Target: ${target}`)
console.log(`Removing: documents with origin ${origin === null ? 'none (hand-written)' : `"${origin}"`}`)
console.log(apply ? 'Mode: APPLY' : 'Mode: dry run (nothing will be removed; add --apply to remove)')

try {
  if (origin === null && !has('--force-empty') && (await countDocuments(client, 'portal')) === 0) {
    console.error('\nRefusing: there are no portal documents loaded, so this would leave the corpus empty.')
    console.error('Load them first (npm run rag:sync-portal -- --apply), or pass --force-empty.')
    process.exit(1)
  }

  const r = await removeDocuments(client, { origin, apply: false })
  console.log(`\nDocuments: ${r.documents} (${r.chunks} chunks)`)
  for (const d of r.rows.slice(0, 60)) console.log(`  [${d.source}] ${d.title}  (id ${d.id})`)
  if (r.rows.length > 60) console.log(`  ... and ${r.rows.length - 60} more`)
  if (r.documents === 0) { console.log('\nNothing to remove.'); process.exit(0) }

  if (!apply) { console.log('\nRe-run with --apply to back these up and remove them.'); process.exit(0) }

  const dir = path.join(__dirname, '../data/backups')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `rag-documents-${origin ?? 'none'}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(file, JSON.stringify({ target, origin, backedUpAt: new Date().toISOString(), documents: r.rows }, null, 1))
  console.log(`\nBacked up ${r.documents} documents to ${path.relative(process.cwd(), file)}`)

  const done = await removeDocuments(client, { origin, apply: true })
  const left = await countDocuments(client, origin)
  console.log(`Removed ${done.documents} documents and ${done.chunks} chunks.`)
  console.log(left === 0 ? 'Verified: none left.' : `WARNING: ${left} document(s) still present.`)
  if (left) process.exitCode = 1
} finally {
  client.close?.()
}
