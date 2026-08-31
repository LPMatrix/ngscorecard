// Builds the open, whole-tracker export shared by two consumers:
//   1. the public, no-key endpoint  GET /api/v1/dump        (server/publicApi.js)
//   2. the static committed mirror  public/ngscorecard-dataset.json
//                                                    (scripts/export-dataset.mjs)
// Openness and mirrorability are a deliberate trust/resilience choice — the
// whole dataset is CC BY 4.0 and downloadable in one request. Keep this file
// dependency-free so the export can never break the build.

// Every per-administration resource, matching the keys getAllDataForAdmin()
// returns and the sections in each data/seed/{key}.json file.
export const RESOURCES = [
  'promises', 'inherited', 'fraud', 'orders', 'ministers', 'bills',
  'appointments', 'judgments', 'budget', 'indicators', 'governors',
]

export const LICENSE = {
  id: 'CC-BY-4.0',
  name: 'Creative Commons Attribution 4.0 International',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  attribution: 'NGScorecard — ngscorecard.com',
}

// `q` is the server/queries.js module (passed in rather than imported so this
// file pulls in no database code of its own).
export async function buildDataset(q) {
  const administrations = await q.getFullDataset()

  const counts = { administrations: administrations.length }
  for (const a of administrations) {
    for (const [resource, rows] of Object.entries(a.data)) {
      counts[resource] = (counts[resource] || 0) + (Array.isArray(rows) ? rows.length : 0)
    }
  }

  return {
    meta: {
      name: 'NGScorecard full dataset',
      description:
        'Every administration NGScorecard tracks — federal and state — with all of ' +
        'its promise, inherited-problem, fraud, executive-order, minister, bill, ' +
        'appointment, judgment, budget, indicator and governor records.',
      generated: new Date().toISOString(),
      source: 'https://ngscorecard.com',
      api: 'https://ngscorecard.com/api/v1',
      docs: 'https://ngscorecard.com/developers',
      license: LICENSE,
      notes:
        'A null field means the figure is not publicly reported — never zero. ' +
        'Every record carries its own source and sourceLabel; cite those primary ' +
        'sources, not this file alone. Mirroring and redistribution are encouraged ' +
        'under the license above, with attribution retained.',
      counts,
    },
    administrations,
  }
}

// Flattens one resource across every administration into a single table,
// prefixing each row with its administration key. Nested sub-arrays (a
// budget year's `ministries`, an indicator's `points`) survive as a
// JSON-encoded cell — see toCsv().
export function flattenResource(administrations, resource) {
  const rows = []
  for (const a of administrations) {
    for (const row of a.data[resource] || []) {
      rows.push({ administration: a.key, ...row })
    }
  }
  return rows
}

function csvCell(value) {
  if (value === null || value === undefined) return ''
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows) {
  if (!rows.length) return ''
  const columns = [...rows.reduce((set, row) => {
    for (const key of Object.keys(row)) set.add(key)
    return set
  }, new Set())]
  const lines = [columns.join(',')]
  for (const row of rows) {
    lines.push(columns.map(col => csvCell(row[col])).join(','))
  }
  return lines.join('\r\n') + '\r\n'
}
