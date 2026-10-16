<template>
  <div class="outcome-verifier">
    <div v-if="!verification" class="form-section">
      <h2>Verify Promise Outcome</h2>
      <p class="subtitle">Check a news article against a promise and suggest a status update.</p>

      <form @submit.prevent="handleVerify">
        <div class="form-group">
          <label for="promiseId">Promise ID</label>
          <input
            v-model.number="promiseId"
            id="promiseId"
            type="number"
            placeholder="e.g., 142"
            required
          />
        </div>

        <div class="form-group">
          <label>Article Source</label>
          <div class="radio-group">
            <label>
              <input v-model="inputType" type="radio" value="text" />
              Paste article text
            </label>
            <label>
              <input v-model="inputType" type="radio" value="url" />
              Article URL
            </label>
          </div>
        </div>

        <div class="form-group">
          <label v-if="inputType === 'text'" for="articleText">Article Text</label>
          <label v-else for="articleUrl">Article URL</label>
          <textarea
            v-if="inputType === 'text'"
            v-model="articleText"
            id="articleText"
            placeholder="Paste the article text here..."
            rows="8"
            required
          />
          <input
            v-else
            v-model="articleUrl"
            id="articleUrl"
            type="url"
            placeholder="https://example.com/article"
            required
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Verifying...' : 'Verify Promise' }}
        </button>

        <div v-if="error" class="error-message">{{ error }}</div>
      </form>
    </div>

    <div v-else class="results-section">
      <button @click="resetForm" class="back-button">← Start Over</button>

      <h3>{{ verification.promise.title }}</h3>
      <div class="promise-info">
        <span class="status-badge" :class="verification.promise.current_status">
          {{ verification.promise.current_status }}
        </span>
      </div>

      <div class="verification-result">
        <div class="confidence-box" :class="verification.confidence.toLowerCase()">
          <strong>Confidence:</strong> {{ verification.confidence }}
        </div>

        <div class="section">
          <h4>Suggested Status</h4>
          <p class="suggested-status">{{ verification.suggested_status || 'No clear evidence' }}</p>
        </div>

        <div class="section">
          <h4>Reasoning</h4>
          <p>{{ verification.reasoning }}</p>
        </div>

        <div v-if="verification.claims && verification.claims.length" class="section">
          <h4>Extracted Claims</h4>
          <ul class="claims-list">
            <li v-for="(claim, i) in verification.claims" :key="i">{{ claim }}</li>
          </ul>
        </div>

        <div v-if="verification.evidence_quotes && verification.evidence_quotes.length" class="section">
          <h4>Evidence Quotes</h4>
          <blockquote v-for="(quote, i) in verification.evidence_quotes" :key="i" class="quote">
            "{{ quote }}"
          </blockquote>
        </div>

        <div v-if="verification.suggested_status" class="approval-section">
          <p>Approve this status update?</p>
          <form @submit.prevent="handleApprove" class="approval-form">
            <div class="form-group">
              <label for="sourceUrl">Source URL (optional)</label>
              <input
                v-model="sourceUrl"
                id="sourceUrl"
                type="url"
                placeholder="https://..."
              />
            </div>

            <div class="form-group">
              <label for="note">Note (optional)</label>
              <textarea
                v-model="note"
                id="note"
                placeholder="Additional context..."
                rows="3"
              />
            </div>

            <div class="button-group">
              <button type="submit" :disabled="approvingLoading" class="approve-btn">
                {{ approvingLoading ? 'Saving...' : 'Approve & Save' }}
              </button>
              <button type="button" @click="resetForm" class="cancel-btn">Cancel</button>
            </div>

            <div v-if="approveError" class="error-message">{{ approveError }}</div>
            <div v-if="approveSuccess" class="success-message">
              ✓ Promise #{{ promiseId }} updated to {{ verification.suggested_status }}
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const promiseId = ref(null)
const inputType = ref('text')
const articleText = ref('')
const articleUrl = ref('')
const sourceUrl = ref('')
const note = ref('')

const loading = ref(false)
const approvingLoading = ref(false)
const error = ref('')
const approveError = ref('')
const approveSuccess = ref(false)
const verification = ref(null)

async function handleVerify() {
  error.value = ''
  loading.value = true

  try {
    const payload = {
      promiseId: promiseId.value,
      ...(inputType.value === 'text' ? { articleText: articleText.value } : { articleUrl: articleUrl.value }),
    }

    const response = await fetch('/api/outcome/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Verification failed')
    }

    verification.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleApprove() {
  approveError.value = ''
  approveSuccess.value = false
  approvingLoading.value = true

  try {
    const response = await fetch('/api/outcome/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promiseId: promiseId.value,
        newStatus: verification.value.suggested_status,
        sourceUrl: sourceUrl.value || undefined,
        note: note.value || undefined,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Save failed')
    }

    approveSuccess.value = true
    setTimeout(() => resetForm(), 2000)
  } catch (err) {
    approveError.value = err.message
  } finally {
    approvingLoading.value = false
  }
}

function resetForm() {
  promiseId.value = null
  articleText.value = ''
  articleUrl.value = ''
  sourceUrl.value = ''
  note.value = ''
  inputType.value = 'text'
  verification.value = null
  error.value = ''
  approveError.value = ''
  approveSuccess.value = false
}
</script>

<style scoped>
.outcome-verifier {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
}

.form-section,
.results-section {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 2rem;
}

h2,
h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  cursor: pointer;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  padding: 0;
}

.back-button:hover {
  text-decoration: underline;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

input[type='number'],
input[type='url'],
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.95rem;
}

input[type='number']:focus,
input[type='url']:focus,
textarea:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.radio-group {
  display: flex;
  gap: 1.5rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  margin-bottom: 0;
  font-weight: normal;
}

.radio-group input[type='radio'] {
  margin-right: 0.5rem;
  cursor: pointer;
}

button {
  background: #0066cc;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
}

button:hover:not(:disabled) {
  background: #0052a3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #d32f2f;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #ffebee;
  border-radius: 4px;
  font-size: 0.9rem;
}

.success-message {
  color: #388e3c;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #e8f5e9;
  border-radius: 4px;
  font-size: 0.9rem;
}

.promise-info {
  margin: 1rem 0 1.5rem 0;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.kept {
  background: #c8e6c9;
  color: #2e7d32;
}

.status-badge.partial {
  background: #fff9c4;
  color: #f57f17;
}

.status-badge.broken {
  background: #ffcdd2;
  color: #c62828;
}

.status-badge.in_progress {
  background: #bbdefb;
  color: #1565c0;
}

.verification-result {
  margin-top: 2rem;
}

.confidence-box {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.confidence-box.high {
  background: #e8f5e9;
  color: #2e7d32;
}

.confidence-box.medium {
  background: #fff3e0;
  color: #e65100;
}

.confidence-box.low {
  background: #ffebee;
  color: #c62828;
}

.section {
  margin-bottom: 1.5rem;
}

.section h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 0.95rem;
}

.suggested-status {
  background: #f0f0f0;
  padding: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.claims-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #555;
}

.claims-list li {
  margin-bottom: 0.5rem;
}

.quote {
  margin: 0.75rem 0;
  padding-left: 1rem;
  border-left: 3px solid #0066cc;
  color: #666;
  font-style: italic;
  font-size: 0.9rem;
}

.approval-section {
  border-top: 1px solid #ddd;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.approval-section p {
  margin: 0 0 1rem 0;
  font-weight: 500;
  color: #333;
}

.approval-form {
  background: white;
  padding: 1rem;
  border-radius: 4px;
}

.button-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.approve-btn {
  flex: 1;
}

.cancel-btn {
  background: #757575;
  flex: 1;
}

.cancel-btn:hover {
  background: #616161;
}
</style>
