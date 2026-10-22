#!/usr/bin/env node
// Rebuild src/content/localGovernments.json from a public CSV of Nigeria's 774
// local government areas.
//
//   npm run lgas:import                    fetch the CSV and rewrite the file
//   npm run lgas:import -- --from-file F   use a CSV you already downloaded
//
// The source is github.com/xosasx/nigerian-local-government-areas (MIT). Its
// rows carry coordinates and Wikidata ids; only names are kept, grouped by
// state, with each state's geopolitical zone from src/lib/zones.js. The script
// refuses to write anything that is not 774 areas in 37 states (36 states and
// the Federal Capital Territory), or that has a duplicate within a state.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NG_ZONES, NG_ZONE_ORDER } from '../src/lib/zones.js'

const SOURCE = {
  name: 'xosasx/nigerian-local-government-areas',
  url: 'https://github.com/xosasx/nigerian-local-government-areas',
  csv: 'https://raw.githubusercontent.com/xosasx/nigerian-local-government-areas/HEAD/csv/lgas.csv',
  license: 'MIT',
}

const args = process.argv.slice(2)
const fromFile = args.includes('--from-file') ? args[args.indexOf('--from-file') + 1] : null
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/content/localGovernments.json')

// A small CSV reader: quoted fields, doubled quotes, commas inside quotes.
function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

const csv = fromFile ? fs.readFileSync(path.resolve(fromFile), 'utf8') : await (await fetch(SOURCE.csv)).text()
const [header, ...rows] = parseCsv(csv)
const col = (n) => { const i = header.indexOf(n); if (i < 0) throw new Error(`The CSV has no "${n}" column (has: ${header.join(', ')})`); return i }
const iName = col('name'), iState = col('state_name')

const tidy = (s) => { const t = s.trim().replace(/\s+/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1) }
const byState = new Map()
for (const r of rows) {
  const state = tidy(r[iState]), name = tidy(r[iName])
  if (!state || !name) throw new Error(`Row with an empty state or name: ${JSON.stringify(r)}`)
  if (!byState.has(state)) byState.set(state, [])
  byState.get(state).push(name)
}

const problems = []
let total = 0
for (const [state, list] of byState) {
  total += list.length
  const dupes = list.filter((n, i) => list.indexOf(n) !== i)
  if (dupes.length) problems.push(`${state}: duplicate ${dupes.join(', ')}`)
  if (!NG_ZONES[state]) problems.push(`${state}: no geopolitical zone in src/lib/zones.js`)
}
if (total !== 774) problems.push(`expected 774 local government areas, found ${total}`)
if (byState.size !== 37) problems.push(`expected 37 states (36 + FCT), found ${byState.size}`)
if (problems.length) { console.error('Refusing to write:\n  ' + problems.join('\n  ')); process.exit(1) }

const states = [...byState]
  .map(([state, lgas]) => ({ state, zone: NG_ZONES[state], lgas: lgas.sort((a, b) => a.localeCompare(b, 'en')) }))
  .sort((a, b) => NG_ZONE_ORDER.indexOf(a.zone) - NG_ZONE_ORDER.indexOf(b.zone) || a.state.localeCompare(b.state, 'en'))

fs.writeFileSync(out, JSON.stringify({
  source: { name: SOURCE.name, url: SOURCE.url, license: SOURCE.license, retrieved: new Date().toISOString().slice(0, 10) },
  total, states,
}, null, 1) + '\n')
console.log(`Wrote ${path.relative(process.cwd(), out)}: ${total} local government areas in ${states.length} states`)
