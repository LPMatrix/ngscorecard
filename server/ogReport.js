// Share image for a term report card (1200×630 PNG), served at
// /api/og/report/<admin>.png and referenced as og:image / twitter:image by the
// /<admin>/report page.
//
// Built with satori (layout → SVG with text converted to vector paths from the
// bundled fonts in server/fonts/) then rasterised by sharp. Going through
// satori rather than sharp's own SVG text means glyphs never depend on system
// fonts, which a serverless runtime doesn't reliably have.
//
// Numbers come from src/lib/termReport.js — the same derivation the page
// uses — so the image can't disagree with the page it links to.

import satori from 'satori'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { buildTermReport } from '../src/lib/termReport.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const W = 1200
const H = 630

// Non-breaking spaces: satori collapses ordinary runs of whitespace.
const DOT = '\u00a0\u00a0·\u00a0\u00a0'

const C = {
  forest: '#073f2a',
  forestDeep: '#04140c',
  flagBright: '#12a05f',
  gold: '#c9a227',
  goldSoft: '#e2c66b',
  rust: '#b5502f',
  parchment: '#f4efe1',
  mintDim: '#a9d6bf',
}

let fontsCache = null
function loadFonts() {
  if (fontsCache) return fontsCache
  const read = (f) => readFileSync(path.join(__dirname, 'fonts', f))
  fontsCache = [
    { name: 'Instrument Sans', data: read('instrument-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Instrument Sans', data: read('instrument-sans-latin-600-normal.woff'), weight: 600, style: 'normal' },
    { name: 'Instrument Sans', data: read('instrument-sans-latin-700-normal.woff'), weight: 700, style: 'normal' },
    { name: 'Playfair Display', data: read('playfair-display-latin-800-normal.woff'), weight: 800, style: 'normal' },
  ]
  return fontsCache
}

// Minimal element factory — satori takes plain { type, props } trees (no
// React needed) and wants display:flex on anything with several children.
const h = (type, style, ...children) => ({
  type,
  props: {
    style: { display: 'flex', ...style },
    children: children.length === 1 ? children[0] : children,
  },
})

function roleLine(admin) {
  const role = admin.level === 'state' ? `Governor of ${admin.state} State` : 'President'
  return [role, admin.party, admin.term].filter(Boolean).join(DOT)
}

function verdictBlock(r) {
  if (!r.total) {
    return h('div', { flexDirection: 'column' },
      h('div', { fontFamily: 'Playfair Display', fontWeight: 800, fontSize: 64, color: C.goldSoft, lineHeight: 1.1 }, 'No promises tracked yet'),
      h('div', { fontSize: 26, color: C.mintDim, marginTop: 12 }, 'This record is being built — see the full scorecard.'),
    )
  }
  const breakdown = [`${r.kept} of ${r.total} kept`, `${r.partial} partial`, `${r.broken} broken`]
  if (r.pending) breakdown.push(`${r.pending} in progress`)
  return h('div', { alignItems: 'center' },
    h('div', { fontFamily: 'Playfair Display', fontWeight: 800, fontSize: 176, lineHeight: 1, color: C.goldSoft, marginRight: 34 }, `${r.keptPct}%`),
    h('div', { flexDirection: 'column' },
      h('div', { fontSize: 38, fontWeight: 600, color: C.parchment, lineHeight: 1.15 }, 'of tracked promises kept'),
      h('div', { fontSize: 24, color: C.mintDim, marginTop: 10 }, breakdown.join(DOT)),
    ),
  )
}

function barBlock(r) {
  if (!r.total) return null
  const seg = (n, color, opacity = 1) => (n
    ? h('div', { width: `${(n / r.total) * 100}%`, height: '100%', background: color, opacity })
    : null)
  return h('div', { flexDirection: 'column', marginTop: 30 },
    h('div', { width: '100%', height: 26, borderRadius: 13, overflow: 'hidden', background: 'rgba(255,255,255,0.12)' },
      ...[seg(r.kept, C.flagBright), seg(r.partial, C.gold), seg(r.broken, C.rust), seg(r.pending, C.mintDim, 0.55)].filter(Boolean),
    ),
  )
}

function tree(admin, r) {
  const nameSize = admin.fullName.length > 30 ? 54 : admin.fullName.length > 22 ? 64 : 74
  return h('div', {
    width: W, height: H, flexDirection: 'column',
    padding: '52px 64px 44px',
    background: `linear-gradient(135deg, ${C.forest} 0%, ${C.forestDeep} 100%)`,
    color: C.parchment, fontFamily: 'Instrument Sans',
  },
    h('div', { justifyContent: 'space-between', alignItems: 'center' },
      h('div', { alignItems: 'center' },
        h('div', {
          width: 54, height: 54, borderRadius: 12, border: `2px solid ${C.gold}`,
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Playfair Display', fontWeight: 800, fontSize: 24, color: C.goldSoft,
        }, 'NG'),
        h('div', { fontSize: 20, fontWeight: 700, letterSpacing: 4, color: C.mintDim, marginLeft: 18 }, 'NGSCORECARD'),
      ),
      h('div', {
        fontSize: 17, fontWeight: 700, letterSpacing: 3, color: C.goldSoft,
        border: `2px solid ${C.gold}`, borderRadius: 999, padding: '8px 20px',
      }, 'TERM REPORT CARD'),
    ),
    h('div', { fontFamily: 'Playfair Display', fontWeight: 800, fontSize: nameSize, lineHeight: 1.05, marginTop: 34, color: C.parchment }, admin.fullName),
    h('div', { fontSize: 26, color: C.mintDim, marginTop: 12 }, roleLine(admin)),
    h('div', { marginTop: 'auto', flexDirection: 'column' },
      verdictBlock(r),
      barBlock(r),
    ),
    h('div', { justifyContent: 'space-between', alignItems: 'center', marginTop: 30, fontSize: 20, color: C.mintDim },
      h('div', { fontWeight: 600 }, `ngscorecard.com/${admin.key}/report`),
      h('div', {}, r.sitting ? `Term in progress${DOT}independent, every claim sourced` : `Independent${DOT}every claim sourced`),
    ),
  )
}

export async function renderReportPng({ admin, promises, fraud, budget }) {
  const report = buildTermReport({ admin, promises, fraud, budget })
  const svg = await satori(tree(admin, report), { width: W, height: H, fonts: loadFonts() })
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
}
