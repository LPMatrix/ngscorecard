<script setup>
import { ref } from 'vue'

const props = defineProps({
  // { entryTable, entryId, title, administration } — or null for a general note.
  context: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const KINDS = [
  { v: 'error',          t: 'A rating or fact looks wrong' },
  { v: 'outdated',       t: "It's out of date" },
  { v: 'missing_source', t: 'The source is missing, broken, or weak' },
  { v: 'other',          t: 'Something else' },
]

const kind = ref('error')
const body = ref('')
const sourceUrl = ref('')
const email = ref('')
const company = ref('')          // honeypot — stays empty for real people
const renderedAt = Date.now()    // submit-timing baseline

const state = ref('idle')        // idle | sending | done | error
const errorMsg = ref('')

async function submit() {
  if (body.value.trim().length < 15) {
    state.value = 'error'
    errorMsg.value = 'Please describe the problem in a sentence or two.'
    return
  }
  state.value = 'sending'
  try {
    const res = await fetch('/api/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        renderedAt,
        company: company.value,
        kind: kind.value,
        body: body.value,
        sourceUrl: sourceUrl.value || undefined,
        email: email.value || undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        entryTable: props.context?.entryTable ?? undefined,
        entryId: props.context?.entryId ?? undefined,
        administration: props.context?.administration ?? undefined,
      }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      state.value = 'error'
      errorMsg.value = j.error || 'Could not submit. Please try again shortly.'
      return
    }
    state.value = 'done'
  } catch {
    state.value = 'error'
    errorMsg.value = 'Could not submit — check your connection and try again.'
  }
}
</script>

<template>
  <div class="cf">
    <h3 class="cf-title">Suggest a correction</h3>
    <p class="cf-context">
      <template v-if="context?.title">About: <strong>{{ context.title }}</strong></template>
      <template v-else>A general correction, or something missing.</template>
    </p>

    <template v-if="state === 'done'">
      <p class="cf-done">Thank you — this has gone to the moderation queue. Every submission is read; it isn't published, it's checked.</p>
      <div class="cf-actions">
        <button type="button" class="cf-btn" @click="emit('close')">Close</button>
      </div>
    </template>

    <form v-else @submit.prevent="submit">
      <label class="cf-label">What's the issue?</label>
      <select v-model="kind" class="cf-input">
        <option v-for="k in KINDS" :key="k.v" :value="k.v">{{ k.t }}</option>
      </select>

      <label class="cf-label">Details <span class="cf-req">*</span></label>
      <textarea v-model="body" class="cf-input cf-textarea" rows="4"
        placeholder="What's wrong, and what should it say instead?"></textarea>

      <label class="cf-label">Supporting link (optional)</label>
      <input v-model="sourceUrl" type="url" class="cf-input" placeholder="https://…" />

      <label class="cf-label">Your email (optional — only if you want a reply)</label>
      <input v-model="email" type="email" class="cf-input" placeholder="you@example.com" />

      <div class="cf-hp" aria-hidden="true">
        <label>Company<input v-model="company" type="text" tabindex="-1" autocomplete="off" /></label>
      </div>

      <p v-if="state === 'error'" class="cf-error">{{ errorMsg }}</p>

      <div class="cf-actions">
        <button type="button" class="cf-btn cf-btn-ghost" @click="emit('close')">Cancel</button>
        <button type="submit" class="cf-btn" :disabled="state === 'sending'">
          {{ state === 'sending' ? 'Sending…' : 'Send' }}
        </button>
      </div>
      <p class="cf-note">Prefer email? <a href="mailto:mubaraqsanusi908@gmail.com">mubaraqsanusi908@gmail.com</a></p>
    </form>
  </div>
</template>
