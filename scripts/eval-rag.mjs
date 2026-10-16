#!/usr/bin/env node
// Scores the Q&A assistant against evals/rag/dataset.json.
//
//   npm run eval:rag                     retrieval only: offline, free, fast
//   npm run eval:rag -- --generate       also call the model (needs OPENROUTER_API_KEY)
//   npm run eval:rag -- --write-baseline accept the current retrieval scores as the new floor
//   npm run eval:rag -- --verbose        list every case, not only failures
//
// Exits 1 when a gated retrieval metric falls below evals/rag/baseline.json
// (or, with --generate, when any generation case fails), so it can block a deploy.
import { writeFileSync } from 'node:fs'
import OpenAI from 'openai'
import {
  buildCorpusDb, runRetrieval, runGeneration, compareToBaseline,
  loadBaseline, loadDataset, BASELINE_PATH, GATED_METRICS,
} from '../evals/rag/lib.mjs'

const args = new Set(process.argv.slice(2))
const pct = (n) => `${Math.round(n * 100)}%`.padStart(4)

const dataset = loadDataset()
const db = await buildCorpusDb()
const retrieval = await runRetrieval({ db, dataset })
const s = retrieval.summary

console.log(`\nRetrieval  (${s.answerable} answerable, ${s.unanswerable} unanswerable, k=${s.k})`)
console.log(`  hit@1 ${pct(s.hitAt1)}   hit@3 ${pct(s.hitAt3)}   hit@5 ${pct(s.hitAt5)}   MRR ${s.mrr}`)
console.log(`  answer text in retrieved chunks (evidence@5): ${pct(s.evidenceAt5)}`)
console.log(`  evidence lost at chunking, unrecoverable by ranking: ${s.chunkingLosses} case(s)`)

console.log('\n  by category          n   hit@1  hit@5   MRR   evidence@5')
for (const [name, g] of Object.entries(s.categories)) {
  console.log(`  ${name.padEnd(18)} ${String(g.n).padStart(3)}   ${pct(g.hitAt1)}   ${pct(g.hitAtK)}   ${g.mrr.toFixed(2)}   ${pct(g.evidenceAtK)}`)
}

console.log('\nCoverage floor (best result\'s share of the question\'s vocabulary)')
console.log(`  answerable   min ${s.coverage.answerable.min}  median ${s.coverage.answerable.median}`)
console.log(`  unanswerable median ${s.coverage.unanswerable.median}  max ${s.coverage.unanswerable.max}`)
console.log('  floor   answerable kept   unanswerable stopped before the model')
for (const f of s.floors) {
  console.log(`  ${String(f.floor).padEnd(6)}  ${pct(f.answerableKept).padStart(8)}          ${pct(f.unanswerableBlocked)}`)
}

const misses = retrieval.cases.filter(c => c.type === 'answerable' && (c.rank === null || !c.evidenceFound))
const leaks = retrieval.cases.filter(c => c.type === 'unanswerable' && c.usable)
if (args.has('--verbose') || misses.length) {
  console.log(`\nRetrieval misses (${misses.length})`)
  for (const c of misses) {
    const why = c.chunkingLoss ? 'evidence lost at chunking' : c.rank === null ? 'right document not in top 5' : 'document found, answer text not in chunks'
    console.log(`  ${c.id.padEnd(20)} [${c.category}] ${why}`)
    console.log(`      "${c.question}"  expected ${c.expected.slice(0, 3).join('/')}  got ${c.got.slice(0, 3).join(', ') || '(nothing)'}`)
  }
}
if (args.has('--verbose')) {
  console.log(`\nUnanswerable questions that reach the model (${leaks.length})`)
  for (const c of leaks) console.log(`  ${c.id.padEnd(16)} coverage ${c.topCoverage}  top: ${c.top}`)
}

let failed = false

if (args.has('--write-baseline')) {
  const baseline = { note: 'Floor for the offline retrieval gate. Regenerate with --write-baseline only when a drop is understood and accepted.',
    retrieval: Object.fromEntries(GATED_METRICS.map(m => [m, s[m]])) }
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n')
  console.log(`\nBaseline written: ${GATED_METRICS.map(m => `${m} ${s[m]}`).join(', ')}`)
} else {
  const regressions = compareToBaseline(s, loadBaseline())
  if (regressions.length) {
    failed = true
    console.log('\nREGRESSION against baseline:')
    for (const r of regressions) console.log(`  ${r.metric}: ${r.actual} < ${r.baseline}`)
  } else {
    console.log('\nBaseline: OK (no gated metric below its floor)')
  }
}

if (args.has('--generate')) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('\n--generate needs OPENROUTER_API_KEY (set it in .env).')
    process.exit(2)
  }
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: { 'HTTP-Referer': 'https://ngscorecard.ng', 'X-Title': 'NGScorecard eval' },
  })
  console.log('\nGeneration  (calls the model; this costs money)')
  const gen = await runGeneration({ db, client, dataset })
  const g = gen.summary
  console.log(`  answerable cases correct:   ${pct(g.answerablePass)}  (${g.answerable} cases)`)
  console.log(`  unanswerable handled right: ${pct(g.unanswerablePass)}  (${g.unanswerable} cases)`)
  console.log(`  answers carrying a citation: ${pct(g.citedRate)}`)
  console.log(`  model calls ${g.modelCalls}, tokens in ${g.promptTokens} / out ${g.completionTokens}`)
  const bad = gen.cases.filter(c => !c.pass)
  for (const c of bad) {
    console.log(`  FAIL ${c.id} [${c.category}]  "${c.question}"`)
    for (const p of c.problems) console.log(`       - ${p}`)
    if (c.answer && args.has('--verbose')) console.log(`       answer: ${c.answer.slice(0, 240)}`)
  }
  if (bad.length) failed = true
}

console.log('')
process.exit(failed ? 1 : 0)
