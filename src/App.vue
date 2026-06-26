<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PromiseCard  from './components/PromiseCard.vue'
import HistoryChart from './components/HistoryChart.vue'
import BudgetView      from './components/BudgetView.vue'
import IndicatorsView  from './components/IndicatorsView.vue'
import GovernorsView   from './components/GovernorsView.vue'

const ADMINISTRATIONS = ref([])

const activeAdmin = ref('tinubu')
const currentAdmin = computed(() => ADMINISTRATIONS.value.find(a => a.key === activeAdmin.value) ?? {})
const LAST_REVIEWED = computed(() => currentAdmin.value.reviewed)

const STATUSES = [
  { key: 'all',     label: 'All' },
  { key: 'kept',    label: 'Kept' },
  { key: 'partial', label: 'Partial' },
  { key: 'broken',  label: 'Broken' },
  { key: 'pending', label: 'In progress' },
]

const promises     = ref([])
const inherited    = ref([])
const fraud        = ref([])
const orders       = ref([])
const ministers    = ref([])
const budget       = ref([])
const bills        = ref([])
const indicators   = ref([])
const appointments = ref([])
const judgments    = ref([])
const history      = ref([])
const governors    = ref([])
const activeTab      = ref('promises')
const activeStatus   = ref('all')
const activeCategory = ref('all')
const searchQuery    = ref('')
const expandedId     = ref(null)
const copied         = ref(false)

async function loadData(admin) {
  const get = (name) => fetch(`/api/${admin}/${name}`).then(r => r.json()).catch(() => [])
  const [p, i, h, f, o, m, bu, bi, ind, ap, j, g] = await Promise.all([
    get('promises'), get('inherited'), get('history'), get('fraud'),
    get('orders'), get('ministers'), get('budget'), get('bills'),
    get('indicators'), get('appointments'), get('judgments'), get('governors'),
  ])
  promises.value     = p
  inherited.value    = i
  history.value      = h
  fraud.value        = f
  orders.value       = o
  ministers.value    = m
  budget.value       = bu
  bills.value        = bi
  indicators.value   = ind
  appointments.value = ap
  judgments.value    = j
  governors.value    = g
}

onMounted(async () => {
  const presidents = await fetch('/api/presidents').then(r => r.json()).catch(() => [])
  ADMINISTRATIONS.value = presidents.map(p => ({
    key:      p.key,
    name:     p.name,
    title:    p.fullName,
    term:     p.term,
    tagline:  p.tagline,
    reviewed: p.reviewed,
  }))

  await loadData(activeAdmin.value)

  // Deep-link: open card specified by ?id= on load
  const params = new URLSearchParams(window.location.search)
  const id = parseInt(params.get('id'))
  if (id) expandedId.value = id
})

watch(activeAdmin, (admin) => {
  activeTab.value      = 'promises'
  activeStatus.value   = 'all'
  activeCategory.value = 'all'
  searchQuery.value    = ''
  expandedId.value     = null
  loadData(admin)
})

// ── Tab switching ─────────────────────────────────────

function switchTab(tab) {
  activeTab.value      = tab
  activeStatus.value   = 'all'
  activeCategory.value = 'all'
  activeResponse.value = 'all'
  searchQuery.value    = ''
  setExpanded(null)
}

// ── Deep-link ─────────────────────────────────────────

function setExpanded(id) {
  expandedId.value = id
  const url = new URL(window.location)
  if (id) {
    url.searchParams.set('id', id)
  } else {
    url.searchParams.delete('id')
  }
  history.replaceState(null, '', url)
}

function handleToggle(id) {
  setExpanded(expandedId.value === id ? null : id)
}

async function handleShare(id) {
  const url = new URL(window.location)
  url.searchParams.set('id', id)
  await navigator.clipboard.writeText(url.toString())
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// ── Promises tab ──────────────────────────────────────

const categories = computed(() =>
  [...new Set(promises.value.map(p => p.category))].sort()
)

const promiseCounts = computed(() => {
  const c = { kept: 0, partial: 0, broken: 0, pending: 0 }
  promises.value.forEach(p => c[p.status]++)
  return c
})

const filteredPromises = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return promises.value.filter(p => {
    const matchStatus = activeStatus.value === 'all' || p.status === activeStatus.value
    const matchCat    = activeCategory.value === 'all' || p.category === activeCategory.value
    const matchQ      = !q
      || p.title.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q)
      || p.promise.toLowerCase().includes(q)
    return matchStatus && matchCat && matchQ
  })
})

const promiseTotal = computed(() => promises.value.length)

function pct(n) { return ((n / (promiseTotal.value || 1)) * 100).toFixed(1) + '%' }

// ── Inherited tab ─────────────────────────────────────

const inheritedCounts = computed(() => ({
  fixed:   inherited.value.filter(p => p.status === 'fixed').length,
  partial: inherited.value.filter(p => p.status === 'partial').length,
  total:   inherited.value.length,
}))

function iPct(n) { return ((n / (inheritedCounts.value.total || 1)) * 100).toFixed(1) + '%' }

// ── Fraud tab ─────────────────────────────────────────

const FRAUD_STATUSES = [
  { key: 'all',       label: 'All' },
  { key: 'convicted', label: 'Convicted' },
  { key: 'ongoing',   label: 'Ongoing' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: 'acquitted', label: 'Acquitted' },
]

const FRAUD_RESPONSES = [
  { key: 'all',       label: 'All responses' },
  { key: 'pursuing',  label: 'Pursuing' },
  { key: 'stalled',   label: 'Stalled' },
  { key: 'political', label: 'Politicised' },
  { key: 'abandoned', label: 'Abandoned' },
  { key: 'complied',  label: 'No interference' },
]

const activeResponse = ref('all')

const fraudCategories = computed(() =>
  [...new Set(fraud.value.map(f => f.category))].sort()
)

const fraudCounts = computed(() => {
  const c = { convicted: 0, ongoing: 0, dismissed: 0, acquitted: 0 }
  fraud.value.forEach(f => { if (c[f.status] !== undefined) c[f.status]++ })
  return c
})

const filteredFraud = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return fraud.value.filter(f => {
    const matchStatus   = activeStatus.value === 'all' || f.status === activeStatus.value
    const matchResponse = activeResponse.value === 'all' || f.responseVerdict === activeResponse.value
    const matchCat      = activeCategory.value === 'all' || f.category === activeCategory.value
    const matchQ        = !q
      || f.title.toLowerCase().includes(q)
      || f.category.toLowerCase().includes(q)
      || f.allegation.toLowerCase().includes(q)
    return matchStatus && matchResponse && matchCat && matchQ
  })
})

// ── Executive Orders tab ───────────────────────────────

const ORDER_STATUSES = [
  { key: 'all',         label: 'All' },
  { key: 'implemented', label: 'Implemented' },
  { key: 'partial',     label: 'Partial' },
  { key: 'reversed',    label: 'Reversed' },
  { key: 'ignored',     label: 'Ignored' },
]

const orderCategories = computed(() =>
  [...new Set(orders.value.map(o => o.category))].sort()
)

const orderCounts = computed(() => {
  const c = { implemented: 0, partial: 0, reversed: 0, ignored: 0 }
  orders.value.forEach(o => { if (c[o.status] !== undefined) c[o.status]++ })
  return c
})

const filteredOrders = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return orders.value.filter(o => {
    const matchStatus = activeStatus.value === 'all' || o.status === activeStatus.value
    const matchCat    = activeCategory.value === 'all' || o.category === activeCategory.value
    const matchQ      = !q
      || o.title.toLowerCase().includes(q)
      || o.category.toLowerCase().includes(q)
      || o.directive.toLowerCase().includes(q)
    return matchStatus && matchCat && matchQ
  })
})

// ── Ministers tab ──────────────────────────────────────

const MINISTER_STATUSES = [
  { key: 'all',      label: 'All' },
  { key: 'good',     label: 'Good' },
  { key: 'fair',     label: 'Fair' },
  { key: 'poor',     label: 'Poor' },
  { key: 'sacked',   label: 'Sacked' },
  { key: 'resigned', label: 'Resigned' },
]

const ministerCounts = computed(() => {
  const c = { good: 0, fair: 0, poor: 0, sacked: 0, resigned: 0 }
  ministers.value.forEach(m => { if (c[m.status] !== undefined) c[m.status]++ })
  return c
})

const filteredMinisters = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return ministers.value.filter(m => {
    const matchStatus = activeStatus.value === 'all' || m.status === activeStatus.value
    const matchQ      = !q
      || m.name.toLowerCase().includes(q)
      || m.ministry.toLowerCase().includes(q)
      || m.mandate.toLowerCase().includes(q)
    return matchStatus && matchQ
  })
})

// ── Bills tab ──────────────────────────────────────────

const BILL_STATUSES = [
  { key: 'all',       label: 'All' },
  { key: 'passed',    label: 'Passed' },
  { key: 'partial',   label: 'Partial' },
  { key: 'pending',   label: 'Pending' },
  { key: 'abandoned', label: 'Abandoned' },
]

const billCategories = computed(() =>
  [...new Set(bills.value.map(b => b.category))].sort()
)

const billCounts = computed(() => {
  const c = { passed: 0, partial: 0, pending: 0, abandoned: 0 }
  bills.value.forEach(b => { if (c[b.status] !== undefined) c[b.status]++ })
  return c
})

// ── Appointments tab ──────────────────────────────────

const APPOINTMENT_STATUSES = [
  { key: 'all',      label: 'All' },
  { key: 'serving',  label: 'Serving' },
  { key: 'resigned', label: 'Resigned' },
  { key: 'sacked',   label: 'Sacked' },
]

const appointmentCategories = computed(() =>
  [...new Set(appointments.value.map(a => a.category))].sort()
)

const filteredAppointments = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return appointments.value.filter(a => {
    const matchStatus = activeStatus.value === 'all' || a.status === activeStatus.value
    const matchCat    = activeCategory.value === 'all' || a.category === activeCategory.value
    const matchQ      = !q
      || a.name.toLowerCase().includes(q)
      || a.role.toLowerCase().includes(q)
      || a.agency.toLowerCase().includes(q)
      || a.state.toLowerCase().includes(q)
    return matchStatus && matchCat && matchQ
  })
})

// ── Judgments tab ─────────────────────────────────────

const JUDGMENT_STATUSES = [
  { key: 'all',     label: 'All' },
  { key: 'lost',    label: 'Govt Lost' },
  { key: 'won',     label: 'Govt Won' },
  { key: 'settled', label: 'Settled' },
  { key: 'ongoing', label: 'Ongoing' },
]

const judgmentCategories = computed(() =>
  [...new Set(judgments.value.map(j => j.category))].sort()
)

const judgmentCounts = computed(() => {
  const c = { lost: 0, won: 0, settled: 0, ongoing: 0 }
  judgments.value.forEach(j => { if (c[j.status] !== undefined) c[j.status]++ })
  return c
})

const filteredJudgments = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return judgments.value.filter(j => {
    const matchStatus = activeStatus.value === 'all' || j.status === activeStatus.value
    const matchCat    = activeCategory.value === 'all' || j.category === activeCategory.value
    const matchQ      = !q
      || j.title.toLowerCase().includes(q)
      || j.category.toLowerCase().includes(q)
      || j.issue.toLowerCase().includes(q)
    return matchStatus && matchCat && matchQ
  })
})

const filteredBills = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return bills.value.filter(b => {
    const matchStatus = activeStatus.value === 'all' || b.status === activeStatus.value
    const matchCat    = activeCategory.value === 'all' || b.category === activeCategory.value
    const matchQ      = !q
      || b.title.toLowerCase().includes(q)
      || b.category.toLowerCase().includes(q)
      || b.summary.toLowerCase().includes(q)
    return matchStatus && matchCat && matchQ
  })
})
</script>

<template>
  <div class="pt-layout">

    <header class="pt-header">
      <div class="pt-govbar">
        <span class="pt-flag" aria-hidden="true"><span></span></span>
        <span>Federal Republic of Nigeria</span>
        <span class="pt-govbar-note">Public accountability information service</span>
      </div>
      <div class="pt-header-brand">
        <div class="pt-crest" aria-hidden="true">NG</div>
        <div>
          <div class="pt-eyebrow">Civic Accountability · Nigeria</div>
          <h1 class="pt-headline">NGScorecard</h1>
        </div>
        <div class="pt-admin-summary">
          <span>{{ currentAdmin.title || currentAdmin.name }}</span>
          <strong>{{ currentAdmin.term }}</strong>
        </div>
      </div>
      <nav class="pt-admin-nav" aria-label="Administration">
        <button
          v-for="a in ADMINISTRATIONS"
          :key="a.key"
          :class="['pt-admin-tab', { active: activeAdmin === a.key }]"
          @click="activeAdmin = a.key"
        >
          <span class="pt-admin-tab-name">{{ a.name }}</span>
          <span class="pt-admin-tab-term">{{ a.term }}</span>
        </button>
      </nav>
      <!-- Mobile-only section nav -->
      <select class="pt-mobile-nav" :value="activeTab" @change="switchTab($event.target.value)">
        <optgroup label="Government">
          <option value="promises">Promises</option>
          <option value="ministers">Ministers</option>
          <option value="orders">Orders &amp; Policy</option>
          <option value="appointments">Appointments</option>
          <option value="governors">Governors</option>
        </optgroup>
        <optgroup label="Accountability">
          <option value="fraud">Fraud</option>
          <option value="judgments">Court Judgments</option>
          <option value="inherited">Inherited Fixes</option>
        </optgroup>
        <optgroup label="Economy">
          <option value="budget">Budget</option>
          <option value="indicators">Key Indicators</option>
        </optgroup>
        <optgroup label="Legislature">
          <option value="bills">Bills Watch</option>
        </optgroup>
      </select>
    </header>

    <!-- ── Body: sidebar + content ── -->
    <div class="pt-body">

      <!-- ── Sidebar (section nav only) ── -->
      <aside class="pt-sidebar">
        <nav class="pt-nav">
          <div class="pt-nav-group">
            <div class="pt-nav-group-label">Government</div>
            <button :class="['pt-nav-btn', { active: activeTab === 'promises' }]"     @click="switchTab('promises')">Promises <span class="pt-nav-count">{{ promises.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'ministers' }]"    @click="switchTab('ministers')">Ministers <span class="pt-nav-count">{{ ministers.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'orders' }]"       @click="switchTab('orders')">Orders &amp; Policy <span class="pt-nav-count">{{ orders.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'appointments' }]" @click="switchTab('appointments')">Appointments <span class="pt-nav-count">{{ appointments.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'governors' }]"    @click="switchTab('governors')">Governors <span class="pt-nav-count">{{ governors.length }}</span></button>
          </div>

          <div class="pt-nav-group">
            <div class="pt-nav-group-label">Accountability</div>
            <button :class="['pt-nav-btn', { active: activeTab === 'fraud' }]"     @click="switchTab('fraud')">Fraud <span class="pt-nav-count">{{ fraud.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'judgments' }]" @click="switchTab('judgments')">Court Judgments <span class="pt-nav-count">{{ judgments.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'inherited' }]" @click="switchTab('inherited')">Inherited Fixes <span class="pt-nav-count">{{ inherited.length }}</span></button>
          </div>

          <div class="pt-nav-group">
            <div class="pt-nav-group-label">Economy</div>
            <button :class="['pt-nav-btn', { active: activeTab === 'budget' }]"     @click="switchTab('budget')">Budget</button>
            <button :class="['pt-nav-btn', { active: activeTab === 'indicators' }]" @click="switchTab('indicators')">Key Indicators</button>
          </div>

          <div class="pt-nav-group">
            <div class="pt-nav-group-label">Legislature</div>
            <button :class="['pt-nav-btn', { active: activeTab === 'bills' }]" @click="switchTab('bills')">Bills Watch <span class="pt-nav-count">{{ bills.length }}</span></button>
          </div>
        </nav>

        <div class="pt-sidebar-footer">
          <span class="pt-freshness-dot"></span>
          Updated <strong>{{ LAST_REVIEWED }}</strong>
          <span class="pt-sidebar-footer-sub">Sources linked on each card</span>
        </div>
      </aside>

      <!-- ── Main content ── -->
      <main class="pt-content">

      <!-- Copied toast -->
      <Transition name="toast">
        <div v-if="copied" class="pt-toast">Link copied to clipboard</div>
      </Transition>

    <!-- ── PROMISES TAB ── -->
    <template v-if="activeTab === 'promises'">

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ promiseTotal }}</div>
          <div class="pt-stat-label">Total tracked</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ promiseCounts.kept }}</div>
          <div class="pt-stat-label">Kept</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ promiseCounts.partial }}</div>
          <div class="pt-stat-label">Partial / mixed</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ promiseCounts.broken }}</div>
          <div class="pt-stat-label">Broken</div>
        </div>
      </div>

      <div class="pt-progress-section">
        <div class="pt-progress-bar">
          <div class="pt-bar-kept"    :style="{ width: pct(promiseCounts.kept) }"></div>
          <div class="pt-bar-partial" :style="{ width: pct(promiseCounts.partial) }"></div>
          <div class="pt-bar-broken"  :style="{ width: pct(promiseCounts.broken) }"></div>
          <div class="pt-bar-pending" :style="{ width: pct(promiseCounts.pending) }"></div>
        </div>
        <div class="pt-legend">
          <div class="pt-legend-item"><span class="pt-legend-dot kept"></span> Kept</div>
          <div class="pt-legend-item"><span class="pt-legend-dot partial"></span> Partial / mixed</div>
          <div class="pt-legend-item"><span class="pt-legend-dot broken"></span> Broken</div>
          <div class="pt-legend-item"><span class="pt-legend-dot pending"></span> In progress</div>
        </div>
      </div>

      <!-- History chart -->
      <HistoryChart :history="history" />

      <!-- Controls -->
      <div class="pt-controls">
        <input
          v-model="searchQuery"
          type="text"
          class="pt-search"
          placeholder="Search promises…"
        />
        <div class="pt-filter-group">
          <button
            v-for="s in STATUSES"
            :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">All categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="p in filteredPromises"
          :key="p.id"
          :item="p"
          :field1="p.promise"
          :field2="p.assessment"
          label1="The promise"
          label2="Assessment"
          :isExpanded="expandedId === p.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredPromises.length" class="pt-empty">
          No promises match your filters.
        </div>
      </div>
    </template>

    <!-- ── INHERITED TAB ── -->
    <template v-else-if="activeTab === 'inherited'">

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ inheritedCounts.total }}</div>
          <div class="pt-stat-label">Inherited problems</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ inheritedCounts.fixed }}</div>
          <div class="pt-stat-label">Fixed</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ inheritedCounts.partial }}</div>
          <div class="pt-stat-label">Partial progress</div>
        </div>
      </div>

      <div class="pt-progress-section">
        <div class="pt-progress-bar">
          <div class="pt-bar-kept"    :style="{ width: iPct(inheritedCounts.fixed) }"></div>
          <div class="pt-bar-partial" :style="{ width: iPct(inheritedCounts.partial) }"></div>
        </div>
        <div class="pt-legend">
          <div class="pt-legend-item"><span class="pt-legend-dot kept"></span> Fixed</div>
          <div class="pt-legend-item"><span class="pt-legend-dot partial"></span> Partial progress</div>
        </div>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="p in inherited"
          :key="p.id"
          :item="p"
          :field1="p.problem"
          :field2="p.resolution"
          label1="The problem"
          label2="What was done"
          :isExpanded="expandedId === p.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
      </div>
    </template>

    <!-- ── FRAUD TAB ── -->
    <template v-else-if="activeTab === 'fraud'">

      <div class="pt-fraud-intro">
        Documented cases of fraud, corruption, and financial misconduct by Nigerian
        government officials and agencies over the past five years (2021–2026).
        Sources linked on each card.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ fraud.length }}</div>
          <div class="pt-stat-label">Total cases</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ fraudCounts.convicted }}</div>
          <div class="pt-stat-label">Convicted</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value pending">{{ fraudCounts.ongoing }}</div>
          <div class="pt-stat-label">Ongoing</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ fraudCounts.dismissed }}</div>
          <div class="pt-stat-label">Dismissed</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="pt-controls">
        <input
          v-model="searchQuery"
          type="text"
          class="pt-search"
          placeholder="Search cases…"
        />
        <div class="pt-filter-group">
          <button
            v-for="s in FRAUD_STATUSES"
            :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">All categories</option>
          <option v-for="cat in fraudCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="pt-controls pt-controls-response">
        <span class="pt-response-filter-label">Govt response:</span>
        <div class="pt-filter-group">
          <button
            v-for="r in FRAUD_RESPONSES"
            :key="r.key"
            :class="['pt-filter-btn', `pt-rfbtn-${r.key}`, { active: activeResponse === r.key }]"
            @click="activeResponse = r.key"
          >{{ r.label }}</button>
        </div>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="f in filteredFraud"
          :key="f.id"
          :item="f"
          :field1="f.allegation"
          :field2="f.outcome"
          :field3="f.govtResponse"
          label1="Allegation"
          label2="Outcome / Status"
          label3="Administration's response"
          :isExpanded="expandedId === f.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredFraud.length" class="pt-empty">
          No cases match your filters.
        </div>
      </div>
    </template>

    <!-- ── ORDERS & POLICY TAB ── -->
    <template v-else-if="activeTab === 'orders'">

      <div class="pt-tab-intro">
        Executive orders, presidential directives, and major policy decisions issued
        since May 2023 — tracked from announcement through to real-world effect.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ orders.length }}</div>
          <div class="pt-stat-label">Total orders</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ orderCounts.implemented }}</div>
          <div class="pt-stat-label">Implemented</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ orderCounts.partial }}</div>
          <div class="pt-stat-label">Partial</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ orderCounts.reversed }}</div>
          <div class="pt-stat-label">Reversed</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" placeholder="Search orders…" />
        <div class="pt-filter-group">
          <button
            v-for="s in ORDER_STATUSES" :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">All categories</option>
          <option v-for="cat in orderCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="o in filteredOrders" :key="o.id"
          :item="o"
          :field1="o.directive"
          :field2="o.effect"
          label1="The directive"
          label2="Real-world effect"
          :isExpanded="expandedId === o.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredOrders.length" class="pt-empty">No orders match your filters.</div>
      </div>
    </template>

    <!-- ── MINISTERS TAB ── -->
    <template v-else-if="activeTab === 'ministers'">

      <div class="pt-tab-intro">
        Performance scorecard for key cabinet ministers — assessed against their stated
        mandate and verified deliverables. Ratings reflect independent assessment as of April 2026.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ ministers.length }}</div>
          <div class="pt-stat-label">Ministers tracked</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ ministerCounts.good }}</div>
          <div class="pt-stat-label">Good</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ ministerCounts.fair }}</div>
          <div class="pt-stat-label">Fair</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ ministerCounts.poor }}</div>
          <div class="pt-stat-label">Poor</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" placeholder="Search ministers…" />
        <div class="pt-filter-group">
          <button
            v-for="s in MINISTER_STATUSES" :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="m in filteredMinisters" :key="m.id"
          :item="{ ...m, title: m.name, category: m.ministry }"
          :field1="m.mandate"
          :field2="m.performance"
          label1="Mandate"
          label2="Performance assessment"
          :isExpanded="expandedId === m.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredMinisters.length" class="pt-empty">No ministers match your filters.</div>
      </div>
    </template>

    <!-- ── BUDGET TAB ── -->
    <template v-else-if="activeTab === 'budget'">

      <div class="pt-tab-intro">
        Federal budget allocation versus actual release rates by ministry.
        Tracks whether approved funds are reaching the programmes they were signed for.
      </div>

      <BudgetView :budgets="budget" />
    </template>

    <!-- ── BILLS TAB ── -->
    <template v-else-if="activeTab === 'bills'">

      <div class="pt-tab-intro">
        Key bills introduced in the 10th National Assembly — tracking passage,
        abandonment, and the gap between legislative promises and outcomes.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ bills.length }}</div>
          <div class="pt-stat-label">Bills tracked</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ billCounts.passed }}</div>
          <div class="pt-stat-label">Passed</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value pending">{{ billCounts.pending }}</div>
          <div class="pt-stat-label">Pending</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ billCounts.abandoned }}</div>
          <div class="pt-stat-label">Abandoned</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" placeholder="Search bills…" />
        <div class="pt-filter-group">
          <button
            v-for="s in BILL_STATUSES" :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">All categories</option>
          <option v-for="cat in billCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="b in filteredBills" :key="b.id"
          :item="b"
          :field1="b.summary"
          :field2="b.outcome"
          label1="What it proposes"
          label2="Outcome"
          :isExpanded="expandedId === b.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredBills.length" class="pt-empty">No bills match your filters.</div>
      </div>
    </template>

    <!-- ── INDICATORS TAB ── -->
    <template v-else-if="activeTab === 'indicators'">
      <div class="pt-tab-intro">
        Key economic metrics since May 2023 — inflation, the naira exchange rate, petrol
        prices, GDP growth, and unemployment. Context for every other tab on this site.
      </div>
      <IndicatorsView :indicators="indicators" />
    </template>

    <!-- ── APPOINTMENTS TAB ── -->
    <template v-else-if="activeTab === 'appointments'">
      <div class="pt-tab-intro">
        Key presidential appointments — who was picked, from where, and how they've
        performed. Tracks state-of-origin patterns and whether appointees delivered.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ appointments.length }}</div>
          <div class="pt-stat-label">Tracked</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ appointments.filter(a => a.status === 'serving').length }}</div>
          <div class="pt-stat-label">Still serving</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ appointments.filter(a => a.status === 'sacked').length }}</div>
          <div class="pt-stat-label">Sacked</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ appointments.filter(a => a.status === 'resigned').length }}</div>
          <div class="pt-stat-label">Resigned</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" placeholder="Search name, role, state…" />
        <div class="pt-filter-group">
          <button
            v-for="s in APPOINTMENT_STATUSES" :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">All categories</option>
          <option v-for="cat in appointmentCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="a in filteredAppointments" :key="a.id"
          :item="{ ...a, title: a.name, category: a.role }"
          :field1="`${a.agency} · ${a.state} (${a.geopolitical}) · Appointed ${a.appointed}`"
          :field2="a.note"
          label1="Details"
          label2="Assessment"
          :isExpanded="expandedId === a.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredAppointments.length" class="pt-empty">No appointments match your filters.</div>
      </div>
    </template>

    <!-- ── GOVERNORS TAB ── -->
    <template v-else-if="activeTab === 'governors'">
      <div class="pt-tab-intro">
        State governors who served during this administration — all 36 states across
        Nigeria's six geopolitical zones, including mid-term changes.
      </div>
      <GovernorsView :governors="governors" />
    </template>

    <!-- ── JUDGMENTS TAB ── -->
    <template v-else-if="activeTab === 'judgments'">
      <div class="pt-tab-intro">
        Key court cases involving the federal government — tracking wins, losses,
        and critically, whether court orders are actually complied with.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ judgments.length }}</div>
          <div class="pt-stat-label">Cases tracked</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ judgmentCounts.lost }}</div>
          <div class="pt-stat-label">Govt lost</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ judgmentCounts.won }}</div>
          <div class="pt-stat-label">Govt won</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ judgmentCounts.settled }}</div>
          <div class="pt-stat-label">Settled</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" placeholder="Search cases…" />
        <div class="pt-filter-group">
          <button
            v-for="s in JUDGMENT_STATUSES" :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">All categories</option>
          <option v-for="cat in judgmentCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="j in filteredJudgments" :key="j.id"
          :item="{ ...j, title: j.title, category: j.category,
                   updated: j.ruled, source: '#', sourceLabel: j.court }"
          :field1="j.issue"
          :field2="j.outcome"
          label1="What the case is about"
          label2="Ruling & compliance"
          :isExpanded="expandedId === j.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredJudgments.length" class="pt-empty">No cases match your filters.</div>
      </div>
    </template>

      </main>
    </div><!-- .pt-body -->
  </div><!-- .pt-layout -->
</template>
