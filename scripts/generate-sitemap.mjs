// Regenerates public/sitemap.xml from the live database, so it can never
// silently drift out of sync with what's actually tracked (it used to be a
// hand-edited file that only ever covered the five federal presidents).
//
// One <url> per administration's base page, plus one per non-empty content
// tab that page actually has — an empty tab isn't worth a crawler's time.
// Priority is tiered: federal presidents first, then current governors,
// then former governors, on the reasoning that's roughly how a reader's
// (and a search engine's) interest runs.
//
// Run after seeding (it reads the same database), same as export:dataset:
//   npm run sitemap

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import * as q from '../server/queries.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '../public/sitemap.xml')
const SITE_ORIGIN = 'https://ngscorecard.com'

// Matches VALID_TABS in src/App.vue minus 'promises' (that's the admin's
// base URL, not a sub-path — see canonicalPath in server/render.js) and
// minus 'history' (backing data for entry change-logs, not its own route).
const TAB_RESOURCES = [
  'ministers', 'orders', 'appointments', 'fraud',
  'judgments', 'inherited', 'budget', 'indicators',
]
const FEDERAL_ONLY_TAB_RESOURCES = ['bills', 'governors']

const STATIC_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/guide', priority: '0.9', changefreq: 'monthly' },
  { loc: '/developers', priority: '0.6', changefreq: 'monthly' },
  { loc: '/press', priority: '0.5', changefreq: 'monthly' },
  { loc: '/guide.ha.html', priority: '0.4', changefreq: 'monthly' },
  { loc: '/guide.ig.html', priority: '0.4', changefreq: 'monthly' },
  { loc: '/guide.pcm.html', priority: '0.4', changefreq: 'monthly' },
  { loc: '/guide.yo.html', priority: '0.4', changefreq: 'monthly' },
]

function adminBasePath(key) {
  // Mirrors canonicalPath() in server/render.js: Tinubu's promises tab is
  // the site root, not /tinubu.
  return key === 'tinubu' ? '/' : `/${key}`
}

function priorityFor(admin, { isTab }) {
  const federal = admin.level !== 'state'
  if (federal) return isTab ? '0.7' : '0.9'
  return admin.isCurrent ? (isTab ? '0.5' : '0.7') : (isTab ? '0.35' : '0.5')
}

const administrations = await q.getFullDataset()
const today = new Date().toISOString().slice(0, 10)

const urls = []
for (const page of STATIC_PAGES) {
  urls.push({ ...page, lastmod: today })
}

for (const admin of administrations) {
  const federal = admin.level !== 'state'
  const basePath = adminBasePath(admin.key)

  if (basePath !== '/') {
    urls.push({ loc: basePath, lastmod: today, changefreq: 'monthly', priority: priorityFor(admin, { isTab: false }) })
  }

  const resources = federal ? [...TAB_RESOURCES, ...FEDERAL_ONLY_TAB_RESOURCES] : TAB_RESOURCES
  for (const resource of resources) {
    if ((admin.data[resource]?.length ?? 0) === 0) continue
    urls.push({
      loc: `${basePath === '/' ? '/tinubu' : basePath}/${resource}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: priorityFor(admin, { isTab: true }),
    })
  }
}

const body = urls
  .map(
    (u) => `  <url>
    <loc>${SITE_ORIGIN}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`

writeFileSync(outPath, xml)
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`)
console.log(`  ${urls.length} URLs (${administrations.length} administrations)`)

// libsql's client can keep the event loop alive; exit explicitly.
process.exit(0)
