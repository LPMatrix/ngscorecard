<script setup>
// Support / donate page — unified into the app route table (see
// GuideView.vue's header comment for why). No payment integration yet: the
// amount buttons and the continue action are inert until a payment
// provider is wired in (see the TODO below). Ships now so the funding
// policy is public before any money moves.
import { inject, ref } from 'vue'

const t = inject('t', (k) => k)

const ONE_TIME_AMOUNTS = [5000, 15000, 50000]
const MONTHLY_AMOUNT = 2500

const frequency = ref('once') // 'once' | 'monthly'
const selectedAmount = ref(ONE_TIME_AMOUNTS[1])
const customAmount = ref('')

function pick(amount) {
  selectedAmount.value = amount
  customAmount.value = ''
}

function naira(n) {
  return `₦${n.toLocaleString('en-NG')}`
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
            <input
              class="amount-custom"
              type="text"
              inputmode="numeric"
              :placeholder="t('support.customAmount')"
              v-model="customAmount"
            />
          </div>

          <button type="button" class="continue-btn" disabled>{{ t('support.continue') }}</button>
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

    <footer>
      <div class="wrap">
        <p class="footer-tag">{{ t('common.footerTag') }}</p>
      </div>
    </footer>
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

.continue-btn {
  width: 100%; border: none; border-radius: 8px; padding: 14px;
  font-size: 15px; font-weight: 800; font-family: inherit; cursor: not-allowed;
  background: var(--line); color: var(--faint);
}
ul.point-list { margin: 0; padding: 0 0 0 18px; color: var(--muted); font-size: 14px; }
ul.point-list li { margin-bottom: 6px; }

footer { border-top: 1px solid var(--line-strong); padding: 28px 24px; text-align: center; color: var(--faint); font-size: 12.5px; }
footer .footer-tag { margin: 0; }
</style>
