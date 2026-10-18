// The one place a grounded answer is produced from retrieved sources. Used by
// the HTTP route and by the eval harness, so what the evals score is exactly
// what users get.
import { buildMessages, parseAnswer } from './ragPrompt.js'
import { REASONING } from './openrouter.js'

// OpenRouter retires model ids (the previous default, anthropic/claude-3-5-sonnet,
// is no longer listed and every answer failed with a 503), so the id can be
// overridden with RAG_MODEL without a code change. Check ids at
// https://openrouter.ai/models.
export const MODEL = process.env.RAG_MODEL || 'anthropic/claude-sonnet-5.5'
// room for a full answer; the model's own reasoning is capped by REASONING, not by this
export const MAX_TOKENS = 1200

// `client` is anything exposing chat.completions.create (OpenAI SDK shape).
// Returns the parsed answer plus the provider's token usage for cost tracking.
export async function synthesize(client, question, sources, history = []) {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.2,
    reasoning: REASONING,
    messages: buildMessages(question, sources, history),
  })

  const choice = response.choices?.[0]
  const text = choice?.message?.content
  // An empty reply is a failure to answer, not the model saying the documents do
  // not cover the question; parsing it as "no answer" told people a service was
  // missing when the model had simply run out of tokens.
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(`The model returned no text (finish_reason: ${choice?.finish_reason ?? 'unknown'})`)
  }
  if (choice.finish_reason === 'length') console.warn('The model hit the token limit; the answer may be cut off')

  return {
    ...parseAnswer(text, sources),
    usage: response.usage ?? null,
  }
}
