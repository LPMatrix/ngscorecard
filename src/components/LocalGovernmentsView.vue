<script setup>
// Local government areas — "/local-governments". Every one of Nigeria's 774,
// grouped by geopolitical zone and state, with a search box and a zone filter.
// The names are bundled content (src/content/localGovernments.json, rebuilt by
// `npm run lgas:import`), so the whole list is in the server-rendered HTML.
import { computed, ref, inject } from 'vue'
import data from '../content/localGovernments.json'
import { NG_ZONE_ORDER } from '../lib/zones.js'

const t = inject('t', (k) => k)
const lp = inject('lp', (p) => p)

const props = defineProps({
  // The administrations App.vue already has ({ key, name, level, state, isCurrent }),
  // used only to link each state to its sitting governor's scorecard.
  admins: { type: Array, default: () => [] },
})

const query = ref('')
const zone = ref('')

const governorOf = computed(() => {
  const m = {}
  for (const a of props.admins) if (a.level === 'state' && a.isCurrent !== false && a.state) m[a.state] = a
  return m
})

const zoneCounts = computed(() => Object.fromEntries(NG_ZONE_ORDER.map((z) => [z, data.states.filter((s) => s.zone === z).reduce((n, s) => n + s.lgas.length, 0)])))

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// States to show: those in the chosen zone, with only the areas that match the
// search (all of a state's areas when it is the state's name that matched).
const groups = computed(() => {
  const q = norm(query.value.trim())
  const out = []
  for (const z of NG_ZONE_ORDER) {
    if (zone.value && zone.value !== z) continue
    const states = []
    for (const s of data.states.filter((x) => x.zone === z)) {
      const stateHit = q && norm(s.state).includes(q)
      const lgas = !q || stateHit ? s.lgas : s.lgas.filter((n) => norm(n).includes(q))
      if (lgas.length) states.push({ ...s, shown: lgas })
    }
    if (states.length) out.push({ zone: z, states })
  }
  return out
})

const shownCount = computed(() => groups.value.reduce((n, g) => n + g.states.reduce((m, s) => m + s.shown.length, 0), 0))
const stateCount = computed(() => groups.value.reduce((n, g) => n + g.states.length, 0))
const filtered = computed(() => !!(query.value.trim() || zone.value))

function clear() { query.value = ''; zone.value = '' }

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-')
</script>

<template>
  <div class="docs-page lga-page">
    <header class="hero">
      <div class="wrap wide">
        <div class="eyebrow">{{ t('lga.eyebrow') }}</div>
        <h1>{{ t('lga.title', { n: data.total }) }}</h1>
        <p class="lede">{{ t('lga.lede', { n: data.total }) }}</p>
        <dl class="lga-stats">
          <div><dt>{{ t('lga.statAreas') }}</dt><dd>{{ data.total }}</dd></div>
          <div><dt>{{ t('lga.statStates') }}</dt><dd>{{ data.states.length }}</dd></div>
          <div><dt>{{ t('lga.statZones') }}</dt><dd>{{ NG_ZONE_ORDER.length }}</dd></div>
        </dl>
      </div>
    </header>

    <main class="wrap wide">
      <div class="lga-controls">
        <label class="lga-search">
          <span class="sr-only">{{ t('lga.searchLabel') }}</span>
          <input v-model="query" type="search" :placeholder="t('lga.searchPlaceholder')" autocomplete="off" spellcheck="false" />
        </label>
        <div class="lga-zones" role="group" :aria-label="t('lga.zoneLabel')">
          <button type="button" class="lga-pill" :class="{ on: !zone }" :aria-pressed="!zone" @click="zone = ''">
            {{ t('lga.allZones') }} <span class="n">{{ data.total }}</span>
          </button>
          <button v-for="z in NG_ZONE_ORDER" :key="z" type="button" class="lga-pill" :class="{ on: zone === z }" :aria-pressed="zone === z" @click="zone = zone === z ? '' : z">
            {{ t('zone.' + z) }} <span class="n">{{ zoneCounts[z] }}</span>
          </button>
        </div>
        <p class="lga-status" role="status" aria-live="polite">
          <template v-if="filtered">
            {{ t('lga.showing', { n: shownCount, total: data.total, s: stateCount, states: data.states.length }) }}
            <button type="button" class="lga-clear" @click="clear">{{ t('lga.clear') }}</button>
          </template>
        </p>
      </div>

      <p v-if="!groups.length" class="lga-empty">{{ t('lga.noMatch') }} <button type="button" class="lga-clear" @click="clear">{{ t('lga.clear') }}</button></p>

      <section v-for="g in groups" :key="g.zone" class="lga-zone" :aria-labelledby="'zone-' + slug(g.zone)">
        <h2 :id="'zone-' + slug(g.zone)" class="lga-zone-title">{{ t('zone.' + g.zone) }}</h2>
        <div class="lga-grid">
          <article v-for="s in g.states" :key="s.state" class="lga-state" :id="slug(s.state)">
            <header>
              <h3>{{ s.state === 'Federal Capital Territory' ? t('lga.fct') : s.state }}</h3>
              <span class="lga-n">{{ filtered && s.shown.length !== s.lgas.length ? s.shown.length + ' / ' + s.lgas.length : s.lgas.length }}</span>
            </header>
            <a v-if="governorOf[s.state]" class="lga-gov" :href="lp('/' + governorOf[s.state].key)">
              {{ t('lga.governor') }}: {{ governorOf[s.state].name }} →
            </a>
            <ul>
              <li v-for="n in s.shown" :key="n">{{ n }}</li>
            </ul>
          </article>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
.docs-page {
  --g800: #075236; --g700: #006b45; --g100: #dff5e8; --g050: #f1fbf5;
  --ink: #1b2720; --muted: #5f6f66; --faint: #7f8c84;
  --line: #d9e2dc; --line-strong: #b9cbc1; --surface: #fffef9;
  color: var(--ink);
}
.wrap { max-width: 1120px; margin: 0 auto; }
.hero { border-bottom: 1px solid var(--line-strong); background: var(--surface); padding: 28px 24px; }
.eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--g700); }
h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 36px; line-height: 1.15; margin: 8px 0 10px; }
.lede { color: var(--muted); font-size: 17px; line-height: 1.5; max-width: 680px; margin: 0; }
.lga-stats { display: flex; flex-wrap: wrap; gap: 8px 36px; margin: 22px 0 0; }
.lga-stats div { display: flex; flex-direction: column-reverse; }
.lga-stats dt { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.lga-stats dd { margin: 0; font-family: "Playfair Display", Georgia, serif; font-size: 30px; font-weight: 800; line-height: 1.1; color: var(--g800); font-variant-numeric: lining-nums; }

main { padding: 28px 24px 72px; }
main.wrap { max-width: 1168px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.lga-controls { display: grid; gap: 12px; margin-bottom: 8px; }
.lga-search input {
  width: 100%; max-width: 460px; font: inherit; font-size: 15px; padding: 11px 14px;
  border: 1px solid var(--line-strong); border-radius: 8px; background: #fff; color: var(--ink);
}
.lga-search input:focus { outline: 2px solid var(--g700); outline-offset: 1px; }
.lga-zones { display: flex; flex-wrap: wrap; gap: 8px; }
.lga-pill {
  font: inherit; font-size: 13px; font-weight: 700; padding: 7px 14px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--line-strong); background: #fff; color: var(--ink);
  transition: border-color 0.14s, background-color 0.14s, color 0.14s;
}
.lga-pill:hover { border-color: var(--g700); }
.lga-pill.on { background: var(--g800); border-color: var(--g800); color: #fff; }
.lga-pill:focus-visible, .lga-clear:focus-visible { outline: 2px solid var(--g700); outline-offset: 2px; }
.lga-pill .n { font-weight: 600; opacity: 0.7; margin-left: 4px; font-variant-numeric: tabular-nums; }
.lga-status { margin: 0; min-height: 22px; font-size: 14px; color: var(--muted); }
.lga-clear { background: none; border: none; padding: 0; margin-left: 8px; font: inherit; font-weight: 700; color: var(--g700); text-decoration: underline; cursor: pointer; }
.lga-empty { padding: 40px 0; color: var(--muted); font-size: 16px; }

.lga-zone { margin-top: 30px; }
.lga-zone-title {
  display: flex; align-items: center; gap: 12px; margin: 0 0 14px; font-size: 12px; font-weight: 800;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--g700);
}
.lga-zone-title::after { content: ''; flex: 1; height: 1px; background: var(--line-strong); }
.lga-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
.lga-state { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px 14px; scroll-margin-top: 80px; }
.lga-state header { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.lga-state h3 { margin: 0; font-family: "Playfair Display", Georgia, serif; font-size: 20px; font-weight: 800; color: var(--g800); }
.lga-n { font-size: 12px; font-weight: 700; color: var(--muted); background: var(--g100); border-radius: 999px; padding: 1px 9px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.lga-gov { display: inline-block; margin: 6px 0 2px; font-size: 13px; font-weight: 700; color: var(--g700); text-decoration: none; }
.lga-gov:hover { text-decoration: underline; }
.lga-state ul { list-style: none; margin: 10px 0 0; padding: 0; column-width: 112px; column-gap: 14px; }
.lga-state li { font-size: 14px; line-height: 1.35; padding: 3px 0; break-inside: avoid; overflow-wrap: anywhere; }


@media (max-width: 560px) {
  h1 { font-size: 28px; }
  main { padding: 22px 16px 56px; }
  .hero { padding: 22px 16px; }
}
@media (prefers-reduced-motion: reduce) { .lga-pill { transition: none; } }
</style>
