// Checks on the corpus source itself (scripts/government-data-sources.mjs):
// the kinds of mistakes that were found in it by hand, so they cannot come back.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { governmentDocuments, stateServices } from '../scripts/government-data-sources.mjs'

const corpusDocuments = () => [...governmentDocuments, ...stateServices]

const docs = corpusDocuments()
const by = (source) => docs.find(d => d.source === source)

describe('corpus source', () => {
  test('every document has a source, title, https url and content', () => {
    for (const d of docs) {
      assert.ok(d.source && d.title && d.content, `${d.source}: missing field`)
      assert.equal(new URL(d.url).protocol, 'https:', `${d.source}: url must be https`)
    }
  })

  test('(source, title) is unique, and `replaces` never names a live title', () => {
    const keys = docs.map(d => `${d.source}|${d.title}`)
    assert.equal(new Set(keys).size, keys.length)
    for (const d of docs) {
      for (const old of d.replaces ?? []) {
        assert.ok(!docs.some(o => o.source === d.source && o.title === old), `${d.source}: replaces a title that is still in use`)
      }
    }
  })

  test("a document's heading names the same body as its title", () => {
    // The BPP page was headed "Budget Office of the Federation" while its text
    // and link said Bureau of Public Procurement.
    assert.match(by('BPP').content, /^# Bureau of Public Procurement/)
    assert.doesNotMatch(by('BPP').content, /Budget Office of the Federation/)
    assert.match(by('SERAP').content, /^# Socio-Economic Rights and Accountability Project/)
    assert.equal(by('SERAP').title, 'Socio-Economic Rights and Accountability Project (SERAP)')
    assert.ok(!by('SERAP').content.includes('Special Offences'))
  })

  test('links point at the agency they describe', () => {
    assert.equal(new URL(by('Federal Civil Service').url).host, 'fedcivilservice.gov.ng')
    assert.equal(new URL(by('SERAP').url).host, 'serap-nigeria.org')
    // the tax service's site belongs to the tax documents only
    for (const d of docs) {
      if (new URL(d.url).host.endsWith('firs.gov.ng')) assert.equal(d.source, 'FIRS', `${d.source} links to firs.gov.ng`)
    }
  })

  test('numbered lists are not interrupted by a bullet', () => {
    for (const d of docs) {
      const lines = d.content.split('\n')
      for (let i = 1; i < lines.length - 1; i++) {
        const broken = /^\s*-\s/.test(lines[i]) && /^\s*\d+\.\s/.test(lines[i - 1]) && /^\s*\d+\.\s/.test(lines[i + 1])
        assert.ok(!broken, `[${d.source}] "${lines[i].trim()}" sits inside a numbered list`)
      }
    }
  })
})
