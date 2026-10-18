/**
 * Lie Detector / Policy Fact-Checker
 * Given a government statement, extracts claims and cross-references against
 * the NGScorecard promise database to flag false or misleading assertions.
 */

import { chatText, parseJsonReply, DEFAULT_MODEL } from './openrouter.js'
import { eq, like, or } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

// An OpenRouter model id; override with AI_TOOLS_MODEL without a code change.
const MODEL = process.env.AI_TOOLS_MODEL || DEFAULT_MODEL

/**
 * Extract verifiable factual claims from a statement
 */
async function extractClaims(statementText) {
  const text = await chatText({
    model: MODEL,
    maxTokens: 512,
    system: `Extract verifiable factual claims from a government statement.
Focus only on claims that can be checked against a database of tracked promises and outcomes.
Look for: deliverables claimed ("we built X", "we have completed Y"), budget figures ("we spent ₦Nbn"), progress ("80% complete"), specific numbers.
Ignore: opinions, future plans, general praise.
Respond in JSON: { claims: [{ text: "exact claim", keywords: ["word1", "word2"] }] }`,
    user: statementText,
  })

  try {
    return parseJsonReply(text).claims || []
  } catch {
    return []
  }
}

/**
 * Find promises in the database relevant to a set of keywords
 */
async function findRelevantPromises(keywords, administration) {
  // Build search conditions from keywords
  const conditions = keywords.flatMap(kw => [
    like(t.promises.title, `%${kw}%`),
    like(t.promises.promise, `%${kw}%`),
    like(t.promises.category, `%${kw}%`),
  ])

  if (!conditions.length) return []

  const rows = await db
    .select()
    .from(t.promises)
    .where(
      administration
        ? eq(t.promises.administration, administration)
        : or(...conditions)
    )
    .limit(20)

  // Post-filter by keyword relevance when not scoped to one admin
  if (!administration) {
    return rows.filter(row =>
      keywords.some(kw =>
        row.title.toLowerCase().includes(kw.toLowerCase()) ||
        row.promise.toLowerCase().includes(kw.toLowerCase())
      )
    )
  }

  return rows
}

/**
 * Fact-check a single claim against retrieved promises
 */
async function factCheckClaim(claim, relevantPromises) {
  if (!relevantPromises.length) {
    return {
      claim: claim.text,
      verdict: 'unverifiable',
      reason: 'No matching promises found in NGScorecard database',
      matched_promises: [],
    }
  }

  const context = relevantPromises
    .map(p => `Promise #${p.id}: "${p.title}" — Status: ${p.status}. Promise: ${p.promise}. Assessment: ${p.assessment || 'none'}`)
    .join('\n')

  const text = await chatText({
    model: MODEL,
    maxTokens: 512,
    system: `You are fact-checking a specific claim from a government statement against tracked promise data.
Verdicts:
- "true": claim matches database evidence
- "misleading": partially true but omits key context or overstates
- "false": directly contradicts database records
- "unverifiable": insufficient data to confirm or deny

Be precise. Cite the specific promise IDs that are relevant.
Respond in JSON: { verdict: "true|misleading|false|unverifiable", reason: "...", matched_promise_ids: [id1, id2] }`,
    user: `CLAIM: "${claim.text}"\n\nNGSCORECARD RECORDS:\n${context}`,
  })

  try {
    const result = parseJsonReply(text)
    const matched = relevantPromises.filter(p => (result.matched_promise_ids || []).includes(p.id))
    return {
      claim: claim.text,
      verdict: result.verdict,
      reason: result.reason,
      matched_promises: matched.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        assessment: p.assessment,
      })),
    }
  } catch {
    return { claim: claim.text, verdict: 'unverifiable', reason: 'Parse error', matched_promises: [] }
  }
}

/**
 * Full fact-check of a government statement
 * Returns: { claims_checked, results: [{ claim, verdict, reason, matched_promises }] }
 */
export async function factCheckStatement(statementText, administration = null) {
  // Step 1: extract claims
  const claims = await extractClaims(statementText)
  if (!claims.length) {
    return { claims_checked: 0, results: [], message: 'No verifiable factual claims found in this statement.' }
  }

  // Step 2: for each claim, find relevant promises and fact-check
  const results = await Promise.all(
    claims.map(async claim => {
      const relevant = await findRelevantPromises(claim.keywords || [], administration)
      return factCheckClaim(claim, relevant)
    })
  )

  return {
    claims_checked: results.length,
    results,
    summary: {
      true: results.filter(r => r.verdict === 'true').length,
      misleading: results.filter(r => r.verdict === 'misleading').length,
      false: results.filter(r => r.verdict === 'false').length,
      unverifiable: results.filter(r => r.verdict === 'unverifiable').length,
    },
  }
}
