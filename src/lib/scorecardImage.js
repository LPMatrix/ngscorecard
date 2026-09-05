// Client-side generation of a shareable "scorecard" PNG for any tracked
// administration — no server round-trip, drawn straight from the data
// already loaded in the page onto an offscreen <canvas>.
//
// Design mirrors the hand-built marketing cards (see /public/press.html's
// og-image pipeline for the sibling static asset) but is fully generic:
// every number here is derived from whatever data the current admin
// actually has, and a category with no rows is simply omitted rather than
// shown as a false zero — same "real fact or omit" rule the underlying
// dataset itself follows.

const W = 1200
const H = 630
const SCALE = 2 // fixed export resolution, independent of the viewer's own DPR

const COLOR = {
  forest: '#073f2a',
  forestDeep: '#04140c',
  flag: '#008751',
  flagBright: '#12a05f',
  gold: '#c9a227',
  goldSoft: '#e2c66b',
  rust: '#b5502f',
  rustSoft: '#d3835f',
  parchment: '#f4efe1',
  mint: '#dff5e8',
  mintDim: '#a9d6bf',
}

const DISPLAY_FONT = 'Playfair Display'
const BODY_FONT = 'Instrument Sans'

// ── Stat derivation ──────────────────────────────────────────────────
// Pure functions over the same arrays already rendered in each tab — no
// separate fetch, so the card always matches what's on screen.

export function promiseTally(promises) {
  const counts = { kept: 0, partial: 0, broken: 0, pending: 0 }
  for (const p of promises || []) {
    if (p.status === 'kept') counts.kept++
    else if (p.status === 'partial') counts.partial++
    else if (p.status === 'broken') counts.broken++
    else counts.pending++
  }
  return { ...counts, total: (promises || []).length }
}

function primaryIndicator(indicators) {
  const ind = (indicators || [])[0]
  const points = ind?.points
  if (!ind || !Array.isArray(points) || points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]
  if (typeof first.value !== 'number' || typeof last.value !== 'number' || first.value === 0) return null
  const pct = Math.round(((last.value - first.value) / Math.abs(first.value)) * 100)
  return { label: ind.label, unit: ind.unit, first, last, pct }
}

function judgmentRecord(judgments) {
  if (!judgments?.length) return null
  const rec = { won: 0, lost: 0, ongoing: 0, other: 0 }
  for (const j of judgments) {
    if (j.status === 'won') rec.won++
    else if (j.status === 'lost') rec.lost++
    else if (j.status === 'ongoing') rec.ongoing++
    else rec.other++
  }
  return rec
}

// Up to 3 supporting stat tiles, in a fixed priority order, skipping any
// category that has nothing tracked. Amounts in `fraud` are free-text
// (e.g. "₦117 billion") and not reliably summable across entries, so this
// reports a case count rather than a total — consistent with not
// asserting a number the source data can't actually support.
export function pickSupportingStats({ indicators, fraud, judgments, orders }) {
  const tiles = []

  const ind = primaryIndicator(indicators)
  if (ind) {
    tiles.push({
      value: `${ind.pct > 0 ? '+' : ''}${ind.pct}%`,
      label: ind.label,
      sub: `${ind.first.value}${ind.unit} (${ind.first.label}) → ${ind.last.value}${ind.unit} (${ind.last.label})`,
    })
  }

  if (fraud?.length) {
    tiles.push({
      value: String(fraud.length),
      label: fraud.length === 1 ? 'Fraud case documented' : 'Fraud cases documented',
      sub: 'See the Fraud tab for amounts & status',
    })
  }

  const rec = judgmentRecord(judgments)
  if (rec && tiles.length < 3) {
    tiles.push({
      value: `${rec.won}–${rec.lost}–${rec.ongoing}`,
      label: 'Court record',
      sub: `won–lost–ongoing, of ${judgments.length} case${judgments.length === 1 ? '' : 's'}`,
    })
  }

  if (orders?.length && tiles.length < 3) {
    tiles.push({
      value: String(orders.length),
      label: orders.length === 1 ? 'Executive order tracked' : 'Executive orders tracked',
      sub: 'Signed directives & policy actions',
    })
  }

  return tiles.slice(0, 3)
}

// ── Drawing helpers ──────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return }
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

async function ensureFontsReady() {
  const specs = [
    '800 64px "Playfair Display"',
    'italic 400 19px "Playfair Display"',
    '700 12px "Instrument Sans"',
    '600 14px "Instrument Sans"',
    '400 13px "Instrument Sans"',
  ]
  await Promise.all(specs.map((s) => document.fonts.load(s)))
  await document.fonts.ready
}

function drawBackground(ctx) {
  ctx.fillStyle = COLOR.forest
  ctx.fillRect(0, 0, W, H)

  const g1 = ctx.createRadialGradient(W * 0.84, H * 0.06, 0, W * 0.84, H * 0.06, W * 0.7)
  g1.addColorStop(0, 'rgba(18,160,95,0.22)')
  g1.addColorStop(1, 'rgba(18,160,95,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, W, H)

  const g2 = ctx.createRadialGradient(-0.06 * W, 1.08 * H, 0, -0.06 * W, 1.08 * H, W * 0.55)
  g2.addColorStop(0, 'rgba(201,162,39,0.16)')
  g2.addColorStop(1, 'rgba(201,162,39,0)')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, W, H)

  // Gold corner frame
  ctx.strokeStyle = 'rgba(226,198,107,0.35)'
  ctx.lineWidth = 1
  ctx.strokeRect(18.5, 18.5, W - 37, H - 37)
  ctx.strokeStyle = COLOR.goldSoft
  const corner = 22
  ;[[18, 18, 1, 1], [W - 18, H - 18, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(x, y + corner * dy)
    ctx.lineTo(x, y)
    ctx.lineTo(x + corner * dx, y)
    ctx.stroke()
  })
}

function text(ctx, str, x, y, { font, color, align = 'left', baseline = 'alphabetic', letterSpacing = 0 }) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = baseline
  if (!letterSpacing) { ctx.fillText(str, x, y); return }
  // Manual letter-spacing (canvas has no native property in all engines).
  let cursor = x
  const chars = align === 'right' ? [...str].reverse() : [...str]
  ctx.textAlign = align === 'right' ? 'right' : 'left'
  for (const ch of chars) {
    ctx.fillText(ch, cursor, y)
    const w = ctx.measureText(ch).width + letterSpacing * (align === 'right' ? -1 : 1)
    cursor += align === 'right' ? -w : w
  }
}

// Wraps `str` to `maxWidth`, drawing up to `maxLines` lines at `lineHeight`
// starting at (x, y). Returns the y position just below the drawn block.
function wrapText(ctx, str, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = str.split(' ')
  let line = ''
  let cy = y
  let lines = 0
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i]
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy)
      line = words[i]
      cy += lineHeight
      lines++
      if (lines >= maxLines - 1) {
        const rest = words.slice(i).join(' ')
        ctx.fillText(ctx.measureText(rest).width > maxWidth ? rest.slice(0, Math.floor(rest.length * maxWidth / ctx.measureText(rest).width) - 1) + '…' : rest, x, cy)
        return cy + lineHeight
      }
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, cy)
  return cy + lineHeight
}

// ── Main render ──────────────────────────────────────────────────────

export async function renderScorecardCanvas(admin, data) {
  await ensureFontsReady()

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  drawBackground(ctx)

  const tally = promiseTally(data.promises)
  const stats = pickSupportingStats(data)

  // ── Left column ──
  const leftX = 68
  let cy = 58

  ctx.save()
  ctx.fillStyle = COLOR.flagBright
  ctx.beginPath(); ctx.arc(leftX + 3, cy - 4, 3, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
  text(ctx, 'NGSCORECARD  ·  GOVERNOR RECORD'.replace('GOVERNOR', admin.level === 'state' ? 'GOVERNOR' : 'PRESIDENT'), leftX + 14, cy, {
    font: '700 12.5px "Instrument Sans"', color: COLOR.goldSoft, letterSpacing: 1.4,
  })

  cy += 46
  ctx.font = '800 46px "Playfair Display"'
  ctx.fillStyle = COLOR.parchment
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const nameLines = ctx.measureText(admin.title || admin.name).width > 560
    ? [admin.name] // long official names fall back to the short form
    : [admin.title || admin.name]
  ctx.fillText(nameLines[0], leftX, cy)

  cy += 40
  const termLabel = admin.level === 'state'
    ? `Governor, ${admin.state} State — ${admin.term}`
    : `President of Nigeria — ${admin.term}`
  text(ctx, termLabel, leftX, cy, { font: 'italic 400 18px "Playfair Display"', color: COLOR.mintDim })

  // Hero: promise tally
  cy += 56
  ctx.font = '800 92px "Playfair Display"'
  ctx.fillStyle = COLOR.parchment
  ctx.textAlign = 'left'
  const heroNum = `${tally.kept}`
  ctx.fillText(heroNum, leftX, cy)
  const heroNumW = ctx.measureText(heroNum).width
  ctx.font = 'italic 400 26px "Playfair Display"'
  ctx.fillStyle = COLOR.mintDim
  ctx.fillText(`of ${tally.total} promise${tally.total === 1 ? '' : 's'}`, leftX + heroNumW + 16, cy)

  cy += 24
  text(ctx, 'KEPT IN FULL', leftX, cy, { font: '600 13px "Instrument Sans"', color: COLOR.mintDim, letterSpacing: 0.8 })

  cy += 20
  const breakdownParts = []
  if (tally.partial) breakdownParts.push([`${tally.partial} partial`, COLOR.goldSoft])
  if (tally.broken) breakdownParts.push([`${tally.broken} broken`, COLOR.rustSoft])
  if (tally.pending) breakdownParts.push([`${tally.pending} in progress`, COLOR.mintDim])
  let bx = leftX
  ctx.font = '700 14px "Instrument Sans"'
  breakdownParts.forEach(([label, color], i) => {
    if (i > 0) { ctx.fillStyle = COLOR.mintDim; ctx.fillText('   ·   ', bx, cy); bx += ctx.measureText('   ·   ').width }
    ctx.fillStyle = color
    ctx.fillText(label, bx, cy)
    bx += ctx.measureText(label).width
  })

  // Rule
  const ruleY = 388
  const ruleGrad = ctx.createLinearGradient(leftX, 0, leftX + 490, 0)
  ruleGrad.addColorStop(0, 'rgba(226,198,107,0.55)')
  ruleGrad.addColorStop(1, 'rgba(226,198,107,0)')
  ctx.fillStyle = ruleGrad
  ctx.fillRect(leftX, ruleY, 490, 1)

  // Supporting stat tiles
  let tx = leftX
  const tileW = 168
  stats.forEach((s) => {
    let ty = ruleY + 44
    ctx.font = '800 30px "Playfair Display"'
    ctx.fillStyle = COLOR.goldSoft
    ctx.textAlign = 'left'
    ctx.fillText(s.value, tx, ty)
    ty += 20
    ctx.font = '700 11px "Instrument Sans"'
    ctx.fillStyle = COLOR.mintDim
    ty = wrapText(ctx, s.label.toUpperCase(), tx, ty, tileW - 12, 14, 2)
    tx += tileW
  })

  // Freshness line
  if (admin.reviewed) {
    text(ctx, `Reviewed ${admin.reviewed}`, leftX, H - 44, { font: 'italic 400 14px "Playfair Display"', color: 'rgba(244,239,225,0.55)' })
  }

  // ── Right column: proportional promise bar ──
  const rightX = W - 64
  let ry = 66
  text(ctx, `${tally.total} PROMISE${tally.total === 1 ? '' : 'S'} TRACKED`, rightX, ry, {
    font: '700 11.5px "Instrument Sans"', color: COLOR.mintDim, align: 'right', letterSpacing: 1,
  })
  ry += 30
  ctx.font = 'italic 500 18px "Playfair Display"'
  ry = (() => {
    // right-aligned two-line title, drawn manually since wrapText assumes left align
    const line1 = 'Every pledge,'
    const line2 = 'tallied and sourced.'
    ctx.fillStyle = COLOR.parchment
    ctx.textAlign = 'right'
    ctx.fillText(line1, rightX, ry)
    ctx.fillText(line2, rightX, ry + 24)
    return ry + 24
  })()

  // Proportional stacked bar
  const barW = 340
  const barX = rightX - barW
  const barY = ry + 34
  const barH = 22
  const segs = [
    ['kept', tally.kept, COLOR.flag, COLOR.flagBright],
    ['partial', tally.partial, COLOR.gold, COLOR.goldSoft],
    ['broken', tally.broken, COLOR.rust, COLOR.rustSoft],
    ['pending', tally.pending, '#3c4a43', '#5c6b63'],
  ].filter(([, n]) => n > 0)

  roundRect(ctx, barX, barY, barW, barH, 6)
  ctx.save(); ctx.clip()
  let segX = barX
  segs.forEach(([, n, c1, c2]) => {
    const w = (n / tally.total) * barW
    const grad = ctx.createLinearGradient(segX, 0, segX + w, 0)
    grad.addColorStop(0, c2); grad.addColorStop(1, c1)
    ctx.fillStyle = grad
    ctx.fillRect(segX, barY, w + 0.5, barH)
    segX += w
  })
  ctx.restore()

  // Legend
  let ly = barY + barH + 22
  const legendLabels = { kept: 'Kept', partial: 'Partial', broken: 'Broken', pending: 'In progress' }
  segs.forEach(([key, n, , c2]) => {
    ctx.textAlign = 'right'
    ctx.font = '600 12px "Instrument Sans"'
    ctx.fillStyle = COLOR.mintDim
    const label = `${legendLabels[key]} — ${n}`
    ctx.fillText(label, rightX, ly)
    const lw = ctx.measureText(label).width
    ctx.fillStyle = c2
    roundRect(ctx, rightX - lw - 16, ly - 9, 10, 10, 2)
    ctx.fill()
    ly += 18
  })

  // Footer wordmark
  ctx.textAlign = 'right'
  ctx.font = '700 20px "Playfair Display"'
  ctx.fillStyle = COLOR.parchment
  const wm2 = 'Scorecard'
  ctx.fillText(wm2, rightX, H - 60)
  const wm2w = ctx.measureText(wm2).width
  ctx.fillStyle = COLOR.flagBright
  ctx.fillText('NG', rightX - wm2w, H - 60) // draw "NG" immediately left of "Scorecard"
  text(ctx, `ngscorecard.com/${admin.key}`, rightX, H - 40, { font: '400 12px "Instrument Sans"', color: COLOR.mintDim, align: 'right' })

  return canvas
}

export async function downloadScorecard(admin, data) {
  const canvas = await renderScorecardCanvas(admin, data)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ngscorecard-${admin.key}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
