<script setup>
import { ref, inject } from 'vue'

const t = inject('t', (k) => k)

const props = defineProps({
  // { entryTable, entryId, title, administration } — or null for a general note.
  context: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const KINDS = [
  { v: 'error',          k: 'correction.kind.error' },
  { v: 'outdated',       k: 'correction.kind.outdated' },
  { v: 'missing_source', k: 'correction.kind.missing_source' },
  { v: 'other',          k: 'correction.kind.other' },
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
    errorMsg.value = t('correction.errShort')
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
      errorMsg.value = j.error || t('correction.errSubmit')
      return
    }
    state.value = 'done'
  } catch {
    state.value = 'error'
    errorMsg.value = t('correction.errConnection')
  }
}
</script>

<template>
  <div class="cf">
    <h3 class="cf-title">{{ t('correction.title') }}</h3>
    <p class="cf-context">
      <template v-if="context?.title">{{ t('correction.aboutPrefix') }}<strong>{{ context.title }}</strong></template>
      <template v-else>{{ t('correction.general') }}</template>
    </p>

    <template v-if="state === 'done'">
      <p class="cf-done">{{ t('correction.done') }}</p>
      <div class="cf-actions">
        <button type="button" class="cf-btn" @click="emit('close')">{{ t('correction.close') }}</button>
      </div>
    </template>

    <form v-else @submit.prevent="submit">
      <label class="cf-label">{{ t('correction.whatIssue') }}</label>
      <select v-model="kind" class="cf-input">
        <option v-for="opt in KINDS" :key="opt.v" :value="opt.v">{{ t(opt.k) }}</option>
      </select>

      <label class="cf-label">{{ t('correction.details') }} <span class="cf-req">*</span></label>
      <textarea v-model="body" class="cf-input cf-textarea" rows="4"
        :placeholder="t('correction.detailsPlaceholder')"></textarea>

      <label class="cf-label">{{ t('correction.supportingLink') }}</label>
      <input v-model="sourceUrl" type="url" class="cf-input" :placeholder="t('correction.linkPlaceholder')" />

      <label class="cf-label">{{ t('correction.yourEmail') }}</label>
      <input v-model="email" type="email" class="cf-input" :placeholder="t('correction.emailPlaceholder')" />

      <div class="cf-hp" aria-hidden="true">
        <label>Company<input v-model="company" type="text" tabindex="-1" autocomplete="off" /></label>
      </div>

      <p v-if="state === 'error'" class="cf-error">{{ errorMsg }}</p>

      <div class="cf-actions">
        <button type="button" class="cf-btn cf-btn-ghost" @click="emit('close')">{{ t('correction.cancel') }}</button>
        <button type="submit" class="cf-btn" :disabled="state === 'sending'">
          {{ state === 'sending' ? t('correction.sending') : t('correction.send') }}
        </button>
      </div>
      <p class="cf-note">{{ t('correction.preferEmail') }} <a href="mailto:mubaraqsanusi908@gmail.com">mubaraqsanusi908@gmail.com</a></p>
    </form>
  </div>
</template>
