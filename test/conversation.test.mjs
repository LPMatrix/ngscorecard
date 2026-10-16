import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildHistory } from '../src/lib/conversation.js'

const user = (text) => ({ type: 'user', text })
const bot = (answer, extra = {}) => ({ type: 'assistant', answer, grounded: true, ...extra })

describe('buildHistory', () => {
  test('an empty conversation sends no history', () => assert.deepEqual(buildHistory([]), []))

  test('keeps user questions and answers, in order', () => {
    assert.deepEqual(buildHistory([user('NIN?'), bot('A birth certificate.'), user('Free?')]), [
      { role: 'user', content: 'NIN?' }, { role: 'assistant', content: 'A birth certificate.' }, { role: 'user', content: 'Free?' },
    ])
  })

  test('leaves out errors and "couldn\'t find this" replies', () => {
    const out = buildHistory([user('a'), { type: 'error', text: 'Sorry' }, user('b'), bot('No luck', { grounded: false }), user('c')])
    assert.deepEqual(out.map(m => m.content), ['a', 'b', 'c'])
  })

  test('sends at most the last six messages', () => {
    const msgs = Array.from({ length: 20 }, (_, i) => (i % 2 ? bot(`a${i}`) : user(`q${i}`)))
    const out = buildHistory(msgs)
    assert.equal(out.length, 6)
    assert.equal(out.at(-1).content, 'a19')
  })

  test('caps very long answers and does not change the conversation it was given', () => {
    const msgs = [user('q'), bot('x'.repeat(5000))]
    const out = buildHistory(msgs)
    assert.equal(out[1].content.length, 800)
    assert.equal(msgs[1].answer.length, 5000)
  })
})
