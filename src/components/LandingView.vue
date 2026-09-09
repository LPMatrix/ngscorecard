<script setup>
import { computed } from 'vue'

const props = defineProps({
  administrations: { type: Array, default: () => [] },
})
defineEmits(['select', 'open-picker'])

// Nigeria's six geopolitical zones — used to group sitting governors the same
// way the command-bar picker does. Kept local: it's static reference data.
const NG_ZONES = {
  Benue: 'North Central', Kogi: 'North Central', Kwara: 'North Central',
  Nasarawa: 'North Central', Niger: 'North Central', Plateau: 'North Central',
  'Federal Capital Territory': 'North Central',
  Adamawa: 'North East', Bauchi: 'North East', Borno: 'North East',
  Gombe: 'North East', Taraba: 'North East', Yobe: 'North East',
  Jigawa: 'North West', Kaduna: 'North West', Kano: 'North West',
  Katsina: 'North West', Kebbi: 'North West', Sokoto: 'North West', Zamfara: 'North West',
  Abia: 'South East', Anambra: 'South East', Ebonyi: 'South East',
  Enugu: 'South East', Imo: 'South East',
  'Akwa Ibom': 'South South', Bayelsa: 'South South', 'Cross River': 'South South',
  Delta: 'South South', Edo: 'South South', Rivers: 'South South',
  Ekiti: 'South West', Lagos: 'South West', Ogun: 'South West',
  Ondo: 'South West', Osun: 'South West', Oyo: 'South West',
}
const NG_ZONE_ORDER = ['North Central', 'North East', 'North West', 'South East', 'South South', 'South West']

const federal = computed(() => props.administrations.filter(a => (a.level ?? 'federal') === 'federal'))
const states  = computed(() => props.administrations.filter(a => a.level === 'state'))

const total        = computed(() => props.administrations.length)
const federalCount = computed(() => federal.value.length)
const stateCount   = computed(() => states.value.length)

const sittingPresident = computed(() => federal.value.find(a => a.isCurrent))
const sittingGovernors = computed(() =>
  states.value.filter(a => a.isCurrent).slice().sort((a, b) => (a.state || '').localeCompare(b.state || '')),
)

const governorsByZone = computed(() => {
  const groups = NG_ZONE_ORDER.map(z => ({
    label: z,
    items: sittingGovernors.value.filter(g => NG_ZONES[g.state] === z),
  })).filter(g => g.items.length)
  const rest = sittingGovernors.value.filter(g => !NG_ZONES[g.state])
  if (rest.length) groups.push({ label: 'Other', items: rest })
  return groups
})

const yearOf = a => parseInt(String(a.termStart ?? '').slice(0, 4)) || 0

// Federal administrations grouped into three readable eras, most recent first.
const federalByEra = computed(() => {
  const byRecent = federal.value.slice().sort((a, b) => yearOf(b) - yearOf(a))
  const buckets = [
    { label: 'Fourth Republic · 1999–present', min: 1999, max: 9999 },
    { label: 'Second Republic & military rule · 1979–1999', min: 1979, max: 1998 },
    { label: 'Independence & the first military era · 1960–1979', min: 1960, max: 1978 },
  ]
  return buckets
    .map(b => ({ label: b.label, items: byRecent.filter(a => yearOf(a) >= b.min && yearOf(a) <= b.max) }))
    .filter(b => b.items.length)
})

// "Month YYYY" / "YYYY" → a sortable number, or 0 if unparseable.
function reviewedRank(s) {
  const m = String(s ?? '').trim().match(/^(?:([A-Za-z]+)\s+)?(\d{4})$/)
  if (!m) return 0
  const mon = m[1]
    ? ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        .indexOf(m[1].slice(0, 3).toLowerCase())
    : 0
  return Number(m[2]) * 12 + (mon < 0 ? 0 : mon)
}
const recentlyReviewed = computed(() =>
  props.administrations
    .filter(a => reviewedRank(a.reviewed) > 0)
    .slice()
    .sort((a, b) => reviewedRank(b.reviewed) - reviewedRank(a.reviewed))
    .slice(0, 8),
)
</script>

<template>
  <div class="lp">
    <section class="lp-hero">
      <p class="lp-eyebrow">Civic accountability · Nigeria</p>
      <h2 class="lp-title">Every Nigerian government, held to its word.</h2>
      <p class="lp-lede">
        NGScorecard tracks campaign promises, fraud cases, executive orders, ministerial
        performance, budgets and court judgments across
        <strong>{{ total }} administrations</strong> — every federal government since 1960,
        and elected state governors back to 1979. Independent, non-partisan, every claim linked
        to its source.
      </p>
      <div class="lp-hero-actions">
        <button class="lp-btn-primary" type="button" @click="$emit('open-picker')">
          Find an administration
        </button>
        <a href="/guide" class="lp-btn-ghost">How this works</a>
      </div>
      <p class="lp-stats">{{ federalCount }} federal · {{ stateCount }} state · 1960–present</p>
    </section>

    <section v-if="sittingPresident || sittingGovernors.length" class="lp-section">
      <h3 class="lp-h">In office now</h3>
      <button
        v-if="sittingPresident"
        type="button"
        class="lp-lead"
        @click="$emit('select', sittingPresident.key)"
      >
        <span class="lp-lead-role">President</span>
        <span class="lp-lead-name">{{ sittingPresident.title }}</span>
        <span class="lp-lead-meta">{{ sittingPresident.party }} · {{ sittingPresident.term }}</span>
      </button>

      <div class="lp-zones">
        <div v-for="z in governorsByZone" :key="z.label" class="lp-zone">
          <div class="lp-zone-label">{{ z.label }}</div>
          <button
            v-for="g in z.items"
            :key="g.key"
            type="button"
            class="lp-gov"
            @click="$emit('select', g.key)"
          >
            <span class="lp-gov-state">{{ g.state }}</span>
            <span class="lp-gov-name">{{ g.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="lp-section">
      <h3 class="lp-h">Federal governments by era</h3>
      <div v-for="era in federalByEra" :key="era.label" class="lp-era">
        <div class="lp-era-label">{{ era.label }}</div>
        <div class="lp-era-row">
          <button
            v-for="a in era.items"
            :key="a.key"
            type="button"
            class="lp-chip"
            @click="$emit('select', a.key)"
          >
            <span class="lp-chip-name">{{ a.name }}</span>
            <span class="lp-chip-term">{{ a.term }}</span>
          </button>
        </div>
      </div>
    </section>

    <section v-if="recentlyReviewed.length" class="lp-section">
      <h3 class="lp-h">Recently reviewed</h3>
      <div class="lp-recent">
        <button
          v-for="a in recentlyReviewed"
          :key="a.key"
          type="button"
          class="lp-recent-item"
          @click="$emit('select', a.key)"
        >
          <span class="lp-recent-name">
            {{ a.name }}<template v-if="a.level === 'state'"> · {{ a.state }}</template>
          </span>
          <span class="lp-recent-date">{{ a.reviewed }}</span>
        </button>
      </div>
    </section>

    <section class="lp-section">
      <h3 class="lp-h">Recurring commitments</h3>
      <a href="/themes" class="lp-themes-link">
        <span class="lp-themes-title">Promises made again and again →</span>
        <span class="lp-themes-sub">Fixing the power supply, diversifying off oil, restructuring the federation — pledges threaded through every administration that made them, with what happened each time.</span>
      </a>
    </section>

    <p class="lp-foot">
      Coverage and rating method are documented in the <a href="/guide">guide</a>.
      Spotted an error? Every card carries a “Report an issue” link.
    </p>
  </div>
</template>

<style scoped>
.lp {
  max-width: 1040px;
  margin: 0 auto;
  padding: 40px 24px 72px;
}

.lp-hero {
  padding: 24px 0 36px;
  border-bottom: 1px solid var(--pt-line);
}
.lp-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pt-text-faint);
}
.lp-title {
  margin: 10px 0 14px;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--pt-text);
}
.lp-lede {
  max-width: 64ch;
  font-size: 16px;
  line-height: 1.6;
  color: var(--pt-text-muted);
}
.lp-lede strong { color: var(--pt-text); font-weight: 700; }

.lp-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 22px 0 14px;
}
.lp-btn-primary {
  padding: 11px 20px;
  border: 0;
  border-radius: 8px;
  background: var(--pt-green-700);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.lp-btn-primary:hover { background: var(--pt-green-800); }
.lp-btn-ghost {
  display: inline-flex;
  align-items: center;
  padding: 11px 18px;
  border: 1px solid var(--pt-line-strong);
  border-radius: 8px;
  background: var(--pt-surface);
  color: var(--pt-text);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}
.lp-btn-ghost:hover { background: var(--pt-surface-hover); }
.lp-stats {
  font-size: 13px;
  color: var(--pt-text-faint);
}

.lp-section { padding: 32px 0; border-bottom: 1px solid var(--pt-line); }
.lp-section:last-of-type { border-bottom: 0; }
.lp-h {
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pt-text-faint);
}

.lp-lead {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 420px;
  padding: 16px 18px;
  margin-bottom: 22px;
  border: 1px solid var(--pt-line-strong);
  border-radius: 12px;
  background: var(--pt-surface);
  text-align: left;
  cursor: pointer;
}
.lp-lead:hover { border-color: var(--pt-green-600); background: var(--pt-surface-hover); }
.lp-lead-role {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pt-green-700);
}
.lp-lead-name { font-size: 20px; font-weight: 800; color: var(--pt-text); }
.lp-lead-meta { font-size: 13px; color: var(--pt-text-muted); }

.lp-zones {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px 24px;
}
.lp-zone-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pt-text-faint);
  margin-bottom: 8px;
}
.lp-gov {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.lp-gov:hover { background: var(--pt-panel); }
.lp-gov-state { font-size: 13px; font-weight: 700; color: var(--pt-text); }
.lp-gov-name { font-size: 12px; color: var(--pt-text-muted); }

.lp-era { margin-bottom: 18px; }
.lp-era-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--pt-text-muted);
  margin-bottom: 10px;
}
.lp-era-row { display: flex; flex-wrap: wrap; gap: 8px; }
.lp-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--pt-line-strong);
  border-radius: 999px;
  background: var(--pt-surface);
  cursor: pointer;
}
.lp-chip:hover { border-color: var(--pt-green-600); background: var(--pt-surface-hover); }
.lp-chip-name { font-size: 13px; font-weight: 700; color: var(--pt-text); }
.lp-chip-term { font-size: 12px; color: var(--pt-text-faint); }

.lp-recent {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}
.lp-recent-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--pt-line);
  border-radius: 8px;
  background: var(--pt-surface);
  text-align: left;
  cursor: pointer;
}
.lp-recent-item:hover { border-color: var(--pt-green-600); background: var(--pt-surface-hover); }
.lp-recent-name { font-size: 13px; font-weight: 700; color: var(--pt-text); }
.lp-recent-date { font-size: 12px; color: var(--pt-text-faint); white-space: nowrap; }

.lp-foot {
  margin-top: 28px;
  font-size: 13px;
  color: var(--pt-text-muted);
}
.lp-foot a { color: var(--pt-link); }

.lp-themes-link {
  display: block;
  border: 1px solid var(--pt-line);
  border-left: 3px solid var(--pt-green-600);
  border-radius: 8px;
  padding: 14px 16px;
  background: var(--pt-surface);
  text-decoration: none;
}
.lp-themes-link:hover { background: var(--pt-surface-hover); border-color: var(--pt-green-600); }
.lp-themes-title { display: block; font-size: 15px; font-weight: 700; color: var(--pt-text); }
.lp-themes-sub { display: block; margin-top: 4px; font-size: 12.5px; line-height: 1.55; color: var(--pt-text-muted); }
</style>
