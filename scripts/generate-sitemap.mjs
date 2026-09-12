// Regenerates public/sitemap.xml from the live database, so it can never
// silently drift out of sync with what's actually tracked.
//
// One <url> per administration's base page, plus one per non-empty content
// tab it actually has, plus the recurring-commitment (themes) pages and the
// guide/press/developers content pages (all real SSR routes — see
// src/routes.js). Emitted once per SEO-ready locale (see READY_LOCALES in
// src/i18n) — locale routes stay reachable but aren't advertised until their
// catalogue is translated.
//
// Run after seeding (reads the same database):  npm run sitemap

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import * as q from '../server/queries.js'
import { READY_LOCALES } from '../src/i18n/index.js'
import { buildPath } from '../src/routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '../public/sitemap.xml')
const SITE_ORIGIN = 'https://ngscorecard.com'

const TAB_RESOURCES = ['ministers', 'orders', 'appointments', 'fraud', 'judgments', 'inherited', 'budget', 'indicators']
const FEDERAL_ONLY_TAB_RESOURCES = ['bills', 'governors']

// "Month YYYY" / "YYYY" → "YYYY-MM-DD", else null.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
function isoFromReviewed(s) {
  const m = String(s ?? '').trim().match(/^(?:([A-Za-z]+)\s+)?(\d{4})$/)
  if (!m) return null
  const mi = m[1] ? MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) : 0
  if (mi < 0) return null
  return `${m[2]}-${String(mi + 1).padStart(2, '0')}-01`
}

function priorityFor(admin, isTab) {
  if (admin.level !== 'state') return isTab ? '0.7' : '0.9'
  return admin.isCurrent ? (isTab ? '0.5' : '0.7') : (isTab ? '0.35' : '0.5')
}

const [administrations, themes] = await Promise.all([q.getFullDataset(), q.getThemesWithCounts()])
const today = new Date().toISOString().slice(0, 10)

const urls = []
const push = (loc, lastmod, changefreq, priority) => urls.push({ loc, lastmod, changefreq, priority })

for (const l of READY_LOCALES) {
  const code = l.code

  // Content pages
  push(buildPath('home', {}, code), today, 'weekly', '1.0')
  push(buildPath('guide', {}, code), today, 'monthly', '0.9')
  push(buildPath('developers', {}, code), today, 'monthly', '0.6')
  push(buildPath('press', {}, code), today, 'monthly', '0.5')

  // Recurring commitments
  push(buildPath('themesIndex', {}, code), today, 'monthly', '0.7')
  for (const th of themes) {
    push(buildPath('themeLineage', { slug: th.slug }, code), today, 'monthly', '0.6')
  }

  // Administrations
  for (const admin of administrations) {
    const lastmod = isoFromReviewed(admin.reviewed) || today
    const base = buildPath('scorecard', { admin: admin.key }, code)
    if (buildPath('home', {}, code) !== base) {
      push(base, lastmod, 'monthly', priorityFor(admin, false))
    }
    const resources = admin.level !== 'state'
      ? [...TAB_RESOURCES, ...FEDERAL_ONLY_TAB_RESOURCES]
      : TAB_RESOURCES
    for (const resource of resources) {
      if ((admin.data[resource]?.length ?? 0) === 0) continue
      push(buildPath('scorecard', { admin: admin.key, tab: resource }, code), lastmod, 'monthly', priorityFor(admin, true))
    }
  }
}

const body = urls
  .map((u) => `  <url>
    <loc>${SITE_ORIGIN}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`)
  .join('\n')

writeFileSync(outPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`)
console.log(`  ${urls.length} URLs · ${administrations.length} administrations · ${themes.length} themes · locales: ${READY_LOCALES.map((l) => l.code).join(', ')}`)

process.exit(0)
