/**
 * Outcome Verifier — AI-powered fact-checking for promises
 * Takes news articles and extracts evidence supporting/contradicting promises
 */

import { eq } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'
import { chatJson, DEFAULT_MODEL } from './openrouter.js'

// Override with AI_TOOLS_MODEL (an OpenRouter model id) without a code change.
const MODEL = process.env.AI_TOOLS_MODEL || DEFAULT_MODEL

/**
 * Fact-check an article against a promise
 * Returns: { claims: [], confidence: "high"|"medium"|"low", suggested_status, reasoning, evidence_quotes: [] }
 * `client` is optional (any chat.completions client); it defaults to OpenRouter.
 */
export async function verifyPromiseOutcome(promiseId, articleText, { client } = {}) {
  // Fetch the promise
  const promise = await db.select().from(t.promises).where(eq(t.promises.id, promiseId))
  if (!promise.length) {
    throw new Error(`Promise ${promiseId} not found`)
  }

  const p = promise[0]

  // Build the fact-check prompt
  const systemPrompt = `You are a fact-checker analyzing government accountability.
Your job: extract claims from news articles about specific promises and rate evidence quality.

Analyze the article against the promise definition. Look for:
- Budget amounts mentioned
- Project completion percentages
- Deliverables completed (hospitals built, roads paved, etc.)
- Target deadlines met or missed
- Official statements about outcomes

Rate your confidence in the evidence (high/medium/low) based on:
- Source credibility (official statements > news reports > social media)
- Specificity (exact figures > vague claims)
- Recency (current reporting > old news)

Suggest a status update only if the article provides clear evidence:
- KEPT: Promise fully delivered as stated
- PARTIAL: Significant progress but incomplete
- BROKEN: Promise not met or abandoned
- IN_PROGRESS: Still being worked on with progress shown

If evidence is unclear or contradictory, say so.`

  const userPrompt = `
PROMISE:
Title: ${p.title}
Definition: ${p.promise}
Expected by: ${p.datePromised}
Current status: ${p.status}
Category: ${p.category}

ARTICLE TEXT:
${articleText}

Extract claims from the article about this promise. What does the article say about the outcome? Rate your confidence and suggest a status update if evidence is clear.

Respond in JSON: { claims: ["claim1", "claim2"], confidence: "high|medium|low", suggested_status: "kept|partial|broken|in_progress|null", reasoning: "...", evidence_quotes: ["quote1"] }`

  const result = await chatJson({ client, model: MODEL, maxTokens: 1024, system: systemPrompt, user: userPrompt })

  return {
    ...result,
    promise: {
      id: p.id,
      title: p.title,
      current_status: p.status,
    },
  }
}

/**
 * Update a promise status based on verification
 * Called after editor approves the Outcome Verifier suggestion
 */
export async function updatePromiseStatus(promiseId, newStatus, sourceUrl, note) {
  const promise = await db.select().from(t.promises).where(eq(t.promises.id, promiseId))
  if (!promise.length) {
    throw new Error(`Promise ${promiseId} not found`)
  }

  const p = promise[0]
  const oldStatus = p.status

  // Update promise
  await db
    .update(t.promises)
    .set({
      status: newStatus,
      updated: new Date().toISOString(),
    })
    .where(eq(t.promises.id, promiseId))

  // Log the change
  await db.insert(t.entryHistory).values({
    entryTable: 'promises',
    entryId: promiseId,
    administration: p.administration,
    kind: 'status_update',
    field: 'status',
    oldValue: oldStatus,
    newValue: newStatus,
    note: `Outcome verified from source: ${sourceUrl}\n${note || ''}`,
    changedAt: new Date().toISOString(),
  })

  return {
    success: true,
    promise_id: promiseId,
    old_status: oldStatus,
    new_status: newStatus,
  }
}

