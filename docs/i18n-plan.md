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

- **Scaffold — done.** `public/guide.<code>.html` pages exist for all four
  locales, sharing `public/guide-i18n.css` (a superset that styles both a
  shell and a fully translated page). `hreflang` alternates + a language
  switcher were added to the English `public/guide.html`.
- **`pcm` (Nigerian Pidgin) — full draft translation done.**
  `public/guide.pcm.html` carries all seven sections translated into Naijá,
  matching the English structure and anchors. It's a **draft pending native
  review**: a `.draft-note` at the top says the English page is authoritative
  for disputes, and glossary term names (`<dt>` — "Kept", "Convicted",
  "Deficit"…) stay in English because that's the vocabulary the app UI shows.
  Institution names (NBS, CBN, DMO, BudgIT, EFCC) and agenda names are left
  as-is.
- **`ha` / `yo` / `ig` — still shells.** English inside a `lang="<code>"`
  page, with untranslated strings marked `lang="en"`, plus a "sections to
  translate" table. Use `guide.pcm.html` as the structural template when
  filling these in. Do not machine-translate civic/legal terms without a
  human check.

## URL scheme

Static files, reachable directly: `/guide.ha.html`, `/guide.yo.html`, etc.
Vite copies `public/` to `dist/client/`, so they serve on both the Node
server and Vercel with no routing changes.

**Follow-up (optional):** pretty URLs `/guide/ha`. Would need a route in
`server/index.js` + `server/dev.js` (next to the existing `/guide` handler)
and a `vercel.json` rewrite per locale. Not required for the scaffold.

## Next steps, in order

1. Native-speaker review of `guide.pcm.html`.
2. Translate `guide.ha.html`, `guide.yo.html`, `guide.ig.html` bodies, using
   `guide.pcm.html` as the structural template — only the prose changes.
3. Localise the **headline verdict strip** in the app (the kept/partial/broken
   counts + labels in `src/App.vue`). Smallest useful in-app i18n: a
   `?lang=` param selecting a small label dictionary — no full framework.
4. Add `guide.pcm.html` to `public/sitemap.xml` now (it has real content); add
   the others as they're filled in.
5. Consider a language switcher in the main app header, not just on `/guide`.

## Non-goals for now

- Full app i18n / a translation framework (vue-i18n etc.).
- Translating every promise `assessment` — that's a large, ongoing content
  effort; start with methodology + verdict labels.
