// Guards against exactly the drift that slipped through undetected this
// session: guide.html gained a whole "Coverage & gaps" section and a version
// bump (v1.2 → v1.3) while all four translated guide.<locale>.html pages
// silently stayed behind, with no signal anywhere that they had.
//
// Each guide*.html carries a `<p class="version">…vX.Y…</p>` line — this
// script is the enforcement half of that convention: every translated page's
// version number must equal the English page's, or the build fails loudly
// instead of drifting quietly. It is NOT a translation-quality check (it
// can't read the prose) — only a "has anyone updated this since English
// last moved" check.
//
// Run manually, or wire into CI:
//   npm run guide:check

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../public')

const LOCALES = [
  { file: 'guide.ha.html', label: 'Hausa' },
  { file: 'guide.ig.html', label: 'Igbo' },
  { file: 'guide.pcm.html', label: 'Naijá / Pidgin' },
  { file: 'guide.yo.html', label: 'Yorùbá' },
]

function extractVersion(html, file) {
  const m = html.match(/<p class="version">[^<]*?v(\d+\.\d+)/)
  if (!m) throw new Error(`${file}: couldn't find a "<p class="version">…vX.Y" line to check`)
  return m[1]
}

const enHtml = readFileSync(path.join(publicDir, 'guide.html'), 'utf8')
const enVersion = extractVersion(enHtml, 'guide.html')

let ok = true
console.log(`English (guide.html) is at v${enVersion}\n`)

for (const { file, label } of LOCALES) {
  const html = readFileSync(path.join(publicDir, file), 'utf8')
  const version = extractVersion(html, file)
  if (version === enVersion) {
    console.log(`OK    ${label.padEnd(18)} v${version}`)
  } else {
    ok = false
    console.log(`STALE ${label.padEnd(18)} v${version} — behind English v${enVersion}; ${file} needs its missing sections translated and its version line bumped to v${enVersion}`)
  }
}

if (!ok) {
  console.log('\nAt least one translation is behind. This is a content gap, not a build error — the site still serves the existing pages as-is — but it should be fixed before relying on them as current.')
  process.exit(1)
}
console.log('\nAll translations are in sync with the English source.')
