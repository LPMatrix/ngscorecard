<script setup>
// Support / donate page — unified into the app route table (see
// GuideView.vue's header comment for why). Payment runs through Paystack's
// Inline popup (no redirect): the client only ever sees the public key, and
// the server re-verifies every transaction with Paystack directly rather
// than trusting the popup's own "success" callback (server/paystackRoutes.js).
import { inject, ref, computed, onMounted } from 'vue'
import { ONE_TIME_AMOUNTS, MONTHLY_AMOUNT, MIN_AMOUNT_NAIRA } from '../lib/donation.js'

const t = inject('t', (k) => k)

const frequency = ref('once') // 'once' | 'monthly'
const selectedAmount = ref(ONE_TIME_AMOUNTS[1])
const customAmount = ref('')
const email = ref('')

// 'loading-config' | 'idle' | 'paying' | 'verifying' | 'done' | 'error'
const state = ref('loading-config')
const errorMsg = ref('')
const config = ref({ enabled: false, publicKey: null, monthlyEnabled: false, monthlyPlanCode: null })

onMounted(async () => {
  try {
    const res = await fetch('/api/donate/config', { cache: 'no-store' })
    if (!res.ok) throw new Error(`config ${res.status}`)
    config.value = await res.json()
  } catch {
    config.value = { enabled: false, publicKey: null, monthlyEnabled: false, monthlyPlanCode: null }
  }
  state.value = 'idle'
})

function pick(amount) {
  selectedAmount.value = amount
  customAmount.value = ''
}

function naira(n) {
  return `₦${n.toLocaleString('en-NG')}`
}

const amountNaira = computed(() => {
  if (frequency.value === 'monthly') return MONTHLY_AMOUNT
  if (customAmount.value) {
    const n = parseInt(customAmount.value.replace(/[^\d]/g, ''), 10)
    return Number.isFinite(n) ? n : 0
  }
  return selectedAmount.value
})

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const amountValid = computed(() => amountNaira.value >= MIN_AMOUNT_NAIRA)
const providerReady = computed(() => (frequency.value === 'monthly' ? config.value.monthlyEnabled : config.value.enabled))
const busy = computed(() => ['loading-config', 'paying', 'verifying'].includes(state.value))
const canSubmit = computed(() => providerReady.value && emailValid.value && amountValid.value && !busy.value)

let paystackScriptPromise = null
function loadPaystackScript() {
  if (window.PaystackPop) return Promise.resolve()
  if (paystackScriptPromise) return paystackScriptPromise
  paystackScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      paystackScriptPromise = null
      reject(new Error(t('support.errScript')))
    }
    document.head.appendChild(script)
  })
  return paystackScriptPromise
}

async function verify(reference) {
  state.value = 'verifying'
  try {
    const res = await fetch('/api/donate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok && j.status === 'success') {
      state.value = 'done'
    } else {
      state.value = 'error'
      errorMsg.value = j.error || t('support.errSubmit')
    }
  } catch {
    state.value = 'error'
    errorMsg.value = t('support.errConnection')
  }
}

async function donate() {
  if (!emailValid.value) { state.value = 'error'; errorMsg.value = t('support.errEmail'); return }
  if (!amountValid.value) { state.value = 'error'; errorMsg.value = t('support.errAmount'); return }
  state.value = 'paying'
  errorMsg.value = ''
  try {
    await loadPaystackScript()
  } catch (e) {
    state.value = 'error'
    errorMsg.value = e.message
    return
  }
  window.PaystackPop.setup({
    key: config.value.publicKey,
    email: email.value.trim(),
    amount: amountNaira.value * 100, // kobo
    currency: 'NGN',
    plan: frequency.value === 'monthly' ? config.value.monthlyPlanCode : undefined,
    metadata: {
      frequency: frequency.value,
      custom_fields: [{ display_name: 'Donation type', variable_name: 'frequency', value: frequency.value }],
    },
    callback: (response) => { verify(response.reference) },
    onClose: () => { if (state.value === 'paying') state.value = 'idle' },
  }).openIframe()
}
</script>

<template>
  <div class="docs-page">
    <header class="hero">
      <div class="wrap">
        <div class="eyebrow">{{ t('support.eyebrow') }}</div>
        <h1>{{ t('support.title') }}</h1>
        <p class="lede">{{ t('support.lede') }}</p>
      </div>
    </header>

    <main class="wrap">

      <section id="give">
        <div class="card give-card">
          <div class="freq-toggle" role="tablist">
            <button
              type="button"
              class="freq-btn"
              :class="{ active: frequency === 'once' }"
              @click="frequency = 'once'"
            >{{ t('support.freq.once') }}</button>
            <button
              type="button"
              class="freq-btn"
              :class="{ active: frequency === 'monthly' }"
              @click="frequency = 'monthly'"
            >{{ t('support.freq.monthly') }}</button>
          </div>

          <div v-if="frequency === 'once'" class="amount-grid">
            <button
              v-for="a in ONE_TIME_AMOUNTS" :key="a"
              type="button"
              class="amount-btn"
              :class="{ active: !customAmount && selectedAmount === a }"
              @click="pick(a)"
            >{{ naira(a) }}</button>
            <input
              class="amount-custom"
              type="text"
              inputmode="numeric"
              :placeholder="t('support.customAmount')"
              v-model="customAmount"
            />
          </div>
          <div v-else class="amount-grid">
            <button type="button" class="amount-btn active" disabled>
              {{ naira(MONTHLY_AMOUNT) }} <span class="per-month">{{ t('support.perMonth') }}</span>
            </button>
          </div>

          <input
            class="amount-custom email-input"
            type="email"
            autocomplete="email"
            :placeholder="t('support.emailPlaceholder')"
            v-model="email"
            :disabled="state === 'done'"
          />

          <p v-if="state !== 'loading-config' && !providerReady" class="give-note">
            {{ frequency === 'monthly' && config.enabled ? t('support.monthlyUnavailable') : t('support.unavailable') }}
          </p>
          <p v-if="state === 'error'" class="give-note give-error">{{ errorMsg }}</p>

          <div v-if="state === 'done'" class="give-success">
            <strong>{{ t('support.successTitle') }}</strong>
            <p>{{ t('support.successBody') }}</p>
          </div>
          <button v-else type="button" class="continue-btn" :disabled="!canSubmit" @click="donate">
            {{ state === 'paying' || state === 'verifying' ? t('support.processing') : t('support.continue') }}
          </button>
        </div>
      </section>

      <section id="funds">
        <h2><span class="num">1</span> {{ t('support.funds.title') }}</h2>
        <ul class="point-list">
          <li>{{ t('support.funds.item1') }}</li>
          <li>{{ t('support.funds.item2') }}</li>
          <li>{{ t('support.funds.item3') }}</li>
        </ul>
      </section>

      <section id="policy">
        <h2><span class="num">2</span> {{ t('support.policy.title') }}</h2>
        <p class="section-lede">{{ t('support.policy.lede') }}</p>
        <ul class="point-list">
          <li>{{ t('support.policy.item1') }}</li>
          <li>{{ t('support.policy.item2') }}</li>
        </ul>
      </section>

      <section id="transparency">
        <h2><span class="num">3</span> {{ t('support.transparency.title') }}</h2>
        <p class="section-lede">{{ t('support.transparency.lede') }}</p>
      </section>

      <section id="contact">
        <h2><span class="num">4</span> {{ t('support.contact.title') }}</h2>
        <div class="card">
          <p style="margin:0 0 8px;">{{ t('support.contact.lede') }}</p>
          <p style="margin:0;"><a href="mailto:mubaraqsanusi908@gmail.com" style="font-weight:700;">mubaraqsanusi908@gmail.com</a></p>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
.docs-page {
  --g900: #073f2a; --g800: #075236; --g700: #006b45; --g600: #008751; --g100: #dff5e8; --g050: #f1fbf5;
  --ink: #1b2720; --muted: #5f6f66; --faint: #7f8c84;
  --line: #d9e2dc; --line-strong: #b9cbc1;
  --surface: #fffef9;
  color: var(--ink);
}
.wrap { max-width: 860px; margin: 0 auto; }
.hero { border-bottom: 1px solid var(--line-strong); background: var(--surface); padding: 28px 24px; }
.eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--g700); }
h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 34px; margin: 6px 0 8px; }
.lede { color: var(--muted); font-size: 16px; max-width: 620px; margin: 0; }

main { padding: 40px 24px 80px; }
section { margin-bottom: 52px; }
h2 { font-size: 20px; font-weight: 800; color: var(--g800); margin: 0 0 6px; display: flex; align-items: center; gap: 8px; }
h2 .num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--g100); color: var(--g700); font-size: 12px; font-weight: 800;
}
.section-lede { color: var(--muted); margin: 0 0 16px; max-width: 640px; }
.section-lede a { color: var(--g700); }

.card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 18px 20px; }

.give-card { padding: 20px; }
.freq-toggle {
  display: inline-flex; background: var(--g050); border: 1px solid var(--line);
  border-radius: 999px; padding: 3px; margin-bottom: 16px;
}
.freq-btn {
  border: none; background: transparent; color: var(--muted);
  font-size: 13px; font-weight: 700; padding: 7px 16px; border-radius: 999px;
  cursor: pointer; font-family: inherit;
}
.freq-btn.active { background: var(--g700); color: #fff; }

.amount-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.amount-btn {
  border: 1px solid var(--line-strong); background: #fff; color: var(--ink);
  font-size: 15px; font-weight: 700; padding: 14px 10px; border-radius: 8px;
  cursor: pointer; font-family: inherit;
}
.amount-btn:hover:not(:disabled) { border-color: var(--g700); }
.amount-btn.active { border-color: var(--g700); background: var(--g100); color: var(--g800); }
.amount-btn:disabled { cursor: default; }
.per-month { display: block; font-size: 11px; font-weight: 600; color: var(--muted); margin-top: 2px; }
.amount-custom {
  grid-column: 1 / -1;
  border: 1px solid var(--line-strong); border-radius: 8px; padding: 12px 14px;
  font-size: 14px; font-family: inherit; color: var(--ink); background: #fff;
}
.amount-custom:focus { outline: none; border-color: var(--g700); }

.email-input { width: 100%; box-sizing: border-box; margin-bottom: 14px; }
.email-input:disabled { background: var(--g050); color: var(--muted); }

.give-note { font-size: 13px; color: var(--muted); margin: -6px 0 14px; }
.give-error { color: #a2261b; }
.give-success {
  border: 1px solid var(--g600); background: var(--g050); border-radius: 8px;
  padding: 16px 18px; color: var(--g800);
}
.give-success strong { display: block; margin-bottom: 4px; }
.give-success p { margin: 0; color: var(--ink); font-size: 14px; }

.continue-btn {
  width: 100%; border: none; border-radius: 8px; padding: 14px;
  font-size: 15px; font-weight: 800; font-family: inherit; cursor: not-allowed;
  background: var(--line); color: var(--faint);
}
.continue-btn:not(:disabled) { cursor: pointer; background: var(--g700); color: #fff; }
.continue-btn:not(:disabled):hover { background: var(--g800); }
ul.point-list { margin: 0; padding: 0 0 0 18px; color: var(--muted); font-size: 14px; }
ul.point-list li { margin-bottom: 6px; }

</style>
