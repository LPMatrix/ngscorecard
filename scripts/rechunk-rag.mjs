#!/usr/bin/env node
// Rebuild RAG chunks from each document's stored content using the current
// chunker, so a chunker fix reaches documents ingested with an older one.
// Documents are untouched; only rag_chunks rows are replaced.
//
//   npm run rag:rechunk                  dry run: reports what would change, writes nothing
//   npm run rag:rechunk -- --apply       write the changes
//   npm run rag:rechunk -- --db <file>   use a specific local SQLite file
//
// Targets Turso when TURSO_DATABASE_URL is set (via .env), otherwise the local
// data/ngscorecard.db. The target is printed before anything runs.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rechunkAll } from '../server/rag.js'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const dbFlag = args.indexOf('--db')
const dbFile = dbFlag !== -1 ? path.resolve(args[dbFlag + 1]) : null

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
console.log(apply ? 'Mode: APPLY (chunks will be replaced)' : 'Mode: dry run (nothing will be written; add --apply to write)')

try {
  const stats = await rechunkAll(client, { apply })
  console.log(`Documents: ${stats.documents}`)
  console.log(`Documents whose chunks ${apply ? 'were rebuilt' : 'would change'}: ${stats.changed}`)
  console.log(`Chunks: ${stats.chunksBefore} before, ${stats.chunksAfter} after`)
  if (!apply && stats.changed) console.log('Re-run with --apply to write these changes.')
} finally {
  client.close?.()
}
