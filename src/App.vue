<script setup>
import { ref, computed, onMounted, watch, inject, provide, nextTick } from 'vue'
import { createT, localizePath } from './i18n/index.js'
import { matchRoute, buildPath } from './routes.js'
import { canonicalizeCategory } from './i18n/categories.js'
import PromiseCard  from './components/PromiseCard.vue'
import BudgetView      from './components/BudgetView.vue'
import IndicatorsView  from './components/IndicatorsView.vue'
import GovernorsView   from './components/GovernorsView.vue'
import CompareView     from './components/CompareView.vue'
import LandingView     from './components/LandingView.vue'
import ThemesView      from './components/ThemesView.vue'
import CorrectionForm  from './components/CorrectionForm.vue'
import { downloadScorecard } from './lib/scorecardImage.js'

// Populated server-side (entry-server.js) or client-side from
// window.__INITIAL_STATE__ (entry-client.js) — null in a plain SPA fallback.
const initial = inject('initialData', null)

// Active UI locale (Phase 1: routing/plumbing only — strings are still English
// until the Phase 2 extraction sweep). `t` translates; `lp` prefixes an
// internal path with the locale ("/tinubu" → "/ha/tinubu"). Child components
// inject `lp` for their own links.
const locale = ref(initial?.locale ?? 'en')
const t = inject('t', createT(locale.value))
const lp = (path) => localizePath(path, locale.value)
provide('t', t)
provide('lp', lp)
provide('locale', locale.value)

const VALID_TABS = new Set([
  'promises', 'ministers', 'orders', 'appointments', 'governors',
  'fraud', 'judgments', 'inherited', 'budget', 'indicators', 'bills',
])
const FEDERAL_ONLY_TABS = new Set(['bills', 'governors'])

const ADMINISTRATIONS = ref(initial?.presidents ?? [])
const federalAdmins = computed(() => ADMINISTRATIONS.value.filter(a => (a.level ?? 'federal') === 'federal'))
// Former governors stay out of the State tab (one entry per state there) but
// remain fully trackable — reachable via the "Previously" link on their
// state's current governor page. See formerGovernorsForState below.
const stateAdmins = computed(() => ADMINISTRATIONS.value.filter(a => a.level === 'state' && a.isCurrent !== false))

const viewMode = ref('single') // 'single' | 'compare'
const compareInitial = ref({ a: null, b: null, tab: 'promises' })
const headerMenuOpen = ref(false) // mobile-only hamburger for Developers/Press links

const notFound = ref(initial?.notFound ?? false)
const requestedAdmin = ref(initial?.requestedAdmin ?? null)
// Bare "/" is the neutral landing page: no administration is selected until
// the reader picks one. Everywhere else, an admin is always active.
const isLanding = ref(initial?.landing === true)
// "/themes" and "/themes/<slug>" — the recurring-commitments view. `themesData`
// is { mode:'index', list } or { mode:'lineage', theme, entries } from SSR.
const themesData = ref(initial?.themes ?? null)
const isThemes = ref(!!initial?.themes && initial?.themes.mode !== 'missing')
const activeAdmin = ref(isLanding.value || isThemes.value ? null : (initial?.admin ?? 'tinubu'))
const currentAdmin = computed(() => ADMINISTRATIONS.value.find(a => a.key === activeAdmin.value) ?? {})
const LAST_REVIEWED = computed(() => currentAdmin.value.reviewed)

// "Month YYYY" / "YYYY" → months elapsed since, or null if unparseable.
function monthsSinceLabel(s) {
  const m = String(s ?? '').trim().match(/^(?:([A-Za-z]+)\s+)?(\d{4})$/)
  if (!m) return null
  const mon = m[1]
    ? ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[1].slice(0, 3).toLowerCase())
    : 0
  if (mon === -1) return null
  const then = new Date(Number(m[2]), mon, 1)
  const now = new Date()
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth())
}
// Sitting administrations should be re-reviewed at least twice a year (see
// /guide §6). Past ~9 months the freshness indicator flips to "review due".
const REVIEW_DUE_MONTHS = 9
const reviewDue = computed(() => {
  if (currentAdmin.value.isCurrent === false) return false
  const months = monthsSinceLabel(LAST_REVIEWED.value)
  return months != null && months >= REVIEW_DUE_MONTHS
})
const isStateLevel = computed(() => currentAdmin.value.level === 'state')
const formerGovernorsForState = computed(() => {
  if (!isStateLevel.value || !currentAdmin.value.state) return []
  return ADMINISTRATIONS.value
    .filter(a => a.level === 'state' && a.isCurrent === false && a.state === currentAdmin.value.state && a.key !== currentAdmin.value.key)
    .sort((a, b) => (b.term || '').localeCompare(a.term || ''))
})
const ministerLabel = computed(() => isStateLevel.value ? t('tab.commissioners') : t('tab.ministers'))

// Drives which roster the picker panel previews when its search box is empty
// ('federal' → the presidents, 'state' → sitting governors grouped by zone).
const adminNavMode = ref(isStateLevel.value ? 'state' : 'federal')

// ── Find-an-administration search ──────────────────────
// There are 200+ tracked administrations (5 presidents, 36 sitting governors,
// and every former governor), far too many for a visible strip. The picker is
// search-first instead: this scores every administration — current and former,
// federal and state — by name, title, or state so any one of them is a single
// query away.
const adminFinderQuery = ref('')
const adminFinderInput = ref(null)
const ADMIN_FINDER_LIMIT = 12

const adminFinderResults = computed(() => {
  const q = adminFinderQuery.value.trim().toLowerCase()
  if (!q) return []
  const scored = []
  for (const a of ADMINISTRATIONS.value) {
    const haystacks = [a.name, a.title, a.state].filter(Boolean).map(s => s.toLowerCase())
    const hit = haystacks.find(h => h.includes(q))
    if (!hit) continue
    // Rank name-starts-with above name-contains above state/title-only matches.
    const nameLower = (a.name || '').toLowerCase()
    let score = 3
    if (nameLower.startsWith(q)) score = 1
    else if (nameLower.includes(q)) score = 2
    scored.push({ admin: a, score })
  }
  scored.sort((x, y) => x.score - y.score || (x.admin.name || '').localeCompare(y.admin.name || ''))
  return scored.slice(0, ADMIN_FINDER_LIMIT).map(s => s.admin)
})

function selectAdminFromFinder(admin) {
  adminNavMode.value = admin.level === 'state' ? 'state' : 'federal'
  isLanding.value = false
  activeAdmin.value = admin.key
  adminFinderQuery.value = ''
  pushRecent(admin.key)
  pickerOpen.value = false
  pickerCursor.value = -1
  adminFinderInput.value?.blur()
}

function submitAdminFinder() {
  if (adminFinderResults.value.length) selectAdminFromFinder(adminFinderResults.value[0])
}

// Leaving the landing page for a specific administration. The activeAdmin
// watcher loads that admin's data and syncs the URL; if it somehow already
// holds this key, load explicitly so the (empty) landing payload is replaced.
function goToAdminFromLanding(key) {
  isLanding.value = false
  if (activeAdmin.value === key) { loadData(key); syncUrl() }
  else activeAdmin.value = key
  if (typeof window !== 'undefined') window.scrollTo(0, 0)
}

// ── Command-bar picker ────────────────────────────────
// A persistent search field with a dropdown panel: search hits (split
// Federal / State), or — with an empty box — a preview of the roster for the
// active Federal/State mode, presidents flat and governors grouped by
// Nigeria's six geopolitical zones. A short "recent" list is kept per browser.
const pickerOpen = ref(false)
const pickerCursor = ref(-1) // index into visiblePickerOptions for ↑/↓ nav

const NG_ZONES = {
  Benue: 'North Central', Kogi: 'North Central', Kwara: 'North Central',
  Nasarawa: 'North Central', Niger: 'North Central', Plateau: 'North Central',
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

const RECENTS_KEY = 'ngsc:recent-admins'
const RECENTS_MAX = 4
const recentAdminKeys = ref([])
const recentAdmins = computed(() =>
  recentAdminKeys.value
    .map(k => ADMINISTRATIONS.value.find(a => a.key === k))
    .filter(Boolean)
)
function pushRecent(key) {
  recentAdminKeys.value = [key, ...recentAdminKeys.value.filter(k => k !== key)].slice(0, RECENTS_MAX)
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(recentAdminKeys.value)) } catch { /* private mode — skip */ }
}

const pickerPlaceholder = computed(() => {
  const n = ADMINISTRATIONS.value.length
  return n ? t('picker.placeholder', { n }) : t('picker.placeholderShort')
})

const pickerGroups = computed(() => {
  if (adminFinderQuery.value.trim()) {
    const fed = adminFinderResults.value.filter(a => a.level !== 'state')
    const st  = adminFinderResults.value.filter(a => a.level === 'state')
    const groups = []
    if (fed.length) groups.push({ label: t('picker.federal'), items: fed })
    if (st.length)  groups.push({ label: t('picker.state'), items: st })
    return groups
  }
  if (adminNavMode.value === 'federal' || !stateAdmins.value.length) {
    return [{ label: t('picker.federalPresidents'), items: federalAdmins.value }]
  }
  const byZone = NG_ZONE_ORDER
    .map(z => ({ label: t('zone.' + z), items: stateAdmins.value.filter(a => NG_ZONES[a.state] === z) }))
    .filter(g => g.items.length)
  const rest = stateAdmins.value.filter(a => !NG_ZONES[a.state])
  if (rest.length) byZone.push({ label: t('zone.Other'), items: rest })
  return byZone
})
const visiblePickerOptions = computed(() => pickerGroups.value.flatMap(g => g.items))

function openPicker() {
  if (pickerOpen.value) return
  pickerOpen.value = true
  pickerCursor.value = adminFinderQuery.value.trim() ? 0 : -1
  nextTick(() => adminFinderInput.value?.focus())
}
function closePicker() {
  pickerOpen.value = false
  pickerCursor.value = -1
  adminFinderQuery.value = ''
  adminFinderInput.value?.blur()
}
function movePickerCursor(delta) {
  const n = visiblePickerOptions.value.length
  if (!n) return
  const from = pickerCursor.value < 0 ? (delta > 0 ? -1 : 0) : pickerCursor.value
  pickerCursor.value = Math.max(0, Math.min(n - 1, from + delta))
  nextTick(() => document.querySelector('.pt-picker-opt.cursor')?.scrollIntoView({ block: 'nearest' }))
}
function onPickerKeydown(e) {
  if (e.key === 'ArrowDown')     { e.preventDefault(); movePickerCursor(1) }
  else if (e.key === 'ArrowUp')  { e.preventDefault(); movePickerCursor(-1) }
  else if (e.key === 'Enter')    {
    e.preventDefault()
    const pick = visiblePickerOptions.value[pickerCursor.value] ?? visiblePickerOptions.value[0]
    if (pick) selectAdminFromFinder(pick)
  }
  else if (e.key === 'Escape')   { e.preventDefault(); closePicker() }
}

// Reset the keyboard cursor to the first hit whenever the query changes.
watch(adminFinderQuery, () => { if (pickerOpen.value) pickerCursor.value = 0 })

const STATUSES = computed(() => [
  { key: 'all',     label: t('status.all') },
  { key: 'kept',    label: t('status.kept') },
  { key: 'partial', label: t('status.partial') },
  { key: 'broken',  label: t('status.broken') },
  { key: 'pending', label: t('status.pending') },
])

const promises     = ref(initial?.data?.promises ?? [])
const inherited    = ref(initial?.data?.inherited ?? [])
const fraud        = ref(initial?.data?.fraud ?? [])
const orders       = ref(initial?.data?.orders ?? [])
const ministers    = ref(initial?.data?.ministers ?? [])
const budget       = ref(initial?.data?.budget ?? [])
const bills        = ref(initial?.data?.bills ?? [])
const indicators   = ref(initial?.data?.indicators ?? [])
const appointments = ref(initial?.data?.appointments ?? [])
const judgments    = ref(initial?.data?.judgments ?? [])
const governors    = ref(initial?.data?.governors ?? [])
const history      = ref(initial?.data?.history ?? []) // public per-entry change log
const activeTab      = ref(initial?.tab ?? 'promises')
const activeStatus   = ref('all')
const activeCategory = ref('all')
const activeResponse = ref('all') // fraud tab: government-response filter
const searchQuery    = ref('')
const expandedId     = ref(initial?.expandedId ?? null)
const copied         = ref(false)

async function loadData(admin) {
  const get = (name) => fetch(`/api/${admin}/${name}`).then(r => r.json()).catch(() => [])
  const [p, i, f, o, m, bu, bi, ind, ap, j, g, hist] = await Promise.all([
    get('promises'), get('inherited'), get('fraud'),
    get('orders'), get('ministers'), get('budget'), get('bills'),
    get('indicators'), get('appointments'), get('judgments'), get('governors'), get('history'),
  ])
  promises.value     = p
  inherited.value    = i
  fraud.value        = f
  orders.value       = o
  ministers.value    = m
  budget.value       = bu
  bills.value        = bi
  indicators.value   = ind
  appointments.value = ap
  judgments.value    = j
  governors.value    = g
  history.value      = hist
}

// Reader "suggest a correction" modal — opened from any card's Report button.
const reportOpen = ref(false)
const reportContext = ref(null)
function openReport(ctx) {
  reportContext.value = ctx || null
  reportOpen.value = true
}

// Logged changes for one card, newest first. Empty until an editor has
// changed the entry through the admin editor.
function historyFor(item, entryTable) {
  return history.value
    .filter(h => h.entryTable === entryTable && h.entryId === item.id)
    .slice()
    .reverse()
}

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)

  // Restore the per-browser "recent administrations" list for the picker.
  try {
    const saved = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]')
    if (Array.isArray(saved)) {
      recentAdminKeys.value = saved.filter(k => typeof k === 'string').slice(0, RECENTS_MAX)
    }
  } catch { /* no/blocked storage — start empty */ }

  // ⌘K / Ctrl-K opens the administration picker from anywhere.
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      openPicker()
    }
  })

  // Compare mode is client-only: SSR always renders the normal single-admin
  // view, and — regardless of whether SSR gave us initial single-admin data
  // — we switch into compare mode here if the URL asks for it.
  if (params.get('mode') === 'compare') {
    if (!ADMINISTRATIONS.value.length) {
      const presidents = await fetch('/api/presidents').then(r => r.json()).catch(() => [])
      ADMINISTRATIONS.value = presidents.map(mapPresident)
    }
    viewMode.value = 'compare'
    compareInitial.value = {
      a: params.get('a') || ADMINISTRATIONS.value[0]?.key,
      b: params.get('b') || ADMINISTRATIONS.value[1]?.key,
      tab: params.get('tab') || 'promises',
    }
    return
  }

  // Server already rendered this exact admin/tab — nothing to fetch.
  if (!initial) {
    const presidents = await fetch('/api/presidents').then(r => r.json()).catch(() => [])
    ADMINISTRATIONS.value = presidents.map(mapPresident)

    // SPA-only bootstrap (SSR normally provides initialData). Route via the
    // shared table so path parsing matches the server exactly.
    const route = matchRoute(window.location.pathname)
    locale.value = route.locale

    if (route.name === 'home') {
      isLanding.value = true
      activeAdmin.value = null
    } else if (route.name === 'themesIndex' || route.name === 'themeLineage') {
      const url = route.name === 'themeLineage' ? `/api/themes/${route.params.slug}` : '/api/themes'
      const payload = await fetch(url).then(r => r.ok ? r.json() : null).catch(() => null)
      if (route.name === 'themeLineage') {
        themesData.value = payload ? { mode: 'lineage', slug: route.params.slug, theme: payload.theme, entries: payload.entries } : { mode: 'missing', slug: route.params.slug }
      } else {
        themesData.value = { mode: 'index', list: payload || [] }
      }
      isThemes.value = themesData.value.mode !== 'missing'
      if (!isThemes.value) { notFound.value = true; requestedAdmin.value = `themes/${route.params.slug}` }
      activeAdmin.value = null
    } else if (route.name === 'scorecard') {
      const admin = route.params.admin || params.get('admin')
      const tab = route.params.tab || params.get('tab')
      if (admin && presidents.some(p => p.key === admin)) activeAdmin.value = admin
      else if (admin) { notFound.value = true; requestedAdmin.value = admin }
      const adminLevel = presidents.find(p => p.key === activeAdmin.value)?.level
      const tabInvalidForLevel = adminLevel === 'state' && FEDERAL_ONLY_TABS.has(tab)
      if (tab && VALID_TABS.has(tab) && !tabInvalidForLevel) activeTab.value = tab
      await loadData(activeAdmin.value)
      const id = parseInt(params.get('id'))
      if (id) expandedId.value = id
    } else {
      notFound.value = true
      requestedAdmin.value = route.path.replace(/^\//, '')
    }
  }

  // Restore filter state from the URL. Runs last, and whether or not SSR gave
  // us initial data — the server always renders with default filters, and the
  // activeAdmin watcher (SPA path) resets them, so this is the final word.
  // Values aren't hard-validated: an unknown status/category just yields an
  // empty list, which the "no matches" state already handles.
  if (params.get('status')) activeStatus.value = params.get('status')
  if (params.get('cat')) activeCategory.value = params.get('cat')
  if (params.get('q')) searchQuery.value = params.get('q')
  if (params.get('response')) activeResponse.value = params.get('response')
})

function enterCompareMode() {
  const level = currentAdmin.value.level ?? 'federal'
  const sameLevelOther = ADMINISTRATIONS.value.find(a => a.key !== activeAdmin.value && (a.level ?? 'federal') === level)
  compareInitial.value = { a: activeAdmin.value, b: sameLevelOther?.key, tab: 'promises' }
  viewMode.value = 'compare'
  const url = new URL(window.location)
  url.pathname = lp('/')
  url.searchParams.set('mode', 'compare')
  url.searchParams.set('a', compareInitial.value.a)
  url.searchParams.set('b', compareInitial.value.b)
  url.searchParams.set('tab', compareInitial.value.tab)
  window.history.replaceState(null, '', url)
}

function exitCompareMode() {
  viewMode.value = 'single'
  const url = new URL(window.location)
  url.searchParams.delete('mode')
  url.searchParams.delete('a')
  url.searchParams.delete('b')
  url.searchParams.delete('tab')
  url.pathname = adminPath(activeAdmin.value, activeTab.value)
  window.history.replaceState(null, '', url)
}

function mapPresident(p) {
  return {
    key:      p.key,
    name:     p.name,
    title:    p.fullName,
    term:     p.term,
    party:    p.party,
    termStart: p.termStart,
    tagline:  p.tagline,
    reviewed: p.reviewed,
    level:    p.level,
    state:    p.state,
    isCurrent: p.isCurrent !== false,
  }
}

watch(activeAdmin, (admin) => {
  activeTab.value      = 'promises'
  activeStatus.value   = 'all'
  activeCategory.value = 'all'
  searchQuery.value    = ''
  expandedId.value     = null
  loadData(admin)
  syncUrl()
})

// ── Tab switching ─────────────────────────────────────

function switchTab(tab) {
  activeTab.value      = tab
  activeStatus.value   = 'all'
  activeCategory.value = 'all'
  activeResponse.value = 'all'
  searchQuery.value    = ''
  setExpanded(null)
  syncUrl()
}

// ── URL sync ────────────────────────────────────────────
// Keeps /admin/tab plus ?id= and the active filters
// (&status=&cat=&q=&response=) in sync with the current view so the exact
// filtered view is shareable, bookmarkable, and — since admin/tab are read
// server-side too — crawlable. `id` is managed separately by setExpanded().

// Path for the current view, via the shared route table (src/routes.js), so
// the URL the client writes matches the canonical the SSR layer declares.
function adminPath(admin, tab) {
  return admin
    ? buildPath('scorecard', { admin, tab }, locale.value)
    : buildPath('home', {}, locale.value)
}

function syncUrl() {
  if (viewMode.value === 'compare') return
  const url = new URL(window.location)
  url.pathname = adminPath(activeAdmin.value, activeTab.value)
  const setOrDrop = (key, value, dflt) => {
    if (value == null || value === dflt) url.searchParams.delete(key)
    else url.searchParams.set(key, value)
  }
  setOrDrop('status', activeStatus.value, 'all')
  setOrDrop('cat', activeCategory.value, 'all')
  setOrDrop('q', searchQuery.value.trim(), '')
  setOrDrop('response', activeResponse.value, 'all')
  window.history.replaceState(null, '', url)
}

// Filter changes are shareable too — keep the URL in step with them.
watch([activeStatus, activeCategory, searchQuery, activeResponse], syncUrl)

// "Copy link to this view" — the whole current URL (admin, tab, filters, and
// an expanded card if any).
async function copyViewLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard unavailable — silently ignore */ }
}

// "Print scorecard" — a shareable PNG built client-side from whatever this
// administration actually has tracked (see src/lib/scorecardImage.js).
// Uses the tab data already loaded in this component, not a fresh fetch.
const generatingCard = ref(false)
async function downloadCard() {
  if (generatingCard.value) return
  generatingCard.value = true
  try {
    await downloadScorecard(currentAdmin.value, {
      promises: promises.value,
      fraud: fraud.value,
      judgments: judgments.value,
      indicators: indicators.value,
      orders: orders.value,
    })
  } catch (e) {
    console.error('Scorecard generation failed', e)
  } finally {
    generatingCard.value = false
  }
}

function setExpanded(id) {
  expandedId.value = id
  const url = new URL(window.location)
  if (id) {
    url.searchParams.set('id', id)
  } else {
    url.searchParams.delete('id')
  }
  window.history.replaceState(null, '', url)
}

function handleToggle(id) {
  setExpanded(expandedId.value === id ? null : id)
}

// "See also" navigation: expand the linked promise and scroll it into view.
function goto(id) {
  setExpanded(id)
  nextTick(() => {
    document.getElementById(`pt-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// Resolve a promise's `related` id list to { id, title } targets that still
// exist in the current list. Empty for every promise until seed data uses it.
function relatedFor(p) {
  if (!Array.isArray(p.related) || !p.related.length) return []
  return p.related
    .map(id => promises.value.find(x => x.id === id))
    .filter(Boolean)
    .map(x => ({ id: x.id, title: x.title }))
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

// True when the promises list is narrowed by search, status, or category —
// drives the "showing N of M" line.
const promisesFiltered = computed(() =>
  activeStatus.value !== 'all' || activeCategory.value !== 'all' || searchQuery.value.trim() !== ''
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

const FRAUD_STATUSES = computed(() => [
  { key: 'all',       label: t('status.all') },
  { key: 'convicted', label: t('status.convicted') },
  { key: 'ongoing',   label: t('status.ongoing') },
  { key: 'dismissed', label: t('status.dismissed') },
  { key: 'acquitted', label: t('status.acquitted') },
])

const FRAUD_RESPONSES = computed(() => [
  { key: 'all',       label: t('response.all') },
  { key: 'pursuing',  label: t('response.pursuing') },
  { key: 'stalled',   label: t('response.stalled') },
  { key: 'political', label: t('response.political') },
  { key: 'abandoned', label: t('response.abandoned') },
  { key: 'complied',  label: t('response.complied') },
])

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

const ORDER_STATUSES = computed(() => [
  { key: 'all',         label: t('status.all') },
  { key: 'implemented', label: t('status.implemented') },
  { key: 'partial',     label: t('status.partial') },
  { key: 'reversed',    label: t('status.reversed') },
  { key: 'ignored',     label: t('status.ignored') },
])

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

const MINISTER_STATUSES = computed(() => [
  { key: 'all',      label: t('status.all') },
  { key: 'good',     label: t('status.good') },
  { key: 'fair',     label: t('status.fair') },
  { key: 'poor',     label: t('status.poor') },
  { key: 'sacked',   label: t('status.sacked') },
  { key: 'resigned', label: t('status.resigned') },
])

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

const BILL_STATUSES = computed(() => [
  { key: 'all',       label: t('status.all') },
  { key: 'passed',    label: t('status.passed') },
  { key: 'partial',   label: t('status.partial') },
  { key: 'pending',   label: t('stats.pending') },
  { key: 'abandoned', label: t('status.abandoned') },
])

const billCategories = computed(() =>
  [...new Set(bills.value.map(b => b.category))].sort()
)

const billCounts = computed(() => {
  const c = { passed: 0, partial: 0, pending: 0, abandoned: 0 }
  bills.value.forEach(b => { if (c[b.status] !== undefined) c[b.status]++ })
  return c
})

// ── Appointments tab ──────────────────────────────────

const APPOINTMENT_STATUSES = computed(() => [
  { key: 'all',      label: t('status.all') },
  { key: 'serving',  label: t('status.serving') },
  { key: 'resigned', label: t('status.resigned') },
  { key: 'sacked',   label: t('status.sacked') },
])

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

const JUDGMENT_STATUSES = computed(() => [
  { key: 'all',     label: t('status.all') },
  { key: 'lost',    label: t('status.lost') },
  { key: 'won',     label: t('status.won') },
  { key: 'settled', label: t('status.settled') },
  { key: 'ongoing', label: t('status.ongoing') },
])

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
      <div class="pt-header-brand">
        <a :href="lp('/')" class="pt-header-home" :aria-label="t('header.home')">
          <div class="pt-crest" aria-hidden="true">NG</div>
          <div>
            <div class="pt-eyebrow">{{ t('header.eyebrow') }}</div>
            <h1 class="pt-headline">NGScorecard</h1>
          </div>
        </a>
        <div class="pt-header-links">
          <a href="/guide" class="pt-header-docs-link">{{ t('header.guide') }}</a>
          <a href="/developers" class="pt-header-docs-link">{{ t('header.developers') }}</a>
          <a href="/press" class="pt-header-docs-link">{{ t('header.press') }}</a>
        </div>
        <div class="pt-header-menu">
          <button
            class="pt-header-menu-btn"
            :aria-label="t('header.moreLinks')"
            :aria-expanded="headerMenuOpen"
            @click="headerMenuOpen = !headerMenuOpen"
          >☰</button>
          <template v-if="headerMenuOpen">
            <div class="pt-header-menu-backdrop" @click="headerMenuOpen = false"></div>
            <div class="pt-header-menu-panel">
              <a href="/guide" class="pt-header-menu-link" @click="headerMenuOpen = false">{{ t('header.guide') }}</a>
              <a href="/developers" class="pt-header-menu-link" @click="headerMenuOpen = false">{{ t('header.developers') }}</a>
              <a href="/press" class="pt-header-menu-link" @click="headerMenuOpen = false">{{ t('header.press') }}</a>
            </div>
          </template>
        </div>
        <div v-if="!notFound && formerGovernorsForState.length" class="pt-admin-summary">
          <span class="pt-prev-gov-label">{{ t('header.previouslyIn', { state: currentAdmin.state }) }}</span>
          <button
            v-for="g in formerGovernorsForState"
            :key="g.key"
            class="pt-prev-gov-link"
            @click="activeAdmin = g.key"
          >{{ g.name }} ({{ g.term }})</button>
        </div>
        <div v-if="viewMode === 'single' && !notFound && !isLanding && !isThemes" class="pt-view-actions">
          <button class="pt-compare-btn" @click="enterCompareMode">{{ t('viewActions.compare') }}</button>
          <button
            class="pt-viewlink-btn"
            @click="copyViewLink"
            :title="t('viewActions.copyLinkTitle')"
          >{{ t('viewActions.copyLink') }}</button>
          <button
            class="pt-viewlink-btn"
            :disabled="generatingCard"
            @click="downloadCard"
            :title="t('viewActions.printTitle')"
          >{{ generatingCard ? t('viewActions.generating') : t('viewActions.printScorecard') }}</button>
        </div>
      </div>
      <div v-if="viewMode === 'single' && !notFound" class="pt-picker">
        <div class="pt-picker-bar">
          <div :class="['pt-picker-field', { open: pickerOpen }]">
            <span class="pt-picker-mag" aria-hidden="true">⌕</span>
            <button
              v-show="!pickerOpen"
              type="button"
              class="pt-picker-trigger"
              :aria-label="isLanding ? t('picker.findAdmin') : t('picker.changeAdmin', { name: currentAdmin.title || currentAdmin.name })"
              @click="openPicker"
            >
              <template v-if="isLanding">
                <span class="pt-picker-trigger-name">{{ t('picker.findAdmin') }}</span>
                <span class="pt-picker-trigger-meta">{{ t('picker.triggerMeta', { n: ADMINISTRATIONS.length }) }}</span>
              </template>
              <template v-else>
                <span class="pt-picker-trigger-label">{{ t('picker.viewing') }}</span>
                <span class="pt-picker-trigger-name">{{ currentAdmin.title || currentAdmin.name }}</span>
                <span class="pt-picker-trigger-meta">{{ isStateLevel ? t('picker.stateLabel', { state: currentAdmin.state }) : t('picker.federalLabel') }} · {{ currentAdmin.term }}</span>
              </template>
            </button>
            <input
              v-show="pickerOpen"
              ref="adminFinderInput"
              v-model="adminFinderQuery"
              type="text"
              class="pt-picker-input"
              :placeholder="pickerPlaceholder"
              :aria-label="t('picker.findByName')"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="pt-picker-panel"
              :aria-expanded="pickerOpen"
              :aria-activedescendant="pickerOpen && visiblePickerOptions[pickerCursor] ? `pt-picker-opt-${visiblePickerOptions[pickerCursor].key}` : null"
              @focus="openPicker"
              @keydown="onPickerKeydown"
            />
            <kbd v-if="!pickerOpen" class="pt-picker-kbd" aria-hidden="true">⌘K</kbd>
            <button
              v-if="pickerOpen && adminFinderQuery"
              type="button"
              class="pt-picker-clear"
              :aria-label="t('picker.clearSearch')"
              @click="adminFinderQuery = ''"
            >✕</button>
          </div>
          <div v-if="recentAdmins.length && !pickerOpen" class="pt-picker-recents">
            <span class="pt-picker-recents-label">{{ t('picker.recent') }}</span>
            <button
              v-for="a in recentAdmins"
              :key="a.key"
              :class="['pt-picker-chip', { active: activeAdmin === a.key }]"
              @click="selectAdminFromFinder(a)"
            >{{ a.level === 'state' ? `${a.name} · ${a.state}` : a.name }}</button>
          </div>
        </div>

        <template v-if="pickerOpen">
          <div class="pt-picker-backdrop" @click="closePicker"></div>
          <div id="pt-picker-panel" class="pt-picker-panel" role="dialog" :aria-label="t('picker.chooseAdmin')">
            <div class="pt-picker-panel-head">
              <div v-if="stateAdmins.length && !adminFinderQuery.trim()" class="pt-admin-mode-tabs" role="tablist" :aria-label="t('picker.govLevel')">
                <button
                  role="tab"
                  :aria-selected="adminNavMode === 'federal'"
                  :class="['pt-admin-mode-tab', { active: adminNavMode === 'federal' }]"
                  @click="adminNavMode = 'federal'"
                >{{ t('picker.federal') }}</button>
                <button
                  role="tab"
                  :aria-selected="adminNavMode === 'state'"
                  :class="['pt-admin-mode-tab', { active: adminNavMode === 'state' }]"
                  @click="adminNavMode = 'state'"
                >{{ t('picker.state') }}</button>
              </div>
              <span v-else class="pt-picker-scope">{{ t('picker.searchResults') }}</span>
              <span class="pt-picker-count">{{ t('picker.shown', { n: visiblePickerOptions.length }) }}</span>
            </div>
            <div class="pt-picker-list" role="listbox" :aria-label="t('picker.chooseAdmin')" @mousedown.prevent>
              <template v-for="g in pickerGroups" :key="g.label">
                <div class="pt-picker-group-label" role="presentation">{{ g.label }}</div>
                <button
                  v-for="a in g.items"
                  :id="`pt-picker-opt-${a.key}`"
                  :key="a.key"
                  type="button"
                  role="option"
                  :aria-selected="activeAdmin === a.key"
                  :class="['pt-picker-opt', {
                    cursor: visiblePickerOptions[pickerCursor]?.key === a.key,
                    active: activeAdmin === a.key,
                  }]"
                  @click="selectAdminFromFinder(a)"
                  @mouseenter="pickerCursor = visiblePickerOptions.findIndex(o => o.key === a.key)"
                >
                  <span class="pt-picker-opt-name">{{ a.name }}</span>
                  <span class="pt-picker-opt-meta">
                    <template v-if="a.level === 'state'">{{ a.state }} · </template>{{ a.term }}
                    <span v-if="!a.isCurrent" class="pt-admin-finder-badge">{{ t('picker.former') }}</span>
                  </span>
                </button>
              </template>
              <div v-if="!visiblePickerOptions.length" class="pt-admin-finder-empty">
                {{ t('picker.noMatch', { q: adminFinderQuery }) }}
              </div>
            </div>
            <div class="pt-picker-foot">
              <span><kbd>↑</kbd><kbd>↓</kbd> {{ t('picker.keyMove') }}</span>
              <span><kbd>↵</kbd> {{ t('picker.keyOpen') }}</span>
              <span><kbd>esc</kbd> {{ t('picker.keyClose') }}</span>
            </div>
          </div>
        </template>
      </div>
      <!-- Mobile-only section nav -->
      <select v-if="viewMode === 'single' && !notFound && !isLanding && !isThemes" class="pt-mobile-nav" v-model="activeTab" @change="switchTab($event.target.value)">
        <optgroup :label="t('nav.group.government')">
          <option value="promises">{{ t('tab.promises') }}</option>
          <option value="ministers">{{ ministerLabel }}</option>
          <option value="orders">{{ t('tab.orders') }}</option>
          <option value="appointments">{{ t('tab.appointments') }}</option>
          <option v-if="!isStateLevel" value="governors">{{ t('tab.governors') }}</option>
        </optgroup>
        <optgroup :label="t('nav.group.accountability')">
          <option value="fraud">{{ t('tab.fraud') }}</option>
          <option value="judgments">{{ t('tab.judgments') }}</option>
          <option value="inherited">{{ t('tab.inherited') }}</option>
        </optgroup>
        <optgroup :label="t('nav.group.economy')">
          <option value="budget">{{ t('tab.budget') }}</option>
          <option value="indicators">{{ t('tab.indicators') }}</option>
        </optgroup>
        <optgroup v-if="!isStateLevel" :label="t('nav.group.legislature')">
          <option value="bills">{{ t('tab.bills') }}</option>
        </optgroup>
      </select>
    </header>

    <!-- ── Not found: the URL's admin segment matches no tracked
         administration (see server/entry-server.js's notFound flag) ── -->
    <div v-if="notFound" class="pt-notfound">
      <div class="pt-notfound-card">
        <div class="pt-eyebrow">{{ t('notFound.eyebrow') }}</div>
        <h2>{{ t('notFound.heading', { key: requestedAdmin }) }}</h2>
        <p>{{ t('notFound.body') }}</p>
        <div class="pt-admin-finder pt-notfound-finder">
          <input
            v-model="adminFinderQuery"
            type="text"
            class="pt-admin-finder-input"
            :placeholder="t('picker.finderPlaceholder')"
            :aria-label="t('picker.finderAria')"
            @keydown.enter.prevent="submitAdminFinder"
          >
          <div v-if="adminFinderQuery.trim()" class="pt-admin-finder-results" @mousedown.prevent>
            <button
              v-for="a in adminFinderResults"
              :key="a.key"
              type="button"
              class="pt-admin-finder-result"
              @click="selectAdminFromFinder(a); notFound = false"
            >
              <span class="pt-admin-finder-result-name">{{ a.name }}</span>
              <span class="pt-admin-finder-result-meta">
                <template v-if="a.level === 'state'">{{ a.state }} · </template>{{ a.term }}
                <span v-if="!a.isCurrent" class="pt-admin-finder-badge">{{ t('picker.former') }}</span>
              </span>
            </button>
            <div v-if="!adminFinderResults.length" class="pt-admin-finder-empty">{{ t('picker.noMatch', { q: adminFinderQuery }) }}</div>
          </div>
        </div>
        <a :href="lp('/')" class="pt-notfound-home">{{ t('notFound.backHome') }}</a>
      </div>
    </div>

    <!-- ── Compare mode ── -->
    <CompareView
      v-else-if="viewMode === 'compare'"
      :presidents="ADMINISTRATIONS"
      :initialA="compareInitial.a"
      :initialB="compareInitial.b"
      :initialTab="compareInitial.tab"
      @exit="exitCompareMode"
    />

    <!-- ── Neutral landing page (bare "/") ── -->
    <LandingView
      v-else-if="isLanding"
      :administrations="ADMINISTRATIONS"
      @select="goToAdminFromLanding"
      @open-picker="openPicker"
    />

    <!-- ── Recurring commitments ("/themes", "/themes/<slug>") ── -->
    <ThemesView v-else-if="isThemes" :data="themesData" />

    <!-- ── Body: sidebar + content ── -->
    <div v-else class="pt-body">

      <!-- ── Sidebar (section nav only) ── -->
      <aside class="pt-sidebar">
        <nav class="pt-nav">
          <div class="pt-nav-group">
            <div class="pt-nav-group-label">{{ t('nav.group.government') }}</div>
            <button :class="['pt-nav-btn', { active: activeTab === 'promises' }]"     @click="switchTab('promises')">{{ t('tab.promises') }} <span class="pt-nav-count">{{ promises.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'ministers' }]"    @click="switchTab('ministers')">{{ ministerLabel }} <span class="pt-nav-count">{{ ministers.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'orders' }]"       @click="switchTab('orders')">{{ t('tab.orders') }} <span class="pt-nav-count">{{ orders.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'appointments' }]" @click="switchTab('appointments')">{{ t('tab.appointments') }} <span class="pt-nav-count">{{ appointments.length }}</span></button>
            <button v-if="!isStateLevel" :class="['pt-nav-btn', { active: activeTab === 'governors' }]"    @click="switchTab('governors')">{{ t('tab.governors') }} <span class="pt-nav-count">{{ governors.length }}</span></button>
          </div>

          <div class="pt-nav-group">
            <div class="pt-nav-group-label">{{ t('nav.group.accountability') }}</div>
            <button :class="['pt-nav-btn', { active: activeTab === 'fraud' }]"     @click="switchTab('fraud')">{{ t('tab.fraud') }} <span class="pt-nav-count">{{ fraud.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'judgments' }]" @click="switchTab('judgments')">{{ t('tab.judgments') }} <span class="pt-nav-count">{{ judgments.length }}</span></button>
            <button :class="['pt-nav-btn', { active: activeTab === 'inherited' }]" @click="switchTab('inherited')">{{ t('tab.inherited') }} <span class="pt-nav-count">{{ inherited.length }}</span></button>
          </div>

          <div class="pt-nav-group">
            <div class="pt-nav-group-label">{{ t('nav.group.economy') }}</div>
            <button :class="['pt-nav-btn', { active: activeTab === 'budget' }]"     @click="switchTab('budget')">{{ t('tab.budget') }}</button>
            <button :class="['pt-nav-btn', { active: activeTab === 'indicators' }]" @click="switchTab('indicators')">{{ t('tab.indicators') }}</button>
          </div>

          <div v-if="!isStateLevel" class="pt-nav-group">
            <div class="pt-nav-group-label">{{ t('nav.group.legislature') }}</div>
            <button :class="['pt-nav-btn', { active: activeTab === 'bills' }]" @click="switchTab('bills')">{{ t('tab.bills') }} <span class="pt-nav-count">{{ bills.length }}</span></button>
          </div>
        </nav>

        <div :class="['pt-sidebar-footer', { 'review-due': reviewDue }]">
          <span class="pt-freshness-dot"></span>
          <template v-if="reviewDue">{{ t('freshness.reviewDue') }} <strong>{{ LAST_REVIEWED }}</strong></template>
          <template v-else>{{ t('freshness.updated') }} <strong>{{ LAST_REVIEWED }}</strong></template>
          <span class="pt-sidebar-footer-sub">{{ t('freshness.sourcesPrefix') }}<a href="/guide#methodology">{{ t('freshness.howReviewed') }}</a></span>
        </div>
      </aside>

      <!-- ── Main content ── -->
      <main class="pt-content">

      <!-- Copied toast -->
      <Transition name="toast">
        <div v-if="copied" class="pt-toast">{{ t('viewActions.linkCopied') }}</div>
      </Transition>

      <!-- Suggest-a-correction modal -->
      <div v-if="reportOpen" class="pt-modal-backdrop" @click.self="reportOpen = false">
        <div class="pt-modal" role="dialog" aria-modal="true">
          <CorrectionForm :context="reportContext" @close="reportOpen = false" />
        </div>
      </div>

    <!-- ── PROMISES TAB ── -->
    <template v-if="activeTab === 'promises'">

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ promiseTotal }}</div>
          <div class="pt-stat-label">{{ t('stats.totalTracked') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ promiseCounts.kept }}</div>
          <div class="pt-stat-label">{{ t('stats.kept') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ promiseCounts.partial }}</div>
          <div class="pt-stat-label">{{ t('stats.partialMixed') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ promiseCounts.broken }}</div>
          <div class="pt-stat-label">{{ t('stats.broken') }}</div>
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
          <div class="pt-legend-item"><span class="pt-legend-dot kept"></span> {{ t('legend.kept') }}</div>
          <div class="pt-legend-item"><span class="pt-legend-dot partial"></span> {{ t('legend.partialMixed') }}</div>
          <div class="pt-legend-item"><span class="pt-legend-dot broken"></span> {{ t('legend.broken') }}</div>
          <div class="pt-legend-item"><span class="pt-legend-dot pending"></span> {{ t('legend.pending') }}</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="pt-controls">
        <input
          v-model="searchQuery"
          type="text"
          class="pt-search"
          :placeholder="t('search.promises')"
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
          <option value="all">{{ t('filter.allCategories') }}</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ t('category.' + canonicalizeCategory(cat)) }}</option>
        </select>
      </div>

      <div v-if="promisesFiltered" class="pt-result-count">
        {{ t('result.showing', { n: filteredPromises.length, m: promises.length }) }}
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="p in filteredPromises"
          :key="p.id"
          :id="`pt-card-${p.id}`"
          :item="p"
          :history="historyFor(p, 'promises')"
          entry-table="promises"
          @report="openReport"
          :field1="p.promise"
          :field2="p.assessment"
          :label1="t('card.label.thePromise')"
          :label2="t('card.label.assessment')"
          :related="relatedFor(p)"
          :isExpanded="expandedId === p.id"
          @toggle="handleToggle"
          @share="handleShare"
          @goto="goto"
        />
        <div v-if="!filteredPromises.length" class="pt-empty">
          {{ t('empty.promises') }}
        </div>
      </div>
    </template>

    <!-- ── INHERITED TAB ── -->
    <template v-else-if="activeTab === 'inherited'">

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ inheritedCounts.total }}</div>
          <div class="pt-stat-label">{{ t('stats.inheritedProblems') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ inheritedCounts.fixed }}</div>
          <div class="pt-stat-label">{{ t('stats.fixed') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ inheritedCounts.partial }}</div>
          <div class="pt-stat-label">{{ t('stats.partialProgress') }}</div>
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
          :history="historyFor(p, 'inherited')"
          entry-table="inherited"
          @report="openReport"
          :field1="p.problem"
          :field2="p.resolution"
          :label1="t('card.label.theProblem')"
          :label2="t('card.label.whatWasDone')"
          :isExpanded="expandedId === p.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
      </div>
    </template>

    <!-- ── FRAUD TAB ── -->
    <template v-else-if="activeTab === 'fraud'">

      <div class="pt-fraud-intro">
        Documented cases of fraud, corruption, and financial misconduct by
        {{ isStateLevel ? `${currentAdmin.state} State` : 'Nigerian federal' }}
        government officials and agencies during the {{ currentAdmin.term }} term.
        Sources linked on each card.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ fraud.length }}</div>
          <div class="pt-stat-label">{{ t('stats.totalCases') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ fraudCounts.convicted }}</div>
          <div class="pt-stat-label">{{ t('stats.convicted') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value pending">{{ fraudCounts.ongoing }}</div>
          <div class="pt-stat-label">{{ t('stats.ongoing') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ fraudCounts.dismissed }}</div>
          <div class="pt-stat-label">{{ t('stats.dismissed') }}</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="pt-controls">
        <input
          v-model="searchQuery"
          type="text"
          class="pt-search"
          :placeholder="t('search.cases')"
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
          <option value="all">{{ t('filter.allCategories') }}</option>
          <option v-for="cat in fraudCategories" :key="cat" :value="cat">{{ t('category.' + canonicalizeCategory(cat)) }}</option>
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
          :history="historyFor(f, 'fraud')"
          entry-table="fraud"
          @report="openReport"
          :field1="f.allegation"
          :field2="f.outcome"
          :field3="f.govtResponse"
          :label1="t('card.label.allegation')"
          :label2="t('card.label.outcomeStatus')"
          :label3="t('card.label.administrationResponse')"
          :isExpanded="expandedId === f.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredFraud.length" class="pt-empty">
          {{ t('empty.cases') }}
        </div>
      </div>
    </template>

    <!-- ── ORDERS & POLICY TAB ── -->
    <template v-else-if="activeTab === 'orders'">

      <div class="pt-tab-intro">
        Executive orders, {{ isStateLevel ? 'gubernatorial' : 'presidential' }} directives, and major policy decisions issued
        during the {{ currentAdmin.term }} term — tracked from announcement through to real-world effect.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ orders.length }}</div>
          <div class="pt-stat-label">{{ t('stats.totalOrders') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ orderCounts.implemented }}</div>
          <div class="pt-stat-label">{{ t('stats.implemented') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ orderCounts.partial }}</div>
          <div class="pt-stat-label">{{ t('stats.partial') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ orderCounts.reversed }}</div>
          <div class="pt-stat-label">{{ t('stats.reversed') }}</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" :placeholder="t('search.orders')" />
        <div class="pt-filter-group">
          <button
            v-for="s in ORDER_STATUSES" :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">{{ t('filter.allCategories') }}</option>
          <option v-for="cat in orderCategories" :key="cat" :value="cat">{{ t('category.' + canonicalizeCategory(cat)) }}</option>
        </select>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="o in filteredOrders" :key="o.id"
          :item="o"
          :history="historyFor(o, 'orders')"
          entry-table="orders"
          @report="openReport"
          :field1="o.directive"
          :field2="o.effect"
          :label1="t('card.label.theDirective')"
          :label2="t('card.label.realWorldEffect')"
          :isExpanded="expandedId === o.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredOrders.length" class="pt-empty">{{ t('empty.orders') }}</div>
      </div>
    </template>

    <!-- ── MINISTERS TAB ── -->
    <template v-else-if="activeTab === 'ministers'">

      <div class="pt-tab-intro">
        Performance scorecard for key {{ isStateLevel ? 'state commissioners' : 'cabinet ministers' }} — assessed against their stated
        mandate and verified deliverables. Ratings reflect independent assessment as of April 2026.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ ministers.length }}</div>
          <div class="pt-stat-label">{{ t('stats.labelTracked', { label: ministerLabel }) }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ ministerCounts.good }}</div>
          <div class="pt-stat-label">{{ t('stats.good') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ ministerCounts.fair }}</div>
          <div class="pt-stat-label">{{ t('stats.fair') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ ministerCounts.poor }}</div>
          <div class="pt-stat-label">{{ t('stats.poor') }}</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" :placeholder="t('search.label', { label: ministerLabel.toLowerCase() })" />
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
          :history="historyFor(m, 'ministers')"
          entry-table="ministers"
          @report="openReport"
          :field1="m.mandate"
          :field2="m.performance"
          :label1="t('card.label.mandate')"
          :label2="t('card.label.performanceAssessment')"
          :isExpanded="expandedId === m.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredMinisters.length" class="pt-empty">{{ t('empty.ministers', { label: ministerLabel.toLowerCase() }) }}</div>
      </div>
    </template>

    <!-- ── BUDGET TAB ── -->
    <template v-else-if="activeTab === 'budget'">

      <div class="pt-tab-intro">
        {{ isStateLevel ? `${currentAdmin.state} State` : 'Federal' }} budget allocation versus actual release rates by ministry.
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
          <div class="pt-stat-label">{{ t('stats.billsTracked') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ billCounts.passed }}</div>
          <div class="pt-stat-label">{{ t('stats.passed') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value pending">{{ billCounts.pending }}</div>
          <div class="pt-stat-label">{{ t('stats.pending') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ billCounts.abandoned }}</div>
          <div class="pt-stat-label">{{ t('stats.abandoned') }}</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" :placeholder="t('search.bills')" />
        <div class="pt-filter-group">
          <button
            v-for="s in BILL_STATUSES" :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">{{ t('filter.allCategories') }}</option>
          <option v-for="cat in billCategories" :key="cat" :value="cat">{{ t('category.' + canonicalizeCategory(cat)) }}</option>
        </select>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="b in filteredBills" :key="b.id"
          :item="b"
          :history="historyFor(b, 'bills')"
          entry-table="bills"
          @report="openReport"
          :field1="b.summary"
          :field2="b.outcome"
          :label1="t('card.label.whatItProposes')"
          :label2="t('card.label.outcome')"
          :isExpanded="expandedId === b.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredBills.length" class="pt-empty">{{ t('empty.bills') }}</div>
      </div>
    </template>

    <!-- ── INDICATORS TAB ── -->
    <template v-else-if="activeTab === 'indicators'">
      <div class="pt-tab-intro">
        Key {{ isStateLevel ? 'state' : 'economic' }} metrics tracked across the {{ currentAdmin.term }} term —
        {{ indicators.map(i => i.label.toLowerCase()).join(', ') || 'no indicators tracked yet' }}.
        Context for every other tab on this site.
      </div>
      <IndicatorsView :indicators="indicators" />
    </template>

    <!-- ── APPOINTMENTS TAB ── -->
    <template v-else-if="activeTab === 'appointments'">
      <div class="pt-tab-intro" v-if="isStateLevel">
        Key gubernatorial appointments beyond the cabinet — agency heads, security
        commanders, and judiciary appointments — and how they've performed.
      </div>
      <div class="pt-tab-intro" v-else>
        Key presidential appointments — who was picked, from where, and how they've
        performed. Tracks state-of-origin patterns and whether appointees delivered.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ appointments.length }}</div>
          <div class="pt-stat-label">{{ t('stats.tracked') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ appointments.filter(a => a.status === 'serving').length }}</div>
          <div class="pt-stat-label">{{ t('stats.stillServing') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ appointments.filter(a => a.status === 'sacked').length }}</div>
          <div class="pt-stat-label">{{ t('status.sacked') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ appointments.filter(a => a.status === 'resigned').length }}</div>
          <div class="pt-stat-label">{{ t('status.resigned') }}</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" :placeholder="t('search.appointments')" />
        <div class="pt-filter-group">
          <button
            v-for="s in APPOINTMENT_STATUSES" :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">{{ t('filter.allCategories') }}</option>
          <option v-for="cat in appointmentCategories" :key="cat" :value="cat">{{ t('category.' + canonicalizeCategory(cat)) }}</option>
        </select>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="a in filteredAppointments" :key="a.id"
          :item="{ ...a, title: a.name, category: a.role }"
          :history="historyFor(a, 'appointments')"
          entry-table="appointments"
          @report="openReport"
          :field1="`${a.agency} · ${a.state} (${a.geopolitical}) · Appointed ${a.appointed}`"
          :field2="a.note"
          :label1="t('card.label.details')"
          :label2="t('card.label.assessment')"
          :isExpanded="expandedId === a.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredAppointments.length" class="pt-empty">{{ t('empty.appointments') }}</div>
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
        Key court cases involving the {{ isStateLevel ? `${currentAdmin.state} State` : 'federal' }} government — tracking wins, losses,
        and critically, whether court orders are actually complied with.
      </div>

      <div class="pt-stats">
        <div class="pt-stat">
          <div class="pt-stat-value total">{{ judgments.length }}</div>
          <div class="pt-stat-label">{{ t('stats.casesTracked') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value broken">{{ judgmentCounts.lost }}</div>
          <div class="pt-stat-label">{{ t('stats.govtLost') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value kept">{{ judgmentCounts.won }}</div>
          <div class="pt-stat-label">{{ t('stats.govtWon') }}</div>
        </div>
        <div class="pt-stat">
          <div class="pt-stat-value partial">{{ judgmentCounts.settled }}</div>
          <div class="pt-stat-label">{{ t('stats.settled') }}</div>
        </div>
      </div>

      <div class="pt-controls">
        <input v-model="searchQuery" type="text" class="pt-search" :placeholder="t('search.cases')" />
        <div class="pt-filter-group">
          <button
            v-for="s in JUDGMENT_STATUSES" :key="s.key"
            :class="['pt-filter-btn', { active: activeStatus === s.key }]"
            @click="activeStatus = s.key"
          >{{ s.label }}</button>
        </div>
        <select v-model="activeCategory" class="pt-cat-filter">
          <option value="all">{{ t('filter.allCategories') }}</option>
          <option v-for="cat in judgmentCategories" :key="cat" :value="cat">{{ t('category.' + canonicalizeCategory(cat)) }}</option>
        </select>
      </div>

      <div class="pt-list">
        <PromiseCard
          v-for="j in filteredJudgments" :key="j.id"
          :item="{ ...j, title: j.title, category: j.category,
                   updated: j.ruled, source: '#', sourceLabel: j.court }"
          :history="historyFor(j, 'judgments')"
          entry-table="judgments"
          @report="openReport"
          :field1="j.issue"
          :field2="j.outcome"
          :label1="t('card.label.caseAbout')"
          :label2="t('card.label.rulingCompliance')"
          :isExpanded="expandedId === j.id"
          @toggle="handleToggle"
          @share="handleShare"
        />
        <div v-if="!filteredJudgments.length" class="pt-empty">{{ t('empty.cases') }}</div>
      </div>
    </template>

      </main>
    </div><!-- .pt-body -->
  </div><!-- .pt-layout -->
</template>
