import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatAnswer } from '../src/lib/formatAnswer.js'

const text = (parts) => parts.map(p => (p.type === 'cite' ? `[${p.id}]` : p.text)).join('')
const kinds = (blocks) => blocks.map(b => b.type)

describe('formatAnswer: structure', () => {
  test('a paragraph, a numbered list and a closing note', () => {
    const out = formatAnswer('To register a birth:\n1. Register within 3 months [1].\n2. Visit the office [1].\n3. Get the certificate.\n\n**Note:** a slip is needed [1].', [1])
    assert.deepEqual(kinds(out), ['p', 'ol', 'p'])
    assert.equal(out[1].items.length, 3)
    assert.equal(out[1].start, 1)
    assert.equal(text(out[1].items[0]), 'Register within 3 months [1].')
    assert.deepEqual(out[2].parts[0], { type: 'strong', text: 'Note:' })
  })

  test('a list directly after a sentence, with no blank line, still becomes a list', () => {
    const out = formatAnswer('You need:\n- a birth certificate\n- proof of address', [])
    assert.deepEqual(kinds(out), ['p', 'ul'])
    assert.equal(out[1].items.length, 2)
  })

  test('accepts the common bullet and number styles', () => {
    for (const marker of ['-', '*', '•']) {
      assert.deepEqual(kinds(formatAnswer(`${marker} one\n${marker} two`)), ['ul'], marker)
    }
    assert.deepEqual(kinds(formatAnswer('1) one\n2) two')), ['ol'])
  })

  test('keeps the starting number of a list and splits different list kinds', () => {
    const out = formatAnswer('3. third\n4. fourth\n\n- bullet')
    assert.equal(out[0].start, 3)
    assert.deepEqual(kinds(out), ['ol', 'ul'])
  })

  test('indented continuation lines belong to the previous item', () => {
    const [list] = formatAnswer('1. Visit the office with the\n   birth notification slip\n2. Pay the fee')
    assert.equal(list.items.length, 2)
    assert.equal(text(list.items[0]), 'Visit the office with the birth notification slip')
  })

  test('consecutive lines of one paragraph are joined; a blank line starts a new one', () => {
    const out = formatAnswer('First line\nsecond line.\n\nNext paragraph.')
    assert.deepEqual(out.map(b => text(b.parts)), ['First line second line.', 'Next paragraph.'])
  })

  test('empty, whitespace and non-string input give no blocks', () => {
    for (const v of ['', '   \n  ', null, undefined, 42]) assert.deepEqual(formatAnswer(v), [])
  })
})

describe('formatAnswer: citations', () => {
  test('single, grouped and adjacent citations become cite parts', () => {
    const [p] = formatAnswer('A [1] and B [1, 2] and C [2][3].', [1, 2, 3])
    assert.deepEqual(p.parts.filter(x => x.type === 'cite').map(x => x.id), [1, 1, 2, 2, 3])
  })

  test('citations to sources that were not returned are dropped, with the gap tidied', () => {
    const [p] = formatAnswer('Claim [1] and another [9].', [1])
    assert.equal(text(p.parts), 'Claim [1] and another.')
  })

  test('with no sources, bracketed numbers are removed rather than shown as dead links', () => {
    const [p] = formatAnswer('Some claim [1].', [])
    assert.ok(!p.parts.some(x => x.type === 'cite'))
    assert.equal(text(p.parts), 'Some claim.')
  })

  test('ordinary brackets that are not citations are left alone', () => {
    const [p] = formatAnswer('Use form CAC 2 [see the guide] today (2025).', [1])
    assert.equal(text(p.parts), 'Use form CAC 2 [see the guide] today (2025).')
  })
})

describe('formatAnswer: stray markdown', () => {
  test('bold is kept; backticks and block-quote markers are flattened', () => {
    const [p] = formatAnswer('> Use `form CAC 2` and **pay** the fee.', [])
    assert.deepEqual(p.parts.map(x => x.type), ['text', 'strong', 'text'])
    assert.equal(text(p.parts), 'Use form CAC 2 and pay the fee.')
  })

  test('a heading becomes a bold line, without the hashes', () => {
    const [p] = formatAnswer('## Steps\n1. First', [])
    assert.deepEqual(p.parts, [{ type: 'strong', text: 'Steps' }])
  })

  test('an unmatched ** is left as text instead of swallowing the line', () => {
    const [p] = formatAnswer('Cost is **free', [])
    assert.equal(text(p.parts), 'Cost is **free')
  })
})

describe('formatAnswer: hostile input stays inert text', () => {
  const attacks = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '[click](javascript:alert(1))',
    '</div><iframe src="https://evil.test"></iframe>',
  ]
  for (const attack of attacks) {
    test(`only text, strong and cite parts are ever produced: ${attack.slice(0, 28)}`, () => {
      const out = formatAnswer(`Intro\n- ${attack}\n\n${attack} [1]`, [1])
      const allowedBlocks = new Set(['p', 'ol', 'ul'])
      const allowedParts = new Set(['text', 'strong', 'cite'])
      for (const b of out) {
        assert.ok(allowedBlocks.has(b.type))
        for (const parts of b.parts ? [b.parts] : b.items) {
          for (const part of parts) assert.ok(allowedParts.has(part.type), part.type)
        }
      }
      // the attack text survives verbatim as a string for the page to escape
      assert.ok(JSON.stringify(out).includes(attack.replace(/"/g, '\\"')))
    })
  }

  test('very long input is truncated, not rendered without limit', () => {
    const out = formatAnswer('word '.repeat(5000), [])
    assert.ok(text(out[0].parts).length <= 5000)
  })
})
