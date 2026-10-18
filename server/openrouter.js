// The one OpenRouter client for the server, and a helper for "ask the model for
// JSON" used by the promise tools. Everything that calls a model goes through
// OpenRouter with the OpenAI-compatible SDK; there is no provider SDK per
// vendor.
import OpenAI from 'openai'

// Built on first use: the SDK throws on a missing key, and doing that at import
// time takes down every /api route, not just the feature that needs the key.
let client = null
export function getOpenRouter() {
  client ??= new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://ngscorecard.ng',
      'X-Title': 'NGScorecard',
    },
  })
  return client
}

// OpenRouter ids use dots (anthropic/claude-sonnet-5.5) and are retired over
// time; check https://openrouter.ai/models. Each feature can override its own.
export const DEFAULT_MODEL = 'anthropic/claude-sonnet-5.5'

// These models think before they answer, and OpenRouter counts that thinking
// against max_tokens. At 500 tokens Haiku used all of them on reasoning and
// returned no text (shown to people as "couldn't find this"), and Sonnet was cut
// off mid-answer. For short, excerpt-grounded answers a low effort gives a
// complete reply on both and costs less. (Turning reasoning off outright is
// refused by Sonnet, so effort is the control that works everywhere.)
export const REASONING = { effort: 'low' }

// Models often wrap JSON in a code fence or add a sentence before it. Take the
// first complete {...} object (string-aware, so braces inside strings do not
// confuse it) and parse that; anything else is an error carrying the reply.
export function parseJsonReply(text) {
  const raw = String(text ?? '').trim()
  if (!raw) throw new Error('The model returned an empty reply')

  const unfenced = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  const start = unfenced.indexOf('{')
  if (start === -1) throw new Error(`The model did not return JSON: ${raw.slice(0, 300)}`)

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < unfenced.length; i++) {
    const ch = unfenced[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) {
      try {
        return JSON.parse(unfenced.slice(start, i + 1))
      } catch (e) {
        throw new Error(`The model returned invalid JSON (${e.message}): ${raw.slice(0, 300)}`)
      }
    }
  }
  throw new Error(`The model returned incomplete JSON: ${raw.slice(0, 300)}`)
}

// One system + user exchange, returning the reply text ('' if there is none). A
// failed request throws; what to do with the text is the caller's business, so
// code that wants "API errors propagate, a bad reply falls back to a default" can
// keep exactly that shape. `client` is anything with chat.completions.create (the
// OpenAI SDK shape), so it can be faked in tests; it defaults to OpenRouter.
export async function chatText({ system, user, model = DEFAULT_MODEL, maxTokens = 1024, client: c = null }) {
  const response = await (c ?? getOpenRouter()).chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature: 0,
    reasoning: REASONING,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  return response.choices?.[0]?.message?.content ?? ''
}

// The same exchange, for a reply that must be a JSON object: throws if it is not.
export async function chatJson(options) {
  return parseJsonReply(await chatText(options))
}
