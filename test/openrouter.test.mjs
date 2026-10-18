import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { parseJsonReply, chatJson, chatText, DEFAULT_MODEL } from '../server/openrouter.js'

describe('parseJsonReply', () => {
  test('plain JSON', () => {
    assert.deepEqual(parseJsonReply('{"a":1,"b":["x"]}'), { a: 1, b: ['x'] })
  })

  test('JSON inside a code fence, with or without a language tag', () => {
    assert.deepEqual(parseJsonReply('```json\n{"ok":true}\n```'), { ok: true })
    assert.deepEqual(parseJsonReply('```\n{"ok":true}\n```'), { ok: true })
  })

  test('a sentence before and after the object', () => {
    assert.deepEqual(parseJsonReply('Here is the result:\n{"suggested_status":"kept"}\nHope that helps!'), { suggested_status: 'kept' })
  })

  test('braces and escaped quotes inside strings do not end the object early', () => {
    const reply = '{"reasoning":"the article says \\"{done}\\" and } then more","n":2}'
    assert.deepEqual(parseJsonReply(reply), { reasoning: 'the article says "{done}" and } then more', n: 2 })
  })

  test('nested objects and arrays', () => {
    assert.deepEqual(parseJsonReply('{"contradictions":[{"id":3,"reason":"x"}],"o":{"p":{"q":1}}}'),
      { contradictions: [{ id: 3, reason: 'x' }], o: { p: { q: 1 } } })
  })

  test('takes the first object when there are several', () => {
    assert.deepEqual(parseJsonReply('{"a":1} and also {"b":2}'), { a: 1 })
  })

  test('empty, non-JSON and truncated replies are errors that include the reply', () => {
    for (const bad of ['', '   ', null, undefined]) assert.throws(() => parseJsonReply(bad), /empty reply/)
    assert.throws(() => parseJsonReply('I cannot help with that.'), /did not return JSON: I cannot help/)
    assert.throws(() => parseJsonReply('{"claims": ["a", "b"'), /incomplete JSON/)
    assert.throws(() => parseJsonReply('{"a": nope}'), /invalid JSON/)
  })

  test('a long non-JSON reply is truncated in the error, not echoed in full', () => {
    assert.throws(() => parseJsonReply('x'.repeat(5000)), (e) => e.message.length < 500)
  })
})

describe('chatJson', () => {
  const fake = (content, record = []) => ({
    chat: { completions: { create: async (body) => { record.push(body); return { choices: [{ message: { content } }] } } } },
  })

  test('sends a system and a user message in the OpenAI shape, deterministically', async () => {
    const record = []
    const out = await chatJson({ client: fake('{"similar_ids":[1,2]}', record), system: 'SYS', user: 'USR', maxTokens: 512 })
    assert.deepEqual(out, { similar_ids: [1, 2] })
    const body = record[0]
    assert.deepEqual(body.messages, [{ role: 'system', content: 'SYS' }, { role: 'user', content: 'USR' }])
    assert.equal(body.max_tokens, 512)
    assert.equal(body.temperature, 0)
    assert.ok(!('system' in body), 'no provider-specific top-level system field')
  })

  test('uses the OpenRouter-format default model unless one is given', async () => {
    const record = []
    await chatJson({ client: fake('{}', record), system: 's', user: 'u' })
    await chatJson({ client: fake('{}', record), system: 's', user: 'u', model: 'anthropic/claude-haiku-5.5' })
    assert.equal(record[0].model, DEFAULT_MODEL)
    assert.match(DEFAULT_MODEL, /^[a-z0-9-]+\/[a-z0-9.-]+$/, 'provider/model with dots, as OpenRouter lists them')
    assert.equal(record[1].model, 'anthropic/claude-haiku-5.5')
  })

  test('a model that returns prose instead of JSON is an error, not a silent undefined', async () => {
    await assert.rejects(chatJson({ client: fake('Sorry, I cannot.'), system: 's', user: 'u' }), /did not return JSON/)
  })

  test('an empty choices array is an error', async () => {
    const client = { chat: { completions: { create: async () => ({ choices: [] }) } } }
    await assert.rejects(chatJson({ client, system: 's', user: 'u' }), /empty reply/)
  })

  test('a failing request propagates', async () => {
    const client = { chat: { completions: { create: async () => { throw new Error('401 Missing Authentication header') } } } }
    await assert.rejects(chatJson({ client, system: 's', user: 'u' }), /401/)
  })
})

describe('chatText', () => {
  const fake = (content, record = []) => ({
    chat: { completions: { create: async (body) => { record.push(body); return { choices: content === undefined ? [] : [{ message: { content } }] } } } },
  })

  test('returns the reply text unparsed, so callers keep their own fallback logic', async () => {
    assert.equal(await chatText({ client: fake('not json at all'), system: 's', user: 'u' }), 'not json at all')
  })

  test('sends the same OpenAI-shaped request as chatJson', async () => {
    const record = []
    await chatText({ client: fake('x', record), system: 'SYS', user: 'USR', maxTokens: 256, model: 'anthropic/claude-haiku-5.5' })
    assert.deepEqual(record[0].messages, [{ role: 'system', content: 'SYS' }, { role: 'user', content: 'USR' }])
    assert.equal(record[0].max_tokens, 256)
    assert.equal(record[0].model, 'anthropic/claude-haiku-5.5')
    assert.equal(record[0].temperature, 0)
    assert.deepEqual(record[0].reasoning, { effort: 'low' })
  })

  test('no choices, or a null message, is an empty string rather than a crash', async () => {
    assert.equal(await chatText({ client: fake(undefined), system: 's', user: 'u' }), '')
    const nullMsg = { chat: { completions: { create: async () => ({ choices: [{ message: { content: null } }] }) } } }
    assert.equal(await chatText({ client: nullMsg, system: 's', user: 'u' }), '')
  })

  test('a failed request throws, so a caller can let API errors propagate', async () => {
    const failing = { chat: { completions: { create: async () => { throw new Error('503 upstream') } } } }
    await assert.rejects(chatText({ client: failing, system: 's', user: 'u' }), /503 upstream/)
  })
})
