#!/usr/bin/env node
// Crawl https://nhrec.gov.ng and sync its pages into the RAG corpus.
//
//   npm run rag:sync-nhrec                   dry run: show what would change
//   npm run rag:sync-nhrec -- --apply        write changes to the database
//   npm run rag:sync-nhrec -- --from-file F  use a saved snapshot (skip fetching)
//   npm run rag:sync-nhrec -- --db <file>    use a specific local SQLite file
//   npm run rag:sync-nhrec -- --delay 800    ms between requests (default 600)
//
// A live crawl fetches one page at a time and takes a few minutes. Responses
// are saved to data/nhrec-snapshot.json (gitignored) so a run can be reviewed
// or repeated with --from-file. Targets Turso when TURSO_DATABASE_URL is set,
// otherwise the local data/ngscorecard.db.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncDocuments } from '../server/rag.js'
import { createNhrecClient, crawlNhrec, nhrecDocuments, NHREC_ORIGIN } from '../server/nhrecSource.js'

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null }

const apply = has('--apply')
const fromFile = val('--from-file')
const dbFile = val('--db') ? path.resolve(val('--db')) : null
const delayMs = val('--delay') ? Number(val('--delay')) : 600

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const snapshotPath = path.join(__dirname, '../data/nhrec-snapshot.json')

// --- 1. fetch or load snapshot -----------------------------------------------

let snapshot
if (fromFile) {
  snapshot = JSON.parse(fs.readFileSync(path.resolve(fromFile), 'utf8'))
  console.log(`Source: snapshot ${fromFile} (fetched ${snapshot.fetchedAt})`)
} else {
  console.log(`Source: live crawl of https://nhrec.gov.ng (paced, ${delayMs} ms between requests)`)
  const client = createNhrecClient({ delayMs })
  let lastSlug = ''
  snapshot = await crawlNhrec(client, {
    onProgress: ({ index, total, slug }) => {
      const line = `  page ${index}/${total}: ${slug}`
      if (line !== lastSlug) process.stderr.write(`${line}\n`)
      lastSlug = line
    },
  })
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true })
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 1))
  console.log(`Fetched ${client.requestCount} pages. Snapshot saved to ${path.relative(process.cwd(), snapshotPath)}`)
}

if (snapshot.failures?.length) {
  console.log(`\n${snapshot.failures.length} page(s) could not be fetched:`)
  for (const f of snapshot.failures.slice(0, 15)) console.log(`  ${f.url ?? f.path}: ${f.error}`)
}

// --- 2. build documents -------------------------------------------------------

const { docs, stats, warnings } = nhrecDocuments(snapshot)
console.log(`\nNHREC: ${stats.pages} pages fetched, ${stats.documents} documents built`)

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`)
  for (const w of warnings.slice(0, 20)) console.log(`  ${w}`)
}

if (stats.documents === 0) {
  console.error('\nNo documents built — has the site structure changed? Nothing was written.')
  process.exit(1)
}

// --- 3. database -------------------------------------------------------------

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

console.log(`\nTarget: ${target}`)
console.log(apply ? 'Mode: APPLY' : 'Mode: dry run (add --apply to write)')

try {
  const r = await syncDocuments(client, docs, { apply, origin: NHREC_ORIGIN, touchChecked: true })
  const verb = apply ? '' : 'would be '
  console.log(`\nDocuments ${verb}inserted:  ${r.inserted}`)
  console.log(`Documents ${verb}updated:   ${r.updated}`)
  console.log(`Documents ${verb}rechunked: ${r.rechunked}`)
  console.log(`Documents unchanged:         ${r.unchanged}${apply && r.touched ? ` (re-dated ${r.touched})` : ''}`)

  if (r.extra.length) {
    console.log(`\nStored earlier but no longer on the site (left untouched): ${r.extra.length}`)
    for (const e of r.extra.slice(0, 20)) console.log(`  [${e.source}] ${e.title}`)
  }

  if (!apply && r.inserted + r.updated + r.rechunked > 0) console.log('\nRe-run with --apply to write these changes.')
  if (apply) {
    const again = await syncDocuments(client, docs, { origin: NHREC_ORIGIN })
    const pending = again.inserted + again.updated + again.rechunked
    console.log(pending === 0 ? '\nVerified: second pass finds nothing left to change.' : `\nWARNING: ${pending} document(s) still differ after applying.`)
    if (pending) process.exitCode = 1
  }
} finally {
  client.close?.()
}
