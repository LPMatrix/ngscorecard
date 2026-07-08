function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

// Renders one HTML response for a request URL, given a template (already
// containing correct client asset tags — from Vite's dev transform or its
// build output, both are complete HTML on their own) and a loader for the
// isomorphic entry-server module. Used by both the local dev server and the
// production Vercel/Node server so they share one code path.
export async function renderHtml(url, template, loadEntryServer) {
  const parsed = new URL(url, 'http://localhost')
  const admin  = parsed.searchParams.get('admin')
  const tab    = parsed.searchParams.get('tab')
  const id     = parseInt(parsed.searchParams.get('id'))

  const { render } = await loadEntryServer()
  const { html, initialData, meta } = await render({ admin, tab, id })

  const stateScript = `<script>window.__INITIAL_STATE__=${JSON.stringify(initialData).replace(/</g, '\\u003c')}</script>`
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)

  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace('<!--ssr-outlet-->', html)
    .replace('<!--ssr-state-->', stateScript)
}
