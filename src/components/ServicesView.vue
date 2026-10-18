<script setup>
import { ref, inject, computed, nextTick, onMounted } from 'vue'
import AnswerBlocks from './AnswerBlocks.vue'
import { formatAnswer } from '../lib/formatAnswer.js'
import { buildHistory } from '../lib/conversation.js'

const t = inject('t')

const question = ref('')
const messages = ref([])
const loading = ref(false)
const messagesEnd = ref(null)

const hasResults = computed(() => messages.value.some(m => m.sources))

// "Government Service Portal, checked 18 Oct 2026" for sources read from the
// portal; nothing for the hand-written summaries, which carry no such date.
function provenance(source) {
  if (source.origin !== 'portal') return ''
  const when = source.checkedAt ? new Date(source.checkedAt) : null
  const date = when && !Number.isNaN(when.getTime())
    ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  return date ? `Government Service Portal, checked ${date}` : 'Government Service Portal'
}

// once there is a conversation, the box invites a follow-up
const placeholder = computed(() =>
  messages.value.some(m => m.type === 'assistant')
    ? 'Ask a follow-up, or a new question...'
    : 'Ask a question about a government service...')

// Starter questions are chosen by the server from the documents themselves (and
// each is checked to find its own service), so none is written here. If the
// request fails the page simply shows no starters.
const suggestions = ref([])
onMounted(async () => {
  try {
    const res = await fetch('/api/rag/suggestions')
    if (res.ok) suggestions.value = (await res.json()).suggestions ?? []
  } catch { /* no starters */ }
})

function askExample(text) {
  question.value = text
  askQuestion()
}

async function askQuestion() {
  if (!question.value.trim()) return

  const userQuestion = question.value.trim()
  const history = buildHistory(messages.value) // earlier turns only; taken before the new one is added
  question.value = ''
  loading.value = true

  // Add user message
  messages.value.push({
    type: 'user',
    text: userQuestion
  })

  try {
    const response = await fetch('/api/rag/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: userQuestion, history })
    })

    // Rate-limit and length errors carry a message the user can act on.
    if (response.status === 429 || response.status === 400) {
      const detail = await response.json().catch(() => ({}))
      messages.value.push({ type: 'error', text: detail.error || 'Please try again in a moment.' })
      loading.value = false
      return
    }
    if (!response.ok) throw new Error('Failed to get answer')

    const data = await response.json()

    // Add assistant message with answer and sources
    const sources = data.sources || []
    const answer = data.answer || 'No answer generated'
    messages.value.push({
      type: 'assistant',
      answer,
      grounded: data.grounded,
      // set when a follow-up was rewritten into a standalone question for the search
      searchedFor: data.searchedFor,
      // formal terms added to the search for everyday wording
      searchTerms: data.searchTerms ?? [],
      // parsed once here; the page renders these blocks, never the raw string
      blocks: formatAnswer(answer, sources.map(s => s.id)),
      sources
    })
  } catch (error) {
    messages.value.push({
      type: 'error',
      text: 'Sorry, I couldn\'t find an answer. Try asking about CAC registration, FIRS taxes, or government budgets.'
    })
  }

  loading.value = false
  await nextTick(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
}

// A citation like [2] in an answer jumps to that source and briefly highlights it.
const hit = ref('')
let hitTimer = null

function jumpToSource(messageIndex, id) {
  const el = document.getElementById(`srv-src-${messageIndex}-${id}`)
  if (!el) return
  const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
  hit.value = `${messageIndex}-${id}`
  clearTimeout(hitTimer)
  hitTimer = setTimeout(() => { hit.value = '' }, 2000)
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    askQuestion()
  }
}
</script>

<template>
  <div class="srv-container">
    <div class="srv-header">
      <h1>Ask about government services</h1>
      <p>Answers come from the service pages on the Government Service Portal, with the sources shown.</p>
      <p class="srv-subtitle">Ask about any service listed on <a href="https://services.gov.ng" target="_blank" rel="noopener">services.gov.ng</a>. If the portal doesn't cover it, this will say so.</p>
    </div>

    <div class="srv-chat">
      <div class="srv-messages">
        <div v-if="!messages.length" class="srv-empty">
          <div class="srv-empty-icon">💬</div>
          <p>{{ suggestions.length ? 'No questions yet. Try asking about:' : 'No questions yet.' }}</p>
          <div v-if="suggestions.length" class="srv-examples">
            <div v-for="item in suggestions" :key="item.question" class="srv-example" @click="askExample(item.question)">
              {{ item.label }}
            </div>
          </div>
        </div>

        <div v-for="(msg, i) in messages" :key="i" :class="['srv-message', msg.type]">
          <div v-if="msg.type === 'user'" class="srv-question">{{ msg.text }}</div>

          <div v-else-if="msg.type === 'error'" class="srv-error">
            {{ msg.text }}
          </div>

          <div v-else-if="msg.type === 'assistant' && msg.answer" class="srv-answer">
            <div class="srv-answer-text">
              <AnswerBlocks
                :blocks="msg.blocks"
                :source-href="(id) => `#srv-src-${i}-${id}`"
                @cite="(id) => jumpToSource(i, id)"
              />
            </div>
            <div v-if="msg.searchedFor" class="srv-searched">Searched for: {{ msg.searchedFor }}</div>
            <div v-if="msg.searchTerms && msg.searchTerms.length" class="srv-searched">Also searched: {{ msg.searchTerms.join(', ') }}</div>
            <div v-if="msg.sources && msg.sources.length > 0" class="srv-sources">
              <div class="srv-sources-header">
                {{ msg.sources.length }} source{{ msg.sources.length !== 1 ? 's' : '' }}:
              </div>
              <div
                v-for="(source, j) in msg.sources"
                :key="j"
                :id="source.id ? `srv-src-${i}-${source.id}` : undefined"
                tabindex="-1"
                :class="['srv-source-small', { hit: hit === `${i}-${source.id}` }]"
              >
                <span v-if="source.id" class="srv-source-num">[{{ source.id }}]</span>
                <span class="srv-source-badge">{{ source.source }}</span>
                <a v-if="source.url" :href="source.url" target="_blank" rel="noopener" class="srv-source-link">
                  {{ source.title }}
                </a>
                <span v-else class="srv-source-title">{{ source.title }}</span>
                <span v-if="provenance(source)" class="srv-source-meta-note">{{ provenance(source) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="srv-loading">
          <div class="srv-spinner"></div>
          <span>Searching documents...</span>
        </div>

        <div ref="messagesEnd" class="srv-end"></div>
      </div>

      <div class="srv-input-area">
        <textarea
          v-model="question"
          @keydown="handleKeydown"
          :disabled="loading"
          maxlength="500"
          :placeholder="placeholder"
          class="srv-input"
        ></textarea>
        <button
          @click="askQuestion"
          :disabled="!question.trim() || loading"
          class="srv-send-btn"
        >
          {{ loading ? 'Searching...' : 'Ask' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* One centred reading column (--col) shared by the intro, the conversation and
   the input; the backgrounds stay full width. The page scrolls normally (the
   chat used to be a fixed 100vh box inside a taller page, giving two scrollbars)
   and the input sticks to the bottom of the window. */
.srv-container {
  --col: 760px;
  min-height: calc(100dvh - 3.5rem);
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
}

.srv-header {
  padding: 2rem 1rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
}


.srv-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ink, #132a1d);
  margin: 0 0 0.5rem 0;
}

.srv-header p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.srv-subtitle a {
  color: inherit;
  text-decoration: underline;
}

.srv-subtitle {
  margin-top: 0.5rem !important;
  font-size: 0.85rem !important;
  color: #999 !important;
}

/* after the margin shorthands above, so these side margins are not reset to 0 */
.srv-header h1,
.srv-header p {
  max-width: var(--col);
  margin-left: auto;
  margin-right: auto;
}

.srv-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.srv-messages {
  flex: 1;
  width: 100%;
  max-width: var(--col);
  margin: 0 auto;
  box-sizing: border-box;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* keeps the newest message clear of the sticky input when scrolled into view */
.srv-end {
  scroll-margin-bottom: 9rem;
}

.srv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
}

.srv-empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.srv-empty p {
  margin: 0;
  color: #666;
  font-weight: 600;
}

.srv-examples {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
  max-width: 600px;
}

.srv-example {
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.srv-example:hover {
  background: var(--accent, #0a6b45);
  color: white;
  border-color: var(--accent, #0a6b45);
}

.srv-message {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.srv-message.user {
  align-self: flex-end;
  max-width: 80%;
}

.srv-question {
  background: var(--accent, #0a6b45);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.srv-message.error {
  align-self: center;
}

.srv-error {
  background: #fee;
  color: #c33;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-left: 4px solid #c33;
  font-size: 0.9rem;
}

.srv-answer {
  max-width: 100%;
  flex: 1;
}

.srv-sources-header {
  font-weight: 600;
  color: var(--ink, #132a1d);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.srv-sources {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.srv-source {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
}

.srv-source-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.srv-source-title {
  font-weight: 600;
  color: var(--ink, #132a1d);
  font-size: 0.95rem;
}

.srv-source-relevance {
  font-size: 0.8rem;
  background: var(--accent, #0a6b45);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  white-space: nowrap;
}

.srv-source-text {
  margin: 0.5rem 0;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
}

.srv-source-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #999;
}

.srv-source-name {
  font-style: italic;
}

.srv-source-link {
  color: var(--accent, #0a6b45);
  text-decoration: none;
  font-weight: 600;
}

.srv-source-link:hover {
  text-decoration: underline;
}

.srv-answer-text {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e6e6e6; /* a faint edge keeps the white card visible on the grey page */
  color: #333;
  line-height: 1.6;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.srv-sources-header {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.srv-source-meta-note {
  margin-left: auto;
  font-size: 0.75rem;
  color: #777;
  white-space: nowrap;
}

.srv-searched {
  margin: -0.4rem 0 0.9rem;
  font-size: 0.8rem;
  color: #777;
  font-style: italic;
}

.srv-source-small.hit {
  background: #e3f3ea;
  border-radius: 6px;
}

.srv-source-small:focus {
  outline: none;
}

.srv-source-small {
  display: flex;
  flex-wrap: wrap; /* the provenance note drops to its own line on narrow screens */
  align-items: center;
  gap: 0.25rem 0.75rem;
  /* side padding with a matching negative margin leaves room for the highlight */
  padding: 0.5rem 0.5rem;
  margin: 0 -0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
}

.srv-source-num {
  font-weight: 700;
  font-size: 12px;
  color: var(--g700, #006b45);
  margin-right: 6px;
}
.srv-source-badge {
  display: inline-block;
  background: var(--accent, #0a6b45);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  white-space: nowrap;
  font-weight: 600;
}

.srv-source-title {
  color: #666;
}

.srv-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #666;
  font-size: 0.9rem;
}

.srv-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top-color: var(--accent, #0a6b45);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg) }
}

.srv-input-area {
  position: sticky;
  bottom: 0;
  z-index: 5;
  /* side padding grows to centre the controls in the column */
  padding: 1rem max(1rem, calc((100% - var(--col)) / 2 + 1rem));
  background: white;
  border-top: 1px solid #ddd;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 0.75rem;
}

.srv-input {
  flex: 1;
  min-height: 50px;
  max-height: 120px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  outline: none;
}

.srv-input:focus {
  border-color: var(--accent, #0a6b45);
}

.srv-send-btn {
  flex: none;
  min-height: 50px;
  padding: 0.75rem 1.5rem;
  background: var(--accent, #0a6b45);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.srv-send-btn:hover:not(:disabled) {
  background: #054a2e;
}

.srv-send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .srv-header {
    padding: 1.5rem 1rem;
  }

  .srv-header h1 {
    font-size: 1.5rem;
  }

  .srv-message.user {
    max-width: 100%;
  }

  .srv-messages {
    padding: 1rem 0.75rem;
  }
}
</style>
