# Localisation plan

Wikipedia's per-language editions widen both reach and perceived legitimacy.
NGScorecard's version started with the part that carries the most trust — the
**methodology** — in Nigeria's three major languages plus Nigerian Pidgin, and
is now being extended to the whole app UI (see "Full-app localisation (F9)"
below). Locales: Hausa, Yorùbá, Igbo, Nigerian Pidgin.

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

**App UI catalogue (separate from the guide HTML above):** all four —
`src/i18n/{ha,pcm,yo,ig}.js` (~310–323 keys each) — are machine drafts of
the *application* chrome, live behind the in-header language switcher (all
`preview`, not `ready` — no SEO exposure). Unreviewed; `yo`/`ig` carry the
higher diacritic/idiom risk. Next: native review, then flip `ready` per
locale (that alone turns on sitemap + hreflang).

## URL scheme

Static files, reachable directly: `/guide.ha.html`, `/guide.yo.html`, etc.
Vite copies `public/` to `dist/client/`, so they serve on both the Node
server and Vercel with no routing changes.

**Follow-up (optional):** pretty URLs `/guide/ha`. Would need a route in
`server/index.js` + `server/dev.js` (next to the existing `/guide` handler)
and a `vercel.json` rewrite per locale. Not required for the scaffold.

## Full-app localisation (F9)

The methodology-only approach above is now being extended to the whole app
UI. The scorecards themselves — nav, tabs, filters, status labels, category
names, section copy, meta tags — get localised into the same five locales,
with locale-prefixed routes (`/ha/tinubu`, `/yo/themes`) and an `hreflang`
cluster.

**In scope:** UI chrome, status labels, category names, meta descriptions,
the landing / themes / compare / correction views.
**Out of scope (v1):** promise / assessment / allegation body text (stays
English — a large ongoing content effort), names, party acronyms, and the
`/developers` · `/press` · `/admin` pages.

### Phases

| # | Deliverable |
|---|---|
| 0 | **Decisions + scaffolding** (done — see below). |
| 1 | **Locale-aware routing & SSR plumbing (done).** `/<code>/…` resolves through the SSR catch-all with `<html lang>`, locale-prefixed canonical, a full `hreflang` cluster (+ `x-default`) and `og:locale`; `t` is provided to the app; every internal link / URL-sync prefixes the locale via `lp()`. Text is still English. `render.js` strips the segment (`splitLocalePath`), `entry-server.render({locale})` threads it, `buildMeta(t,…)` pulls meta frames from the catalogue. `/<code>/guide` deferred to Phase 3. |
| 2 | **String extraction sweep (done).** Every hardcoded UI string in `App.vue` + the 9 components (`PromiseCard`, `CompareView`, `AdminColumn`, `GovernorsView`, `BudgetView`, `IndicatorsView`, `LandingView`, `ThemesView`, `CorrectionForm`) now routes through `t()` — nav, tabs, stat tiles, filters, status/category vocab, card labels, flags, source tiers, empty states, picker, correction form, meta. `en.js` has ~356 keys. Category display keys off `canonicalizeCategory()`. Verified: 0 raw-key leaks in SSR HTML across every page type, English renders unchanged, `/ha` falls back to English cleanly. One deliberate cosmetic delta: the landing lede / themes "promised by N" count lost its bold, flattened for clean `{n}` interpolation. |
| 3 | **Language switcher + Hausa pilot (done).** In-header `<select>` (`src/components/LangSwitcher.vue`) in both the desktop links row and the mobile hamburger panel; on change it does a full-page nav to `swapLocale(pathname, code)` so the server re-renders with the right catalogue/meta/`<html lang>`. New gate `preview` on `LOCALES` (separate from `ready`): `SWITCHABLE_LOCALES` = `ready ∨ preview` drives the switcher, `READY_LOCALES` still gates SEO. `ha` is `preview: true, ready: false` — switchable, but no sitemap/hreflang exposure until native review. `src/i18n/ha.js` is a ~320-key unreviewed machine draft (chrome only; per-admin `meta.federal/state` frames + rare vocab still fall back to English). A gold `i18n.previewNote` strip shows on every page in a preview locale. `/ha/guide` serves `guide.ha.html` via the route table's `staticFileFor` (already working since the route-table refactor). Verified: switch both directions from `/`, `/ha`, `/ha/tinubu`, `/ha/themes`, `/ha/themes/:slug`; `<html lang="ha">`, JSON-LD `inLanguage:"ha"`, still zero `hreflang` cluster; no console/hydration errors. |
| 4 | **All four draft catalogues done, all `preview: true`.** `src/i18n/{ha,pcm,yo,ig}.js` — `ha` ~320 keys, `pcm` ~310, `yo`/`ig` ~323 each; same coverage shape (chrome only; per-admin `meta.*` frames + rare vocab fall back to English), same `i18n.previewNote` strip. `pcm` is English-lexified (lowest-risk); `yo`/`ig` are not — expect tone/diacritic slips and unidiomatic phrasing until native review. `yo`/`ig` translate the geopolitical-zone names; `pcm` leaves them to English fallback (already correct Naijá). Language switcher now lists English · Hausa · Yorùbá · Igbo · Naijá. Verified per locale: `/‹c›`, `/‹c›/tinubu`, `/‹c›/tinubu/orders`, `/‹c›/themes`, `/‹c›/themes/:slug` all 200 with `<html lang="‹c›">` + JSON-LD `inLanguage`; `/‹c›/guide` serves `guide.‹c›.html`; zero hreflang cluster (READY still en-only); switching between preview locales works; clean fresh-tab console; `npm run build` green. |
| 5 | SEO + polish — locale URLs in `sitemap.xml`, `hreflang` verified across page types, native-review cycle, QA matrix. |

### Phase 0 decisions (settled)

- **Mechanism: in-house, no framework.** `src/i18n/index.js` exports
  `createT(locale)` → `t(key, params)` with a strict fallback chain
  (requested locale → English → the key), `{param}` interpolation and a
  `singular|plural` pipe. Rationale: ~250 flat keys, hand-rolled SSR, and the
  codebase's no-heavy-deps norm. `vue-i18n` was the alternative and is more
  than this needs.
- **Locale set:** `en` (default, **no prefix**), `ha`, `yo`, `ig`, `pcm`.
- **URL model:** path prefix. `/tinubu` (en) ↔ `/ha/tinubu`. Helpers
  `splitLocalePath()` / `localizePath()` in `src/i18n/index.js`.
- **Catalogue:** `src/i18n/en.js` is the source of truth (flat dotted keys,
  `export default {…}` — plain JS, not JSON, so it loads under Vite, raw Node
  and Vercel alike). `ha/yo/ig/pcm.js` mirror its key set; missing keys fall
  back to
  English. Phase 0 seeded the enumerable core (status vocab, tab names,
  actions, meta templates, landing/themes copy); Phase 2 completes it.
- **Category normalisation:** the `category` field has ~70 free-text
  variants. `src/i18n/categories.js` maps them to 23 canonical slugs via
  `canonicalizeCategory(raw)`, so i18n keys off `category.<slug>` without
  rewriting stored data. A later task can normalise the DB itself.
- **Data stays English:** in non-`en` locales, cards show an "Assessment
  shown in English" note (`label.assessmentInEnglish`).

### Older next steps (still valid, now folded into the phases above)

1. Native-speaker review of the four guide drafts — the blocker for treating
   any locale as production. Same reviewers seed the app catalogues.
2. Add locale pages to `public/sitemap.xml` (Phase 5).
3. Pretty URLs `/guide/ha` — becomes `/ha/guide` under the Phase 1 router.

## Non-goals for now

- Translating every promise `assessment` — large, ongoing content effort.
- Localising numerals / currency figures (₦ amounts stay as written).
