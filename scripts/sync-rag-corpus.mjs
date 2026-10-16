#!/usr/bin/env node
// Make the RAG corpus in a database match scripts/government-data-sources.mjs.
//
//   npm run rag:sync                 dry run: shows what would change, writes nothing
//   npm run rag:sync -- --apply      write the changes
//   npm run rag:sync -- --db <file>  use a specific local SQLite file
//
// Targets Turso when TURSO_DATABASE_URL is set (via .env), otherwise the local
// data/ngscorecard.db. The target is printed first. Safe to re-run: documents
// are matched on (source, title), unchanged ones are skipped, and nothing is
// ever deleted. Documents in the database that are not in the source are only
// reported. Missing RAG tables are created on --apply.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncDocuments } from '../server/rag.js'
import { governmentDocuments, stateServices } from './government-data-sources.mjs'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const dbFlag = args.indexOf('--db')
const dbFile = dbFlag !== -1 ? path.resolve(args[dbFlag + 1]) : null

const docs = [...governmentDocuments, ...stateServices]
if (!docs.length) {
  console.error('No source documents found; refusing to run.')
  process.exit(1)
}

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
console.log(`Source: ${docs.length} documents from scripts/government-data-sources.mjs`)
console.log(apply ? 'Mode: APPLY' : 'Mode: dry run (nothing will be written; add --apply to write)')

try {
  const r = await syncDocuments(client, docs, { apply })
  const verb = apply ? '' : 'would be '
  if (r.tablesMissing) console.log(`RAG tables are missing in this database; they ${apply ? 'were' : 'will be'} created.`)
  console.log(`\nDocuments ${verb}inserted: ${r.inserted}`)
  console.log(`Documents ${verb}updated:  ${r.updated}`)
  console.log(`Documents ${verb}rechunked: ${r.rechunked}`)
  console.log(`Documents unchanged:        ${r.unchanged}`)

  for (const p of r.plan.filter(p => p.action !== 'unchanged').slice(0, 60)) {
    console.log(`  ${p.action.padEnd(8)} [${p.source}] ${p.title}  (${p.chunks} chunks)${p.renamedFrom ? `\n           renamed from: ${p.renamedFrom}` : ''}`)
  }
  if (r.plan.filter(p => p.action !== 'unchanged').length > 60) console.log('  ...')

  if (r.extra.length) {
    console.log(`\nIn the database but not in the source (left untouched): ${r.extra.length}`)
    for (const e of r.extra.slice(0, 20)) console.log(`  [${e.source}] ${e.title}  (id ${e.id})`)
  }
  if (r.duplicates.length) {
    console.log(`\nDuplicate rows for one document (left untouched, the first is used): ${r.duplicates.length}`)
    for (const d of r.duplicates.slice(0, 20)) console.log(`  [${d.source}] ${d.title}  (id ${d.id})`)
  }

  if (!apply && r.inserted + r.updated + r.rechunked > 0) console.log('\nRe-run with --apply to write these changes.')
  if (apply) {
    const again = await syncDocuments(client, docs)
    const pending = again.inserted + again.updated + again.rechunked
    console.log(pending === 0 ? '\nVerified: a second pass finds nothing left to change.' : `\nWARNING: ${pending} document(s) still differ after applying.`)
    if (pending) process.exitCode = 1
  }
} finally {
  client.close?.()
}
