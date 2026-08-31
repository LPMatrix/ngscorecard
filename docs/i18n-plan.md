# Localisation plan

Wikipedia's per-language editions widen both reach and perceived legitimacy.
NGScorecard's version starts with the parts that carry the most trust — the
**methodology** and the **headline verdicts** — in Nigeria's three major
languages plus Nigerian Pidgin. The methodology page is drafted in all four;
the headline verdicts are not localised yet.

## Target locales

| Code | Language | Endonym shown in UI |
|------|----------|---------------------|
| `en` | English (source) | English |
| `ha` | Hausa | Hausa |
| `yo` | Yoruba | Yorùbá |
| `ig` | Igbo | Igbo |
| `pcm` | Nigerian Pidgin | Naijá |

## Status

**All four locales now carry a full draft translation** of the whole
methodology (`public/guide.<code>.html`), sharing `public/guide-i18n.css`.
`hreflang` alternates + a language switcher are on the English
`public/guide.html`. **None are natively reviewed** — every page shows a
`.draft-note` saying the English version is authoritative for any dispute or
citation.

| Locale | State | Risk notes |
|--------|-------|------------|
| `pcm` Naijá | Full draft | English-lexified — lowest risk; still needs a review pass. |
| `yo` Yorùbá | Full draft | Not lexified — expect tone-mark slips, unidiomatic phrasing. |
| `ig` Igbo | Full draft | Not lexified — dotted vowels (ị ọ ụ), ṅ; same risk as `yo`. |
| `ha` Hausa | Full draft | Boko orthography (ƙ ɗ ɓ); tone/length unmarked, so fewer diacritic traps, but lexical/grammar errors expected. |

In every page, glossary term names (`<dt>` — "Kept", "Convicted", "Deficit"…)
stay in English because that's the vocabulary the app UI shows; institution
names (NBS, CBN, DMO, BudgIT, EFCC) and agenda names are left as-is. Do not
treat any of these as production copy until a native speaker has passed over
it.

## URL scheme

Static files, reachable directly: `/guide.ha.html`, `/guide.yo.html`, etc.
Vite copies `public/` to `dist/client/`, so they serve on both the Node
server and Vercel with no routing changes.

**Follow-up (optional):** pretty URLs `/guide/ha`. Would need a route in
`server/index.js` + `server/dev.js` (next to the existing `/guide` handler)
and a `vercel.json` rewrite per locale. Not required for the scaffold.

## Next steps, in order

1. **Native-speaker review of all four drafts** — `pcm`, `yo`, `ig`, `ha`.
   This is the blocker for everything below.
2. Localise the **headline verdict strip** in the app (the kept/partial/broken
   counts + labels in `src/App.vue`). Smallest useful in-app i18n: a
   `?lang=` param selecting a small label dictionary — no full framework.
3. Add the four locale pages to `public/sitemap.xml` once reviewed.
4. Consider a language switcher in the main app header, not just on `/guide`.
5. Optional: pretty URLs `/guide/ha` (see URL scheme above).

## Non-goals for now

- Full app i18n / a translation framework (vue-i18n etc.).
- Translating every promise `assessment` — that's a large, ongoing content
  effort; start with methodology + verdict labels.
