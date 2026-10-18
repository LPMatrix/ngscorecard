<script setup>
// Newsletter signup. Posts to /api/newsletter/subscribe; the person is only
// subscribed after clicking the link in the confirmation email, which is what
// the "done" message says. Spam guards mirror CorrectionForm: a honeypot field
// and a render timestamp. The timestamp is set after mount, because this
// component is server-rendered and a server-side Date.now() would be stale.
import { ref, onMounted, inject } from 'vue'

const t = inject('t', (k) => k)

const props = defineProps({
  // Where the signup happened ("footer", "publication:<slug>"); stored with the row.
  source: { type: String, default: 'site' },
  // Smaller, single-line layout for the footer.
  compact: { type: Boolean, default: false },
})

const email = ref('')
const company = ref('')          // honeypot, stays empty for real people
const renderedAt = ref(0)
const state = ref('idle')        // idle | sending | done | error
const errorMsg = ref('')

onMounted(() => { renderedAt.value = Date.now() })

async function submit() {
  if (state.value === 'sending') return
  state.value = 'sending'
  try {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, company: company.value, renderedAt: renderedAt.value, source: props.source }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      state.value = 'error'
      errorMsg.value = j.error || t('newsletter.errSubmit')
      return
    }
    state.value = 'done'
  } catch {
    state.value = 'error'
    errorMsg.value = t('newsletter.errConnection')
  }
}
</script>

<template>
  <section class="nl" :class="{ compact }" :aria-label="t('newsletter.title')">
    <template v-if="state === 'done'">
      <p class="nl-done" role="status">{{ t('newsletter.done') }}</p>
    </template>
    <form v-else novalidate @submit.prevent="submit">
      <h2 class="nl-title">{{ t('newsletter.title') }}</h2>
      <p class="nl-lede">{{ t('newsletter.lede') }}</p>
      <div class="nl-row">
        <label class="nl-sr" :for="`nl-email-${source}`">{{ t('newsletter.emailLabel') }}</label>
        <input :id="`nl-email-${source}`" v-model="email" type="email" class="nl-input" autocomplete="email"
          inputmode="email" required :placeholder="t('newsletter.placeholder')" />
        <button type="submit" class="nl-btn" :disabled="state === 'sending'">
          {{ state === 'sending' ? t('newsletter.sending') : t('newsletter.subscribe') }}
        </button>
      </div>
      <div class="nl-hp" aria-hidden="true">
        <label>Company<input v-model="company" type="text" tabindex="-1" autocomplete="off" /></label>
      </div>
      <p v-if="state === 'error'" class="nl-error" role="alert">{{ errorMsg }}</p>
      <p class="nl-note">{{ t('newsletter.note') }}</p>
    </form>
  </section>
</template>

<style scoped>
.nl { max-width: 520px; margin: 0 auto; text-align: left; color: var(--pt-text, #1b2720); }
.nl-title { font-size: 20px; font-weight: 800; color: var(--pt-green-800, #075236); margin: 0 0 4px; }
.nl-lede { font-size: 15px; line-height: 1.5; margin: 0 0 12px; color: var(--pt-text-muted, #5f6f66); }
.nl-row { display: flex; gap: 8px; }
.nl-input {
  flex: 1; min-width: 0; font: inherit; font-size: 15px; padding: 9px 12px;
  border: 1px solid var(--pt-line, #b9cbc1); border-radius: 6px; background: #fff; color: inherit;
}
.nl-input:focus { outline: 2px solid var(--pt-green-700, #006b45); outline-offset: 1px; }
.nl-btn {
  font: inherit; font-size: 15px; font-weight: 700; padding: 9px 16px; border: 0; border-radius: 6px;
  background: var(--pt-green-700, #006b45); color: #fff; cursor: pointer; white-space: nowrap;
}
.nl-btn:disabled { opacity: .6; cursor: default; }
.nl-error { color: #a12b1a; font-size: 14px; margin: 8px 0 0; }
.nl-done { font-size: 15px; line-height: 1.5; margin: 0; }
.nl-note { font-size: 12.5px; color: var(--pt-text-faint, #7f8c84); margin: 8px 0 0; }
.nl-sr, .nl-hp { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
.compact { margin-bottom: 18px; text-align: center; }
.compact .nl-title { font-size: 15px; }
.compact .nl-lede { font-size: 13.5px; margin-bottom: 8px; }
.compact .nl-input, .compact .nl-btn { font-size: 14px; padding: 7px 12px; }
@media (max-width: 480px) { .nl-row { flex-direction: column; } }
</style>
