// synthesize(): the one call that turns excerpts into an answer. These pin the
// bug where a model that spent its whole token budget on reasoning returned no
// text and the page said "I couldn't find this".
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { synthesize, MAX_TOKENS, MODEL } from '../server/ragAnswer.js'
import { NO_ANSWER_MESSAGE } from '../server/ragPrompt.js'

const sources = [{ title: 'FRSC (Renewal)', source: 'FRSC', text: 'Pay the fee online.', coverage: 1 }]
const reply = (choice) => ({ chat: { completions: { create: async (body) => { reply.last = body; return { choices: [choice], usage: { prompt_tokens: 5, completion_tokens: 5 } } } } } })

describe('synthesize', () => {
  test('asks for a low reasoning effort and leaves room for a full answer', async () => {
    await synthesize(reply({ message: { content: 'Pay the fee online [1].' }, finish_reason: 'stop' }), 'How do I renew?', sources)
    assert.deepEqual(reply.last.reasoning, { effort: 'low' })
    assert.ok(MAX_TOKENS >= 800, `${MAX_TOKENS} tokens`)
    assert.equal(reply.last.max_tokens, MAX_TOKENS)
    assert.equal(reply.last.model, MODEL)
    assert.deepEqual(reply.last.messages.map(m => m.role), ['system', 'user'])
  })

  test('a normal reply is parsed, cited and returned with usage', async () => {
    const r = await synthesize(reply({ message: { content: 'Pay the fee online [1].' }, finish_reason: 'stop' }), 'q', sources)
    assert.equal(r.grounded, true)
    assert.equal(r.cited, true)
    assert.deepEqual(r.sources.map(s => s.id), [1])
    assert.deepEqual(r.usage, { prompt_tokens: 5, completion_tokens: 5 })
  })

  test('NOT_FOUND is still the model saying the excerpts do not answer it', async () => {
    const r = await synthesize(reply({ message: { content: 'NOT_FOUND' }, finish_reason: 'stop' }), 'q', sources)
    assert.equal(r.grounded, false)
    assert.equal(r.answer, NO_ANSWER_MESSAGE)
  })

  test('an empty reply is an error, not "no answer" (the model ran out of tokens thinking)', async () => {
    await assert.rejects(
      synthesize(reply({ message: { content: null }, finish_reason: 'length' }), 'q', sources),
      /returned no text \(finish_reason: length\)/)
    await assert.rejects(synthesize(reply({ message: { content: '   \n' }, finish_reason: 'stop' }), 'q', sources), /no text/)
    await assert.rejects(synthesize({ chat: { completions: { create: async () => ({ choices: [] }) } } }, 'q', sources), /finish_reason: unknown/)
  })

  test('a reply cut off by the token limit is still returned, with a warning', async () => {
    const orig = console.warn; let warned = ''
    console.warn = (m) => { warned = m }
    try {
      const r = await synthesize(reply({ message: { content: 'First, pay the fee [1]. Then' }, finish_reason: 'length' }), 'q', sources)
      assert.match(r.answer, /pay the fee/)
      assert.match(warned, /token limit/)
    } finally { console.warn = orig }
  })
})
