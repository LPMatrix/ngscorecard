// Writes the whole tracker to public/ngscorecard-dataset.json — a committed,
// static, zero-infrastructure mirror of GET /api/v1/dump that stays available
// even if the API or database is down, and that anyone can rehost as-is.
//
// Run after seeding (it reads the same database):
//   npm run export:dataset
//
// Vite copies public/ to dist/client/, so the file is served at
// https://<host>/ngscorecard-dataset.json with no function invocation.

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import * as q from '../server/queries.js'
import { buildDataset } from '../server/dataExport.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '../public/ngscorecard-dataset.json')

const dataset = await buildDataset(q)
writeFileSync(outPath, JSON.stringify(dataset, null, 2) + '\n')

const { counts } = dataset.meta
const records = Object.entries(counts)
  .filter(([k]) => k !== 'administrations')
  .reduce((n, [, v]) => n + v, 0)

console.log(`Wrote ${path.relative(process.cwd(), outPath)}`)
console.log(`  ${counts.administrations} administrations, ${counts.promises ?? 0} promises, ${records} records total`)

// libsql's client can keep the event loop alive; exit explicitly.
process.exit(0)
