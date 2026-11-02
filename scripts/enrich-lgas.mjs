/**
 * Enriches src/content/localGovernments.json with three new data fields:
 *   - LGA.population2006  — 2006 NPC census (U.S. Census Bureau / HDX, CC BY)
 *   - LGA.constituency    — House of Representatives federal constituency
 *                           (nuhu-ibrahim/lga-districs SQL, via INEC delimitation)
 *   - State.councilStatus — elected | caretaker | contested | unknown
 *   - State.electionDate  — ISO date of last LGA election (when known)
 *
 * Usage:
 *   node scripts/enrich-lgas.mjs <path-to-xlsx> <path-to-sql>
 *
 * The XLSX is Nigeria_uscb_202001.xlsx from HDX (CC BY, U.S. Census Bureau).
 * The SQL is nigeria_lga_districts.sql from github.com/nuhu-ibrahim/lga-districs.
 */

import { readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Election status (state-level, sourced from research Nov 2026) ─────────────
// Sources: ICIR, ShineYourEye, Premium Times, Channels TV — see research notes.
// Format: { status: elected|caretaker|contested|unknown, date: ISO-string|null }
const ELECTION_STATUS = {
  'Abia':                   { status: 'elected',   date: '2024-11' },
  'Adamawa':                { status: 'elected',   date: '2024' },
  'Akwa Ibom':              { status: 'elected',   date: '2024-10-26' },
  'Anambra':                { status: 'elected',   date: '2024' },
  'Bauchi':                 { status: 'elected',   date: '2024-08-19' },
  'Bayelsa':                { status: 'caretaker', date: null },
  'Benue':                  { status: 'elected',   date: '2024-11-16' },
  'Borno':                  { status: 'elected',   date: '2024-01-20' },
  'Cross River':            { status: 'elected',   date: '2024' },
  'Delta':                  { status: 'elected',   date: '2024-07-13' },
  'Ebonyi':                 { status: 'elected',   date: '2024' },
  'Edo':                    { status: 'contested', date: null },
  'Ekiti':                  { status: 'unknown',   date: null },
  'Enugu':                  { status: 'elected',   date: '2024' },
  'Federal Capital Territory': { status: 'elected', date: '2026-02-21' },
  'Gombe':                  { status: 'elected',   date: '2024' },
  'Imo':                    { status: 'elected',   date: '2024-09-21' },
  'Jigawa':                 { status: 'elected',   date: '2024-10' },
  'Kaduna':                 { status: 'elected',   date: '2024-10-19' },
  'Kano':                   { status: 'elected',   date: '2024-10-24' },
  'Katsina':                { status: 'elected',   date: '2025-02-15' },
  'Kebbi':                  { status: 'elected',   date: '2024-08-31' },
  'Kogi':                   { status: 'elected',   date: '2024-10-09' },
  'Kwara':                  { status: 'elected',   date: '2024-09-21' },
  'Lagos':                  { status: 'elected',   date: '2025-07-12' },
  'Nasarawa':               { status: 'elected',   date: '2024-11' },
  'Niger':                  { status: 'elected',   date: '2025-11-01' },
  'Ogun':                   { status: 'elected',   date: '2024-11' },
  'Ondo':                   { status: 'elected',   date: '2025-01-18' },
  'Osun':                   { status: 'elected',   date: '2025-02-22' },
  'Oyo':                    { status: 'elected',   date: '2024' },
  'Plateau':                { status: 'elected',   date: '2024-10-09' },
  'Rivers':                 { status: 'elected',   date: '2025-08-30' },
  'Sokoto':                 { status: 'elected',   date: '2024' },
  'Taraba':                 { status: 'elected',   date: '2024-11-18' },
  'Yobe':                   { status: 'unknown',   date: null },
  'Zamfara':                { status: 'caretaker', date: null },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Fuzzy match: exact first, then try stripping punctuation / common variants
function matchLga(name, map) {
  const key = normalize(name)
  if (map.has(key)) return map.get(key)
  // try without apostrophes / hyphens
  const alt = key.replace(/['\-]/g, ' ').replace(/\s+/g, ' ').trim()
  if (map.has(alt)) return map.get(alt)
  return null
}

// ── Parse SQL ─────────────────────────────────────────────────────────────────
function parseConstituencies(sqlPath) {
  const sql = readFileSync(sqlPath, 'utf-8')

  // Extract representative_district_tbl rows
  const districtSection = sql.slice(sql.indexOf('representative_district_tbl'))
  const districts = new Map()
  for (const m of districtSection.matchAll(/\((\d+),\s*\d+,\s*'([^']+)'\)/g)) {
    districts.set(parseInt(m[1]), m[2])
  }

  // Extract lga_tbl rows: (lga_id, state_id, sen_id, rep_id, lga_name)
  const lgaSection = sql.slice(sql.indexOf('INSERT INTO `lga_tbl`'))
  const map = new Map() // normalized lga name -> constituency name
  for (const m of lgaSection.matchAll(/\(\d+,\s*\d+,\s*\d+,\s*(\d+),\s*'([^']+)'\)/g)) {
    const repId = parseInt(m[1])
    const lgaName = m[2]
    const constituency = districts.get(repId) || ''
    map.set(normalize(lgaName), constituency)
  }

  console.log(`SQL: ${map.size} LGAs, ${districts.size} constituencies`)
  return map
}

// ── Parse XLSX (Age-Sex sheet) for 2006 census BTOTL ─────────────────────────
async function parseCensus(xlsxPath) {
  const buf = readFileSync(xlsxPath)
  const zip = await JSZip.loadAsync(buf)

  // Shared strings
  const ssXml = await zip.file('xl/sharedStrings.xml').async('string')
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const ssDoc = parser.parse(ssXml)
  const siArr = Array.isArray(ssDoc.sst.si) ? ssDoc.sst.si : [ssDoc.sst.si]
  const strings = siArr.map(si => {
    if (!si) return ''
    if (si.t !== undefined) return String(si.t)
    if (si.r) {
      const rs = Array.isArray(si.r) ? si.r : [si.r]
      return rs.map(r => (r.t !== undefined ? String(r.t) : '')).join('')
    }
    return ''
  })

  // Find sheet index for 'Age-Sex'
  const wbXml = await zip.file('xl/workbook.xml').async('string')
  const wbDoc = parser.parse(wbXml)
  const sheets = Array.isArray(wbDoc.workbook.sheets.sheet)
    ? wbDoc.workbook.sheets.sheet
    : [wbDoc.workbook.sheets.sheet]
  const sheetIdx = sheets.findIndex(s => s['@_name'] === 'Age-Sex') + 1
  if (!sheetIdx) throw new Error('Age-Sex sheet not found')

  const wsXml = await zip.file(`xl/worksheets/sheet${sheetIdx}.xml`).async('string')

  // Parse rows with a lightweight regex approach (avoids deep XML for large sheets)
  // Each row: <row r="N">...<c r="XN" t="s"><v>idx</v>...</row>
  const colIndexOf = col => {
    // Convert column letter(s) to 0-based index: A=0, B=1, Z=25, AA=26 …
    let n = 0
    for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64)
    return n - 1
  }

  const cellRe = /<c r="([A-Z]+)\d+" ?([^>]*)><v>([^<]*)<\/v>/g
  const rowRe = /<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g

  // Column indices (from header row 1)
  // We'll detect them dynamically from the first row
  let colGeoMatch = -1, colAdm1 = -1, colAdmLevel = -1, colBtotl = -1
  const HEADERS = { GEO_MATCH: 2, ADM1_NAME: 4, ADM_LEVEL: 6, BTOTL: 12 }
  // Use known fixed positions (confirmed from earlier inspection)
  colGeoMatch = HEADERS.GEO_MATCH
  colAdm1 = HEADERS.ADM1_NAME
  colAdmLevel = HEADERS.ADM_LEVEL
  colBtotl = HEADERS.BTOTL

  const map = new Map() // normalized "state|lga" -> population
  let rowCount = 0

  for (const rowM of wsXml.matchAll(rowRe)) {
    const rowNum = parseInt(rowM[1])
    if (rowNum < 3) continue // skip header rows

    const cells = new Array(20).fill(null)
    for (const cellM of rowM[2].matchAll(cellRe)) {
      const colLetter = cellM[1]
      const attrs = cellM[2]
      const rawVal = cellM[3]
      const ci = colIndexOf(colLetter)
      if (ci >= cells.length) cells.push(...new Array(ci - cells.length + 1).fill(null))
      cells[ci] = attrs.includes('t="s"') ? strings[parseInt(rawVal)] : rawVal
    }

    const admLevel = cells[colAdmLevel]
    if (admLevel !== '2') continue // only LGA rows

    const geoMatch = (cells[colGeoMatch] || '').trim()  // e.g. "ABA NORTH"
    const adm1 = (cells[colAdm1] || '').trim()           // e.g. "NIGERIA_ABIA"
    const btotl = cells[colBtotl]
    if (!geoMatch || !btotl) continue

    const state = adm1.replace(/^NIGERIA_/, '').trim()
    const key = normalize(`${state}|${geoMatch}`)
    map.set(key, parseInt(btotl))
    rowCount++
  }

  console.log(`XLSX: ${rowCount} LGA population rows extracted`)
  return map
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = process.argv[2]
  const sqlPath  = process.argv[3]

  if (!xlsxPath || !sqlPath) {
    console.error('Usage: node scripts/enrich-lgas.mjs <xlsx> <sql>')
    process.exit(1)
  }

  const jsonPath = path.join(__dirname, '../src/content/localGovernments.json')
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  console.log('Parsing constituency SQL…')
  const constituencyMap = parseConstituencies(sqlPath)

  console.log('Parsing census XLSX…')
  const censusMap = await parseCensus(xlsxPath)

  let popFound = 0, popMissed = 0
  let consFound = 0, consMissed = 0

  const enrichedStates = data.states.map(state => {
    const elec = ELECTION_STATUS[state.state] || { status: 'unknown', date: null }

    // normalised XLSX state key: strip accents/spaces for matching
    // XLSX uses ALL-CAPS, strip NIGERIA_ prefix → "ABIA", "CROSS RIVER", "FCT" etc.
    const xlsxState = state.state === 'Federal Capital Territory' ? 'FCT'
      : state.state.toUpperCase()

    const enrichedLgas = state.lgas.map(lgaName => {
      // Census lookup: try state|lgaName key
      const censusKey = normalize(`${xlsxState}|${lgaName}`)
      let pop = censusMap.get(censusKey) ?? null
      if (pop == null) {
        // fallback: search just by LGA name across all states
        for (const [k, v] of censusMap) {
          if (k.endsWith('|' + normalize(lgaName))) { pop = v; break }
        }
      }
      if (pop != null) popFound++; else popMissed++

      // Constituency lookup
      const constituency = matchLga(lgaName, constituencyMap) ?? null
      if (constituency != null) consFound++; else consMissed++

      return { name: lgaName, population2006: pop, constituency }
    })

    return {
      state: state.state,
      zone: state.zone,
      councilStatus: elec.status,
      ...(elec.date ? { electionDate: elec.date } : {}),
      lgas: enrichedLgas,
    }
  })

  const enriched = {
    ...data,
    sources: [
      data.source,
      { name: 'U.S. Census Bureau / HDX', url: 'https://data.humdata.org/dataset/nigeria-subnational-boundaries-and-tabular-data', license: 'CC BY', field: 'population2006' },
      { name: 'nuhu-ibrahim/lga-districs (INEC delimitation)', url: 'https://github.com/nuhu-ibrahim/lga-districs', license: 'unspecified', field: 'constituency' },
      { name: 'ICIR / ShineYourEye / Premium Times (research Nov 2026)', url: 'https://www.shineyoureye.org/info/local-government-elections', license: 'editorial', field: 'councilStatus' },
    ],
    states: enrichedStates,
  }
  // Remove old singular source key
  delete enriched.source

  writeFileSync(jsonPath, JSON.stringify(enriched, null, 1))

  console.log(`\nDone.`)
  console.log(`  Population: ${popFound} matched, ${popMissed} unmatched`)
  console.log(`  Constituency: ${consFound} matched, ${consMissed} unmatched`)
  console.log(`  Written to ${jsonPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
