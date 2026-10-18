#!/usr/bin/env node
// Load every service listed on the Government Service Portal (services.gov.ng),
// and every agency's profile, into the RAG corpus.
//
//   npm run rag:sync-portal                       fetch the portal, show what would change, write nothing
//   npm run rag:sync-portal -- --apply            write the changes
//   npm run rag:sync-portal -- --from-file F      use a saved snapshot instead of fetching
//   npm run rag:sync-portal -- --db <file>        use a specific local SQLite file
//   npm run rag:sync-portal -- --limit 3          only the first 3 agencies (a quick trial)
//   npm run rag:sync-portal -- --delay 600        milliseconds between requests (default 400)
//   npm run rag:sync-portal -- --allow-partial    allow --apply even if some pages could not be fetched
//
// A live fetch is one request at a time and takes a minute or two. The raw
// responses are saved to data/portal-snapshot.json (gitignored) so a run can be
// reviewed or repeated offline with --from-file.
//
// Targets Turso when TURSO_DATABASE_URL is set (via .env), otherwise the local
// data/ngscorecard.db. The target is printed first. Safe to re-run: documents
// are matched on the portal's own ids, unchanged ones are only re-dated, and
// nothing is ever deleted. The hand-written documents are not touched.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncDocuments } from '../server/rag.js'
import { createPortalClient, crawlPortal, portalDocuments, PORTAL_ORIGIN } from '../server/portalSource.js'

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null }

const apply = has('--apply')
const allowPartial = has('--allow-partial')
const fromFile = val('--from-file')
const dbFile = val('--db') ? path.resolve(val('--db')) : null
const limit = val('--limit') ? Number(val('--limit')) : null
const delayMs = val('--delay') ? Number(val('--delay')) : 400

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const snapshotPath = path.join(__dirname, '../data/portal-snapshot.json')

// --- 1. the portal's data ---------------------------------------------------

let snapshot
if (fromFile) {
  snapshot = JSON.parse(fs.readFileSync(path.resolve(fromFile), 'utf8'))
  console.log(`Source: snapshot ${fromFile} (fetched ${snapshot.fetchedAt})`)
} else {
  console.log(`Source: live fetch of ${'https://services.gov.ng'} (one request at a time, ${delayMs} ms apart)`)
  const client = createPortalClient({ delayMs })
  let lastLine = ''
  snapshot = await crawlPortal(client, {
    limitProviders: limit,
    onProgress: ({ index, total, slug }) => {
      const line = `  agency ${index}/${total}: ${slug}`
      if (line !== lastLine) process.stderr.write(`${line}\n`)
      lastLine = line
    },
  })
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true })
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 1))
  console.log(`Fetched ${client.requestCount} pages. Raw responses saved to ${path.relative(process.cwd(), snapshotPath)}`)
}

if (snapshot.failures?.length) {
  console.log(`\n${snapshot.failures.length} page(s) could not be fetched:`)
  for (const f of snapshot.failures.slice(0, 15)) console.log(`  ${f.path}: ${f.error}`)
}

// --- 2. documents -----------------------------------------------------------

const { docs, stats, warnings, skipped } = portalDocuments(snapshot)
console.log(`\nPortal: ${stats.providers} agencies, ${stats.services} services`)
console.log(`Documents built: ${stats.documents} (${stats.serviceDocuments} services, ${stats.providerDocuments} agency profiles)`)
console.log(`  of the ${stats.serviceDocuments} services: ${stats.comingSoon} are marked "coming soon" for online application, and ${stats.unusableFees} have no usable fee on the portal (stated as such, not as ₦0)`)

if (skipped.length) {
  console.log(`\nLeft out (${skipped.length}):`)
  for (const s of skipped.slice(0, 25)) console.log(`  ${s.where}: ${s.reason}`)
}
if (warnings.length) {
  console.log(`\nWorth a look (${warnings.length}):`)
  for (const w of warnings.slice(0, 25)) console.log(`  ${w.where}: ${w.message}`)
  if (warnings.length > 25) console.log(`  ... and ${warnings.length - 25} more`)
}

// sanity: do not touch the database if the portal returned something implausible
if (stats.services === 0 || stats.providers < Math.min(5, limit ?? 5)) {
  console.error('\nThe portal returned too little data to trust (has its API changed?). Nothing was written.')
  process.exit(1)
}
if (apply && snapshot.failures?.length && !allowPartial) {
  console.error('\nSome pages were missing, so this is a partial picture. Re-run, or pass --allow-partial to write what was fetched.')
  process.exit(1)
}

// --- 3. the database --------------------------------------------------------

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
console.log(apply ? 'Mode: APPLY' : 'Mode: dry run (nothing will be written; add --apply to write)')

try {
  const r = await syncDocuments(client, docs, { apply, origin: PORTAL_ORIGIN, touchChecked: true })
  const verb = apply ? '' : 'would be '
  console.log(`\nDocuments ${verb}inserted:  ${r.inserted}`)
  console.log(`Documents ${verb}updated:   ${r.updated}`)
  console.log(`Documents ${verb}rechunked: ${r.rechunked}`)
  console.log(`Documents unchanged:         ${r.unchanged}${apply && r.touched ? ` (re-dated ${r.touched})` : ''}`)

  const byAgency = new Map()
  for (const p of r.plan.filter(p => p.action !== 'unchanged')) {
    const k = `${p.source} ${p.action}`
    byAgency.set(k, (byAgency.get(k) ?? 0) + 1)
  }
  if (byAgency.size) {
    console.log('\nBy agency:')
    console.log('  ' + [...byAgency].map(([k, n]) => `${k} ${n}`).join(' | ').replace(/(.{110}\S*)\s\|\s/g, '$1\n  '))
  }
  for (const p of r.plan.filter(p => p.renamedFrom)) console.log(`  renamed: ${p.renamedFrom} -> ${p.title}`)

  if (r.extra.length) {
    console.log(`\nStored from the portal earlier but no longer listed (left untouched): ${r.extra.length}`)
    for (const e of r.extra.slice(0, 20)) console.log(`  [${e.source}] ${e.title}  (id ${e.id})`)
  }
  if (r.duplicates.length) console.log(`\nDuplicate rows for one portal item (left untouched): ${r.duplicates.length}`)

  if (!apply && r.inserted + r.updated + r.rechunked > 0) console.log('\nRe-run with --apply to write these changes.')
  if (apply) {
    const again = await syncDocuments(client, docs, { origin: PORTAL_ORIGIN })
    const pending = again.inserted + again.updated + again.rechunked
    console.log(pending === 0 ? '\nVerified: a second pass finds nothing left to change.' : `\nWARNING: ${pending} document(s) still differ after applying.`)
    if (pending) process.exitCode = 1
  }
} finally {
  client.close?.()
}
