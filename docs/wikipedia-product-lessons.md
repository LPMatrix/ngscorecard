# Product lessons from Wikipedia

Wikipedia is one of the few web products that made *contested factual claims*
feel trustworthy at scale — which is exactly NGScorecard's problem. This doc
captures the transferable ideas and how each maps onto what the codebase
already has.

Status legend: **Done** · **Planned** · **Idea**

---

## 1. Verifiability as a UI primitive, not a footer — *Mostly done*

**Wikipedia:** every claim carries an inline citation; the *absence* of one is
visibly flagged ("citation needed").

**Here — done:**

- **Card-footer signal.** `PromiseCard.vue` shows a source-tier pill:
  `Primary` (green), `Reporting` (blue), `Analysis` (gold), `Weak source`
  (red), and `Source: not linked` (amber) when there's no source at all.
- **Stored classification.** New nullable `source_tier` column on `promises`,
  `inherited`, `fraud`, `orders`, `ministers`, `bills`, `judgments`
  (`'official' | 'reporting' | 'analysis' | 'weak' | null`), pushed to Turso;
  seed pipeline carries it; the admin editor has a **Source tier** select on
  each of those tables. When it's unset the frontend still shows `Primary`
  for a `.gov` host from the URL heuristic — so unclassified rows aren't blank.
- **Admin-side source gate** (`server/adminRoutes.js`). Creating a row in
  `promises` / `inherited` / `fraud` / `orders` / `bills` requires a
  `source` + `sourceLabel` (422 otherwise); updating one of those rows in a
  way that changes `status` / `responseVerdict` is rejected if the row would
  be left without a source.

**Still open:**

- Dead-link detection (needs a fetch/crawl pass).
- Extending the gate to `ministers` / `judgments` (their schema allows a null
  source, so retrofitting risks breaking legitimate edits — needs a data
  pass first).

---

## 2. Make the process public, not just the verdict — *Mostly done*

**Wikipedia:** trust comes as much from visible revision history + talk pages
as from the articles themselves.

**Here — done:**

- **Public per-entry change history.** New append-only `entry_history` table
  (`server/schema.js`), written by the admin editor on every change to a
  status, source tier, or assessment, with the editor's optional reason. Shown
  as a "Change history" block on the expanded card (`PromiseCard.vue`), newest
  first; read via `GET /api/[v1/]:admin/history`. Governance for it in
  `GOVERNANCE.md`; direction in `PRINCIPLES.md`.
- **Staleness banner from `reviewed`** — done earlier (see Smaller borrows).

**Still open:**

- **A dispute space per rating.** A structured "contest this rating" thread
  beside the card (Wikipedia's article/talk split). Overlaps with the
  corrections queue — needs the same "public write surface, moderated" call.
- **Citable permalinks** (#6) — the change history is the substrate; still
  need a `?asof=<date>` render that reconstructs an entry as it read then.

**Effort:** staleness banner is trivial and high-trust-per-line. Changelog is
a table + a small UI. Dispute threads are a real feature — scope later.

---

## 3. A written, versioned methodology — *Done*

**Wikipedia:** NPOV and notability are *documented, enforceable policies*, not
vibes.

**Here:** `public/guide.html` now carries the full methodology:

- **Section 1 "What counts as a trackable promise"** — the inclusion test
  (included / tracked separately / excluded / selection within a term),
  applied identically to every administration so counts are comparable.
- **Section 2 "Promise ratings"** — an explicit evidence bar for kept /
  partial / broken / in-progress, plus the tie-break rule when sources
  disagree and the "absence of evidence isn't failure" rule.
- **Section 6 "Sourcing & review"** — a four-tier source hierarchy, the
  "blank means not published, not zero" rule, and the review cadence (what the
  `reviewed` date means; sitting administrations re-reviewed ≥2×/year).
- **Section 7 "Change log"** — versioned (`Methodology v1.0 · 31 Aug 2026`,
  stamped in the page hero), newest-first, with the re-rating commitment when
  the rubric changes.

**Maintenance:** bump the version stamp in the hero and add a `<dt>/<dd>` to
the section 7 change log whenever the inclusion test or the evidence bar
changes.

---

## 4. Neutral governance, visibly — *Done*

**Wikipedia:** part of its authority is being non-commercial and un-ownable.

**Here:** `public/guide.html` section 7, **"Independence & openness"**
(methodology v1.2) — what it is (a free, open public good, not a business),
who decides ratings (editors, against the methodology; no subject/source/
sponsor pre-approval), funding (not for profit; no money from any government,
party, candidate or campaign; a paid layer, if any, only sustains the free
version and stays separate from ratings), open-by-default licensing, and
ownership. Backed by a repo-root `LICENSE` (AGPL-3.0), `DATA-LICENSE.md`
(CC BY 4.0), a `README.md`, and updated footers across the static pages.

**Note for the maintainer:** the funding wording is *policy*, not a
disclosure of current backers — keep it true as `docs/monetization-strategy-review.md`
plans (e.g. sponsored reports) become real.

---

## 5. Openness as a trust & resilience strategy — *Done (behind a flag, dark)*

**Wikipedia:** CC-licensed, full downloadable dumps, mirrors permitted — which
makes it infrastructure, and hard to capture or censor.

**Here:** built and held back until the platform matures. See
`DATASET_DUMP_PUBLIC` in `server/publicApi.js`.

- `GET /api/v1/dump` — whole dataset in one JSON doc, no key, CORS-open,
  CC BY 4.0; `?format=csv&resource=<name>` for flat CSV per resource.
- `scripts/export-dataset.mjs` (`npm run export:dataset`) → static mirror at
  `/ngscorecard-dataset.json` (gitignored for now).
- `server/dataExport.js` + `getFullDataset()` in `server/queries.js`.
- `DATA-LICENSE.md` — carries a "not yet in effect" banner until the flag is
  turned on.

**To ship:** set `DATASET_DUMP_PUBLIC=true`, re-add the "Full dataset &
license" section to `public/developers.html`, drop the banner from
`DATA-LICENSE.md`.

---

## 6. Citable permalinks — *Idea*

**Wikipedia:** you can link to an article *as it read on a specific date*.

**Here:** the `FEATURES.md` deep-link idea (`?id=6`) should extend to a
**permalink to a revision** — a journalist citing "the scorecard as of
Oct 2026" needs an immutable URL, not a page that changes under them. Depends
on #2's history table existing (a permalink is just a pointer into it).

**Effort:** falls out of #2 nearly for free once row history exists.

---

## 7. Low-friction contribution + a review gate — *Lightweight version done*

**Wikipedia:** anyone can edit, but sensitive pages go through pending-changes
review.

**Here (done — no backend):** every card footer has a **Report an issue**
link that opens a pre-filled email carrying the entry's title, administration,
category, current rating, and the deep link — so "this looks wrong" reaches a
human with the context attached. `PromiseCard.vue` `reportIssue()`.

**Full version (deferred — needs schema + admin work):** a public "submit a
correction / evidence" form landing in a moderation queue (new table) with a
review view in the existing admin dashboard (`server/adminRoutes.js`,
`server/adminAuth.js`, `public/admin.html`). That's the version that actually
*scales* sourcing; the mailto is the stopgap.

---

## Smaller borrows

- **Standardised status banners** — *Done.* PromiseCard renders a fixed banner
  keyed off an optional `flag` field on a promise (`disputed` | `correction` |
  `review`). Ships dormant — nothing shows until seed data sets `flag`. Plus a
  **derived staleness marker**: cards not updated in ≥18 months show
  "· needs review" in the footer, and the sidebar freshness indicator flips to
  "Review due" (amber) once an administration's `reviewed` date is ≥9 months
  old. No data field for the staleness part — it's computed from the existing
  `updated` / `reviewed` labels. See `PromiseCard.vue` FLAG_META / `isStale`
  and `App.vue` `reviewDue`.
- **Summary-first progressive disclosure** — *Already the shape.* Headline
  stat tiles → progress bar → collapsed cards → expand for assessment →
  sources in the card footer. Nothing to build; keep the top skimmable.
- **Language editions** — *All four locales fully drafted.*
  `public/guide.<ha|yo|ig|pcm>.html` each carry a full draft translation of
  the whole methodology, on shared `guide-i18n.css`; `hreflang` alternates
  and a language switcher on `public/guide.html`. **None natively reviewed** —
  every page's `.draft-note` says the English version is authoritative, and
  the `yo` / `ig` / `ha` notes flag the higher error risk. Review of all four
  is the next step. See `docs/i18n-plan.md`.
- **"What links here" / related promises** — *Done (dormant).* Optional
  `related` field on a promise (JSON array of sibling ids) → a "See also" chip
  group in PromiseCard that expands and scrolls to the linked card
  (`App.vue` `goto` / `relatedFor`). Renders nothing until seed data links
  promises. `FEATURES.md`'s "related promises grouping" note.

---

## Rough priority

> The project's directional commitments now live in [`PRINCIPLES.md`](../PRINCIPLES.md)
> (aligned with the Open Definition, the Principles for Digital Development,
> and the independent-accountability-project tradition). Its "what this
> implies next" section is the canonical roadmap; the list below is the
> implementation backlog.

Done so far: ~~#3 methodology page~~, ~~#4 Independence + `PRINCIPLES.md` +
`GOVERNANCE.md`~~, ~~staleness banner~~, ~~status-flag infra~~,
~~related-promises infra~~, ~~language scaffold~~, ~~#1 source-tier pill +
"not linked" + `source_tier` column + admin gate~~, ~~#7 correction queue
(mailto → "Suggest a correction" modal → `POST /api/corrections` with spam
guards → `/admin` inbox)~~, ~~#2 per-entry change history (`entry_history` +
card block)~~, ~~API deprecation policy (`/developers` §6)~~.

Still to do, roughly in order:

1. **Dispute thread** — the correction *queue* is done (`POST /api/corrections`
   → `/admin` inbox, with spam guards). What's left is Wikipedia's talk-page
   equivalent: a visible back-and-forth beside a contested rating, and a
   decision on how much of that is public vs. moderated.
2. **#6 citable permalinks** — `?asof=<date>` reconstructs an entry from
   `entry_history`. The substrate now exists.
3. **Dead-link detection** for sources (a periodic fetch/crawl pass); extend
   the source gate to `ministers` / `judgments` after a data pass.
4. **Seed the dormant fields** — start setting `flag` / `related` /
   `source_tier` on real
   promises; get the four `guide.<locale>.html` drafts natively reviewed;
   confirm the #4 funding wording against reality.
5. **#5** — flip `DATASET_DUMP_PUBLIC` when the audience and cadence justify
   it.
6. **Progress-over-time chart** — start monthly `history` snapshots now; build
   the chart once there are several points.
