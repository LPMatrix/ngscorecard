/**
 * Promise Classifier — AI-powered promise intake and contradiction detection
 * Categorizes new promises, finds similar historical promises, flags contradictions
 */

import { eq } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'
import { chatJson, DEFAULT_MODEL } from './openrouter.js'

// Override with AI_TOOLS_MODEL (an OpenRouter model id) without a code change.
const MODEL = process.env.AI_TOOLS_MODEL || DEFAULT_MODEL

/**
 * Classify a new promise
 * Returns: { suggested_category, similar_promises, contradictions, confidence, reasoning }
 */
export async function classifyPromise(administration, promiseText, { client } = {}) {
  // Fetch all promises from this administration for context
  const adminPromises = await db
    .select()
    .from(t.promises)
    .where(eq(t.promises.administration, administration))

  // Build the classification prompt
  const systemPrompt = `You are a government accountability specialist analyzing promises.
Your job: categorize a new government promise and identify similar historical promises and contradictions.

Categories: health, energy, infrastructure, education, security, economy, agriculture, environment, civil_service, transport, water, technology, justice

For contradictions, look for:
- Direct conflicts (incompatible targets)
- Budget conflicts (spending that doesn't add up)
- Timeline conflicts (impossible schedules)
- Policy conflicts (contradictory approaches)

Respond in JSON: {
  suggested_category: "category",
  confidence_category: "high|medium|low",
  similar_promise_ids: [id1, id2, ...],
  contradictions: [{ id, reason }],
  reasoning: "..."
}`

  const existingPromisesContext = adminPromises
    .map(p => `ID ${p.id}: "${p.title}" (${p.category}): ${p.promise}`)
    .join('\n')

  const userPrompt = `
ADMINISTRATION: ${administration}

NEW PROMISE:
${promiseText}

EXISTING PROMISES FROM THIS ADMINISTRATION:
${existingPromisesContext || '(none)'}

Classify this new promise. What category fits best? Are there similar promises already tracked? Any contradictions with existing promises?`

  const classification = await chatJson({ client, model: MODEL, maxTokens: 1024, system: systemPrompt, user: userPrompt })

  // A model can omit a field it had nothing to put in; treat that as "none".
  const similarIds = Array.isArray(classification.similar_promise_ids) ? classification.similar_promise_ids : []
  const contradictions = Array.isArray(classification.contradictions) ? classification.contradictions : []

  // Enrich with full promise objects for similar promises
  const similarPromises = adminPromises.filter(p => similarIds.includes(p.id))

  // Enrich contradictions with full promise details
  const enrichedContradictions = contradictions.map(c => {
    const promise = adminPromises.find(p => p.id === c.id)
    return {
      id: c.id,
      title: promise?.title,
      reason: c.reason
    }
  })

  return {
    suggested_category: classification.suggested_category,
    confidence_category: classification.confidence_category,
    similar_promises: similarPromises.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      status: p.status,
      promise: p.promise
    })),
    contradictions: enrichedContradictions,
    reasoning: classification.reasoning
  }
}

/**
 * Find similar promises across all administrations
 * Useful for finding historical patterns and duplicates
 */
export async function findSimilarHistoricalPromises(promiseText, limit = 5, { client } = {}) {
  // Fetch a sample of promises from all administrations
  const allPromises = await db
    .select()
    .from(t.promises)
    .limit(500) // Sample for similarity matching

  if (!allPromises.length) {
    return []
  }

  const systemPrompt = `You are analyzing promise similarity across government administrations.
Given a new promise, find the most similar promises from a historical dataset.
Return the IDs of the most similar promises (up to ${limit} matches).

Respond in JSON: { similar_ids: [id1, id2, ...] }`

  const promisesContext = allPromises
    .map(p => `ID ${p.id}: "${p.title}" (${p.administration}): ${p.promise}`)
    .join('\n')

  const userPrompt = `
NEW PROMISE:
${promiseText}

HISTORICAL PROMISES:
${promisesContext}

Which promises from history are most similar to this new one?`

  // This is a convenience lookup: a failed or unparseable model call means "no
  // suggestions", not an error for the caller.
  try {
    const result = await chatJson({ client, model: MODEL, maxTokens: 512, system: systemPrompt, user: userPrompt })
    const ids = Array.isArray(result.similar_ids) ? result.similar_ids : []
    return allPromises.filter(p => ids.includes(p.id))
  } catch (e) {
    console.warn('findSimilarHistoricalPromises:', e.message)
    return []
  }
}
