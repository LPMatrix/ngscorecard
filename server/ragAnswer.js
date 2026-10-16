// The one place a grounded answer is produced from retrieved sources. Used by
// the HTTP route and by the eval harness, so what the evals score is exactly
// what users get.
import { buildMessages, parseAnswer } from './ragPrompt.js'

// OpenRouter retires model ids (the previous default, anthropic/claude-3-5-sonnet,
// is no longer listed and every answer failed with a 503), so the id can be
// overridden with RAG_MODEL without a code change. Check ids at
// https://openrouter.ai/models.
export const MODEL = process.env.RAG_MODEL || 'anthropic/claude-sonnet-5.5'
export const MAX_TOKENS = 500

// `client` is anything exposing chat.completions.create (OpenAI SDK shape).
// Returns the parsed answer plus the provider's token usage for cost tracking.
export async function synthesize(client, question, sources) {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.2,
    messages: buildMessages(question, sources),
  })

  return {
    ...parseAnswer(response.choices?.[0]?.message?.content, sources),
    usage: response.usage ?? null,
  }
}
