// Turns an assistant answer (plain text with light structure) into blocks the
// page can render safely.
//
// The output is data, never HTML: every piece of text stays a string for Vue to
// escape, so nothing the model writes (or copied from a retrieved web page) can
// inject markup. Only a small subset is understood:
//
//   paragraphs        text separated by a blank line
//   numbered lists    "1. step" or "1) step"
//   bulleted lists    "- item", "* item" or "• item"
//   bold              **text** (a model habit even when told not to)
//   citations         [1], [1, 2] and [1][2], kept only if that source exists
//
// Other markdown noise (headings, backticks, block quotes) is flattened to text.
//
// Blocks:  { type: 'p', parts }
//          { type: 'ol', start, items: [parts, ...] }
//          { type: 'ul', items: [parts, ...] }
// Parts:   { type: 'text', text } | { type: 'strong', text } | { type: 'cite', id }

const MAX_CHARS = 5000

const ORDERED = /^\s*(\d{1,3})[.)]\s+(.*)$/
const BULLET = /^\s*[-*•]\s+(.*)$/
const HEADING = /^\s{0,3}#{1,6}\s+(.*)$/
const CONTINUATION = /^\s{2,}\S/

const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\[\d+(?:\s*,\s*\d+)*\])/g

function inline(raw, validIds) {
  const cleaned = raw.replace(/`+/g, '').replace(/^\s*>\s?/, '')
  const parts = []
  const pushText = (text) => {
    if (!text) return
    const last = parts[parts.length - 1]
    if (last && last.type === 'text') last.text += text
    else parts.push({ type: 'text', text })
  }

  for (const piece of cleaned.split(INLINE)) {
    if (!piece) continue
    if ((piece.startsWith('**') && piece.endsWith('**') && piece.length > 4) ||
        (piece.startsWith('__') && piece.endsWith('__') && piece.length > 4)) {
      parts.push({ type: 'strong', text: piece.slice(2, -2) })
    } else if (/^\[\d/.test(piece) && piece.endsWith(']')) {
      for (const id of piece.slice(1, -1).split(',').map(n => Number(n.trim()))) {
        if (validIds.has(id)) parts.push({ type: 'cite', id })
      }
    } else {
      pushText(piece)
    }
  }

  // tidy the gap a dropped citation leaves behind ("word  ." -> "word.")
  for (const part of parts) {
    if (part.type === 'text') part.text = part.text.replace(/ {2,}/g, ' ').replace(/ +([.,;:!?])/g, '$1')
  }
  return parts
}

export function formatAnswer(answer, sourceIds = []) {
  if (typeof answer !== 'string' || !answer.trim()) return []
  const validIds = new Set(sourceIds)
  const lines = answer.slice(0, MAX_CHARS).replace(/\r\n?/g, '\n').split('\n')

  const blocks = []
  let paragraph = [] // raw lines
  let list = null // { type, start?, items: [raw strings] }

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push({ type: 'p', parts: inline(paragraph.join(' ').replace(/\s+/g, ' ').trim(), validIds) })
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    const items = list.items.map(item => inline(item.trim(), validIds))
    blocks.push(list.type === 'ol' ? { type: 'ol', start: list.start, items } : { type: 'ul', items })
    list = null
  }

  for (const line of lines) {
    if (!line.trim()) { flushParagraph(); flushList(); continue }

    const ordered = line.match(ORDERED)
    const bullet = !ordered && line.match(BULLET)
    if (ordered || bullet) {
      const kind = ordered ? 'ol' : 'ul'
      flushParagraph()
      if (list && list.type !== kind) flushList()
      if (!list) list = { type: kind, start: ordered ? Number(ordered[1]) : undefined, items: [] }
      list.items.push(ordered ? ordered[2] : bullet[1])
      continue
    }

    if (list && CONTINUATION.test(line)) { // wrapped text belonging to the last item
      list.items[list.items.length - 1] += ` ${line.trim()}`
      continue
    }

    const heading = line.match(HEADING)
    if (heading) {
      flushParagraph(); flushList()
      blocks.push({ type: 'p', parts: [{ type: 'strong', text: heading[1].replace(/\*\*|__|`/g, '').trim() }] })
      continue
    }

    flushList()
    paragraph.push(line.trim())
  }
  flushParagraph()
  flushList()

  return blocks.filter(b => (b.parts ? b.parts.length : b.items.length))
}
