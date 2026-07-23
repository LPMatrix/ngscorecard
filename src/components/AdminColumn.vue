<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import PromiseCard from './PromiseCard.vue'
import BudgetView from './BudgetView.vue'
import IndicatorsView from './IndicatorsView.vue'

const props = defineProps({
  admin:         { type: Object, required: true }, // { key, name, title, term, tagline, level, state }
  tab:           { type: String, required: true },
  statusFilter:  { type: String, default: 'all' },
  categoryFilter:{ type: String, default: 'all' },
  searchQuery:   { type: String, default: '' },
})

const isStateLevel = computed(() => props.admin.level === 'state')
const ministerLabel = computed(() => isStateLevel.value ? 'Commissioners' : 'Ministers')

const loading = ref(true)
const promises = ref([])
const inherited = ref([])
const fraud = ref([])
const orders = ref([])
const ministers = ref([])
const budget = ref([])
const indicators = ref([])
const appointments = ref([])
const judgments = ref([])

async function loadData(adminKey) {
  loading.value = true
  const get = (name) => fetch(`/api/${adminKey}/${name}`).then(r => r.json()).catch(() => [])
  const [p, i, f, o, m, bu, ind, ap, j] = await Promise.all([
    get('promises'), get('inherited'), get('fraud'),
    get('orders'), get('ministers'), get('budget'),
    get('indicators'), get('appointments'), get('judgments'),
  ])
  promises.value = p
  inherited.value = i
  fraud.value = f
  orders.value = o
  ministers.value = m
  budget.value = bu
  indicators.value = ind
  appointments.value = ap
  judgments.value = j
  loading.value = false
}

onMounted(() => loadData(props.admin.key))
watch(() => props.admin.key, (key) => loadData(key))

// ── generic filtering, parameterised by which text fields to search ──
function filterList(list, { status, category, textFields = [] }) {
  const q = props.searchQuery.toLowerCase()
  return list.filter(item => {
    const matchStatus = props.statusFilter === 'all' || item[status ?? 'status'] === props.statusFilter
    const matchCat = !category || props.categoryFilter === 'all' || item[category] === props.categoryFilter
    const matchQ = !q || textFields.some(f => (item[f] || '').toLowerCase().includes(q))
    return matchStatus && matchCat && matchQ
  })
}

const promiseCounts = computed(() => {
  const c = { kept: 0, partial: 0, broken: 0, pending: 0 }
  promises.value.forEach(p => c[p.status]++)
  return c
})
const filteredPromises = computed(() => filterList(promises.value, { category: 'category', textFields: ['title', 'category', 'promise'] }))

const inheritedCounts = computed(() => ({
  fixed: inherited.value.filter(p => p.status === 'fixed').length,
  partial: inherited.value.filter(p => p.status === 'partial').length,
  total: inherited.value.length,
}))
const filteredInherited = computed(() => filterList(inherited.value, {}))

const fraudCounts = computed(() => {
  const c = { convicted: 0, ongoing: 0, dismissed: 0, acquitted: 0 }
  fraud.value.forEach(f => { if (c[f.status] !== undefined) c[f.status]++ })
  return c
})
const filteredFraud = computed(() => filterList(fraud.value, { category: 'category', textFields: ['title', 'category', 'allegation'] }))

const orderCounts = computed(() => {
  const c = { implemented: 0, partial: 0, reversed: 0, ignored: 0 }
  orders.value.forEach(o => { if (c[o.status] !== undefined) c[o.status]++ })
  return c
})
const filteredOrders = computed(() => filterList(orders.value, { category: 'category', textFields: ['title', 'category', 'directive'] }))

const ministerCounts = computed(() => {
  const c = { good: 0, fair: 0, poor: 0, sacked: 0, resigned: 0 }
  ministers.value.forEach(m => { if (c[m.status] !== undefined) c[m.status]++ })
  return c
})
const filteredMinisters = computed(() => filterList(ministers.value, { textFields: ['name', 'ministry', 'mandate'] }))

const appointmentCounts = computed(() => ({
  serving: appointments.value.filter(a => a.status === 'serving').length,
  sacked: appointments.value.filter(a => a.status === 'sacked').length,
  resigned: appointments.value.filter(a => a.status === 'resigned').length,
}))
const filteredAppointments = computed(() => filterList(appointments.value, { category: 'category', textFields: ['name', 'role', 'agency', 'state'] }))

const judgmentCounts = computed(() => {
  const c = { lost: 0, won: 0, settled: 0, ongoing: 0 }
  judgments.value.forEach(j => { if (c[j.status] !== undefined) c[j.status]++ })
  return c
})
const filteredJudgments = computed(() => filterList(judgments.value, { category: 'category', textFields: ['title', 'category', 'issue'] }))

function pct(n, total) { return ((n / (total || 1)) * 100).toFixed(1) + '%' }

const expandedId = ref(null)
function handleToggle(id) { expandedId.value = expandedId.value === id ? null : id }
watch(() => props.tab, () => { expandedId.value = null })
</script>

<template>
  <div class="cmp-col">
    <div class="cmp-col-head">
      <div class="cmp-col-name">{{ admin.title || admin.name }}</div>
      <div class="cmp-col-meta">
        <span>{{ admin.term }}</span>
        <span v-if="admin.state">· {{ admin.state }} State</span>
        <span v-if="admin.tagline">· "{{ admin.tagline }}"</span>
      </div>
    </div>

    <div v-if="loading" class="cmp-loading">Loading…</div>

    <template v-else>
      <!-- PROMISES -->
      <template v-if="tab === 'promises'">
        <div class="cmp-stats">
          <div class="cmp-stat"><div class="cmp-stat-val total">{{ promises.length }}</div><div class="cmp-stat-lbl">Total</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val kept">{{ promiseCounts.kept }}</div><div class="cmp-stat-lbl">Kept</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val partial">{{ promiseCounts.partial }}</div><div class="cmp-stat-lbl">Partial</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val broken">{{ promiseCounts.broken }}</div><div class="cmp-stat-lbl">Broken</div></div>
        </div>
        <div class="cmp-progress-bar">
          <div class="cmp-bar-kept" :style="{ width: pct(promiseCounts.kept, promises.length) }"></div>
          <div class="cmp-bar-partial" :style="{ width: pct(promiseCounts.partial, promises.length) }"></div>
          <div class="cmp-bar-broken" :style="{ width: pct(promiseCounts.broken, promises.length) }"></div>
          <div class="cmp-bar-pending" :style="{ width: pct(promiseCounts.pending, promises.length) }"></div>
        </div>
        <div class="cmp-list">
          <PromiseCard v-for="p in filteredPromises" :key="p.id" :item="p" :field1="p.promise" :field2="p.assessment" label1="The promise" label2="Assessment" :isExpanded="expandedId === p.id" @toggle="handleToggle" />
          <div v-if="!filteredPromises.length" class="cmp-empty">No promises match your filters.</div>
        </div>
      </template>

      <!-- INHERITED -->
      <template v-else-if="tab === 'inherited'">
        <div class="cmp-stats">
          <div class="cmp-stat"><div class="cmp-stat-val total">{{ inheritedCounts.total }}</div><div class="cmp-stat-lbl">Inherited</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val kept">{{ inheritedCounts.fixed }}</div><div class="cmp-stat-lbl">Fixed</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val partial">{{ inheritedCounts.partial }}</div><div class="cmp-stat-lbl">Partial</div></div>
        </div>
        <div class="cmp-list">
          <PromiseCard v-for="p in filteredInherited" :key="p.id" :item="p" :field1="p.problem" :field2="p.resolution" label1="The problem" label2="What was done" :isExpanded="expandedId === p.id" @toggle="handleToggle" />
          <div v-if="!filteredInherited.length" class="cmp-empty">No inherited issues match your filters.</div>
        </div>
      </template>

      <!-- FRAUD -->
      <template v-else-if="tab === 'fraud'">
        <div class="cmp-stats">
          <div class="cmp-stat"><div class="cmp-stat-val total">{{ fraud.length }}</div><div class="cmp-stat-lbl">Cases</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val broken">{{ fraudCounts.convicted }}</div><div class="cmp-stat-lbl">Convicted</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val pending">{{ fraudCounts.ongoing }}</div><div class="cmp-stat-lbl">Ongoing</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val total">{{ fraudCounts.dismissed }}</div><div class="cmp-stat-lbl">Dismissed</div></div>
        </div>
        <div class="cmp-list">
          <PromiseCard v-for="f in filteredFraud" :key="f.id" :item="f" :field1="f.allegation" :field2="f.outcome" :field3="f.govtResponse" label1="Allegation" label2="Outcome / Status" label3="Admin's response" :isExpanded="expandedId === f.id" @toggle="handleToggle" />
          <div v-if="!filteredFraud.length" class="cmp-empty">No cases match your filters.</div>
        </div>
      </template>

      <!-- ORDERS -->
      <template v-else-if="tab === 'orders'">
        <div class="cmp-stats">
          <div class="cmp-stat"><div class="cmp-stat-val total">{{ orders.length }}</div><div class="cmp-stat-lbl">Total</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val kept">{{ orderCounts.implemented }}</div><div class="cmp-stat-lbl">Implemented</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val partial">{{ orderCounts.partial }}</div><div class="cmp-stat-lbl">Partial</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val broken">{{ orderCounts.reversed }}</div><div class="cmp-stat-lbl">Reversed</div></div>
        </div>
        <div class="cmp-list">
          <PromiseCard v-for="o in filteredOrders" :key="o.id" :item="o" :field1="o.directive" :field2="o.effect" label1="The directive" label2="Real-world effect" :isExpanded="expandedId === o.id" @toggle="handleToggle" />
          <div v-if="!filteredOrders.length" class="cmp-empty">No orders match your filters.</div>
        </div>
      </template>

      <!-- MINISTERS -->
      <template v-else-if="tab === 'ministers'">
        <div class="cmp-stats">
          <div class="cmp-stat"><div class="cmp-stat-val total">{{ ministers.length }}</div><div class="cmp-stat-lbl">{{ ministerLabel }}</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val kept">{{ ministerCounts.good }}</div><div class="cmp-stat-lbl">Good</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val partial">{{ ministerCounts.fair }}</div><div class="cmp-stat-lbl">Fair</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val broken">{{ ministerCounts.poor }}</div><div class="cmp-stat-lbl">Poor</div></div>
        </div>
        <div class="cmp-list">
          <PromiseCard v-for="m in filteredMinisters" :key="m.id" :item="{ ...m, title: m.name, category: m.ministry }" :field1="m.mandate" :field2="m.performance" label1="Mandate" label2="Performance" :isExpanded="expandedId === m.id" @toggle="handleToggle" />
          <div v-if="!filteredMinisters.length" class="cmp-empty">No {{ ministerLabel.toLowerCase() }} match your filters.</div>
        </div>
      </template>

      <!-- APPOINTMENTS -->
      <template v-else-if="tab === 'appointments'">
        <div class="cmp-stats">
          <div class="cmp-stat"><div class="cmp-stat-val total">{{ appointments.length }}</div><div class="cmp-stat-lbl">Tracked</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val kept">{{ appointmentCounts.serving }}</div><div class="cmp-stat-lbl">Serving</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val broken">{{ appointmentCounts.sacked }}</div><div class="cmp-stat-lbl">Sacked</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val partial">{{ appointmentCounts.resigned }}</div><div class="cmp-stat-lbl">Resigned</div></div>
        </div>
        <div class="cmp-list">
          <PromiseCard v-for="a in filteredAppointments" :key="a.id" :item="{ ...a, title: a.name, category: a.role }" :field1="`${a.agency} · ${a.state} (${a.geopolitical}) · Appointed ${a.appointed}`" :field2="a.note" label1="Details" label2="Assessment" :isExpanded="expandedId === a.id" @toggle="handleToggle" />
          <div v-if="!filteredAppointments.length" class="cmp-empty">No appointments match your filters.</div>
        </div>
      </template>

      <!-- JUDGMENTS -->
      <template v-else-if="tab === 'judgments'">
        <div class="cmp-stats">
          <div class="cmp-stat"><div class="cmp-stat-val total">{{ judgments.length }}</div><div class="cmp-stat-lbl">Cases</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val broken">{{ judgmentCounts.lost }}</div><div class="cmp-stat-lbl">Govt lost</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val kept">{{ judgmentCounts.won }}</div><div class="cmp-stat-lbl">Govt won</div></div>
          <div class="cmp-stat"><div class="cmp-stat-val partial">{{ judgmentCounts.settled }}</div><div class="cmp-stat-lbl">Settled</div></div>
        </div>
        <div class="cmp-list">
          <PromiseCard
            v-for="j in filteredJudgments" :key="j.id"
            :item="{ ...j, source: '#', sourceLabel: j.court, updated: j.ruled }"
            :field1="j.issue" :field2="j.outcome"
            label1="What the case is about" label2="Ruling & compliance"
            :isExpanded="expandedId === j.id" @toggle="handleToggle"
          />
          <div v-if="!filteredJudgments.length" class="cmp-empty">No cases match your filters.</div>
        </div>
      </template>

      <!-- BUDGET -->
      <template v-else-if="tab === 'budget'">
        <BudgetView v-if="budget.length" :budgets="budget" />
        <div v-else class="cmp-empty">No budget data tracked.</div>
      </template>

      <!-- INDICATORS -->
      <template v-else-if="tab === 'indicators'">
        <IndicatorsView v-if="indicators.length" :indicators="indicators" />
        <div v-else class="cmp-empty">No indicators tracked.</div>
      </template>
    </template>
  </div>
</template>
