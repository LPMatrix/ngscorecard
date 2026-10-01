<script setup>
import { ref, inject, computed, nextTick } from 'vue'

const t = inject('t')

const question = ref('')
const messages = ref([])
const loading = ref(false)
const messagesEnd = ref(null)

const hasResults = computed(() => messages.value.some(m => m.sources))

async function askQuestion() {
  if (!question.value.trim()) return

  const userQuestion = question.value.trim()
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
      body: JSON.stringify({ question: userQuestion })
    })

    if (!response.ok) throw new Error('Failed to get answer')

    const data = await response.json()

    // Add assistant message with answer and sources
    messages.value.push({
      type: 'assistant',
      answer: data.answer || 'No answer generated',
      sources: data.sources || []
    })
  } catch (error) {
    messages.value.push({
      type: 'error',
      text: 'Sorry, I couldn\'t find an answer. Try asking about CAC registration, FIRS taxes, or government budgets.'
    })
  }

  loading.value = false
  await nextTick(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth' }))
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
      <h1>Ask Government</h1>
      <p>Find answers in official Nigerian government documents and announcements.</p>
      <p class="srv-subtitle">Ask about business registration, taxes, budgets, policies, and more.</p>
    </div>

    <div class="srv-chat">
      <div class="srv-messages">
        <div v-if="!messages.length" class="srv-empty">
          <div class="srv-empty-icon">💬</div>
          <p>No questions yet. Try asking:</p>
          <div class="srv-examples">
            <div class="srv-example" @click="question = 'How do I register a business with CAC?'; askQuestion()">
              How do I register a business?
            </div>
            <div class="srv-example" @click="question = 'What is the current inflation rate?'; askQuestion()">
              What is the current inflation rate?
            </div>
            <div class="srv-example" @click="question = 'Where can I find government budget information?'; askQuestion()">
              Where is the budget information?
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
              {{ msg.answer }}
            </div>
            <div v-if="msg.sources && msg.sources.length > 0" class="srv-sources">
              <div class="srv-sources-header">
                {{ msg.sources.length }} source{{ msg.sources.length !== 1 ? 's' : '' }}:
              </div>
              <div v-for="(source, j) in msg.sources" :key="j" class="srv-source-small">
                <span class="srv-source-badge">{{ source.source }}</span>
                <a v-if="source.url" :href="source.url" target="_blank" class="srv-source-link">
                  {{ source.title }}
                </a>
                <span v-else class="srv-source-title">{{ source.title }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="srv-loading">
          <div class="srv-spinner"></div>
          <span>Searching documents...</span>
        </div>

        <div ref="messagesEnd"></div>
      </div>

      <div class="srv-input-area">
        <textarea
          v-model="question"
          @keydown="handleKeydown"
          :disabled="loading"
          placeholder="Ask a question about government services, budgets, taxes..."
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
.srv-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
}

.srv-header {
  padding: 2rem;
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

.srv-subtitle {
  margin-top: 0.5rem !important;
  font-size: 0.85rem !important;
  color: #999 !important;
}

.srv-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.srv-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  max-width: 800px;
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
  border-left: 4px solid var(--accent, #0a6b45);
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

.srv-source-small {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  font-size: 0.85rem;
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
  padding: 1rem;
  background: white;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 0.5rem;
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
  .srv-container {
    height: auto;
    min-height: 100vh;
  }

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
    padding: 0.5rem;
  }
}
</style>
