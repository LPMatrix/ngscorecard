// Eval harness for the Q&A assistant.
//
// Two layers, scored separately (checklist item 4: retrieval quality is measured
// apart from answer quality):
//   retrieval   offline and free: does the right document / the answer-bearing
//               text come back in the top k?
//   generation  calls the model: does the answer stay grounded, cite, mention
//               the facts, and decline when the documents don't cover it?
//
// The corpus is scripts/government-data-sources.mjs, loaded into an in-memory
// database, so results depend only on the repo, not on any live database.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import Database from 'better-sqlite3'
import { addDocument, queryRAG, chunkText } from '../../server/rag.js'
import { hasUsableSources, MIN_COVERAGE } from '../../server/ragPrompt.js'
import { synthesize } from '../../server/ragAnswer.js'
import { governmentDocuments, stateServices } from '../../scripts/government-data-sources.mjs'

const here = dirname(fileURLToPath(import.meta.url))
export const DATASET_PATH = join(here, 'dataset.json')
export const BASELINE_PATH = join(here, 'baseline.json')

export const loadDataset = () => JSON.parse(readFileSync(DATASET_PATH, 'utf8'))
export const loadBaseline = () => JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
export const corpusDocuments = () => [...governmentDocuments, ...stateServices]

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ')
const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const quantile = (xs, q) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]
}

export async function buildCorpusDb(docs = corpusDocuments()) {
  const db = new Database(':memory:')
  db.prepare(`CREATE TABLE rag_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL,
    title TEXT NOT NULL, url TEXT, content TEXT NOT NULL, fetched_at TEXT NOT NULL, updated_at TEXT NOT NULL)`).run()
  db.prepare(`CREATE TABLE rag_chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL,
    text TEXT NOT NULL, embedding TEXT, token_count INTEGER, section TEXT, chunk_index INTEGER,
    created_at TEXT NOT NULL)`).run()
  for (const doc of docs) await addDocument(db, doc)
  return db
}

// --- retrieval --------------------------------------------------------------

export async function runRetrieval({ db, dataset = loadDataset(), docs = corpusDocuments() } = {}) {
  const k = dataset.k ?? 5
  const bySource = new Map(docs.map(d => [d.source, d]))
  const chunkTexts = new Map(docs.map(d => [d.source, chunkText(d.content).map(c => norm(c.text))]))

  const cases = []
  for (const c of dataset.cases) {
    const { results } = await queryRAG(db, c.question, k)
    const topCoverage = results[0]?.coverage ?? 0
    const usable = hasUsableSources(results)

    if (c.type === 'unanswerable') {
      cases.push({ id: c.id, type: c.type, category: c.category, question: c.question, topCoverage, usable,
        top: results[0]?.source ?? null })
      continue
    }

    const wanted = new Set(c.expectedSources)
    const rankIndex = results.findIndex(r => wanted.has(r.source))
    const evidence = norm(c.evidence)
    const evidenceFound = results.some(r => norm(r.text).includes(evidence))

    // Evidence that exists in an expected document but in none of that
    // document's chunks was lost at ingestion; ranking can't recover it.
    const holders = c.expectedSources
      .map(s => bySource.get(s))
      .filter(d => d && norm(d.content).includes(evidence))
    const chunkingLoss = holders.length > 0 &&
      holders.every(d => !chunkTexts.get(d.source).some(t => t.includes(evidence)))

    cases.push({
      id: c.id, type: c.type, category: c.category, question: c.question,
      rank: rankIndex === -1 ? null : rankIndex + 1,
      evidenceFound, chunkingLoss, topCoverage, usable,
      got: results.map(r => r.source),
      expected: c.expectedSources,
    })
  }

  return { k, cases, summary: summarizeRetrieval(cases, k) }
}

function summarizeRetrieval(cases, k) {
  const ans = cases.filter(c => c.type === 'answerable')
  const unans = cases.filter(c => c.type === 'unanswerable')
  const hit = (n) => mean(ans.map(c => (c.rank !== null && c.rank <= n ? 1 : 0)))

  const group = (list) => ({
    n: list.length,
    hitAt1: round(mean(list.map(c => (c.rank === 1 ? 1 : 0)))),
    hitAtK: round(mean(list.map(c => (c.rank !== null ? 1 : 0)))),
    mrr: round(mean(list.map(c => (c.rank ? 1 / c.rank : 0)))),
    evidenceAtK: round(mean(list.map(c => (c.evidenceFound ? 1 : 0)))),
  })

  const categories = {}
  for (const name of new Set(ans.map(c => c.category))) {
    categories[name] = group(ans.filter(c => c.category === name))
  }

  // How a coverage floor would trade answerable questions kept against
  // unanswerable questions stopped before the model is called.
  const answerCov = ans.map(c => c.topCoverage)
  const unansCov = unans.map(c => c.topCoverage)
  const floors = [MIN_COVERAGE, 0.2, 0.3, 0.4, 0.5].map(f => ({
    floor: f,
    answerableKept: round(mean(answerCov.map(v => (v >= f ? 1 : 0))), 2),
    unanswerableBlocked: round(mean(unansCov.map(v => (v < f ? 1 : 0))), 2),
  }))

  return {
    k,
    answerable: ans.length,
    unanswerable: unans.length,
    hitAt1: round(hit(1)),
    hitAt3: round(hit(3)),
    hitAt5: round(hit(5)),
    mrr: round(mean(ans.map(c => (c.rank ? 1 / c.rank : 0)))),
    evidenceAt5: round(mean(ans.map(c => (c.evidenceFound ? 1 : 0)))),
    chunkingLosses: ans.filter(c => c.chunkingLoss).length,
    unanswerableBlockedAtFloor: round(mean(unans.map(c => (c.usable ? 0 : 1)))),
    answerableBlockedAtFloor: round(mean(ans.map(c => (c.usable ? 0 : 1)))),
    coverage: {
      answerable: { min: round(Math.min(...answerCov), 2), median: round(quantile(answerCov, 0.5), 2) },
      unanswerable: { median: round(quantile(unansCov, 0.5), 2), max: round(Math.max(...unansCov), 2) },
    },
    floors,
    categories,
  }
}

// Metrics the gate protects. A drop below the committed baseline fails.
export const GATED_METRICS = ['hitAt5', 'mrr', 'evidenceAt5']

export function compareToBaseline(summary, baseline = loadBaseline()) {
  const failures = []
  for (const metric of GATED_METRICS) {
    const floor = baseline.retrieval?.[metric]
    if (floor === undefined) continue
    if (summary[metric] + 1e-9 < floor) {
      failures.push({ metric, baseline: floor, actual: summary[metric] })
    }
  }
  return failures
}

// --- generation -------------------------------------------------------------

const mentions = (answer, requirement) =>
  requirement.split('|').some(alt => norm(answer).includes(norm(alt)))

export async function runGeneration({ db, client, dataset = loadDataset(), only = null } = {}) {
  const k = dataset.k ?? 5
  const out = []
  let promptTokens = 0
  let completionTokens = 0
  let calls = 0

  for (const c of dataset.cases) {
    if (only && !only.includes(c.id)) continue
    const { results } = await queryRAG(db, c.question, k)

    if (!hasUsableSources(results)) {
      // Blocked before the model: correct for unanswerable, a miss otherwise.
      out.push({ id: c.id, type: c.type, category: c.category, question: c.question, blocked: true,
        pass: c.type === 'unanswerable', problems: c.type === 'unanswerable' ? [] : ['blocked before the model'] })
      continue
    }

    const parsed = await synthesize(client, c.question, results)
    calls++
    promptTokens += parsed.usage?.prompt_tokens ?? 0
    completionTokens += parsed.usage?.completion_tokens ?? 0
    const problems = []

    if (c.type === 'unanswerable') {
      if (parsed.grounded) {
        const hits = (c.forbidden ?? []).filter(p => new RegExp(p, 'i').test(parsed.answer))
        if (!c.forbidden?.length) problems.push('answered a question the documents do not cover')
        else if (hits.length) problems.push(`stated something the documents do not contain (matched ${hits.join(', ')})`)
      }
    } else {
      if (!parsed.grounded) problems.push('said it could not find the answer')
      else {
        if (!parsed.cited) problems.push('no valid citation')
        else if (!parsed.sources.some(s => c.expectedSources.includes(s.source))) {
          problems.push(`cited ${parsed.sources.map(s => s.source).join(', ')} instead of ${c.expectedSources.slice(0, 3).join('/')}`)
        }
        for (const m of c.answerMentions ?? []) {
          if (!mentions(parsed.answer, m)) problems.push(`answer does not mention "${m}"`)
        }
      }
    }

    out.push({
      id: c.id, type: c.type, category: c.category, question: c.question,
      blocked: false, grounded: parsed.grounded, cited: parsed.cited,
      answer: parsed.answer, pass: problems.length === 0, problems,
    })
  }

  const answerable = out.filter(r => r.type === 'answerable')
  const unanswerable = out.filter(r => r.type === 'unanswerable')
  return {
    cases: out,
    summary: {
      answerable: answerable.length,
      unanswerable: unanswerable.length,
      answerablePass: round(mean(answerable.map(r => (r.pass ? 1 : 0)))),
      unanswerablePass: round(mean(unanswerable.map(r => (r.pass ? 1 : 0)))),
      citedRate: round(mean(answerable.filter(r => !r.blocked && r.grounded).map(r => (r.cited ? 1 : 0)))),
      modelCalls: calls,
      promptTokens,
      completionTokens,
    },
  }
}
