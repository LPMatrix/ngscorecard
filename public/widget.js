/*!
 * NGScorecard embeddable widget.
 *
 * Usage:
 *   <div data-ngscorecard-admin="tinubu"></div>
 *   <script src="https://ngscorecard.com/widget.js" async></script>
 *
 * Or, for a single widget, put the admin key right on the script tag:
 *   <script src="https://ngscorecard.com/widget.js" data-ngscorecard-admin="tinubu" async></script>
 *
 * Renders a live Kept/Partial/Broken/In-progress bar for the given
 * administration, pulling from the public, unauthenticated widget summary
 * endpoint (no API key needed — see server/publicApi.js).
 */
(function () {
  'use strict'

  // Captured synchronously, at parse time — document.currentScript is only
  // valid while this script is actively executing, and init() below may run
  // later (deferred to DOMContentLoaded), by which point it would be null.
  var THIS_SCRIPT = document.currentScript

  var STATUS = [
    { key: 'kept', label: 'Kept', color: '#008751' },
    { key: 'partial', label: 'Partial', color: '#c7931d' },
    { key: 'broken', label: 'Broken', color: '#a2261b' },
    { key: 'pending', label: 'In progress', color: '#aab6af' },
  ]

  function originFromScript() {
    if (!THIS_SCRIPT || !THIS_SCRIPT.src) return 'https://ngscorecard.com'
    try {
      return new URL(THIS_SCRIPT.src).origin
    } catch (e) {
      return 'https://ngscorecard.com'
    }
  }

  function getShadow(root) {
    if (!root.attachShadow) return root
    return root.shadowRoot || root.attachShadow({ mode: 'open' })
  }

  function render(root, data, origin) {
    var shadow = getShadow(root)
    var total = data.total || 0

    var css =
      ':host, .ngs-w { all: initial; box-sizing: border-box; }' +
      '.ngs-w * { box-sizing: border-box; }' +
      '.ngs-w {' +
      '  display: block; font-family: -apple-system, "Segoe UI", Roboto, "Instrument Sans", sans-serif;' +
      '  border: 1px solid #d9e2dc; background: #fffef9; border-radius: 6px; padding: 14px 16px;' +
      '  max-width: 420px; color: #1b2720;' +
      '}' +
      '.ngs-w a { color: inherit; text-decoration: none; }' +
      '.ngs-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 10px; }' +
      '.ngs-title { font-size: 13px; font-weight: 700; color: #006b45; }' +
      '.ngs-title a:hover { text-decoration: underline; }' +
      '.ngs-total { font-size: 11px; color: #5f6f66; white-space: nowrap; }' +
      '.ngs-bar { display: flex; height: 10px; border-radius: 5px; overflow: hidden; background: #eef2ee; margin-bottom: 10px; }' +
      '.ngs-seg { height: 100%; }' +
      '.ngs-legend { display: flex; flex-wrap: wrap; gap: 10px 14px; margin-bottom: 10px; }' +
      '.ngs-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #5f6f66; }' +
      '.ngs-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }' +
      '.ngs-item b { color: #1b2720; font-weight: 700; }' +
      '.ngs-foot { font-size: 10px; color: #7f8c84; border-top: 1px solid #d9e2dc; padding-top: 8px; }' +
      '.ngs-foot a { font-weight: 700; color: #006b45; }' +
      '.ngs-foot a:hover { text-decoration: underline; }'

    var segs = STATUS.map(function (s) {
      var count = data.counts[s.key] || 0
      var pct = total ? (count / total) * 100 : 0
      return '<div class="ngs-seg" style="width:' + pct + '%;background:' + s.color + '" title="' + s.label + ': ' + count + '"></div>'
    }).join('')

    var legend = STATUS.map(function (s) {
      var count = data.counts[s.key] || 0
      return '<span class="ngs-item"><span class="ngs-dot" style="background:' + s.color + '"></span>' + s.label + ' <b>' + count + '</b></span>'
    }).join('')

    var title = (data.name || data.admin) + (data.tagline ? ' — ' + data.tagline : '')

    shadow.innerHTML =
      '<style>' + css + '</style>' +
      '<div class="ngs-w">' +
      '  <div class="ngs-head">' +
      '    <span class="ngs-title"><a href="' + data.url + '" target="_blank" rel="noopener">' + title + '</a></span>' +
      '    <span class="ngs-total">' + total + ' tracked</span>' +
      '  </div>' +
      '  <div class="ngs-bar">' + segs + '</div>' +
      '  <div class="ngs-legend">' + legend + '</div>' +
      '  <div class="ngs-foot">Powered by <a href="' + origin + '" target="_blank" rel="noopener">NGScorecard</a> — independent Nigerian government accountability tracking</div>' +
      '</div>'
  }

  function renderError(root) {
    var shadow = getShadow(root)
    shadow.innerHTML =
      '<div style="font-family:-apple-system,sans-serif;font-size:12px;color:#a2261b;' +
      'border:1px solid #d9e2dc;border-radius:6px;padding:10px 12px;">NGScorecard widget unavailable.</div>'
  }

  function mount(el, origin) {
    if (el.tagName === 'SCRIPT') return // the shorthand script tag itself matches the attribute selector below; skip it
    var admin = el.getAttribute('data-ngscorecard-admin')
    if (!admin || el.hasAttribute('data-ngscorecard-loaded')) return
    el.setAttribute('data-ngscorecard-loaded', 'true')

    fetch(origin + '/api/v1/widget/' + encodeURIComponent(admin) + '/summary')
      .then(function (res) {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then(function (data) { render(el, data, origin) })
      .catch(function () { renderError(el) })
  }

  function init() {
    var origin = originFromScript()

    // Shorthand: a single widget declared directly on the script tag.
    if (THIS_SCRIPT && THIS_SCRIPT.getAttribute('data-ngscorecard-admin')) {
      var inline = document.createElement('div')
      inline.setAttribute('data-ngscorecard-admin', THIS_SCRIPT.getAttribute('data-ngscorecard-admin'))
      THIS_SCRIPT.parentNode.insertBefore(inline, THIS_SCRIPT.nextSibling)
      mount(inline, origin)
    }

    var targets = document.querySelectorAll('[data-ngscorecard-admin]')
    for (var i = 0; i < targets.length; i++) mount(targets[i], origin)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
