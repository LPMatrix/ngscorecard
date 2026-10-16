// The recent turns the Ask page sends along with a new question, so a follow-up
// like "And for minors?" can be understood. Errors and "couldn't find this"
// replies carry no information worth sending and are left out. The server
// checks and caps this again; the limits here only keep requests small.

const MAX_MESSAGES = 6 // three exchanges
const MAX_CHARS = 800

export function buildHistory(messages) {
  const out = []
  for (const m of messages) {
    if (m.type === 'user' && m.text) {
      out.push({ role: 'user', content: m.text })
    } else if (m.type === 'assistant' && m.answer && m.grounded !== false) {
      out.push({ role: 'assistant', content: m.answer })
    }
  }
  return out.slice(-MAX_MESSAGES).map(m => ({ ...m, content: m.content.slice(0, MAX_CHARS) }))
}
