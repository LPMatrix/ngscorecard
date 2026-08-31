# Localisation plan

Wikipedia's per-language editions widen both reach and perceived legitimacy.
NGScorecard's version starts small: translate the parts that carry the most
trust — the **methodology** and the **headline verdicts** — into Nigeria's
three major languages plus Nigerian Pidgin.

## Target locales

| Code | Language | Endonym shown in UI |
|------|----------|---------------------|
| `en` | English (source) | English |
| `ha` | Hausa | Hausa |
| `yo` | Yoruba | Yorùbá |
| `ig` | Igbo | Igbo |
| `pcm` | Nigerian Pidgin | Naijá |

## Status

- **Scaffold — done.** `public/guide.<code>.html` shells exist for all four
  locales, sharing `public/guide-i18n.css`. Each shows a "translation in
  progress" notice, the seven methodology section titles + one-line summaries
  (the text a translator needs to render), a language switcher, and a link to
  the English source. `hreflang` alternates + a language switcher were added
  to the English `public/guide.html`.
- **Translations — not started.** The shells are deliberately English inside a
  `lang="<code>"` page, with the untranslated strings marked `lang="en"`.
  Fill them in from a native speaker or a reviewed translation; do not
  machine-translate civic/legal terms without a human check.

## URL scheme

Static files, reachable directly: `/guide.ha.html`, `/guide.yo.html`, etc.
Vite copies `public/` to `dist/client/`, so they serve on both the Node
server and Vercel with no routing changes.

**Follow-up (optional):** pretty URLs `/guide/ha`. Would need a route in
`server/index.js` + `server/dev.js` (next to the existing `/guide` handler)
and a `vercel.json` rewrite per locale. Not required for the scaffold.

## Next steps, in order

1. Translate `guide.ha.html` … `guide.pcm.html` bodies. Keep the shared
   structure; only the prose changes.
2. Localise the **headline verdict strip** in the app (the kept/partial/broken
   counts + labels in `src/App.vue`). Smallest useful in-app i18n: a
   `?lang=` param selecting a small label dictionary — no full framework.
3. Add the locale pages to `public/sitemap.xml` once they hold real content.
4. Consider a language switcher in the main app header, not just on `/guide`.

## Non-goals for now

- Full app i18n / a translation framework (vue-i18n etc.).
- Translating every promise `assessment` — that's a large, ongoing content
  effort; start with methodology + verdict labels.
