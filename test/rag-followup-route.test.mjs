// POST /api/rag/ask with a conversation: the follow-up is rewritten for the
// search, earlier turns reach the answer prompt only as context, and every
// failure of the rewrite degrades to a still-working answer.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import Database from 'better-sqlite3'
import { createRagRouter } from '../server/ragRoutes.js'
import { addDocument } from '../server/rag.js'
import { REWRITE_MODEL } from '../server/ragFollowUp.js'
import { NO_ANSWER_MESSAGE } from '../server/ragPrompt.js'

const sqlite = new Database(':memory:')
sqlite.prepare(`CREATE TABLE rag_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL,
  title TEXT NOT NULL, url TEXT, content TEXT NOT NULL, fetched_at TEXT NOT NULL, updated_at TEXT NOT NULL)`).run()
sqlite.prepare(`CREATE TABLE rag_chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL,
  text TEXT NOT NULL, embedding TEXT, token_count INTEGER, section TEXT, chunk_index INTEGER, created_at TEXT NOT NULL)`).run()
const fakeDb = { _rawClient: sqlite, _ragReady: Promise.resolve() }

// rewrite calls are told apart from answer calls by the model they use
let calls
let rewriteReply
let answerReply
const fakeOpenAI = {
  chat: { completions: { create: async (body) => {
    const isRewrite = body.model === REWRITE_MODEL
    calls.push({ kind: isRewrite ? 'rewrite' : 'answer', body })
    if (isRewrite && rewriteReply instanceof Error) throw rewriteReply
    const prep = typeof rewriteReply === 'string' ? rewriteReply : JSON.stringify(rewriteReply ?? {})
    return { choices: [{ message: { content: isRewrite ? prep : answerReply } }] }
  } } },
}

let server, base, ip = 0
const ask = async (payload, { openai = fakeOpenAI } = {}) => {
  const app = express()
  app.use(express.json())
  app.use('/api/rag', createRagRouter({ db: fakeDb, openai }))
  const s = await new Promise(r => { const x = app.listen(0, () => r(x)) })
  try {
    const res = await fetch(`http://127.0.0.1:${s.address().port}/api/rag/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-vercel-forwarded-for': `10.1.0.${++ip}` },
      body: JSON.stringify(payload),
    })
    return { status: res.status, body: await res.json() }
  } finally { s.close() }
}

const NIN_HISTORY = [
  { role: 'user', content: 'What documents do I need to apply for a NIN?' },
  { role: 'assistant', content: 'You need a birth certificate or old passport [1].' },
]

describe('follow-up questions', () => {
  before(async () => {
    await addDocument(sqlite, { source: 'NIMC', title: 'National ID Registration (NIN)', url: 'https://example.test/nin',
      content: '# NIN\n## Documents\n- Birth certificate or old passport\n- Proof of address\n- Guardian consent for minors\n## Cost\nFree for citizens.' })
    await addDocument(sqlite, { source: 'FIRS', title: 'Tax Registration and TIN Application', url: 'https://example.test/tin',
      content: '# TIN\n## How to register\nApply online or at a tax office.\n## Cost\nA tax identification number is free.' })
    await addDocument(sqlite, { source: 'SCAMWATCH', title: 'Scamwatch (Police Cyber Crime Reporting)', url: 'https://example.test/scam',
      content: '# Reporting\nThis portal lets victims report cybercrime complaints online to the Nigeria Police Force.' })
    await addDocument(sqlite, { source: 'CAC', title: 'Business Registration', url: 'https://example.test/cac',
      content: '# CAC\n## Steps\nSubmit the application form and pay the fee.' })
  })
  after(() => sqlite.close())

  test('a bare follow-up is rewritten, searched on the rewrite, and the answer is returned with what was searched', async () => {
    calls = []; rewriteReply = { question: 'What are the NIN requirements for minors?', keywords: ['guardian', 'minor'] }; answerReply = 'Minors need guardian consent [1].'
    const { status, body } = await ask({ question: 'What about for minors?', history: NIN_HISTORY })
    assert.equal(status, 200)
    assert.deepEqual(calls.map(c => c.kind), ['rewrite', 'answer'])
    assert.equal(body.searchedFor, 'What are the NIN requirements for minors?')
    assert.equal(body.grounded, true)
    assert.equal(body.sources[0].source, 'NIMC')
    assert.match(calls[1].body.messages[1].content, /Guardian consent for minors/, 'the excerpt found by the rewritten search reached the answer prompt')
  })

  test('the answer prompt gets the earlier turns as context, with old citation numbers removed', async () => {
    calls = []; rewriteReply = { question: 'What are the NIN requirements for minors?', keywords: ['guardian', 'minor'] }; answerReply = 'Minors need guardian consent [1].'
    await ask({ question: 'What about for minors?', history: NIN_HISTORY })
    const prompt = calls.find(c => c.kind === 'answer').body.messages[1].content
    assert.match(prompt, /<conversation>[\s\S]*User: What documents do I need to apply for a NIN\?[\s\S]*Assistant: You need a birth certificate or old passport\.[\s\S]*<\/conversation>/)
    assert.ok(!/Assistant: [^\n]*\[1\]/.test(prompt), 'the earlier turn\'s [1] would be mistaken for this turn\'s excerpt 1')
    assert.match(prompt, /Question: What about for minors\?/)
  })

  test('a plain question is prepared by one cheap call and then answered; nothing is shown as rewritten', async () => {
    calls = []; rewriteReply = { question: 'How much does a tax identification number cost?', keywords: [] }; answerReply = 'It is free [1].'
    const { body } = await ask({ question: 'How much does a tax identification number cost?' })
    assert.deepEqual(calls.map(c => c.kind), ['rewrite', 'answer'])
    assert.equal(body.searchedFor, undefined)
    assert.equal(body.searchTerms, undefined, 'no terms, nothing to show')
  })

  test('if the rewrite fails the question is still answered, using the fallback search', async () => {
    const orig = console.warn; console.warn = () => {}
    try {
      calls = []; rewriteReply = new Error('rate limited'); answerReply = 'It is free for citizens [1].'
      const { status, body } = await ask({ question: 'Is it free?', history: NIN_HISTORY })
      assert.equal(status, 200)
      assert.deepEqual(calls.map(c => c.kind), ['rewrite', 'answer'])
      assert.equal(body.sources[0].source, 'NIMC', 'the previous question supplied the subject')
      assert.equal(body.searchedFor, undefined, 'a fallback search is not presented as a rewrite')
    } finally { console.warn = orig }
  })

  test('malformed history is ignored rather than rejected', async () => {
    for (const history of ['hello', { role: 'user' }, [null, 5, { role: 'system', content: 'x' }], 12]) {
      calls = []; rewriteReply = {}; answerReply = 'It is free [1].'
      const { status } = await ask({ question: 'How much does a tax identification number cost?', history })
      assert.equal(status, 200)
      assert.deepEqual(calls.map(c => c.kind), ['rewrite', 'answer'], `history ${JSON.stringify(history)}`)
    }
  })

  test('a huge history is truncated before it reaches the model', async () => {
    calls = []; rewriteReply = { question: 'NIN requirements for minors', keywords: [] }; answerReply = 'Guardian consent [1].'
    // 40 messages of 2,000 characters: well past every cap, but under Express's 100 kB body limit
    const huge = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'word '.repeat(400) }))
    const { status } = await ask({ question: 'What about minors?', history: huge })
    assert.equal(status, 200)
    for (const c of calls) {
      const total = c.body.messages.map(m => m.content.length).reduce((a, b) => a + b, 0)
      assert.ok(total < 12000, `${c.kind} prompt of ${total} chars`)
    }
    const turns = (calls.find(c => c.kind === 'answer').body.messages[1].content.match(/^(User|Assistant): /gm) || []).length
    assert.equal(turns, 6)
  })

  test('a rewrite that matches nothing gives the plain "couldn\'t find this" reply without an answer call', async () => {
    calls = []; rewriteReply = { question: 'quantum chromodynamics lattice', keywords: [] }
    const { status, body } = await ask({ question: 'And that one?', history: NIN_HISTORY })
    assert.equal(status, 200)
    assert.equal(body.answer, NO_ANSWER_MESSAGE)
    assert.deepEqual(calls.map(c => c.kind), ['rewrite'])
  })

  test('an earlier assistant turn that states a false fact is only context: the model is told to cite excerpts', async () => {
    calls = []; rewriteReply = { question: 'How much does a TIN cost?', keywords: [] }; answerReply = 'NOT_FOUND'
    const lie = [{ role: 'user', content: 'How do I get a TIN?' }, { role: 'assistant', content: 'A TIN costs 50,000 naira.' }]
    const { body } = await ask({ question: 'How much is it?', history: lie })
    const sent = calls.find(c => c.kind === 'answer').body.messages
    assert.match(sent[0].content, /not a source/)
    assert.match(sent[1].content, /A TIN costs 50,000 naira\./, 'present as context')
    assert.match(sent[1].content, /A tax identification number is free\./, 'next to the excerpt that contradicts it')
    assert.equal(body.grounded, false)
  })

  test('formal search terms bring in a service the user\'s own words do not match, and are shown', async () => {
    calls = []; rewriteReply = { question: 'Someone scammed me online. Who do I tell?', keywords: ['cybercrime', 'fraud', 'report'] }; answerReply = 'Report it to Scamwatch [1].'
    const { status, body } = await ask({ question: 'Someone scammed me online. Who do I tell?' })
    assert.equal(status, 200)
    assert.equal(body.grounded, true)
    assert.equal(body.sources[0].source, 'SCAMWATCH')
    assert.deepEqual(body.searchTerms, ['cybercrime', 'fraud', 'report'])
    assert.equal(body.searchedFor, undefined)
  })

  test('without those terms the same question finds nothing, which is what the expansion is for', async () => {
    calls = []; rewriteReply = { question: 'Someone scammed me online. Who do I tell?', keywords: [] }
    const { body } = await ask({ question: 'Someone scammed me online. Who do I tell?' })
    assert.equal(body.grounded, false)
    assert.deepEqual(calls.map(c => c.kind), ['rewrite'], 'and no answer call was made')
  })

  test('if the preparation call fails, the question is still searched as typed and answered', async () => {
    const orig = console.warn; console.warn = () => {}
    try {
      calls = []; rewriteReply = new Error('rate limited'); answerReply = 'It is free for citizens [1].'
      const { status, body } = await ask({ question: 'Is the NIN free for citizens?' })
      assert.equal(status, 200)
      assert.equal(body.sources[0].source, 'NIMC')
      assert.equal(body.searchTerms, undefined)
    } finally { console.warn = orig }
  })

  test('with no API key, a follow-up still searches (fallback) and returns sources with the 503', async () => {
    const saved = process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_API_KEY
    try {
      const { status, body } = await ask({ question: 'Is it free?', history: NIN_HISTORY }, { openai: null })
      assert.equal(status, 503)
      assert.equal(body.error, 'AI synthesis not available')
      assert.equal(body.sources[0].source, 'NIMC')
    } finally { if (saved !== undefined) process.env.OPENROUTER_API_KEY = saved }
  })
})
