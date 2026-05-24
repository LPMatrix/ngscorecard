<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  governors: { type: Array, required: true },
})

const ZONES = [
  'South-West',
  'South-South',
  'South-East',
  'North-West',
  'North-East',
  'North-Central',
]

const PARTY_COLORS = {
  APC:  { bg: 'var(--pt-kept-bg)',    text: 'var(--pt-kept)',    border: 'oklch(82% 0.08 145)' },
  PDP:  { bg: 'var(--pt-broken-bg)',  text: 'var(--pt-broken)',  border: 'oklch(85% 0.08 22)'  },
  NNPP: { bg: 'oklch(93% 0.05 290)',  text: 'oklch(36% 0.18 290)', border: 'oklch(80% 0.1 290)' },
  LP:   { bg: 'var(--pt-partial-bg)', text: 'var(--pt-partial)', border: 'oklch(82% 0.1 68)'   },
  APGA: { bg: 'oklch(93% 0.06 230)',  text: 'oklch(36% 0.18 230)', border: 'oklch(80% 0.1 230)' },
}

const STATUS_META = {
  serving:   { label: 'Serving',   cls: 'gov-status-serving'   },
  completed: { label: 'Completed', cls: 'gov-status-completed' },
  deceased:  { label: 'Deceased',  cls: 'gov-status-deceased'  },
  removed:   { label: 'Removed',   cls: 'gov-status-removed'   },
}

const searchQuery  = ref('')
const activeZone   = ref('all')
const activeParty  = ref('all')
const activeStatus = ref('all')

const parties = computed(() =>
  [...new Set(props.governors.map(g => g.party))].sort()
)

const stats = computed(() => {
  const total  = props.governors.length
  const byParty = {}
  for (const g of props.governors) byParty[g.party] = (byParty[g.party] || 0) + 1
  const serving  = props.governors.filter(g => g.status === 'serving').length
  const deceased = props.governors.filter(g => g.status === 'deceased').length
  const removed  = props.governors.filter(g => g.status === 'removed').length
  return { total, byParty, serving, deceased, removed }
})

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return props.governors.filter(g => {
    const matchZone   = activeZone.value === 'all'   || g.geopolitical === activeZone.value
    const matchParty  = activeParty.value === 'all'  || g.party === activeParty.value
    const matchStatus = activeStatus.value === 'all' || g.status === activeStatus.value
    const matchQ      = !q
      || g.name.toLowerCase().includes(q)
      || g.state.toLowerCase().includes(q)
      || g.party.toLowerCase().includes(q)
    return matchZone && matchParty && matchStatus && matchQ
  })
})

// Group: zone → state → [governors in chronological order]
const grouped = computed(() => {
  const zones = {}
  for (const z of ZONES) {
    const zoneGovs = filtered.value.filter(g => g.geopolitical === z)
    if (!zoneGovs.length) continue
    const byState = {}
    for (const g of zoneGovs) {
      if (!byState[g.state]) byState[g.state] = []
      byState[g.state].push(g)
    }
    // Sort states alphabetically; governors within state by termStart
    const stateEntries = Object.entries(byState)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([state, govs]) => [
        state,
        govs.slice().sort((a, b) => (a.termStart || '').localeCompare(b.termStart || '')),
      ])
    zones[z] = stateEntries
  }
  return zones
})

function partyStyle(party) {
  const c = PARTY_COLORS[party]
  if (!c) return { background: 'var(--pt-pending-bg)', color: 'var(--pt-text-muted)', border: '1px solid var(--pt-border)' }
  return { background: c.bg, color: c.text, border: `1px solid ${c.border}` }
}

function termLabel(g) {
  return g.termEnd ? `${g.termStart}–${g.termEnd}` : `${g.termStart}–present`
}
</script>

<template>
  <!-- ── Stats ── -->
  <div class="pt-stats">
    <div class="pt-stat">
      <div class="pt-stat-value total">{{ stats.total }}</div>
      <div class="pt-stat-label">Governor records</div>
    </div>
    <div v-for="(count, party) in stats.byParty" :key="party" class="pt-stat">
      <div class="pt-stat-value" :style="{ color: (PARTY_COLORS[party] || {}).text || 'var(--pt-text-muted)' }">
        {{ count }}
      </div>
      <div class="pt-stat-label">{{ party }}</div>
    </div>
    <div v-if="stats.serving" class="pt-stat">
      <div class="pt-stat-value kept">{{ stats.serving }}</div>
      <div class="pt-stat-label">Still serving</div>
    </div>
    <div v-if="stats.deceased" class="pt-stat">
      <div class="pt-stat-value" style="color:var(--pt-text-muted)">{{ stats.deceased }}</div>
      <div class="pt-stat-label">Deceased</div>
    </div>
    <div v-if="stats.removed" class="pt-stat">
      <div class="pt-stat-value broken">{{ stats.removed }}</div>
      <div class="pt-stat-label">Removed</div>
    </div>
  </div>

  <!-- ── Controls ── -->
  <div class="pt-controls gov-controls">
    <input
      v-model="searchQuery"
      type="text"
      class="pt-search"
      placeholder="Search by name or state…"
    />

    <div class="gov-filter-row">
      <span class="gov-filter-label">Zone</span>
      <div class="pt-filter-group">
        <button :class="['pt-filter-btn', { active: activeZone === 'all' }]"   @click="activeZone = 'all'">All</button>
        <button
          v-for="z in ZONES" :key="z"
          :class="['pt-filter-btn', { active: activeZone === z }]"
          @click="activeZone = z"
        >{{ z.replace('South-', 'S-').replace('North-', 'N-') }}</button>
      </div>
    </div>

    <div class="gov-filter-row">
      <span class="gov-filter-label">Party</span>
      <div class="pt-filter-group">
        <button :class="['pt-filter-btn', { active: activeParty === 'all' }]"  @click="activeParty = 'all'">All</button>
        <button
          v-for="p in parties" :key="p"
          :class="['pt-filter-btn', { active: activeParty === p }]"
          @click="activeParty = p"
        >{{ p }}</button>
      </div>
    </div>

    <div class="gov-filter-row">
      <span class="gov-filter-label">Status</span>
      <div class="pt-filter-group">
        <button :class="['pt-filter-btn', { active: activeStatus === 'all' }]"       @click="activeStatus = 'all'">All</button>
        <button :class="['pt-filter-btn', { active: activeStatus === 'serving' }]"   @click="activeStatus = 'serving'">Serving</button>
        <button :class="['pt-filter-btn', { active: activeStatus === 'completed' }]" @click="activeStatus = 'completed'">Completed</button>
        <button :class="['pt-filter-btn', { active: activeStatus === 'deceased' }]"  @click="activeStatus = 'deceased'">Deceased</button>
        <button :class="['pt-filter-btn', { active: activeStatus === 'removed' }]"   @click="activeStatus = 'removed'">Removed</button>
      </div>
    </div>
  </div>

  <!-- ── Zones ── -->
  <div v-if="!Object.keys(grouped).length" class="pt-empty">No governors match your filters.</div>

  <div v-for="(states, zone) in grouped" :key="zone" class="gov-zone">
    <div class="gov-zone-header">
      <span class="gov-zone-name">{{ zone }}</span>
      <span class="gov-zone-count">{{ states.length }} states</span>
    </div>

    <div class="gov-state-grid">
      <div v-for="[state, govs] in states" :key="state" class="gov-state-card">
        <div class="gov-state-name">{{ state }}</div>

        <div class="gov-governor-list">
          <div v-for="(g, idx) in govs" :key="g.id" class="gov-governor-row">
            <!-- Connector line between multiple governors -->
            <div v-if="idx > 0" class="gov-succession-arrow">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M5 1v7M2 5.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="gov-governor-item">
              <div class="gov-governor-name">{{ g.name }}</div>
              <div class="gov-governor-meta">
                <span class="gov-party-badge" :style="partyStyle(g.party)">{{ g.party }}</span>
                <span class="gov-term">{{ termLabel(g) }}</span>
                <span :class="['gov-status-dot', STATUS_META[g.status]?.cls]"
                      :title="STATUS_META[g.status]?.label"></span>
              </div>
              <div v-if="g.note" class="gov-note">{{ g.note }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Controls ── */
.gov-controls { flex-direction: column; align-items: stretch; gap: 0.6rem; }

.gov-filter-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.gov-filter-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pt-text-faint);
  min-width: 36px;
  flex-shrink: 0;
}

/* ── Zone section ── */
.gov-zone { margin-top: 2rem; }

.gov-zone-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--pt-border);
}

.gov-zone-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pt-text-muted);
}

.gov-zone-count {
  font-size: 11px;
  color: var(--pt-text-faint);
}

/* ── State grid ── */
.gov-state-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.65rem;
}

.gov-state-card {
  background: var(--pt-surface);
  border: 1px solid var(--pt-border);
  border-radius: 8px;
  padding: 0.75rem 0.9rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.gov-state-card:hover {
  border-color: var(--pt-border-light);
  box-shadow: 0 2px 8px oklch(0% 0 0 / 0.06);
}

.gov-state-name {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--pt-text-faint);
  margin-bottom: 0.5rem;
}

/* ── Governor list within a state ── */
.gov-governor-list { display: flex; flex-direction: column; gap: 0; }

.gov-succession-arrow {
  display: flex;
  justify-content: center;
  color: var(--pt-border);
  margin: 0.2rem 0;
}

.gov-governor-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.gov-governor-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--pt-text);
  line-height: 1.3;
}

.gov-governor-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.gov-party-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  border-radius: 4px;
  border-style: solid;
  border-width: 1px;
  line-height: 1.6;
}

.gov-term {
  font-size: 11px;
  color: var(--pt-text-faint);
}

/* Status dot */
.gov-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.gov-status-serving   { background: var(--pt-kept-bar); }
.gov-status-completed { background: var(--pt-border); }
.gov-status-deceased  { background: var(--pt-text-muted); }
.gov-status-removed   { background: var(--pt-broken); }

/* Note */
.gov-note {
  font-size: 11px;
  color: var(--pt-text-faint);
  line-height: 1.45;
  font-style: italic;
  margin-top: 0.1rem;
}

/* Separator between governors in same state */
.gov-governor-row + .gov-governor-row > .gov-governor-item {
  padding-top: 0.2rem;
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .gov-state-grid { grid-template-columns: repeat(2, 1fr); }
  .gov-filter-row { gap: 0.4rem; }
}
</style>
