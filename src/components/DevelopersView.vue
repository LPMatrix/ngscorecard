<script setup>
// API & widget docs — unified into the app route table (see GuideView.vue's
// header comment). Chrome (titles/ledes/TOC) is translated; the endpoint
// tables, curl examples and JSON are literal API syntax and stay English —
// the conventional treatment for developer reference content, and the part
// most likely to mislead if machine-translated.
import { inject, onMounted, ref, computed } from 'vue'

const t = inject('t', (k) => k)

const email = ref('')
const keyBusy = ref(false)
// Driven off t() rather than a ref set to a hardcoded English string, so it
// stays translated at rest — not just while a request is in flight.
const keyBtnLabel = computed(() => keyBusy.value ? t('developers.quickstart.requesting') : t('developers.quickstart.getKeyBtn'))
const keyResult = ref('')
const keyResultShown = ref(false)

async function getKey() {
  const value = email.value.trim()
  if (!value || value.indexOf('@') === -1) {
    keyResult.value = t('developers.quickstart.invalidEmail')
    keyResultShown.value = true
    return
  }
  keyBusy.value = true
  try {
    const res = await fetch('/api/v1/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value }),
    })
    const data = await res.json()
    keyResult.value = JSON.stringify(data, null, 2)
    keyResultShown.value = true
  } catch (e) {
    keyResult.value = t('developers.quickstart.requestFailed')
    keyResultShown.value = true
  } finally {
    keyBusy.value = false
  }
}

// The embeddable widget is a self-contained third-party script (public/widget.js)
// that queries the DOM for data-ngscorecard-admin — it isn't a Vue component,
// so it's loaded imperatively once this section has mounted.
const widgetHost = ref(null)
onMounted(() => {
  const script = document.createElement('script')
  script.src = '/widget.js'
  script.async = true
  document.body.appendChild(script)
})
</script>

<template>
  <div class="docs-page">
    <header class="hero">
      <div class="wrap">
        <div class="eyebrow">{{ t('header.eyebrow') }}</div>
        <h1>{{ t('developers.title') }}</h1>
        <p class="lede">{{ t('developers.lede') }}</p>
      </div>
    </header>

    <nav class="toc">
      <div class="wrap">
        <a href="#quickstart">{{ t('developers.toc.quickstart') }}</a>
        <a href="#auth">{{ t('developers.toc.auth') }}</a>
        <a href="#endpoints">{{ t('developers.toc.endpoints') }}</a>
        <a href="#widget">{{ t('developers.toc.widget') }}</a>
        <a href="#example">{{ t('developers.toc.example') }}</a>
        <a href="#stability">{{ t('developers.toc.stability') }}</a>
      </div>
    </nav>

    <main class="wrap">

      <section id="quickstart">
        <h2><span class="num">1</span>{{ t('developers.quickstart.title') }}</h2>
        <p>{{ t('developers.quickstart.lede') }}</p>

        <div class="card">
          <strong>{{ t('developers.quickstart.tryIt') }}</strong>
          <div class="try-form">
            <input v-model="email" type="email" placeholder="you@example.com" @keyup.enter="getKey" />
            <button :disabled="keyBusy" @click="getKey">{{ keyBtnLabel }}</button>
          </div>
          <div class="try-result" :class="{ show: keyResultShown }">{{ keyResult }}</div>
        </div>

        <pre><span class="comment"># 1. Get a key</span>
curl -X POST https://ngscorecard.com/api/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'

<span class="comment"># → { "key": "ngs_live_...", "tier": "free", "rateLimit": "60 requests/minute" }</span>

<span class="comment"># 2. Use it</span>
curl https://ngscorecard.com/api/v1/tinubu/promises \
  -H "X-API-Key: ngs_live_..."</pre>
      </section>

      <section id="auth">
        <h2><span class="num">2</span>{{ t('developers.auth.title') }}</h2>
        <p>{{ t('developers.auth.lede') }}</p>
        <div class="table-scroll">
          <table>
            <tr><th>Tier</th><th>Rate limit</th><th>Auth</th></tr>
            <tr><td><strong>Free</strong> (current)</td><td>60 requests/minute per key</td><td><code>X-API-Key</code> header</td></tr>
            <tr><td>Widget summary</td><td>30 requests/minute per caller IP</td><td>none — public, CORS-open</td></tr>
          </table>
        </div>
        <p style="margin-top:14px;">Exceeding the limit returns <code>429</code> with a JSON error body. Missing or invalid keys return <code>401</code>.
          Requesting an unknown administration key returns <code>400</code> (or <code>404</code> for the widget endpoint).</p>
      </section>

      <section id="endpoints">
        <h2><span class="num">3</span>{{ t('developers.endpoints.title') }}</h2>
        <p>{{ t('developers.endpoints.lede') }}
          (e.g. <code>tinubu</code> is a president, <code>otti</code> and <code>ododo</code> are governors) —
          <code>GET /api/v1/presidents</code> for the 5 federal presidents, <code>GET /api/v1/governors</code> for the 36 state governors.</p>
        <div class="table-scroll">
          <table>
            <tr><th>Method</th><th>Path</th><th>Returns</th></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/presidents</code></td><td>The 5 federal presidents and their <code>:admin</code> keys</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/governors</code></td><td>The 36 state governors and their <code>:admin</code> keys</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/promises</code></td><td>Campaign promises, status, and sourcing</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/inherited</code></td><td>Inherited problems and their resolution status</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/fraud</code></td><td>Fraud allegations, amounts, and outcomes</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/orders</code></td><td>Executive orders and directives</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/ministers</code></td><td>Ministers/commissioners and performance notes</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/bills</code></td><td>Legislation (federal administrations only)</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/appointments</code></td><td>Key appointments across government</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/judgments</code></td><td>Court judgments and compliance</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/budget</code></td><td>Annual budgets, revenue, and debt service (see note below)</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/governors</code></td><td>Historical state governors listed under a <em>president's</em> own profile — not the same list as <code>GET /api/v1/governors</code> above (federal administrations only)</td></tr>
            <tr><td><span class="badge get">GET</span></td><td><code>/api/v1/:admin/indicators</code></td><td>Tracked economic/performance indicators over time</td></tr>
            <tr><td><span class="badge post">POST</span></td><td><code>/api/v1/keys</code></td><td>Issue (or retrieve) a free API key for an email</td></tr>
          </table>
        </div>
        <p style="margin-top:14px;">
          <strong>On budget data:</strong> where a figure isn't publicly reported anywhere, the field is <code>null</code> —
          never a guessed number. A <code>null</code> means "not published," not "zero."
        </p>
      </section>

      <section id="widget">
        <h2><span class="num">4</span>{{ t('developers.widget.title') }}</h2>
        <p>{{ t('developers.widget.lede') }}</p>

        <pre>&lt;div data-ngscorecard-admin="tinubu"&gt;&lt;/div&gt;
&lt;script src="https://ngscorecard.com/widget.js" async&gt;&lt;/script&gt;</pre>

        <p>Or, for a single widget, skip the <code>&lt;div&gt;</code> and put the admin key directly on the script tag:</p>
        <pre>&lt;script src="https://ngscorecard.com/widget.js" data-ngscorecard-admin="tinubu" async&gt;&lt;/script&gt;</pre>

        <p><strong>{{ t('developers.widget.liveExample') }}</strong></p>
        <div ref="widgetHost" class="widget-demo" data-ngscorecard-admin="tinubu"></div>
      </section>

      <section id="example">
        <h2><span class="num">5</span>{{ t('developers.example.title') }}</h2>
        <p><code>GET /api/v1/otti/promises</code> — trimmed to one item:</p>
        <pre>[
  {
    "id": 1,
    "title": "Rebuild Port Harcourt Road in Aba",
    "category": "Infrastructure",
    "status": "kept",
    "promise": "Promised to restore major abandoned Aba roads...",
    "assessment": "The reconstruction of Port Harcourt Road in Aba became...",
    "source": "https://abiastate.gov.ng/...",
    "sourceLabel": "Abia State Government",
    "updated": "May 2025"
  }
]</pre>
      </section>

      <section id="stability">
        <h2><span class="num">6</span>{{ t('developers.stability.title') }}</h2>
        <p>{{ t('developers.stability.lede') }}</p>
        <ul>
          <li><strong>Additive changes are not breaking.</strong> New fields on a response, new endpoints, and new optional parameters can land in <code>v1</code> at any time — write clients that ignore fields they don't recognise.</li>
          <li><strong>Breaking changes get a new version.</strong> Removing or renaming a field, changing a type, or changing the meaning of a value happens under <code>/api/v2</code>, never in place.</li>
          <li><strong>Old versions stay up for at least 12 months</strong> after a successor ships.</li>
          <li><strong>Sunsets are announced,</strong> not silent — in this page's change history, in the <code>GET /api/v1</code> index response, and via a <code>Sunset</code> HTTP header (RFC&nbsp;8594) on the affected endpoints for the whole deprecation window.</li>
        </ul>
        <p class="try-note">Nothing is deprecated today. The dataset and its licence are covered separately in <a href="/guide#independence">the methodology</a> and <code>DATA-LICENSE.md</code>.</p>
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
  --gold: #c7931d;
  --ink: #1b2720; --muted: #5f6f66; --faint: #7f8c84;
  --line: #d9e2dc; --line-strong: #b9cbc1;
  --surface: #fffef9;
  --mono: "IBM Plex Mono", ui-monospace, monospace;
  color: var(--ink);
}
.wrap { max-width: 860px; margin: 0 auto; }
.hero { border-bottom: 1px solid var(--line-strong); background: var(--surface); padding: 28px 24px; }
.eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--g700); }
h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 34px; margin: 6px 0 8px; }
.lede { color: var(--muted); font-size: 16px; max-width: 620px; margin: 0; }

nav.toc { background: var(--surface); border-bottom: 1px solid var(--line); padding: 10px 24px; overflow-x: auto; white-space: nowrap; }
nav.toc .wrap { display: flex; gap: 18px; }
nav.toc a { font-size: 13px; font-weight: 700; color: var(--muted); text-decoration: none; }
nav.toc a:hover { color: var(--g700); }

main { padding: 40px 24px 80px; }
section { margin-bottom: 52px; }
h2 { font-size: 20px; font-weight: 800; color: var(--g800); margin: 0 0 6px; display: flex; align-items: center; gap: 8px; }
h2 .num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--g100); color: var(--g700); font-size: 12px; font-weight: 800;
}
section > p { color: var(--muted); margin: 0 0 16px; max-width: 640px; }
section > p a { color: var(--g700); }

pre {
  background: #0f1a14; color: #eafff2; border-radius: 8px; padding: 16px 18px;
  overflow-x: auto; font-family: var(--mono); font-size: 12.5px; line-height: 1.6;
  margin: 0 0 14px;
}
code { font-family: var(--mono); }
:not(pre) > code {
  background: var(--g050); border: 1px solid var(--line); border-radius: 4px;
  padding: 1px 6px; font-size: 0.92em; color: var(--g800);
}
.comment { color: #6f8f7d; }

table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 8px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--faint); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 800; }
td code { white-space: nowrap; }
.table-scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.table-scroll table { margin-bottom: 0; }
.table-scroll th, .table-scroll td { border-bottom: 1px solid var(--line); }
.table-scroll tr:last-child td { border-bottom: none; }

.card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 18px 20px; }
.try-form { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0; }
.try-form input {
  flex: 1; min-width: 220px; padding: 9px 12px; border: 1px solid var(--line-strong); border-radius: 6px;
  font-size: 13px; font-family: inherit; background: #fff;
}
.try-form button {
  padding: 9px 18px; border: none; border-radius: 6px; background: var(--g700); color: #fff;
  font-weight: 700; font-size: 13px; cursor: pointer;
}
.try-form button:hover { background: var(--g800); }
.try-form button:disabled { background: var(--faint); cursor: default; }
.try-result {
  margin-top: 10px; font-family: var(--mono); font-size: 12.5px;
  background: #0f1a14; color: #eafff2; border-radius: 8px; padding: 12px 14px; white-space: pre-wrap; word-break: break-all;
  display: none;
}
.try-result.show { display: block; }
.try-note { font-size: 12px; color: var(--faint); margin-top: 8px; }

.badge { display: inline-block; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; }
.badge.get { background: var(--g100); color: var(--g800); }
.badge.post { background: #fff1cc; color: var(--gold); }

.widget-demo { margin-top: 14px; }
footer { border-top: 1px solid var(--line-strong); padding: 28px 24px; text-align: center; color: var(--faint); font-size: 12.5px; }
footer .footer-tag { margin: 0; }
</style>
