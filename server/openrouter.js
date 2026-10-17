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

// One system + user exchange that must come back as a JSON object. `client` is
// anything with chat.completions.create (the OpenAI SDK shape), so it can be
// faked in tests; it defaults to the shared OpenRouter client.
export async function chatJson({ system, user, model = DEFAULT_MODEL, maxTokens = 1024, client: c = null }) {
  const response = await (c ?? getOpenRouter()).chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature: 0,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  return parseJsonReply(response.choices?.[0]?.message?.content)
}
