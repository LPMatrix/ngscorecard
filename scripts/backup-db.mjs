// Writes a full, timestamped JSON backup of every table to data/backups/
// (gitignored). Turso's current plan has no point-in-time recovery, so this is
// the way back from a bad bulk edit or delete: run it before big data work and
// on a schedule.
//
// admin_users is skipped on purpose: it holds password hashes, and accounts are
// quicker to re-create from /admin → Team than to restore from a file. The
// admin_audit table IS included, since it carries the before-state of deletes.
//
// Run:  npm run db:backup
//
// To restore a table, re-insert its rows with the same ids (the JSON keys are
// the raw column names). Individual deleted rows are easier to put back from
// /admin → Activity log → Restore.

import { mkdirSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
if (!url) {
  console.error('TURSO_DATABASE_URL is not set, so there is no hosted database to back up. (Local dev uses data/ngscorecard.db: just copy that file.)')
  process.exit(1)
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
const SKIP = new Set(['admin_users'])

const tables = (await client.execute(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_%' ESCAPE '\\' ORDER BY name"
)).rows.map(r => r.name).filter(n => !SKIP.has(n))

const data = {}
const counts = {}
for (const name of tables) {
  const rows = (await client.execute(`SELECT * FROM "${name}"`)).rows
  data[name] = rows.map(r => ({ ...r }))
  counts[name] = rows.length
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/backups')
mkdirSync(dir, { recursive: true })
const file = path.join(dir, `ngscorecard-${stamp}.json`)
writeFileSync(file, JSON.stringify({ takenAt: new Date().toISOString(), counts, data }) + '\n')

const total = Object.values(counts).reduce((n, c) => n + c, 0)
console.log(`Backed up ${tables.length} tables, ${total} rows → ${path.relative(process.cwd(), file)}`)
