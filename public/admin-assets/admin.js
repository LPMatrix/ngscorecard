// NGScorecard admin dashboard. Markup: public/admin.html, styles: admin.css.
(function () {
  'use strict'

  var STATUS_OPTIONS = {
    inherited: ['broken', 'disputed', 'fixed', 'ongoing', 'partial', 'pending'],
    fraud: ['abated', 'acquitted', 'convicted', 'debunked', 'denied', 'dismissed', 'disputed', 'investigating', 'ongoing', 'pending', 'prosecuted', 'resolved'],
    orders: ['ignored', 'implemented', 'partial', 'reversed'],
    ministers: ['fair', 'good', 'poor', 'resigned', 'sacked'],
    bills: ['abandoned', 'partial', 'passed', 'pending'],
    appointments: ['completed', 'deceased', 'defected', 'reinstated', 'resigned', 'retired', 'sacked', 'served', 'serving'],
    judgments: ['lost', 'ongoing', 'settled', 'won'],
    governors: ['completed', 'deceased', 'removed', 'serving'],
    projects: ['completed', 'ongoing', 'stalled', 'abandoned'],
  }

  function statusField(table, required) {
    return { key: 'status', label: 'Status', type: 'status', options: STATUS_OPTIONS[table] || [], required: required !== false }
  }

  // Tables whose edits are written to the public entry_history log.
  var HISTORY_TABLES = new Set(['promises', 'inherited', 'fraud', 'orders', 'ministers', 'bills', 'judgments', 'appointments', 'projects'])

  // Source tier (methodology §6). Blank = unclassified (frontend falls back to
  // the .gov URL check). 'weak' flags a source as insufficient on its own.
  function sourceTierField() {
    return {
      key: 'sourceTier', label: 'Source tier', type: 'select',
      options: ['', 'official', 'reporting', 'analysis', 'weak'],
      hint: 'official = govt/primary · reporting = established news · analysis = expert/CSO · weak = flagged',
    }
  }

  var TABLES = {
    presidents: {
      label: 'Administrations', adminScoped: false,
      list: ['key', 'name', 'level', 'state', 'termStart', 'termEnd'],
      columns: [
        { key: 'key', label: 'Key', type: 'text', required: true, hint: 'e.g. "tinubu" — used in URLs and every other table\'s administration field' },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'fullName', label: 'Full name', type: 'text', required: true },
        { key: 'termStart', label: 'Term start', type: 'text', required: true, hint: 'YYYY-MM-DD' },
        { key: 'termEnd', label: 'Term end', type: 'text', hint: 'blank = still serving' },
        { key: 'tagline', label: 'Tagline', type: 'text', required: true },
        { key: 'party', label: 'Party', type: 'text' },
        { key: 'reviewed', label: 'Last reviewed', type: 'text', required: true, hint: 'YYYY-MM-DD' },
        { key: 'level', label: 'Level', type: 'select', required: true, options: ['federal', 'state'] },
        { key: 'state', label: 'State', type: 'text', hint: 'governors only, e.g. "Oyo"' },
      ],
    },
    promises: {
      label: 'Promises', adminScoped: true,
      list: ['title', 'category', 'status', 'updated'],
      columns: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', required: true, options: ['kept', 'partial', 'broken', 'pending', 'unassessed'] },
        { key: 'promise', label: 'Promise (verbatim)', type: 'textarea', required: true },
        { key: 'assessment', label: 'Assessment', type: 'textarea', required: true },
        { key: 'source', label: 'Source URL', type: 'text', required: true },
        { key: 'sourceLabel', label: 'Source label', type: 'text', required: true },
        sourceTierField(),
        { key: 'updated', label: 'Updated', type: 'text', required: true, hint: 'YYYY-MM-DD' },
      ],
    },
    inherited: {
      label: 'Inherited Issues', adminScoped: true,
      list: ['title', 'category', 'status', 'updated'],
      columns: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        statusField('inherited'),
        { key: 'problem', label: 'Problem', type: 'textarea', required: true },
        { key: 'resolution', label: 'Resolution', type: 'textarea', required: true },
        { key: 'source', label: 'Source URL', type: 'text', required: true },
        { key: 'sourceLabel', label: 'Source label', type: 'text', required: true },
        sourceTierField(),
        { key: 'updated', label: 'Updated', type: 'text', required: true },
      ],
    },
    fraud: {
      label: 'Fraud Cases', adminScoped: true,
      list: ['title', 'category', 'status', 'year', 'updated'],
      columns: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        statusField('fraud'),
        { key: 'amount', label: 'Amount', type: 'text', hint: 'free text, e.g. "₦80bn"' },
        { key: 'year', label: 'Year', type: 'number' },
        { key: 'allegation', label: 'Allegation', type: 'textarea', required: true },
        { key: 'outcome', label: 'Outcome', type: 'textarea', required: true },
        { key: 'responseVerdict', label: 'Response verdict', type: 'text' },
        { key: 'govtResponse', label: 'Government response', type: 'textarea' },
        { key: 'source', label: 'Source URL', type: 'text', required: true },
        { key: 'sourceLabel', label: 'Source label', type: 'text', required: true },
        sourceTierField(),
        { key: 'updated', label: 'Updated', type: 'text', required: true },
      ],
    },
    orders: {
      label: 'Executive Orders', adminScoped: true,
      list: ['title', 'category', 'status', 'signed'],
      columns: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        statusField('orders'),
        { key: 'signed', label: 'Signed', type: 'text', hint: 'YYYY-MM-DD' },
        { key: 'directive', label: 'Directive', type: 'textarea', required: true },
        { key: 'effect', label: 'Effect', type: 'textarea', required: true },
        { key: 'source', label: 'Source URL', type: 'text', required: true },
        { key: 'sourceLabel', label: 'Source label', type: 'text', required: true },
        sourceTierField(),
        { key: 'updated', label: 'Updated', type: 'text', required: true },
      ],
    },
    ministers: {
      label: 'Ministers', adminScoped: true,
      list: ['name', 'ministry', 'status', 'serving'],
      columns: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'ministry', label: 'Ministry', type: 'text', required: true },
        { key: 'appointed', label: 'Appointed', type: 'text', hint: 'YYYY-MM-DD' },
        statusField('ministers'),
        { key: 'serving', label: 'Currently serving', type: 'boolean' },
        { key: 'mandate', label: 'Mandate', type: 'textarea', required: true },
        { key: 'performance', label: 'Performance', type: 'textarea', required: true },
        { key: 'source', label: 'Source URL', type: 'text' },
        { key: 'sourceLabel', label: 'Source label', type: 'text' },
        sourceTierField(),
        { key: 'updated', label: 'Updated', type: 'text' },
      ],
    },
    bills: {
      label: 'Bills', adminScoped: true,
      list: ['title', 'status', 'chamber', 'signed'],
      columns: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        statusField('bills'),
        { key: 'chamber', label: 'Chamber', type: 'text' },
        { key: 'introduced', label: 'Introduced', type: 'text', hint: 'YYYY-MM-DD' },
        { key: 'signed', label: 'Signed', type: 'text', hint: 'YYYY-MM-DD' },
        { key: 'summary', label: 'Summary', type: 'textarea', required: true },
        { key: 'outcome', label: 'Outcome', type: 'textarea', required: true },
        { key: 'source', label: 'Source URL', type: 'text', required: true },
        { key: 'sourceLabel', label: 'Source label', type: 'text', required: true },
        sourceTierField(),
        { key: 'updated', label: 'Updated', type: 'text', required: true },
      ],
    },
    appointments: {
      label: 'Appointments', adminScoped: true,
      list: ['name', 'role', 'agency', 'status'],
      columns: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'role', label: 'Role', type: 'text', required: true },
        { key: 'agency', label: 'Agency', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        { key: 'state', label: 'State', type: 'text', required: true },
        { key: 'geopolitical', label: 'Geopolitical zone', type: 'text', required: true },
        { key: 'appointed', label: 'Appointed', type: 'text', required: true, hint: 'YYYY-MM-DD' },
        statusField('appointments'),
        { key: 'note', label: 'Note', type: 'textarea', required: true },
      ],
    },
    judgments: {
      label: 'Judgments', adminScoped: true,
      list: ['title', 'court', 'status', 'ruled'],
      columns: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'court', label: 'Court', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        statusField('judgments'),
        { key: 'compliance', label: 'Compliance', type: 'text' },
        { key: 'ruled', label: 'Ruled', type: 'text', required: true, hint: 'YYYY-MM-DD' },
        { key: 'issue', label: 'Issue', type: 'textarea', required: true },
        { key: 'outcome', label: 'Outcome', type: 'textarea', required: true },
        { key: 'source', label: 'Source URL', type: 'text' },
        { key: 'sourceLabel', label: 'Source label', type: 'text' },
        sourceTierField(),
      ],
    },
    budget: {
      label: 'Budget', adminScoped: true,
      list: ['year', 'totalBn', 'revenueBn', 'source'],
      columns: [
        { key: 'year', label: 'Year', type: 'number', required: true },
        { key: 'totalBn', label: 'Total (₦bn)', type: 'number', required: true },
        { key: 'revenueBn', label: 'Revenue (₦bn)', type: 'number', hint: 'blank = not published' },
        { key: 'actualRevenueBn', label: 'Actual revenue (₦bn)', type: 'number', hint: 'blank = not published' },
        { key: 'debtServiceBn', label: 'Debt service (₦bn)', type: 'number', hint: 'blank = not published' },
        { key: 'capitalBn', label: 'Capital (₦bn)', type: 'number', hint: 'blank = not published' },
        { key: 'recurrentBn', label: 'Recurrent (₦bn)', type: 'number', hint: 'blank = not published' },
        { key: 'implementationPct', label: 'Implementation %', type: 'number' },
        { key: 'deficitBn', label: 'Deficit (₦bn)', type: 'number', hint: 'blank = not published' },
        { key: 'note', label: 'Note', type: 'textarea' },
        { key: 'source', label: 'Source URL', type: 'text', required: true },
        { key: 'sourceLabel', label: 'Source label', type: 'text', required: true },
      ],
    },
    budgetMinistries: {
      label: 'Budget — Ministries', adminScoped: true,
      list: ['budgetYear', 'name', 'allocationBn', 'releasedPct'],
      columns: [
        { key: 'budgetYear', label: 'Budget year', type: 'number', required: true, hint: 'must match a Budget row\'s year' },
        { key: 'name', label: 'Ministry name', type: 'text', required: true },
        { key: 'allocationBn', label: 'Allocation (₦bn)', type: 'number', required: true },
        { key: 'releasedPct', label: 'Released %', type: 'number' },
        { key: 'note', label: 'Note', type: 'text' },
      ],
    },
    indicators: {
      label: 'Indicators', adminScoped: true,
      list: ['key', 'label', 'unit', 'higherIsBetter'],
      columns: [
        { key: 'key', label: 'Key', type: 'text', required: true, hint: 'e.g. "inflation"' },
        { key: 'label', label: 'Label', type: 'text', required: true },
        { key: 'unit', label: 'Unit', type: 'text', required: true },
        { key: 'color', label: 'Color', type: 'text', required: true, hint: 'hex or CSS color' },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'source', label: 'Source URL', type: 'text', required: true },
        { key: 'sourceLabel', label: 'Source label', type: 'text', required: true },
        { key: 'note', label: 'Note', type: 'text' },
        { key: 'higherIsBetter', label: 'Rising value is good news', type: 'boolean' },
      ],
    },
    indicatorPoints: {
      label: 'Indicators — Data Points', adminScoped: true,
      list: ['indicatorId', 'label', 'value', 'year', 'period', 'basis', 'source'],
      columns: [
        { key: 'indicatorId', label: 'Indicator ID', type: 'number', required: true, hint: 'the numeric id from the Indicators table' },
        { key: 'label', label: 'Point label', type: 'text', required: true, hint: 'e.g. "Q1 2024"' },
        { key: 'value', label: 'Value', type: 'number', required: true },
        { key: 'year', label: 'Year', type: 'number', hint: 'survey/fiscal year' },
        { key: 'period', label: 'Period', type: 'text', hint: 'e.g. Q1, Sep' },
        { key: 'source', label: 'Source URL', type: 'text' },
        { key: 'sourceLabel', label: 'Source label', type: 'text' },
        { key: 'basis', label: 'Basis', type: 'text', hint: 'e.g. domestic' },
        { key: 'note', label: 'Note', type: 'textarea' },
      ],
    },
    governors: {
      label: 'Historical Governors', adminScoped: true,
      list: ['name', 'state', 'party', 'status'],
      columns: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'state', label: 'State', type: 'text', required: true },
        { key: 'party', label: 'Party', type: 'text', required: true },
        { key: 'geopolitical', label: 'Geopolitical zone', type: 'text', required: true },
        { key: 'termStart', label: 'Term start', type: 'text', required: true, hint: 'YYYY-MM-DD' },
        { key: 'termEnd', label: 'Term end', type: 'text' },
        statusField('governors'),
        { key: 'note', label: 'Note', type: 'text' },
      ],
    },
    projects: {
      label: 'Capital Projects', adminScoped: true,
      list: ['title', 'category', 'status', 'updated'],
      columns: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true, hint: 'e.g. Transport, Energy' },
        statusField('projects'),
        { key: 'state', label: 'State', type: 'text', hint: 'blank = nationwide/federal' },
        { key: 'location', label: 'Location', type: 'text' },
        { key: 'started', label: 'Started', type: 'text', hint: 'YYYY-MM-DD' },
        { key: 'targetCompletion', label: 'Target completion', type: 'text' },
        { key: 'completedDate', label: 'Completed date', type: 'text' },
        { key: 'budgetAllocatedBn', label: 'Budget allocated (₦bn)', type: 'number' },
        { key: 'amountSpentBn', label: 'Amount spent (₦bn)', type: 'number' },
        { key: 'physicalCompletionPct', label: 'Physical completion %', type: 'number' },
        { key: 'contractor', label: 'Contractor', type: 'text' },
        { key: 'summary', label: 'Summary', type: 'textarea', required: true },
        { key: 'outcome', label: 'Outcome', type: 'textarea', required: true },
        { key: 'source', label: 'Source URL', type: 'text', required: true },
        { key: 'sourceLabel', label: 'Source label', type: 'text', required: true },
        sourceTierField(),
        { key: 'updated', label: 'Updated', type: 'text', required: true, hint: 'YYYY-MM-DD' },
      ],
    },
    corrections: {
      label: 'Corrections inbox', adminScoped: false,
      list: ['createdAt', 'kind', 'status', 'entryTable', 'body'],
      columns: [
        { key: 'status', label: 'Status', type: 'select', required: true, options: ['new', 'reviewing', 'actioned', 'declined'] },
        { key: 'adminNote', label: 'Moderator note', type: 'textarea' },
        { key: 'kind', label: 'Kind', type: 'text' },
        { key: 'entryTable', label: 'Entry table', type: 'text' },
        { key: 'entryId', label: 'Entry id', type: 'number' },
        { key: 'administration', label: 'Administration', type: 'text' },
        { key: 'url', label: 'Page URL', type: 'text' },
        { key: 'body', label: 'Message', type: 'textarea' },
        { key: 'sourceUrl', label: 'Supporting link', type: 'text' },
        { key: 'email', label: 'Reporter email', type: 'text' },
        { key: 'ipHash', label: 'Source hash', type: 'text', hint: 'pseudonymous — same value = same source' },
        { key: 'createdAt', label: 'Received', type: 'text' },
      ],
    },
  }

  var DEFAULT_PAGE_SIZE = 100
  var state = {
    user: null, table: null, administration: '', administrations: [], rows: [], editingId: null,
    page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, pageCount: 1,
    q: '', status: '', overview: null,
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel) }
  var $$ = function (sel, root) { return Array.from((root || document).querySelectorAll(sel)) }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }


  // ---------- Icons, status badges, dates ----------
  // 24x24 stroke icons (Feather-style paths), drawn inline so nothing is fetched.
  var ICONS = {
    overview: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    presidents: '<path d="M3 21h18"/><path d="M5 21V10"/><path d="M9 21V10"/><path d="M15 21V10"/><path d="M19 21V10"/><path d="M2 10l10-7 10 7z"/>',
    promises: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    inherited: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    fraud: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    orders: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    ministers: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    bills: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    appointments: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
    judgments: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0z"/><path d="M19 7l-3 7a3 3 0 0 0 6 0z"/>',
    budget: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    budgetMinistries: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    indicators: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    indicatorPoints: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    governors: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    projects: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    corrections: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    ai: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
    key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    team: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    dot: '<circle cx="12" cy="12" r="3"/>',
  }
  function icon(name) {
    return '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.dot) + '</svg>'
  }

  // A status always shows its word (never colour alone). The colour says whether
  // it is good news, bad news, still moving, or simply over.
  var TONES = {
    good: ['kept', 'completed', 'implemented', 'passed', 'fixed', 'resolved', 'won', 'good', 'served', 'serving', 'confirmed', 'actioned', 'convicted', 'prosecuted', 'abated', 'reinstated'],
    bad: ['broken', 'abandoned', 'ignored', 'poor', 'lost', 'sacked', 'removed', 'reversed', 'declined'],
    warn: ['partial', 'ongoing', 'pending', 'disputed', 'investigating', 'reviewing', 'new', 'fair', 'stalled', 'in_progress', 'in progress', 'defected', 'denied'],
    mute: ['unassessed', 'deceased', 'retired', 'resigned', 'dismissed', 'acquitted', 'debunked', 'settled', 'unsubscribed'],
  }
  function statusTone(v) {
    var k = String(v == null ? '' : v).trim().toLowerCase()
    for (var tone in TONES) { if (TONES[tone].indexOf(k) !== -1) return tone }
    return 'plain'
  }
  function statusBadge(v) {
    if (v == null || v === '') return '<span class="muted-dash">—</span>'
    return '<span class="badge tone-' + statusTone(v) + '">' + esc(String(v).replace(/_/g, ' ')) + '</span>'
  }

  function toneBadge(label, tone) { return '<span class="badge tone-' + tone + '">' + esc(label) + '</span>' }

  function relTime(iso) {
    var t = Date.parse(iso)
    if (!isFinite(t)) return esc(iso || '')
    var mins = Math.round((Date.now() - t) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return mins + ' min ago'
    var hrs = Math.round(mins / 60)
    if (hrs < 24) return hrs + ' h ago'
    var days = Math.round(hrs / 24)
    if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago')
    return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // One place that talks to the server: JSON in and out, the CSRF token on every
  // call, and the same handling of an expired session or a forced password change.
  async function request(url, path, opts) {
    var csrf = document.cookie.split(';').map(function (v) { return v.trim().split('=') }).find(function (v) { return v[0] === 'ngs_csrf' })
    var headers = { 'Content-Type': 'application/json' }
    if (csrf) headers['x-csrf-token'] = decodeURIComponent(csrf[1])
    var res = await fetch(url, Object.assign({ headers: headers }, opts))
    if (res.status === 401 && path !== '/login' && path !== '/password') { showLogin(); throw new Error('unauthenticated') }
    if (!res.ok) {
      var body = await res.json().catch(function () { return {} })
      if (body.error === 'password_change_required') { openPasswordForm(true); throw new Error('You must set a new password before continuing.') }
      if (res.status === 401 && path === '/login') throw new Error('unauthenticated')
      throw new Error(body.error || ('Request failed (' + res.status + ')'))
    }
    if (res.status === 204) return null
    return res.json()
  }
  function api(path, opts) { return request('/api/admin' + path, path, opts) }
  // The AI tools live under /api/outcome and need an admin session like the rest.
  function tool(path, opts) { return request('/api/outcome' + path, path, opts) }

  // ---------- Feedback: toasts, loading, empty states ----------
  var TOAST_ICONS = {
    ok: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  }
  // A short message that does not take focus and goes away by itself.
  function toast(message, kind) {
    var box = $('#toasts')
    var el = document.createElement('div')
    el.className = 'toast' + (kind === 'error' ? ' error' : '')
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status')
    el.innerHTML = (kind === 'error' ? TOAST_ICONS.error : TOAST_ICONS.ok) + '<span class="toast-msg"></span><button type="button" class="toast-x" aria-label="Dismiss">×</button>'
    el.querySelector('.toast-msg').textContent = message
    var gone = false
    function dismiss() {
      if (gone) return
      gone = true
      el.classList.add('leaving')
      setTimeout(function () { el.remove() }, 180)
    }
    el.querySelector('.toast-x').addEventListener('click', dismiss)
    box.appendChild(el)
    while (box.children.length > 4) box.firstChild.remove()
    setTimeout(dismiss, kind === 'error' ? 7000 : 4000)
  }

  // Placeholder blocks shaped like what is loading, instead of a bare "Loading…".
  function skeleton(rows, tall) {
    var h = '<div class="skeleton" role="status" aria-label="Loading">'
    for (var i = 0; i < (rows || 5); i++) h += '<i' + (tall ? ' class="tall"' : '') + '></i>'
    return h + '</div>'
  }

  function emptyState(iconName, title, body) {
    return '<div class="empty"><div class="empty-icon">' + icon(iconName).replace('width="16" height="16"', 'width="24" height="24"') + '</div><h3>' + esc(title) + '</h3>' + (body ? '<p>' + esc(body) + '</p>' : '') + '</div>'
  }

  function setSub(text) { $('#section-sub').textContent = text || '' }

  // A button that shows it is working, and cannot be pressed twice.
  function busy(btn, on, label) {
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin" aria-hidden="true"></span>' + esc(label || 'Working…') }
    else { btn.disabled = false; if (btn.dataset.label != null) btn.innerHTML = btn.dataset.label }
  }

  // ---------- Confirmation modal ----------
  // One modal for every confirmation, notice and short text prompt, replacing
  // the browser's confirm/alert/prompt.
  //   run(value)   the action itself. While it is in flight the buttons are
  //                locked, if it throws the message is shown in the modal and
  //                it stays open, and only on success does it close.
  //   input        { label, value } adds a text field; its value is passed to run.
  //   hideCancel   a plain notice: one OK button.
  // Resolves true if the action ran (or the notice was dismissed), false if
  // the person cancelled. Cancel has the initial focus on destructive
  // confirmations, so a stray Enter never confirms one.
  function confirmAction(opts) {
    return new Promise(function (resolve) {
      var overlay = $('#confirm-overlay'), ok = $('#confirm-ok'), cancel = $('#confirm-cancel')
      var field = $('#confirm-field'), input = $('#confirm-input')
      var busy = false
      $('#confirm-title').textContent = opts.title
      $('#confirm-message').textContent = opts.message || ''
      $('#confirm-error').textContent = ''
      ok.textContent = opts.confirmLabel || (opts.hideCancel ? 'OK' : 'Confirm')
      ok.className = 'btn ' + (opts.danger === false || opts.hideCancel ? 'primary' : 'danger-solid')
      ok.disabled = false
      cancel.disabled = false
      cancel.style.display = opts.hideCancel ? 'none' : ''
      field.style.display = opts.input ? '' : 'none'
      if (opts.input) {
        $('#confirm-field-label').textContent = opts.input.label
        input.value = opts.input.value || ''
      }

      function close(result) {
        overlay.classList.remove('show')
        document.removeEventListener('keydown', onKey)
        ok.onclick = cancel.onclick = overlay.onclick = input.onkeydown = null
        resolve(result)
      }
      function onKey(e) { if (e.key === 'Escape' && !busy) close(opts.hideCancel ? true : false) }
      cancel.onclick = function () { if (!busy) close(false) }
      overlay.onclick = function (e) { if (e.target === overlay && !busy) close(opts.hideCancel ? true : false) }
      input.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); ok.click() } }
      ok.onclick = async function () {
        busy = true
        ok.disabled = cancel.disabled = true
        $('#confirm-error').textContent = ''
        try {
          if (opts.run) await opts.run(opts.input ? input.value : undefined)
          busy = false
          close(true)
        } catch (err) {
          busy = false
          ok.disabled = cancel.disabled = false
          $('#confirm-error').textContent = err.message
        }
      }
      document.addEventListener('keydown', onKey)
      overlay.classList.add('show')
      if (opts.input) { input.focus(); input.select() }
      else if (opts.hideCancel) ok.focus()
      else cancel.focus()
    })
  }

  function notice(title, message) {
    return confirmAction({ title: title, message: message, hideCancel: true })
  }

  var DELETE_NOTE = 'The deletion is logged, and the owner can restore it from the Activity log.'

  // ---------- Login ----------
  function showLogin() {
    // Wipe whatever the last person had open, so a second person signing in on
    // the same browser tab never sees the previous session's data.
    state.user = null
    state.rows = []
    $('#content').innerHTML = ''
    $('#section-title').textContent = '—'
    $('#section-controls').innerHTML = ''
    $('#nav').innerHTML = ''
    $('#whoami').innerHTML = ''
    $('#app').classList.remove('ready')
    setSub('')
    closeDetail()
    $('#login-screen').style.display = 'grid'
  }

  function showApp() {
    $('#login-screen').style.display = 'none'
    $('#app').classList.add('ready')
  }

  $('#login-form').addEventListener('submit', async function (e) {
    e.preventDefault()
    var errEl = $('#login-error')
    var btn = $('#login-submit')
    errEl.textContent = ''
    busy(btn, true, 'Signing in\u2026')
    try {
      await api('/login', { method: 'POST', body: JSON.stringify({ email: $('#login-email').value, password: $('#login-password').value }) })
      $('#login-password').value = ''
      await boot()
    } catch (err) {
      errEl.textContent = err.message === 'unauthenticated' ? 'That email and password do not match. Check them and try again.' : err.message
      $('#login-password').focus()
    } finally {
      busy(btn, false)
    }
  })

  // Show or hide the password while typing it.
  $('#login-reveal').addEventListener('click', function () {
    var input = $('#login-password')
    var show = input.type === 'password'
    input.type = show ? 'text' : 'password'
    this.textContent = show ? 'Hide' : 'Show'
    this.setAttribute('aria-pressed', show ? 'true' : 'false')
    this.setAttribute('aria-label', show ? 'Hide password' : 'Show password')
  })

  $('#logout-btn').addEventListener('click', async function () {
    await api('/logout', { method: 'POST' }).catch(function () {})
    state.user = null
    showLogin()
  })

  // ---------- Nav ----------
  // The sidebar is a set of groups; each heading is a button that folds its items.
  // Which groups are folded is remembered per browser. A folded group that holds
  // the page you are on is marked (see setActiveNav) rather than forced open, so
  // a fold is respected on every visit, including the default landing page.
  var NAV_COLLAPSED_KEY = 'ngscorecard.admin.navCollapsed'
  function loadCollapsedGroups() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(NAV_COLLAPSED_KEY) || '[]')
      return Array.isArray(saved) ? saved : []
    } catch (e) { return [] }
  }
  function saveCollapsedGroups(list) {
    try { window.localStorage.setItem(NAV_COLLAPSED_KEY, JSON.stringify(list)) } catch (e) { /* private mode: just not remembered */ }
  }
  function setGroupOpen(group, open) {
    group.classList.toggle('collapsed', !open)
    group.querySelector('.group-toggle').setAttribute('aria-expanded', open ? 'true' : 'false')
    group.querySelector('.group-items').hidden = !open
  }

  function buildNav() {
    var nav = $('#nav')
    nav.innerHTML = ''
    var isOwner = state.user && state.user.role === 'owner'
    var collapsed = loadCollapsedGroups()
    var groupCount = 0

    // items: [{ label, table, icon, onClick }]
    function makeNavButton(it) {
      var btn = document.createElement('button')
      btn.className = 'nav-item'
      btn.type = 'button'
      btn.innerHTML = icon(it.icon) + '<span class="nav-label"></span><span class="nav-count" hidden></span>'
      btn.querySelector('.nav-label').textContent = it.label
      if (it.table) btn.dataset.table = it.table
      btn.addEventListener('click', function () { closeMobileNav(); it.onClick() })
      return btn
    }

    // The landing page sits above the groups, always visible.
    var top = document.createElement('div')
    top.className = 'nav-top'
    top.appendChild(makeNavButton({ label: 'Overview', table: '__overview', icon: 'overview', onClick: function () { selectOverview() } }))
    nav.appendChild(top)

    // a group with no items is not drawn
    function addGroup(label, items) {
      if (!items.length) return
      var id = 'nav-group-' + (++groupCount)
      var group = document.createElement('div')
      group.className = 'nav-group'
      group.dataset.group = label

      var toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'group-label group-toggle'
      toggle.setAttribute('aria-controls', id)
      toggle.innerHTML = '<span></span><span class="chev" aria-hidden="true">\u25BE</span>'
      toggle.firstChild.textContent = label

      var list = document.createElement('div')
      list.className = 'group-items'
      list.id = id

      items.forEach(function (it) { list.appendChild(makeNavButton(it)) })

      group.appendChild(toggle)
      group.appendChild(list)
      nav.appendChild(group)
      setGroupOpen(group, collapsed.indexOf(label) === -1)

      toggle.addEventListener('click', function () {
        var open = group.classList.contains('collapsed') // it is about to open
        setGroupOpen(group, open)
        var now = loadCollapsedGroups().filter(function (l) { return l !== label })
        if (!open) now.push(label)
        saveCollapsedGroups(now)
      })
    }

    addGroup('Content', Object.keys(TABLES).map(function (name) {
      return { label: TABLES[name].label, table: name, icon: name, onClick: function () { selectTable(name) } }
    }))

    addGroup('AI Tools', [
      { label: 'Outcome Verifier', table: '__outcome', icon: 'ai', onClick: function () { selectOutcomeVerifier() } },
      { label: 'Promise Classifier', table: '__classifier', icon: 'ai', onClick: function () { selectPromiseClassifier() } },
      { label: 'Pattern Detector', table: '__patterns', icon: 'ai', onClick: function () { selectPatternDetector() } },
      { label: 'Real-time Tracker', table: '__tracker', icon: 'ai', onClick: function () { selectRealTimeTracker() } },
      { label: 'Lie Detector', table: '__factcheck', icon: 'ai', onClick: function () { selectLieDetector() } },
    ])

    var reference = []
    if (isOwner) reference.push({ label: 'API Keys', table: '__keys', icon: 'key', onClick: function () { selectKeys() } })
    if (isOwner) reference.push({ label: 'Newsletter', table: '__newsletter', icon: 'mail', onClick: function () { selectNewsletter() } })
    reference.push(
      { label: 'Indicator Registry', table: '__registry', icon: 'list', onClick: function () { selectRegistry() } },
      { label: 'Change History', table: '__history', icon: 'clock', onClick: function () { selectHistory() } },
      { label: 'Coverage Audit', table: '__audit', icon: 'shield', onClick: function () { selectAudit() } }
    )
    addGroup(isOwner ? 'Public API' : 'Reference', reference)

    var account = []
    if (isOwner) {
      account.push(
        { label: 'Team', table: '__team', icon: 'team', onClick: function () { selectTeam() } },
        { label: 'Activity log', table: '__activity', icon: 'indicatorPoints', onClick: function () { selectActivity() } }
      )
    }
    if (state.user && !state.user.isEnvOwner) {
      account.push({ label: 'Change password', icon: 'lock', onClick: function () { openPasswordForm(false) } })
    }
    addGroup('Account', account)
  }

  function setActiveNav(name) {
    $('#section-count').textContent = ''
    setSub('')
    $$('.nav-item').forEach(function (b) { b.classList.toggle('active', b.dataset.table === name) })
    // a folded group hides its items, so mark the one that holds the current page
    $$('.nav-group').forEach(function (g) { g.classList.toggle('has-active', !!g.querySelector('.nav-item.active')) })
  }

  // The Corrections inbox shows how many are waiting. Refreshed after anything
  // that could change it.
  function setNavCount(table, n) {
    var chip = $('.nav-item[data-table="' + table + '"] .nav-count')
    if (!chip) return
    chip.textContent = n > 99 ? '99+' : String(n)
    chip.hidden = !(n > 0)
  }
  async function refreshCounts() {
    try {
      state.overview = await api('/overview')
      setNavCount('corrections', (state.overview.corrections && state.overview.corrections['new']) || 0)
    } catch (e) { /* the badge is a convenience; the page works without it */ }
  }

  // On narrow screens the sidebar slides over the page.
  function closeMobileNav() { document.body.classList.remove('nav-open') }
  $('#nav-toggle').addEventListener('click', function () { document.body.classList.toggle('nav-open') })
  $('#nav-scrim').addEventListener('click', closeMobileNav)

  // ---------- Table view ----------
  async function ensureAdministrations() {
    if (state.administrations.length) return
    state.administrations = await api('/administrations')
  }

  var TABLE_NOTES = {
    presidents: 'The administrations (presidents and governors) that every other entry is filed under.',
    promises: 'What leaders promised, and how each one turned out.',
    inherited: 'Problems an administration took over, and what happened to them.',
    fraud: 'Corruption allegations and cases, and their outcomes.',
    orders: 'Executive orders, and whether they were carried out.',
    ministers: 'Ministers and how they performed against their mandates.',
    bills: 'Bills before the National Assembly, and what became of them.',
    judgments: 'Court judgments involving the government.',
    projects: 'Capital projects and how far along they are.',
    corrections: 'Corrections and evidence sent in by readers. Nothing here is published; each one is checked.',
  }

  async function selectTable(name, preset) {
    state.table = name
    state.editingId = null
    state.page = 1
    state.q = ''
    state.status = (preset && preset.status) || ''
    closeDetail()
    setActiveNav(name)
    var cfg = TABLES[name]
    $('#section-title').textContent = cfg.label
    setSub(TABLE_NOTES[name])
    var controls = $('#section-controls')
    controls.innerHTML = ''

    var search = document.createElement('input')
    search.type = 'search'
    search.id = 'table-search'
    search.className = 'search'
    search.placeholder = 'Search ' + cfg.label.toLowerCase() + '…'
    search.setAttribute('aria-label', 'Search ' + cfg.label)
    var searchTimer
    search.addEventListener('input', function () {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(function () { state.q = search.value.trim(); state.page = 1; loadRows() }, 300)
    })
    controls.appendChild(search)

    var statusCol = cfg.columns.find(function (c) { return c.key === 'status' })
    var statusOptions = statusCol && statusCol.options && statusCol.options.length ? statusCol.options : null
    if (statusOptions) {
      var statusSel = document.createElement('select')
      statusSel.setAttribute('aria-label', 'Filter by status')
      statusSel.innerHTML = '<option value="">All statuses</option>' + statusOptions.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o.replace(/_/g, ' ')) + '</option>' }).join('')
      statusSel.value = state.status
      statusSel.addEventListener('change', function () { state.status = statusSel.value; state.page = 1; loadRows() })
      controls.appendChild(statusSel)
    }

    if (cfg.adminScoped) {
      await ensureAdministrations()
      var sel = document.createElement('select')
      sel.id = 'admin-filter'
      sel.innerHTML = '<option value="">All administrations</option>' +
        state.administrations.map(function (a) { return '<option value="' + esc(a.key) + '">' + esc(a.name) + '</option>' }).join('')
      sel.value = state.administration
      sel.addEventListener('change', function () { state.administration = sel.value; state.page = 1; loadRows() })
      controls.appendChild(sel)
    }
    var addBtn = document.createElement('button')
    addBtn.className = 'btn primary'
    addBtn.textContent = '+ Add'
    addBtn.addEventListener('click', function () { openForm(null) })
    controls.appendChild(addBtn)
    var exportBtn = document.createElement('button')
    exportBtn.className = 'btn'
    exportBtn.textContent = 'Export JSON'
    exportBtn.addEventListener('click', exportCurrentTable)
    controls.appendChild(exportBtn)
    var importBtn = document.createElement('button')
    importBtn.className = 'btn'
    importBtn.textContent = 'Import JSON'
    importBtn.addEventListener('click', function () { $('#bulk-file').click() })
    controls.appendChild(importBtn)
    var fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.id = 'bulk-file'
    fileInput.accept = '.json,application/json'
    fileInput.style.display = 'none'
    fileInput.addEventListener('change', importCurrentTable)
    controls.appendChild(fileInput)

    await loadRows()
  }

  async function exportCurrentTable() {
    var cfg = TABLES[state.table]
    var qs = '?page=1&pageSize=500'
    if (cfg.adminScoped && state.administration) qs += '&administration=' + encodeURIComponent(state.administration)
    var result = await api('/' + state.table + qs)
    var blob = new Blob([JSON.stringify(result.rows, null, 2)], { type: 'application/json' })
    var link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'ngscorecard-' + state.table + '.json'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  async function importCurrentTable(e) {
    var file = e.target.files[0]
    if (!file) return
    try {
      var text = await file.text()
      var rows = JSON.parse(text)
      if (!Array.isArray(rows)) rows = [rows]
      if (!rows.length) throw new Error('File contains no rows')
      var result = await api('/bulk/' + state.table, { method: 'POST', body: JSON.stringify(rows) })
      e.target.value = ''
      await loadRows()
      await notice('Import complete', 'Imported ' + result.inserted + ' row(s) into ' + (TABLES[state.table] ? TABLES[state.table].label : state.table) + '. Database only: seed files are unchanged.')
    } catch (err) {
      e.target.value = ''
      await notice('Import failed', err.message)
    }
  }

  function fmtDateTime(iso) {
    var t = Date.parse(iso)
    if (!isFinite(t)) return iso ? esc(iso) : '<span class="muted-dash">—</span>'
    var d = new Date(t)
    return '<time datetime="' + esc(iso) + '" title="' + esc(iso) + '">' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</time>'
  }
  function dash(v) { return v == null || v === '' ? '<span class="muted-dash">—</span>' : esc(v) }
  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/)
    return ((parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
  }

  // ---------- Coverage Audit ----------
  var ERA_LABELS = { 'state-current': 'State, current term', 'state-pre1999': 'State, before 1999', 'state-1999-2007': 'State, 1999 to 2007', 'state-2007-2023': 'State, 2007 to 2023' }
  async function selectAudit() {
    state.table = '__audit'
    setActiveNav('__audit')
    $('#section-title').textContent = 'Coverage Audit'
    setSub('How many of the core indicators are published for each era of administrations, and where the gaps are.')
    $('#section-controls').innerHTML = ''
    $('#content').innerHTML = skeleton(3, true)
    var data = await api('/audit')
    var d = data.drift || {}
    var driftCards = [
      ['Indicators with no registry key', d.noRegistryKey, 'Cannot be matched to the indicator registry'],
      ['Missing direction of “better”', d.missingHib, 'The registry says which way is good; the row does not'],
      ['Administrations with too few data points', d.fewPoints, 'Fewer than two points, so no trend can be drawn'],
    ].map(function (c) { return statCard({ label: c[0], value: c[1] || 0, tone: c[1] ? 'warn' : 'good', sub: c[2] }) }).join('')

    var eras = Object.keys(data.eraCoverage).sort().map(function (era) {
      var keys = Object.keys(data.eraCoverage[era]).sort()
      var rows = keys.map(function (key) {
        var c = data.eraCoverage[era][key]
        var total = c.published + c.notPublished + c.missing
        var pct = function (n) { return total ? (n / total * 100).toFixed(1) : 0 }
        return '<div class="cov-row"><span class="k" title="' + esc(key) + '">' + esc(key) + '</span>' +
          '<span class="cov-bar" role="img" aria-label="' + c.published + ' published, ' + c.notPublished + ' not published, ' + c.missing + ' missing"><i class="pub" style="width:' + pct(c.published) + '%"></i><i class="np" style="width:' + pct(c.notPublished) + '%"></i><i class="miss" style="width:' + pct(c.missing) + '%"></i></span>' +
          '<span class="n">' + c.published + '/' + total + '</span></div>'
      }).join('')
      var n = data.eraTotals && data.eraTotals[era]
      return panel((ERA_LABELS[era] || era) + (n != null ? ' · ' + plural(n, 'administration') : ''), rows || '<p class="faint pad">No core indicators in this era.</p>')
    }).join('')

    $('#content').innerHTML =
      '<div class="stats">' + driftCards + '</div>' +
      '<div class="legend"><span><i style="background:#1f9d63"></i>Published</span><span><i style="background:#d9a31b"></i>Not published</span><span><i style="background:#c4392b"></i>Missing</span></div>' +
      '<div class="era-grid">' + eras + '</div>'
  }

  function pageQueryString() {
    var cfg = TABLES[state.table]
    var parts = []
    if (cfg.adminScoped && state.administration) parts.push('administration=' + encodeURIComponent(state.administration))
    if (state.q) parts.push('q=' + encodeURIComponent(state.q))
    if (state.status) parts.push('status=' + encodeURIComponent(state.status))
    parts.push('page=' + state.page)
    parts.push('pageSize=' + state.pageSize)
    return '?' + parts.join('&')
  }

  function applyPageResult(result) {
    state.rows = result.rows
    state.total = result.total
    state.page = result.page
    state.pageSize = result.pageSize
    state.pageCount = result.pageCount
  }

  async function loadRows() {
    state.reload = loadRows
    $('#content').innerHTML = skeleton()
    var result = await api('/' + state.table + pageQueryString())
    // If we deleted the last row on a page beyond page 1, step back rather
    // than show a blank page.
    if (!result.rows.length && result.page > 1 && result.total > 0) {
      state.page = Math.max(1, result.pageCount)
      result = await api('/' + state.table + pageQueryString())
    }
    applyPageResult(result)
    renderTable()
  }

  function renderTable() {
    var cfg = TABLES[state.table]
    var cols = cfg.list
    var filtered = !!(state.q || state.status)
    $('#section-count').textContent = state.total ? String(state.total) : ''
    if (!state.total) {
      $('#content').innerHTML = '<div class="table-scroll"><div class="empty-state">' + (filtered
        ? 'Nothing matches' + (state.q ? ' “' + esc(state.q) + '”' : '') + (state.status ? ' with status “' + esc(state.status) + '”' : '') + '. Try fewer words, or another status.'
        : 'No rows yet. Click "+ Add" to create one.') + '</div></div>'
      return
    }
    var html = '<div class="table-scroll"><table class="data"><thead><tr>'
    if (cfg.adminScoped) html += '<th>Admin</th>'
    cols.forEach(function (c) { html += '<th>' + esc(labelFor(cfg, c)) + '</th>' })
    html += '<th></th></tr></thead><tbody>'
    state.rows.forEach(function (row) {
      html += '<tr class="row-click" tabindex="0" data-id="' + row.id + '">'
      if (cfg.adminScoped) html += '<td>' + esc(row.administration) + '</td>'
      cols.forEach(function (c) {
        var v = row[c]
        if (typeof v === 'boolean') v = v ? 'yes' : 'no'
        if (c === 'status') html += '<td>' + statusBadge(v) + '</td>'
        else html += '<td title="' + esc(v) + '"><span class="cell-text">' + esc(v) + '</span></td>'
      })
      html += '<td class="actions"><button class="btn small" data-edit="' + row.id + '">Edit</button>' +
        (state.table === 'corrections' && row.status !== 'actioned' ? '<button class="btn small" data-apply="' + row.id + '">Apply</button>' : '') +
        '<button class="btn small danger" data-del="' + row.id + '">Delete</button></td></tr>'
    })
    html += '</tbody></table></div>'
    html += renderPagination()
    $('#content').innerHTML = html
    $$('[data-edit]').forEach(function (b) {
      b.addEventListener('click', function () { openForm(Number(b.dataset.edit)) })
    })
    $$('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () { deleteRow(Number(b.dataset.del)) })
    })
    $$('[data-apply]').forEach(function (b) {
      b.addEventListener('click', function () { applyCorrection(Number(b.dataset.apply)) })
    })
    // A row opens its detail panel; the buttons inside it keep their own job.
    $$('tr.row-click').forEach(function (tr) {
      tr.addEventListener('click', function (e) { if (!e.target.closest('button')) openDetail(Number(tr.dataset.id)) })
      tr.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === tr) { e.preventDefault(); openDetail(Number(tr.dataset.id)) }
      })
    })
    wirePagination()
  }

  async function applyCorrection(id) {
    var done = await confirmAction({
      title: 'Mark this correction as actioned?',
      message: 'Make the change to the entry first. This records that it has been dealt with.',
      input: { label: 'Moderator note (optional)', value: 'Applied by administrator' },
      confirmLabel: 'Mark actioned',
      danger: false,
      run: function (note) { return api('/corrections/' + id + '/apply', { method: 'POST', body: JSON.stringify({ adminNote: note }) }) },
    })
    if (done) { closeDetail(); await loadRows(); toast('Marked as actioned.'); refreshCounts() }
    return done
  }

  // ---------- Row detail panel ----------
  // Every field of a row, in full (the table truncates long text), with the same
  // actions as the table. Values are only ever inserted escaped; a link is made
  // only for an http(s) address.
  function isHttpUrl(v) { return /^https?:\/\/[^\s"'<>]+$/i.test(String(v || '')) }
  function detailValue(col, v) {
    if (v == null || v === '') return '<span class="muted-dash">—</span>'
    if (col.type === 'boolean' || typeof v === 'boolean') return v ? 'Yes' : 'No'
    if (col.key === 'status') return statusBadge(v)
    if (isHttpUrl(v)) return '<a href="' + esc(v) + '" target="_blank" rel="noopener noreferrer">' + esc(v) + '</a>'
    return esc(v)
  }

  function openDetail(id) {
    var cfg = TABLES[state.table]
    var row = state.rows.find(function (r) { return r.id === id })
    if (!row || !cfg) return
    state.detailId = id
    var fields = []
    if (cfg.adminScoped) fields.push({ label: 'Administration', html: esc(row.administration) })
    cfg.columns.forEach(function (col) { fields.push({ label: col.label, html: detailValue(col, row[col.key]), long: col.type === 'textarea' }) })
    var title = row.title || row.name || row.key || ('Row ' + row.id)
    var canApply = state.table === 'corrections' && row.status !== 'actioned'
    $('#drawer-title').textContent = String(title).slice(0, 160)
    $('#drawer-sub').textContent = cfg.label + ' · #' + row.id
    $('#drawer-body').innerHTML = '<dl>' + fields.map(function (f) {
      return '<div class="df' + (f.long ? ' long' : '') + '"><dt>' + esc(f.label) + '</dt><dd>' + f.html + '</dd></div>'
    }).join('') + '</dl>'
    $('#drawer-actions').innerHTML =
      '<button type="button" class="btn danger" id="drawer-delete">Delete</button><span class="spacer"></span>' +
      (canApply ? '<button type="button" class="btn" id="drawer-apply">Mark actioned</button>' : '') +
      '<button type="button" class="btn primary" id="drawer-edit">Edit</button>'
    $('#drawer-edit').addEventListener('click', function () { closeDetail(); openForm(id) })
    $('#drawer-delete').addEventListener('click', async function () { await deleteRow(id); if (!state.rows.some(function (r) { return r.id === id })) closeDetail() })
    var applyBtn = $('#drawer-apply')
    if (applyBtn) applyBtn.addEventListener('click', function () { applyCorrection(id) })
    $('#drawer').classList.add('show')
    $('#drawer-close').focus()
  }

  function closeDetail() {
    state.detailId = null
    var d = $('#drawer')
    if (d) d.classList.remove('show')
  }
  $('#drawer-close').addEventListener('click', closeDetail)
  $('#drawer').addEventListener('click', function (e) { if (e.target.id === 'drawer') closeDetail() })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('#drawer').classList.contains('show') && !document.querySelector('.overlay.show')) closeDetail()
  })

  function renderPagination() {
    var start = state.total ? (state.page - 1) * state.pageSize + 1 : 0
    var end = Math.min(state.page * state.pageSize, state.total)
    var sizes = [25, 50, 100, 200, 500]
    if (sizes.indexOf(state.pageSize) === -1) sizes.push(state.pageSize)
    sizes.sort(function (a, b) { return a - b })
    var html = '<div class="pagination">'
    html += '<span>Rows ' + start + '–' + end + ' of ' + state.total + '</span>'
    html += '<div class="pager">'
    html += '<button class="btn small" id="page-prev" ' + (state.page <= 1 ? 'disabled' : '') + '>← Prev</button>'
    html += '<span class="page-current">Page ' + state.page + ' of ' + state.pageCount + '</span>'
    html += '<button class="btn small" id="page-next" ' + (state.page >= state.pageCount ? 'disabled' : '') + '>Next →</button>'
    html += '</div>'
    html += '<select id="page-size-select">' + sizes.map(function (s) {
      return '<option value="' + s + '" ' + (s === state.pageSize ? 'selected' : '') + '>' + s + ' / page</option>'
    }).join('') + '</select>'
    html += '</div>'
    return html
  }

  function wirePagination() {
    var prev = $('#page-prev')
    var next = $('#page-next')
    var sizeSel = $('#page-size-select')
    var reload = state.reload || loadRows
    if (prev) prev.addEventListener('click', function () { if (state.page > 1) { state.page -= 1; reload() } })
    if (next) next.addEventListener('click', function () { if (state.page < state.pageCount) { state.page += 1; reload() } })
    if (sizeSel) sizeSel.addEventListener('change', function () {
      state.pageSize = Number(sizeSel.value)
      state.page = 1
      reload()
    })
  }

  function labelFor(cfg, key) {
    var col = cfg.columns.find(function (c) { return c.key === key })
    return col ? col.label : key
  }

  async function deleteRow(id) {
    var label = TABLES[state.table] ? TABLES[state.table].label : 'this table'
    var done = await confirmAction({
      title: 'Delete this row?',
      message: 'Row ' + id + ' will be removed from ' + label + '. ' + DELETE_NOTE,
      confirmLabel: 'Delete',
      run: function () { return api('/' + state.table + '/' + id, { method: 'DELETE' }) },
    })
    if (done) { await loadRows(); toast('Row deleted. The owner can restore it from the Activity log.'); if (state.table === 'corrections') refreshCounts() }
  }

  // ---------- Form ----------
  // Add and edit open a sheet from the right. Fields are grouped (Basics, Details,
  // Evidence) so a long record reads as sections, not one tall column, and closing
  // it with unsaved edits asks first.
  var EVIDENCE_KEYS = ['source', 'sourceLabel', 'sourceTier', 'sourceUrl']
  function sectionOf(col) {
    if (EVIDENCE_KEYS.indexOf(col.key) !== -1) return 'Evidence'
    if (col.type === 'textarea') return 'Details'
    return 'Basics'
  }
  var SHORT_KEYS = ['category', 'updated', 'signed', 'appointed', 'year', 'amount', 'party', 'state', 'level', 'termStart', 'termEnd', 'reviewed', 'key', 'ministry', 'serving', 'kind']
  var formDirty = false

  function fieldHtml(col, val) {
    var id = 'f-' + col.key
    if (col.type === 'boolean') {
      return '<div class="field checkbox half"><input type="checkbox" id="' + id + '" data-field="' + col.key + '" ' + (val ? 'checked' : '') + '>' +
        '<label for="' + id + '">' + esc(col.label) + '</label></div>'
    }
    var half = (col.type === 'select' || col.type === 'number' || col.type === 'status' || SHORT_KEYS.indexOf(col.key) !== -1) ? ' half' : ''
    var label = '<label for="' + id + '">' + esc(col.label) + (col.required ? '<span class="req" aria-hidden="true"> *</span>' : '') + '</label>'
    var req = col.required ? 'required' : ''
    var input
    if (col.type === 'textarea') {
      input = '<textarea id="' + id + '" data-field="' + col.key + '" rows="4" ' + req + '>' + esc(val) + '</textarea>'
    } else if (col.type === 'select') {
      input = '<select id="' + id + '" data-field="' + col.key + '" ' + req + '>' +
        col.options.map(function (o) { return '<option value="' + esc(o) + '" ' + (o === val ? 'selected' : '') + '>' + esc(o || '— none —') + '</option>' }).join('') + '</select>'
    } else if (col.type === 'status') {
      input = '<input type="text" id="' + id + '" list="dl-' + col.key + '" data-field="' + col.key + '" value="' + esc(val) + '" autocomplete="off" ' + req + '>' +
        '<datalist id="dl-' + col.key + '">' + col.options.map(function (o) { return '<option value="' + esc(o) + '">' }).join('') + '</datalist>'
    } else if (col.type === 'number') {
      input = '<input type="number" step="any" id="' + id + '" data-field="' + col.key + '" value="' + (val == null ? '' : esc(val)) + '" ' + req + '>'
    } else {
      input = '<input type="text" id="' + id + '" data-field="' + col.key + '" value="' + esc(val) + '" ' + req + '>'
    }
    return '<div class="field' + half + '">' + label + input + (col.hint ? '<div class="hint">' + esc(col.hint) + '</div>' : '') + '</div>'
  }

  // prefill: values to start a new record with (used by the Real-time Tracker)
  function openForm(id, prefill) {
    state.editingId = id
    var cfg = TABLES[state.table]
    var row = id ? state.rows.find(function (r) { return r.id === id }) : {}
    var single = cfg.label.replace(/s$/, '')
    $('#form-title').textContent = (id ? 'Edit ' : 'Add ') + single.toLowerCase()
    $('#form-sub').textContent = id ? cfg.label + ' · #' + id : 'New entry in ' + cfg.label
    $('#form-error').textContent = ''
    $('#form-delete').style.display = id ? 'inline-flex' : 'none'
    busy($('#form-save'), false)
    formDirty = false

    var groups = { Basics: [], Details: [], Evidence: [] }
    var adminHtml = ''
    if (cfg.adminScoped) {
      var opts = state.administrations.map(function (a) {
        var sel = (row.administration || state.administration) === a.key ? 'selected' : ''
        return '<option value="' + esc(a.key) + '" ' + sel + '>' + esc(a.name) + '</option>'
      }).join('')
      adminHtml = '<div class="field half"><label for="f-administration">Administration<span class="req" aria-hidden="true"> *</span></label><select id="f-administration" data-field="administration" required>' + opts + '</select></div>'
    }
    cfg.columns.forEach(function (col) { groups[sectionOf(col)].push(fieldHtml(col, row[col.key])) })
    // the administration sits right under the first field (usually the title) so the short fields pair up
    if (adminHtml) groups.Basics.splice(Math.min(1, groups.Basics.length), 0, adminHtml)

    // An optional public note, logged to entry_history on save. Only offered when
    // editing a rated table (there is a change to record).
    if (id && HISTORY_TABLES.has(state.table)) {
      groups.Evidence.push('<div class="field"><label for="f-note">Change note</label><input type="text" id="f-note" data-field="__note" value="" placeholder="e.g. re-reviewed against Q2 budget data"><div class="hint">Optional. Shown publicly on the card, next to the change.</div></div>')
    }

    var names = Object.keys(groups).filter(function (n) { return groups[n].length })
    $('#form-fields').innerHTML = names.map(function (n) {
      return '<fieldset class="fs">' + (names.length > 1 ? '<legend>' + n + '</legend>' : '') + '<div class="grid">' + groups[n].join('') + '</div></fieldset>'
    }).join('')

    if (prefill) {
      Object.keys(prefill).forEach(function (k) {
        var el = $('[data-field="' + k + '"]', $('#form-fields'))
        if (el && prefill[k] != null && prefill[k] !== '') { el.value = prefill[k]; formDirty = true }
      })
    }

    $('#overlay').classList.add('show')
    var first = $('#form-fields input:not([type=checkbox]), #form-fields textarea, #form-fields select')
    if (first) setTimeout(function () { first.focus() }, 60)
  }

  $('#form-fields').addEventListener('input', function () { formDirty = true })
  $('#form-fields').addEventListener('change', function () { formDirty = true })

  function hideForm() {
    $('#overlay').classList.remove('show')
    state.editingId = null
    formDirty = false
  }

  // Leaving with unsaved edits asks first; an untouched form just closes.
  async function closeForm(force) {
    if (!force && formDirty) {
      var discard = await confirmAction({
        title: 'Discard your changes?',
        message: 'What you typed has not been saved.',
        confirmLabel: 'Discard',
        run: function () { return Promise.resolve() },
      })
      if (!discard) return
    }
    hideForm()
  }

  $('#form-cancel').addEventListener('click', function () { closeForm() })
  $('#form-x').addEventListener('click', function () { closeForm() })
  $('#overlay').addEventListener('mousedown', function (e) { if (e.target.id === 'overlay') closeForm() })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('#overlay').classList.contains('show') && !$('#confirm-overlay').classList.contains('show')) closeForm()
  })

  $('#form-delete').addEventListener('click', async function () {
    if (!state.editingId) return
    var id = state.editingId
    var label = TABLES[state.table] ? TABLES[state.table].label : 'this table'
    var done = await confirmAction({
      title: 'Delete this row?',
      message: 'Row ' + id + ' will be removed from ' + label + '. ' + DELETE_NOTE,
      confirmLabel: 'Delete',
      run: function () { return api('/' + state.table + '/' + id, { method: 'DELETE' }) },
    })
    if (!done) return
    hideForm()
    await loadRows()
    toast('Row deleted. The owner can restore it from the Activity log.')
    if (state.table === 'corrections') refreshCounts()
  })

  $('#record-form').addEventListener('submit', async function (e) {
    e.preventDefault()
    var cfg = TABLES[state.table]
    var form = e.target
    $('#form-error').textContent = ''

    // Validate before sending: name every missing field, and put the cursor on the first.
    var missing = []
    cfg.columns.concat(cfg.adminScoped ? [{ key: 'administration', label: 'Administration', required: true }] : []).forEach(function (col) {
      var el = $('[data-field="' + col.key + '"]', form)
      if (col.required && col.type !== 'boolean' && el && String(el.value).trim() === '') missing.push({ col: col, el: el })
    })
    if (missing.length) {
      $('#form-error').textContent = 'Please fill in: ' + missing.map(function (m) { return m.col.label }).join(', ') + '.'
      missing[0].el.focus()
      return
    }

    var values = {}
    if (cfg.adminScoped) values.administration = $('[data-field="administration"]', form).value
    cfg.columns.forEach(function (col) {
      var el = $('[data-field="' + col.key + '"]', form)
      var v
      if (col.type === 'boolean') { v = el.checked }
      else if (col.type === 'number') { v = el.value === '' ? null : Number(el.value) }
      else { v = el.value === '' ? (col.required ? '' : null) : el.value }
      values[col.key] = v
    })
    var noteEl = $('[data-field="__note"]', form)
    if (noteEl && noteEl.value.trim()) values.__note = noteEl.value.trim()

    var btn = $('#form-save')
    busy(btn, true, 'Saving…')
    try {
      var editing = !!state.editingId
      if (editing) {
        await api('/' + state.table + '/' + state.editingId, { method: 'PUT', body: JSON.stringify(values) })
      } else {
        await api('/' + state.table, { method: 'POST', body: JSON.stringify(values) })
      }
      hideForm()
      await loadRows()
      toast(editing ? 'Changes saved.' : 'Added.')
      if (state.table === 'corrections') refreshCounts()
    } catch (err) {
      $('#form-error').textContent = err.message
      busy(btn, false)
    }
  })

  // ---------- AI tools ----------
  // Five assistants that read, classify and check. They only ever suggest: nothing
  // is written to the tracker until a person approves it.
  function toolIntro(iconName, text, note) {
    return '<div class="tool-intro"><span class="ti-icon">' + icon(iconName).replace('width="16" height="16"', 'width="20" height="20"') + '</span><div><p>' + esc(text) + '</p>' +
      '<p>' + esc(note || 'Suggestions come from an AI model and can be wrong. Check the sources before you rely on one.') + '</p></div></div>'
  }
  function adminOptions(first) {
    return '<option value="">' + esc(first) + '</option>' + state.administrations.map(function (a) { return '<option value="' + esc(a.key) + '">' + esc(a.name) + '</option>' }).join('')
  }
  function meter(level) {
    var l = String(level || '').toLowerCase()
    if (['high', 'medium', 'low'].indexOf(l) === -1) return '<span class="tag">' + esc(level || 'unknown') + '</span>'
    return '<span class="meter ' + l + '"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>' + l + ' confidence</span>'
  }
  function formError(id) { return '<div class="form-error" id="' + id + '" role="alert"></div>' }

  // ---------- AI Tools: Promise Classifier ----------
  async function selectPromiseClassifier() {
    state.table = '__classifier'
    setActiveNav('__classifier')
    $('#section-title').textContent = 'Promise Classifier'
    setSub('Suggests a category for a new promise and finds similar ones, including any it may contradict.')
    $('#section-controls').innerHTML = ''
    await ensureAdministrations()

    $('#content').innerHTML = '<div class="tool">' +
      toolIntro('ai', 'Paste a promise from a speech, manifesto, budget or statement. You get a suggested category, similar promises from the same administration, and across history.') +
      '<form id="classifier-form" class="card">' +
        '<div class="field"><label for="classifier-admin">Administration</label><select id="classifier-admin" required>' + adminOptions('Choose an administration') + '</select></div>' +
        '<div class="field"><label for="classifier-promise">Promise text</label><textarea id="classifier-promise" rows="5" placeholder="Paste the full promise as it was made" required></textarea>' +
          '<div class="hint">Where it came from does not matter: speech, manifesto, budget announcement or official statement.</div></div>' +
        '<div class="actions-row"><button type="submit" class="btn primary" id="classifier-go">Classify promise</button></div>' + formError('classifier-error') +
      '</form>' +
      '<div id="classifier-results" class="result" hidden></div></div>'

    $('#classifier-form').addEventListener('submit', handleClassifyPromise)
  }

  async function handleClassifyPromise(e) {
    e.preventDefault()
    var btn = $('#classifier-go')
    var administration = $('#classifier-admin').value
    var promiseText = $('#classifier-promise').value
    $('#classifier-error').textContent = ''
    busy(btn, true, 'Classifying…')
    try {
      var result = await tool('/classify', { method: 'POST', body: JSON.stringify({ promiseText: promiseText, administration: administration }) })
      var historical = []
      try { historical = await tool('/classify/historical', { method: 'POST', body: JSON.stringify({ promiseText: promiseText }) }) } catch (err) { /* optional: the main result still stands */ }
      renderClassifierResults(result, historical)
    } catch (err) {
      $('#classifier-error').textContent = err.message
    } finally {
      busy(btn, false)
    }
  }

  function promiseCard(p, withAdmin, danger) {
    return '<div class="item-card' + (danger ? ' danger' : '') + '"><div class="it-title">#' + esc(p.id) + ' · ' + esc(p.title) + '</div>' +
      '<div class="it-meta">' + (withAdmin && p.administration ? esc(p.administration) + ' · ' : '') + (p.category ? esc(p.category) + ' · ' : '') + (p.status ? statusBadge(p.status) : '') + '</div>' +
      (p.reason ? '<div class="it-body">' + esc(p.reason) + '</div>' : (p.promise ? '<div class="it-body">' + esc(String(p.promise).slice(0, 180)) + (p.promise.length > 180 ? '…' : '') + '</div>' : '')) + '</div>'
  }

  function renderClassifierResults(r, historical) {
    var html = '<div class="result-head"><h3 class="section-h" style="margin:0;flex:1">Result</h3><button type="button" class="btn" id="classifier-again">Classify another</button></div>' +
      '<div class="kv"><div><dt>Suggested category</dt><dd>' + esc(r.suggested_category) + '</dd></div><div><dt>Confidence</dt><dd>' + meter(r.confidence_category) + '</dd></div></div>' +
      '<div class="callout"><h4>Reasoning</h4><p class="prose">' + esc(r.reasoning) + '</p></div>'
    if (r.contradictions && r.contradictions.length) {
      html += '<div class="callout bad"><h4>Possible contradictions</h4><div class="stack">' + r.contradictions.map(function (c) { return promiseCard(c, false, true) }).join('') + '</div></div>'
    }
    if (r.similar_promises && r.similar_promises.length) {
      html += '<div class="section-h">Similar promises, same administration</div><div class="stack">' + r.similar_promises.map(function (p) { return promiseCard(p) }).join('') + '</div>'
    }
    if (historical && historical.length) {
      html += '<div class="section-h">Similar promises across history</div><div class="stack">' + historical.map(function (p) { return promiseCard(p, true) }).join('') + '</div>'
    }
    var box = $('#classifier-results')
    box.innerHTML = html
    box.hidden = false
    $('#classifier-form').hidden = true
    $('#classifier-again').addEventListener('click', function () { box.hidden = true; $('#classifier-form').hidden = false; $('#classifier-promise').focus() })
    box.scrollIntoView({ block: 'nearest' })
  }

  // ---------- AI Tools: Outcome Verifier ----------
  async function selectOutcomeVerifier() {
    state.table = '__outcome'
    setActiveNav('__outcome')
    $('#section-title').textContent = 'Outcome Verifier'
    setSub('Checks a news article against a tracked promise and suggests what its status should be.')
    $('#section-controls').innerHTML = ''

    $('#content').innerHTML = '<div class="tool">' +
      toolIntro('promises', 'Give it a promise id and an article. It extracts the claims, quotes the evidence and suggests a status. Nothing changes until you approve it.') +
      '<form id="outcome-form" class="card">' +
        '<div class="field"><label for="outcome-promise-id">Promise ID</label><input type="number" id="outcome-promise-id" min="1" placeholder="e.g. 142" required>' +
          '<div class="hint">Open the Promises table and click a row; its id is shown at the top of the panel.</div></div>' +
        '<div class="field"><label>Article</label><div class="seg-toggle" role="radiogroup" aria-label="Article source">' +
          '<label><input type="radio" name="outcome-input-type" value="text" checked><span>Paste text</span></label>' +
          '<label><input type="radio" name="outcome-input-type" value="url"><span>Article URL</span></label></div></div>' +
        '<div class="field"><label for="outcome-article" id="outcome-article-label">Article text</label><textarea id="outcome-article" rows="6" placeholder="Paste the article text here" required></textarea></div>' +
        '<div class="actions-row"><button type="submit" class="btn primary" id="outcome-go">Verify promise</button></div>' + formError('outcome-error') +
      '</form>' +
      '<div id="outcome-results" class="result" hidden></div></div>'

    $('#outcome-form').addEventListener('submit', handleOutcomeVerify)
    $$('[name="outcome-input-type"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var url = this.value === 'url'
        $('#outcome-article-label').textContent = url ? 'Article URL' : 'Article text'
        var ta = $('#outcome-article')
        ta.placeholder = url ? 'https://example.com/article' : 'Paste the article text here'
        ta.rows = url ? 2 : 6
      })
    })
  }

  async function handleOutcomeVerify(e) {
    e.preventDefault()
    var btn = $('#outcome-go')
    var promiseId = parseInt($('#outcome-promise-id').value, 10)
    var byUrl = document.querySelector('[name="outcome-input-type"]:checked').value === 'url'
    var payload = { promiseId: promiseId }
    payload[byUrl ? 'articleUrl' : 'articleText'] = $('#outcome-article').value
    $('#outcome-error').textContent = ''
    busy(btn, true, 'Reading the article…')
    try {
      renderOutcomeResults(await tool('/verify', { method: 'POST', body: JSON.stringify(payload) }), promiseId)
    } catch (err) {
      $('#outcome-error').textContent = err.message
    } finally {
      busy(btn, false)
    }
  }

  function renderOutcomeResults(r, promiseId) {
    var html = '<div class="result-head"><h3 class="section-h" style="margin:0;flex:1">Result</h3><button type="button" class="btn" id="outcome-again">Check another</button></div>' +
      '<h3 style="margin:0 0 12px;font-size:17px;line-height:1.4">' + esc(r.promise.title) + '</h3>' +
      '<div class="kv"><div><dt>Current status</dt><dd>' + statusBadge(r.promise.current_status) + '</dd></div>' +
      '<div><dt>Suggested status</dt><dd>' + (r.suggested_status ? statusBadge(r.suggested_status) : '<span class="muted-dash">No clear evidence</span>') + '</dd></div>' +
      '<div><dt>Confidence</dt><dd>' + meter(r.confidence) + '</dd></div></div>' +
      '<div class="callout"><h4>Reasoning</h4><p class="prose">' + esc(r.reasoning) + '</p></div>'
    if (r.claims && r.claims.length) html += '<div class="section-h">Claims found in the article</div><div class="callout"><ul>' + r.claims.map(function (c) { return '<li>' + esc(c) + '</li>' }).join('') + '</ul></div>'
    if (r.evidence_quotes && r.evidence_quotes.length) html += '<div class="section-h">Evidence quotes</div><div class="stack">' + r.evidence_quotes.map(function (q) { return '<blockquote class="quote">' + esc(q) + '</blockquote>' }).join('') + '</div>'
    if (r.suggested_status) {
      html += '<div class="card" style="margin-top:20px"><h3>Approve this change?</h3><p class="lede">This sets promise #' + esc(promiseId) + ' to “' + esc(r.suggested_status) + '” and records it in the change history.</p>' +
        '<div class="field"><label for="outcome-source-url">Source URL <span class="faint">(optional)</span></label><input type="url" id="outcome-source-url" placeholder="https://…"></div>' +
        '<div class="field"><label for="outcome-note">Note <span class="faint">(optional)</span></label><textarea id="outcome-note" rows="2" placeholder="Context for the change history"></textarea></div>' +
        '<div class="actions-row"><button type="button" class="btn primary" id="outcome-save">Approve and save</button></div>' + formError('outcome-save-error') + '</div>'
    }
    var box = $('#outcome-results')
    box.innerHTML = html
    box.hidden = false
    $('#outcome-form').hidden = true
    $('#outcome-again').addEventListener('click', function () { box.hidden = true; $('#outcome-form').hidden = false })
    var save = $('#outcome-save')
    if (save) save.addEventListener('click', function () { saveOutcomeVerification(promiseId, r.suggested_status) })
    box.scrollIntoView({ block: 'nearest' })
  }

  async function saveOutcomeVerification(promiseId, suggestedStatus) {
    var btn = $('#outcome-save')
    $('#outcome-save-error').textContent = ''
    busy(btn, true, 'Saving…')
    try {
      await tool('/approve', { method: 'POST', body: JSON.stringify({
        promiseId: promiseId, newStatus: suggestedStatus,
        sourceUrl: $('#outcome-source-url').value || undefined, note: $('#outcome-note').value || undefined,
      }) })
      toast('Promise #' + promiseId + ' is now “' + suggestedStatus + '”.')
      selectOutcomeVerifier()
      refreshCounts()
    } catch (err) {
      $('#outcome-save-error').textContent = err.message
      busy(btn, false)
    }
  }

  // ---------- AI Tools: Lie Detector ----------
  var VERDICTS = {
    'true': { label: 'True', mark: '✓' }, misleading: { label: 'Misleading', mark: '!' },
    'false': { label: 'False', mark: '✗' }, unverifiable: { label: 'Unverifiable', mark: '?' },
  }

  async function selectLieDetector() {
    state.table = '__factcheck'
    setActiveNav('__factcheck')
    $('#section-title').textContent = 'Lie Detector'
    setSub('Fact-checks a government statement against the promises and records we track.')
    $('#section-controls').innerHTML = ''
    await ensureAdministrations()

    $('#content').innerHTML = '<div class="tool">' +
      toolIntro('shield', 'Paste a statement, press release or speech. Each claim is checked against the tracker and marked true, misleading, false or unverifiable.', 'A verdict only reflects what the tracker holds. “Unverifiable” means we have nothing to check it against, not that it is false.') +
      '<form id="factcheck-form" class="card">' +
        '<div class="field"><label for="factcheck-admin">Administration <span class="faint">(optional)</span></label><select id="factcheck-admin">' + adminOptions('All administrations') + '</select>' +
          '<div class="hint">Choosing one is faster and more accurate.</div></div>' +
        '<div class="field"><label for="factcheck-text">Statement or speech</label><textarea id="factcheck-text" rows="8" placeholder="Paste the statement, press release or budget speech" required></textarea></div>' +
        '<div class="actions-row"><button type="submit" class="btn primary" id="factcheck-go">Fact-check</button></div>' + formError('factcheck-error') +
      '</form>' +
      '<div id="factcheck-results" class="result" hidden></div></div>'
    $('#factcheck-form').addEventListener('submit', handleFactCheck)
  }

  async function handleFactCheck(e) {
    e.preventDefault()
    var btn = $('#factcheck-go')
    $('#factcheck-error').textContent = ''
    busy(btn, true, 'Checking claims…')
    try {
      var administration = $('#factcheck-admin').value
      renderFactCheckResults(await tool('/factcheck', { method: 'POST', body: JSON.stringify({ statementText: $('#factcheck-text').value, administration: administration || undefined }) }))
    } catch (err) {
      $('#factcheck-error').textContent = err.message
    } finally {
      busy(btn, false)
    }
  }

  function renderFactCheckResults(result) {
    var box = $('#factcheck-results')
    var html = '<div class="result-head"><h3 class="section-h" style="margin:0;flex:1">Result</h3><button type="button" class="btn" id="factcheck-again">New statement</button></div>'
    if (!result.claims_checked) {
      html += '<div class="notice">' + esc(result.message || 'No verifiable claims were found in that text.') + '</div>'
    } else {
      html += '<div class="verdict-grid">' + Object.keys(VERDICTS).map(function (k) {
        return '<div class="v-' + k + '"><b>' + ((result.summary && result.summary[k]) || 0) + '</b><span>' + VERDICTS[k].label + '</span></div>'
      }).join('') + '</div><div class="stack">' + result.results.map(function (r) {
        var v = VERDICTS[r.verdict] ? r.verdict : 'unverifiable'
        return '<article class="claim v-' + v + '"><span class="claim-icon" aria-hidden="true">' + VERDICTS[v].mark + '</span><div>' +
          '<div class="claim-text">“' + esc(r.claim) + '” <span class="tag" style="margin-left:6px">' + VERDICTS[v].label + '</span></div>' +
          '<div class="claim-reason">' + esc(r.reason) + '</div>' +
          (r.matched_promises && r.matched_promises.length ? '<div class="claim-tags">' + r.matched_promises.map(function (p) { return '<span class="tag"><b>#' + esc(p.id) + '</b> ' + esc(p.title) + ' · ' + esc(p.status) + '</span>' }).join('') + '</div>' : '') +
          '</div></article>'
      }).join('') + '</div>'
    }
    box.innerHTML = html
    box.hidden = false
    $('#factcheck-form').hidden = true
    $('#factcheck-again').addEventListener('click', function () { box.hidden = true; $('#factcheck-form').hidden = false; $('#factcheck-text').focus() })
    box.scrollIntoView({ block: 'nearest' })
  }

  // ---------- AI Tools: Real-time Tracker ----------
  async function selectRealTimeTracker() {
    state.table = '__tracker'
    setActiveNav('__tracker')
    $('#section-title').textContent = 'Real-time Tracker'
    setSub('Scans news feeds for new promises. Review what it finds and add the ones worth tracking.')
    $('#section-controls').innerHTML = '<button class="btn primary" id="tracker-scan">Scan feeds now</button>'
    $('#tracker-scan').addEventListener('click', runTrackerScan)
    $('#content').innerHTML = skeleton(3, true)
    await loadTrackerQueue()
  }

  async function loadTrackerQueue() {
    try {
      renderTrackerQueue(await tool('/tracker/queue'))
    } catch (err) {
      $('#content').innerHTML = '<div class="notice">Could not load the queue: ' + esc(err.message) + '</div>'
    }
  }

  async function runTrackerScan() {
    var btn = $('#tracker-scan')
    busy(btn, true, 'Scanning feeds…')
    try {
      var result = await tool('/tracker/scan', { method: 'POST', body: '{}' })
      await loadTrackerQueue()
      toast('Scanned ' + result.scanned + ' articles, found ' + result.found + ' promises, added ' + result.added + ' new.')
    } catch (err) {
      toast('Scan failed: ' + err.message, 'error')
    } finally {
      busy(btn, false)
    }
  }

  function renderTrackerQueue(queue) {
    var pending = (queue || []).filter(function (q) { return q.status === 'pending' })
    if (!pending.length) {
      $('#content').innerHTML = emptyState('projects', queue && queue.length ? 'Queue cleared' : 'Nothing to review yet', queue && queue.length ? 'Every item has been reviewed.' : 'Press “Scan feeds now” to look for new promises in the news.')
      return
    }
    $('#content').innerHTML = '<div class="tool"><div class="stack">' + pending.map(function (item) {
      return '<article class="queue-item" data-id="' + esc(item.id) + '"><div class="qi-main">' +
        '<div class="qi-meta"><strong>' + esc(item.source_name) + '</strong>' + (item.category ? '<span class="tag">' + esc(item.category) + '</span>' : '') + meter(item.confidence) + '<span>' + esc(String(item.detected_at || '').slice(0, 10)) + '</span></div>' +
        '<p>' + esc(item.promise_text) + '</p>' +
        (item.official ? '<div class="it-meta">Said by ' + esc(item.official) + (item.administration_hint ? ' (' + esc(item.administration_hint) + ')' : '') + '</div>' : '') +
        (/^https?:\/\//i.test(item.source_url || '') ? '<a href="' + esc(item.source_url) + '" target="_blank" rel="noopener noreferrer">Read the source ↗</a>' : '') +
        '</div><div class="qi-actions"><button type="button" class="btn small primary" data-add="' + esc(item.id) + '">Add to tracker</button>' +
        '<button type="button" class="btn small danger" data-dismiss="' + esc(item.id) + '">Dismiss</button></div></article>'
    }).join('') + '</div></div>'

    $$('[data-add]').forEach(function (b) { b.addEventListener('click', function () { addTrackerItemToPromises(b.dataset.add, pending) }) })
    $$('[data-dismiss]').forEach(function (b) { b.addEventListener('click', function () { dismissTrackerItem(b.dataset.dismiss) }) })
  }

  async function dismissTrackerItem(id) {
    try {
      await tool('/tracker/queue/' + encodeURIComponent(id), { method: 'DELETE' })
      var el = document.querySelector('.queue-item[data-id="' + id.replace(/"/g, '') + '"]')
      if (el) el.remove()
      if (!document.querySelector('.queue-item')) loadTrackerQueue()
    } catch (err) {
      toast('Could not dismiss: ' + err.message, 'error')
    }
  }

  // Opens the Promises form with what the scan found already filled in; the
  // editor still chooses the status and writes the assessment.
  async function addTrackerItemToPromises(id, items) {
    var item = items.find(function (q) { return String(q.id) === String(id) })
    if (!item) return
    await selectTable('promises')
    var hint = String(item.administration_hint || '').toLowerCase()
    var match = state.administrations.find(function (a) { return a.key === hint || String(a.name).toLowerCase() === hint })
    openForm(null, {
      administration: match ? match.key : '', promise: item.promise_text, category: item.category || '',
      source: /^https?:\/\//i.test(item.source_url || '') ? item.source_url : '', sourceLabel: item.source_name || '',
    })
    toast('Pre-filled from the scan. Add a title, status and assessment, then save.')
  }

  // ---------- AI Tools: Pattern Detector ----------
  async function selectPatternDetector() {
    state.table = '__patterns'
    setActiveNav('__patterns')
    $('#section-title').textContent = 'Pattern Detector'
    setSub('Looks across all tracked promises for sectors and administrations that stand out.')
    await ensureAdministrations()
    $('#section-controls').innerHTML = '<select id="patterns-admin" aria-label="Administration">' + adminOptions('All administrations') + '</select><button class="btn primary" id="patterns-run">Analyse</button>'
    $('#content').innerHTML = '<div class="tool">' + toolIntro('indicators', 'Choose an administration, or leave it on all, then press Analyse. You get the overall pattern, anything unusual, and kept and broken rates by sector and by administration.') + '</div>'
    $('#patterns-run').addEventListener('click', runPatternDetector)
  }

  async function runPatternDetector() {
    var btn = $('#patterns-run')
    var administration = $('#patterns-admin').value
    busy(btn, true, 'Analysing…')
    $('#content').innerHTML = skeleton(4, true)
    try {
      renderPatternReport(await tool('/patterns' + (administration ? '?administration=' + encodeURIComponent(administration) : '')))
    } catch (err) {
      $('#content').innerHTML = '<div class="notice">Analysis failed: ' + esc(err.message) + '</div>'
    } finally {
      busy(btn, false)
    }
  }

  function rateTable(rows, firstLabel, firstKey) {
    return '<div class="table-scroll"><table class="data"><thead><tr><th>' + firstLabel + '</th><th class="num">Total</th><th class="num">Kept</th><th class="num">Partial</th><th class="num">Broken</th><th class="num">Pending</th><th>Kept rate</th><th class="num">Broken rate</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var cls = r.kept_rate >= 50 ? '' : (r.kept_rate <= 20 ? ' low' : ' mid')
        return '<tr><td>' + esc(r[firstKey]) + '</td><td class="num">' + r.total + '</td><td class="num">' + r.kept + '</td><td class="num">' + r.partial + '</td><td class="num">' + r.broken + '</td><td class="num">' + r.pending + '</td>' +
          '<td><div class="bar-cell"><span class="track"><i class="' + cls.trim() + '" style="width:' + Math.max(0, Math.min(100, r.kept_rate)) + '%"></i></span><span class="' + (r.kept_rate >= 50 ? 'rate-good' : r.kept_rate <= 20 ? 'rate-bad' : '') + '">' + r.kept_rate + '%</span></div></td>' +
          '<td class="num">' + r.broken_rate + '%</td></tr>'
      }).join('') + '</tbody></table></div>'
  }

  function renderPatternReport(report) {
    var html = '<div class="tool" style="max-width:none">'
    if (report.insights && report.insights.length) {
      html += '<div class="callout"><h4>AI insights</h4><ul>' + report.insights.map(function (i) { return '<li>' + esc(i) + '</li>' }).join('') + '</ul></div>'
    }
    var anomalies = ((report.anomalies && report.anomalies.sector_anomalies) || []).concat((report.anomalies && report.anomalies.admin_anomalies) || [])
    if (anomalies.length) {
      html += '<div class="callout warn"><h4>Anomalies</h4><ul>' + anomalies.map(function (a) {
        return '<li><strong>' + esc(a.category || a.administration) + '</strong>: ' + a.kept_rate + '% kept, ' + Math.abs(a.deviation) + ' points ' + (a.type === 'overperformer' ? 'above' : 'below') + ' the average (' + esc(a.type) + ')</li>'
      }).join('') + '</ul></div>'
    }
    if (report.sector_patterns && report.sector_patterns.length) html += '<div class="section-h">By sector</div>' + rateTable(report.sector_patterns, 'Category', 'category')
    if (report.admin_comparison && report.admin_comparison.length) html += '<div class="section-h">By administration</div>' + rateTable(report.admin_comparison, 'Administration', 'administration')
    if (html === '<div class="tool" style="max-width:none">') html += emptyState('indicators', 'No promise data', 'Nothing was found for this selection.')
    $('#content').innerHTML = html + '</div>'
  }

  // ---------- Registry and history ----------
  async function selectRegistry() {
    state.table = '__registry'
    setActiveNav('__registry')
    $('#section-title').textContent = 'Indicator Registry'
    setSub('The reference list of every indicator the tracker can show.')
    $('#section-controls').innerHTML = '<input type="search" class="search" id="registry-search" placeholder="Filter indicators…" aria-label="Filter indicators">'
    $('#content').innerHTML = skeleton()
    var rows = await api('/registry')
    $('#section-count').textContent = String(rows.length)
    function draw(filter) {
      var f = String(filter || '').toLowerCase()
      var shown = rows.filter(function (r) { return !f || JSON.stringify(r).toLowerCase().indexOf(f) !== -1 })
      if (!shown.length) { $('#registry-table').innerHTML = '<div class="table-scroll">' + emptyState('list', 'No indicator matches', 'Try fewer letters.') + '</div>'; return }
      $('#registry-table').innerHTML = '<div class="table-scroll"><table class="data"><thead><tr><th>Key</th><th>Label</th><th>Unit</th><th>Level</th><th>Tier</th><th>Description</th></tr></thead><tbody>' +
        shown.map(function (r) {
          return '<tr><td><code class="mono">' + esc(r.key) + '</code></td><td>' + esc(r.label) + '</td><td>' + dash(r.unit) + '</td><td>' + dash(r.level) + '</td><td>' + (r.tier ? '<span class="badge tone-plain">' + esc(r.tier) + '</span>' : dash('')) + '</td><td title="' + esc(r.description) + '"><span class="cell-text">' + esc(r.description) + '</span></td></tr>'
        }).join('') + '</tbody></table></div>'
    }
    $('#content').innerHTML = '<div id="registry-table"></div>'
    draw('')
    $('#registry-search').addEventListener('input', function () { draw(this.value) })
  }

  async function selectHistory() {
    state.table = '__history'
    setActiveNav('__history')
    await ensureAdministrations()
    $('#section-title').textContent = 'Change History'
    setSub('The public record of every rating and entry change, one administration at a time.')
    $('#section-controls').innerHTML = '<select id="history-admin" aria-label="Administration">' + adminOptions('Choose an administration') + '</select>'
    $('#content').innerHTML = emptyState('clock', 'Choose an administration', 'Its public change history will appear here, oldest first.')
    $('#history-admin').addEventListener('change', async function () {
      if (!this.value) return
      $('#content').innerHTML = skeleton()
      var rows = await api('/history/' + encodeURIComponent(this.value))
      $('#section-count').textContent = rows.length ? String(rows.length) : ''
      if (!rows.length) { $('#content').innerHTML = emptyState('clock', 'No changes recorded', 'Nothing has been changed publicly for this administration yet.'); return }
      $('#content').innerHTML = '<div class="table-scroll"><table class="data"><thead><tr><th>When</th><th>Entry</th><th>Field</th><th>Change</th><th>Kind</th><th>Note</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var change = (r.oldValue == null && r.newValue == null) ? '<span class="muted-dash">—</span>'
            : '<span class="diff"><span class="old">' + esc(String(r.oldValue == null ? '' : r.oldValue).slice(0, 60)) + '</span><span aria-hidden="true">→</span><span class="new">' + esc(String(r.newValue == null ? '' : r.newValue).slice(0, 60)) + '</span></span>'
          return '<tr><td>' + fmtDateTime(r.changedAt) + '</td><td>' + esc(r.entryTable) + ' #' + esc(r.entryId) + '</td><td>' + esc(r.field) + '</td><td>' + change + '</td><td><span class="act">' + esc(String(r.kind).replace(/_/g, ' ')) + '</span></td><td>' + dash(r.note) + '</td></tr>'
        }).join('') + '</tbody></table></div>'
    })
  }

  // ---------- API Keys ----------
  async function selectKeys(keepPage) {
    state.table = '__keys'
    state.reload = function () { selectKeys(true) }
    if (!keepPage) state.page = 1
    setActiveNav('__keys')
    $('#section-title').textContent = 'API Keys'
    setSub('Keys issued for the public data API. Revoking one cuts off access straight away.')
    $('#section-controls').innerHTML = ''
    $('#content').innerHTML = skeleton()
    var result = await api('/keys?page=' + state.page + '&pageSize=' + state.pageSize)
    if (!result.rows.length && result.page > 1 && result.total > 0) {
      state.page = Math.max(1, result.pageCount)
      result = await api('/keys?page=' + state.page + '&pageSize=' + state.pageSize)
    }
    applyPageResult(result)
    $('#section-count').textContent = state.total ? String(state.total) : ''
    if (!state.total) {
      $('#content').innerHTML = '<div class="table-scroll">' + emptyState('key', 'No API keys yet', 'Keys appear here when someone requests access to the public API.') + '</div>'
      return
    }
    var html = '<div class="table-scroll"><table class="data"><thead><tr><th>Holder</th><th>Tier</th><th>Created</th><th>Last used</th><th class="num">Requests</th><th>Status</th><th></th></tr></thead><tbody>'
    state.rows.forEach(function (k) {
      html += '<tr><td><div class="person"><span class="avatar" aria-hidden="true">' + esc(initials(k.email)) + '</span><span>' + esc(k.email) + '</span></div></td><td><span class="badge tone-plain">' + esc(k.tier) + '</span></td><td>' + fmtDateTime(k.createdAt) + '</td>' +
        '<td>' + (k.lastUsedAt ? fmtDateTime(k.lastUsedAt) : '<span class="muted-dash">never</span>') + '</td><td class="num">' + esc(k.requestCount) + '</td>' +
        '<td>' + (k.revoked ? toneBadge('revoked', 'bad') : toneBadge('active', 'good')) + '</td>' +
        '<td class="actions"><button class="btn small" data-toggle="' + k.id + '" data-revoked="' + k.revoked + '">' + (k.revoked ? 'Restore' : 'Revoke') + '</button>' +
        '<button class="btn small danger" data-delkey="' + k.id + '">Delete</button></td></tr>'
    })
    $('#content').innerHTML = html + '</tbody></table></div>' + renderPagination()
    $$('[data-toggle]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var revoked = b.dataset.revoked === 'true'
        busy(b, true, '')
        try { await api('/keys/' + b.dataset.toggle + '/' + (revoked ? 'unrevoke' : 'revoke'), { method: 'POST' }); toast(revoked ? 'Key restored.' : 'Key revoked. It stopped working immediately.') }
        catch (err) { toast(err.message, 'error') }
        selectKeys(true)
      })
    })
    $$('[data-delkey]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var done = await confirmAction({
          title: 'Delete this API key?',
          message: 'Anyone using this key loses access immediately. Unlike a table row, a deleted key cannot be restored; issue a new one instead.',
          confirmLabel: 'Delete key',
          run: function () { return api('/keys/' + b.dataset.delkey, { method: 'DELETE' }) },
        })
        if (done) { toast('Key deleted.'); selectKeys(true) }
      })
    })
    wirePagination()
  }

  // ---------- Overview ----------
  // The landing page: what is waiting for a person, then what changed lately.
  var PROMISE_ORDER = ['kept', 'partial', 'broken', 'pending', 'unassessed']
  var OVERVIEW_TABLES = ['promises', 'inherited', 'fraud', 'orders', 'ministers', 'bills', 'judgments', 'projects', 'governors']

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')) }

  function statCard(opts) {
    var tag = opts.go ? 'button type="button"' : 'div'
    var end = opts.go ? 'button' : 'div'
    return '<' + tag + ' class="stat' + (opts.tone ? ' tone-' + opts.tone : '') + '"' + (opts.go ? ' data-go="' + esc(opts.go) + '"' : '') + '>' +
      '<span class="stat-label">' + esc(opts.label) + '</span>' +
      '<span class="stat-value">' + esc(opts.value) + '</span>' +
      (opts.sub ? '<span class="stat-sub">' + opts.sub + '</span>' : '') +
      (opts.extra || '') + '</' + end + '>'
  }

  function promiseBar(byStatus) {
    var total = 0
    var keys = PROMISE_ORDER.filter(function (k) { return byStatus[k] }).concat(Object.keys(byStatus).filter(function (k) { return PROMISE_ORDER.indexOf(k) === -1 }))
    keys.forEach(function (k) { total += byStatus[k] })
    if (!total) return ''
    return '<span class="seg" role="img" aria-label="' + esc(keys.map(function (k) { return byStatus[k] + ' ' + k }).join(', ')) + '">' +
      keys.map(function (k) { return '<i class="tone-' + statusTone(k) + '" style="width:' + (byStatus[k] / total * 100).toFixed(2) + '%"></i>' }).join('') + '</span>' +
      '<span class="seg-legend">' + keys.map(function (k) { return '<span><i class="tone-' + statusTone(k) + '"></i>' + esc(k) + ' ' + byStatus[k] + '</span>' }).join('') + '</span>'
  }

  function panel(title, bodyHtml, linkHtml) {
    return '<section class="panel"><header><h3>' + esc(title) + '</h3>' + (linkHtml || '') + '</header>' + bodyHtml + '</section>'
  }

  async function selectOverview() {
    state.table = '__overview'
    state.reload = selectOverview
    closeDetail()
    setActiveNav('__overview')
    $('#section-title').textContent = 'Overview'
    setSub('What needs attention, and what changed lately.')
    $('#section-controls').innerHTML = ''
    $('#content').innerHTML = skeleton()
    var o
    try {
      o = await api('/overview')
    } catch (err) {
      // "Unknown table" means the server is older than this page (it was started before
      // the overview endpoint existed); a restart is the fix, not a retry.
      var stale = /^Unknown table/.test(err.message)
      $('#content').innerHTML = '<div class="notice">' + (stale
        ? '<strong>The server needs a restart.</strong> It is running older code than this page. Stop it (Ctrl+C) and run <code class="mono">npm run dev</code> again, then reload.'
        : 'Could not load the overview: ' + esc(err.message)) + '</div>'
      return
    }
    state.overview = o
    setNavCount('corrections', o.corrections['new'] || 0)
    await ensureAdministrations()

    var isOwner = state.user && state.user.role === 'owner'
    var waiting = o.corrections['new'] || 0
    var reviewing = o.corrections.reviewing || 0
    var promiseTotal = o.totals.promises || 0
    var due = o.reviewDue.count

    var cards = [
      statCard({ label: 'Corrections waiting', value: waiting, tone: waiting ? 'warn' : 'good', go: 'corrections',
        sub: waiting ? (reviewing ? reviewing + ' more being reviewed' : 'Readers are waiting on a response') : 'Inbox is clear' }),
      statCard({ label: 'Promises tracked', value: promiseTotal, go: 'promises', extra: promiseBar(o.promisesByStatus) }),
      statCard({ label: 'Reviews overdue', value: due, tone: due ? 'warn' : 'good', go: '__audit',
        sub: due ? 'Profiles last reviewed 9+ months ago' : 'Every current profile is up to date' }),
      statCard({ label: 'Changed this week', value: o.changesLast7Days, go: '__history', sub: 'Public changes to ratings and entries' }),
    ]
    if (isOwner && o.subscribers) {
      cards.push(statCard({ label: 'Newsletter', value: o.subscribers.confirmed, go: '__newsletter',
        sub: o.subscribers.pending ? o.subscribers.pending + ' awaiting confirmation' : 'confirmed subscribers' }))
    }

    // Needs attention
    var attention = []
    if (waiting) attention.push('<li><button type="button" class="linkish" data-go="corrections"><strong>' + plural(waiting, 'correction') + '</strong> waiting for a first look</button></li>')
    o.reviewDue.oldest.forEach(function (p) {
      attention.push('<li><span><strong>' + esc(p.name) + '</strong>' + (p.state ? ' (' + esc(p.state) + ')' : '') + ' was last reviewed ' + esc(p.reviewed) + ' <span class="faint">(' + plural(p.months, 'month') + ' ago)</span></span></li>')
    })
    if (due > o.reviewDue.oldest.length) attention.push('<li class="faint">and ' + (due - o.reviewDue.oldest.length) + ' more overdue</li>')
    var attentionHtml = attention.length
      ? '<ul class="plain">' + attention.join('') + '</ul>'
      : '<p class="all-clear">Nothing is waiting. The inbox is clear and every current profile has been reviewed recently.</p>'

    // Recent public changes
    var changes = o.recentChanges.length ? '<ul class="plain feed">' + o.recentChanges.map(function (c) {
      var arrow = c.oldValue != null || c.newValue != null
        ? ' <span class="faint">' + esc(c.oldValue == null ? '' : String(c.oldValue).slice(0, 40)) + '</span> → <strong>' + esc(c.newValue == null ? '' : String(c.newValue).slice(0, 40)) + '</strong>'
        : ''
      return '<li><span>' + esc(c.entryTable) + ' #' + esc(c.entryId) + (c.administration ? ' · ' + esc(c.administration) : '') + ' · ' + esc(c.field) + arrow + '</span><time>' + relTime(c.changedAt) + '</time></li>'
    }).join('') + '</ul>' : '<p class="faint pad">No changes recorded yet.</p>'

    // What is in the tracker
    var contents = '<div class="chips">' + OVERVIEW_TABLES.filter(function (n) { return TABLES[n] }).map(function (n) {
      return '<button type="button" class="chip" data-go="' + n + '"><span class="chip-n">' + (o.totals[n] || 0) + '</span> ' + esc(TABLES[n].label) + '</button>'
    }).join('') + '</div>'

    var activity = ''
    if (isOwner && o.recentActivity) {
      activity = panel('Recent admin activity', o.recentActivity.length ? '<ul class="plain feed">' + o.recentActivity.map(function (a) {
        return '<li><span><strong>' + esc(a.actorEmail) + '</strong> ' + esc(String(a.action).replace(/_/g, ' ')) + (a.tableName ? ' in ' + esc(a.tableName) : '') + (a.rowId ? ' #' + esc(a.rowId) : '') + '</span><time>' + relTime(a.at) + '</time></li>'
      }).join('') + '</ul>' : '<p class="faint pad">No activity yet.</p>', '<button type="button" class="linkish small" data-go="__activity">View all</button>')
    }

    $('#content').innerHTML =
      '<div class="stats">' + cards.join('') + '</div>' +
      '<div class="cols">' +
        panel('Needs attention', attentionHtml) +
        panel('Recent changes', changes, '<button type="button" class="linkish small" data-go="__history">Change history</button>') +
      '</div>' +
      panel('What is in the tracker', contents) +
      activity

    $$('#content [data-go]').forEach(function (el) {
      el.addEventListener('click', function () { goTo(el.dataset.go) })
    })
  }

  // Open a view by the same id the sidebar uses.
  function goTo(id) {
    if (TABLES[id]) {
      // the overview's corrections card means "show me the ones nobody has looked at"
      return selectTable(id, id === 'corrections' ? { status: 'new' } : null)
    }
    var item = document.querySelector('.nav-item[data-table="' + id + '"]')
    if (item) item.click()
  }

  // ---------- Newsletter (owner) ----------
  async function selectNewsletter(keepPage) {
    state.table = '__newsletter'
    state.reload = function () { selectNewsletter(true) }
    if (!keepPage) { state.page = 1; state.newsletterStatus = state.newsletterStatus || '' }
    setActiveNav('__newsletter')
    $('#section-title').textContent = 'Newsletter'
    setSub('Signups confirm by email. Only confirmed addresses should be mailed; unsubscribed ones are kept so they are never re-added.')
    $('#section-controls').innerHTML = '<a class="btn" href="/api/admin/subscribers.csv">Download confirmed (CSV)</a><a class="btn" href="/api/admin/subscribers.csv?status=all">All (CSV)</a>'
    $('#content').innerHTML = skeleton()
    var q = '/subscribers?page=' + state.page + '&pageSize=' + state.pageSize + (state.newsletterStatus ? '&status=' + state.newsletterStatus : '')
    var result = await api(q)
    applyPageResult(result)
    var c = result.counts
    var tabs = [['', 'All', c.confirmed + c.pending + c.unsubscribed], ['confirmed', 'Confirmed', c.confirmed], ['pending', 'Pending', c.pending], ['unsubscribed', 'Unsubscribed', c.unsubscribed]]
    var html = '<div class="stats">' +
      statCard({ label: 'Confirmed', value: c.confirmed, tone: 'good', sub: 'Will receive the newsletter' }) +
      statCard({ label: 'Pending', value: c.pending, tone: c.pending ? 'warn' : '', sub: 'Have not clicked the confirmation link' }) +
      statCard({ label: 'Unsubscribed', value: c.unsubscribed, sub: 'Opted out; kept so they are not re-added' }) + '</div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (tb) {
        var on = (state.newsletterStatus || '') === tb[0]
        return '<button type="button" role="tab" aria-selected="' + on + '" class="tab' + (on ? ' on' : '') + '" data-nlstatus="' + tb[0] + '">' + esc(tb[1]) + ' <span class="tab-n">' + tb[2] + '</span></button>'
      }).join('') + '</div>'
    if (!state.total) {
      $('#content').innerHTML = html + '<div class="table-scroll">' + emptyState('mail', 'No subscribers here yet', 'People appear when they sign up from the site footer or a publication.') + '</div>'
    } else {
      html += '<div class="table-scroll"><table class="data"><thead><tr><th>Email</th><th>Status</th><th>Source</th><th>Signed up</th><th>Confirmed</th><th>Unsubscribed</th></tr></thead><tbody>'
      state.rows.forEach(function (r) {
        html += '<tr><td><div class="person"><span class="avatar" aria-hidden="true">' + esc(initials(r.email)) + '</span><span>' + esc(r.email) + '</span></div></td><td>' + statusBadge(r.status) + '</td><td>' + dash(r.source) +
          '</td><td>' + fmtDateTime(r.createdAt) + '</td><td>' + (r.confirmedAt ? fmtDateTime(r.confirmedAt) : dash('')) + '</td><td>' + (r.unsubscribedAt ? fmtDateTime(r.unsubscribedAt) : dash('')) + '</td></tr>'
      })
      $('#content').innerHTML = html + '</tbody></table></div>' + renderPagination()
      wirePagination()
    }
    $$('[data-nlstatus]').forEach(function (b) {
      b.addEventListener('click', function () { state.newsletterStatus = b.dataset.nlstatus; selectNewsletter() })
    })
  }

  // ---------- Team (owner) ----------
  async function selectTeam() {
    state.table = '__team'
    setActiveNav('__team')
    $('#section-title').textContent = 'Team'
    $('#section-controls').innerHTML = '<button class="btn primary" id="team-add">+ Add person</button>'
    $('#team-add').addEventListener('click', openPersonForm)
    $('#content').innerHTML = skeleton()
    setSub('Everyone who can sign in to this dashboard. Owners can do everything; editors work on the data.')
    var users = await api('/users')
    $('#section-count').textContent = String(users.length)
    var html = '<div class="table-scroll"><table class="data"><thead><tr><th>Person</th><th>Role</th><th>Status</th><th>Last sign-in</th><th></th></tr></thead><tbody>'
    users.forEach(function (u) {
      var env = u.id === 0
      var status = !u.active ? toneBadge('deactivated', 'mute') : (u.mustChangePassword ? toneBadge('invited', 'warn') : toneBadge('active', 'good'))
      html += '<tr><td><div class="person"><span class="avatar" aria-hidden="true">' + esc(initials(u.name)) + '</span><span><div class="nm">' + esc(u.name) + '</div><div class="em">' + esc(u.email) + '</div></span></div></td>' +
        '<td>' + (u.role === 'owner' ? toneBadge('owner', 'good') : toneBadge('editor', 'plain')) + '</td><td>' + status + '</td>' +
        '<td>' + (u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : '<span class="muted-dash">never</span>') + '</td><td class="actions">' +
        (env ? '<span class="faint" title="Set by the ADMIN_EMAIL and ADMIN_PASSWORD environment variables">Environment owner</span>' : '<button class="btn small" data-reset="' + u.id + '">Reset password</button>' +
          '<button class="btn small ' + (u.active ? 'danger' : '') + '" data-active="' + u.id + '" data-to="' + (u.active ? 'false' : 'true') + '">' + (u.active ? 'Deactivate' : 'Reactivate') + '</button>') +
        '</td></tr>'
    })
    $('#content').innerHTML = html + '</tbody></table></div>'
    $$('[data-reset]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var r
        var done = await confirmAction({
          title: 'Reset this password?',
          message: 'Their current password stops working immediately and they are signed out. You will get a temporary password to send them.',
          confirmLabel: 'Reset password',
          run: async function () { r = await api('/users/' + b.dataset.reset + '/reset', { method: 'POST' }) },
        })
        if (done) showPersonResult('Password reset', 'Their old password has stopped working. Send them this temporary one; they will choose their own at next sign-in.', r.temporaryPassword)
      })
    })
    $$('[data-active]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var to = b.dataset.to === 'true'
        var setActive = function () { return api('/users/' + b.dataset.active + '/active', { method: 'POST', body: JSON.stringify({ active: to }) }) }
        if (to) { try { await setActive() } catch (err) { await notice('Could not reactivate', err.message) } selectTeam(); return }
        var done = await confirmAction({
          title: 'Deactivate this person?',
          message: 'They are signed out immediately and can no longer sign in. Their history stays in the activity log, and you can reactivate them later.',
          confirmLabel: 'Deactivate',
          run: setActive,
        })
        if (done) selectTeam()
      })
    })
  }

  // The temporary password is shown once, in the same modal used to create the
  // account (and by "Reset password"), and is never stored in readable form.
  function showPersonResult(title, lead, pw) {
    $('#person-form').style.display = 'none'
    $('#person-result').style.display = ''
    $('#person-result-title').textContent = title
    $('#person-result-lead').textContent = lead
    $('#person-temp').value = pw
    $('#person-copy').textContent = 'Copy'
    $('#person-overlay').classList.add('show')
    $('#person-temp').select()
  }

  function openPersonForm() {
    $('#person-form').reset()
    $('#person-error').textContent = ''
    $('#person-submit').disabled = false
    $('#person-form').style.display = ''
    $('#person-result').style.display = 'none'
    $('#person-overlay').classList.add('show')
    $('#person-name').focus()
  }

  function closePersonModal() {
    $('#person-overlay').classList.remove('show')
    $('#person-temp').value = ''
  }

  $('#person-cancel').addEventListener('click', closePersonModal)
  $('#person-done').addEventListener('click', function () { closePersonModal(); selectTeam() })
  // Backdrop click closes the form, but not the one-time password view.
  $('#person-overlay').addEventListener('click', function (e) {
    if (e.target.id === 'person-overlay' && $('#person-form').style.display !== 'none') closePersonModal()
  })
  $('#person-copy').addEventListener('click', async function () {
    var input = $('#person-temp')
    input.select()
    try { await navigator.clipboard.writeText(input.value); this.textContent = 'Copied' } catch (e) { document.execCommand('copy'); this.textContent = 'Copied' }
  })

  $('#person-form').addEventListener('submit', async function (e) {
    e.preventDefault()
    $('#person-error').textContent = ''
    $('#person-submit').disabled = true
    try {
      var r = await api('/users', { method: 'POST', body: JSON.stringify({
        name: $('#person-name').value.trim(),
        email: $('#person-email').value.trim(),
        role: $('#person-role').value,
      }) })
      showPersonResult('Account created', r.user.name + ' can sign in at this page with ' + r.user.email + ' and the temporary password below.', r.temporaryPassword)
    } catch (err) {
      $('#person-error').textContent = err.message
      $('#person-submit').disabled = false
    }
  })

  // ---------- Activity log (owner) ----------
  async function selectActivity(keepPage) {
    state.table = '__activity'
    state.reload = function () { selectActivity(true) }
    if (!keepPage) state.page = 1
    setActiveNav('__activity')
    $('#section-title').textContent = 'Activity log'
    $('#section-controls').innerHTML = ''
    $('#content').innerHTML = skeleton()
    setSub('A private record of who changed what. A deleted row can be restored from here.')
    var result = await api('/activity?page=' + state.page + '&pageSize=' + state.pageSize)
    applyPageResult(result)
    $('#section-count').textContent = state.total ? String(state.total) : ''
    if (!state.total) { $('#content').innerHTML = '<div class="table-scroll">' + emptyState('indicatorPoints', 'Nothing recorded yet', 'Edits, deletions and sign-ins will be listed here.') + '</div>'; return }
    var html = '<div class="table-scroll"><table class="data"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Where</th><th>Details</th></tr></thead><tbody>'
    state.rows.forEach(function (r) {
      var detail = ''
      if (r.beforeJson || r.afterJson) {
        detail = '<details><summary>View change</summary>' +
          (r.beforeJson ? '<div class="label-s" style="margin-top:8px">Before</div><pre class="json">' + esc(pretty(r.beforeJson)) + '</pre>' : '') +
          (r.afterJson ? '<div class="label-s" style="margin-top:8px">After</div><pre class="json">' + esc(pretty(r.afterJson)) + '</pre>' : '') + '</details>'
      }
      if (r.action === 'delete') detail += ' <button class="btn small" data-restore="' + r.id + '">Restore</button>'
      var where = [r.tableName ? esc(r.tableName) + (r.rowId ? ' #' + esc(r.rowId) : '') : '', r.administration ? esc(r.administration) : ''].filter(Boolean).join(' · ')
      html += '<tr><td>' + fmtDateTime(r.at) + '</td><td><div class="person"><span class="avatar" aria-hidden="true">' + esc(initials(r.actorEmail)) + '</span><span><div class="nm">' + esc(r.actorEmail) + '</div><div class="em">' + esc(r.actorRole) + '</div></span></div></td>' +
        '<td><span class="act ' + esc(String(r.action).replace(/_/g, '-')) + '">' + esc(String(r.action).replace(/_/g, ' ')) + '</span></td><td>' + (where || '<span class="muted-dash">—</span>') + '</td><td>' + (detail || '<span class="muted-dash">—</span>') + '</td></tr>'
    })
    html += '</tbody></table></div>' + renderPagination()
    $('#content').innerHTML = html
    $$('[data-restore]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var done = await confirmAction({
          title: 'Restore this row?',
          message: 'It goes back into its table exactly as it was, with its original id.',
          confirmLabel: 'Restore',
          danger: false,
          run: function () { return api('/activity/' + b.dataset.restore + '/restore', { method: 'POST' }) },
        })
        if (done) { toast('Row restored.'); selectActivity(true) }
      })
    })
    wirePagination()
  }

  function pretty(json) {
    try { return JSON.stringify(JSON.parse(json), null, 2) } catch (e) { return json }
  }

  // ---------- Password ----------
  var pwForced = false
  function openPasswordForm(forced) {
    pwForced = !!forced
    $('#pw-title').textContent = forced ? 'Choose your password' : 'Change password'
    $('#pw-lead').textContent = forced ? 'You signed in with a temporary password. Choose your own to continue.' : ''
    $('#pw-cancel').style.display = forced ? 'none' : ''
    $('#pw-error').textContent = ''
    $('#pw-form').reset()
    $('#pw-overlay').classList.add('show')
  }
  function closePasswordForm() { $('#pw-overlay').classList.remove('show') }

  $('#pw-cancel').addEventListener('click', closePasswordForm)
  $('#pw-form').addEventListener('submit', async function (e) {
    e.preventDefault()
    var next = $('#pw-new').value
    if (next !== $('#pw-confirm').value) { $('#pw-error').textContent = 'The new passwords do not match.'; return }
    try {
      await api('/password', { method: 'POST', body: JSON.stringify({ current: $('#pw-current').value, next: next }) })
      closePasswordForm()
      if (pwForced) { pwForced = false; await boot() }
      else toast('Your password has been updated.')
    } catch (err) {
      $('#pw-error').textContent = err.message === 'unauthenticated' ? 'Current password is incorrect.' : err.message
    }
  })

  // ---------- Boot ----------
  async function boot() {
    var session = await fetch('/api/admin/session').then(function (r) { return r.json() })
    if (!session.authenticated) { showLogin(); return }
    state.user = session.user
    $('#whoami').innerHTML = '<strong>' + esc(state.user.name) + '</strong>' + esc(state.user.email) + ' · ' + esc(state.user.role)
    showApp()
    buildNav()
    if (state.user.mustChangePassword) { openPasswordForm(true); return }
    await selectOverview()
  }

  boot()
})()
