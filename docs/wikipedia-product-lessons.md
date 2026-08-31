# Product lessons from Wikipedia

Wikipedia is one of the few web products that made *contested factual claims*
feel trustworthy at scale — which is exactly NGScorecard's problem. This doc
captures the transferable ideas and how each maps onto what the codebase
already has.

Status legend: **Done** · **Planned** · **Idea**

---

## 1. Verifiability as a UI primitive, not a footer — *Partly done*

**Wikipedia:** every claim carries an inline citation; the *absence* of one is
visibly flagged ("citation needed").

**Here (done — no data change):** `PromiseCard.vue`'s footer now derives a
signal from the source URL host alone:

- **`Primary`** pill when the host is a government/official domain
  (`.gov(.ng)` etc.) — a positive "strongest basis for a rating" mark.
- **`Source: not linked`** (amber) instead of an empty link when a record
  carries no source at all (appointments, some ministers/judgments).

**Still open (needs schema / admin work — deferred):**

- Full source *tiers* beyond "official vs other" — the middle tiers
  (reputable reporting vs commentary) aren't reliably detectable from a URL;
  they'd need a stored classification.
- Dead-link detection (needs a fetch/crawl pass).
- Admin-side gate: reject a status change that isn't accompanied by a source
  on the change itself (`server/adminRoutes.js`).

---

## 2. Make the process public, not just the verdict — *Planned (partly scaffolded)*

**Wikipedia:** trust comes as much from visible revision history + talk pages
as from the articles themselves.

**Here:**

- **Public per-promise changelog.** A permanent, append-only log —
  "pending → broken, April 2026, +2 sources, editor note" — with a diff view.
  Bigger than the single "status changed" line in `FEATURES.md`.
  - The `history` table in `server/schema.js` (`administration`, `label`,
    `kept`, `partial`, `broken`, `pending`) already exists for the aggregate
    "progress over time" chart. A per-row `promise_history` table is the
    natural extension.
- **A dispute space per rating.** The kept/partial/broken call is a judgement;
  give readers a structured "contest this rating" thread that lives *beside*
  the card, not in it (Wikipedia's article/talk split keeps the main view
  clean while making disagreement legible). Could start as moderated
  submissions surfaced read-only.
- **Staleness banner from `reviewed`.** Each administration row has a
  `reviewed` date. Surface it: "Buhari — not reviewed since May 2023", the way
  Wikipedia flags out-of-date sections.

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

**Here:** `public/guide.html` now has a section 7, **Independence** —
who decides ratings (editors, against the methodology; no subject/source/
sponsor pre-approval), funding policy (no money from any government, party,
candidate or campaign; any revenue kept separate from ratings and
disclosed), ownership, and "corrections over reputation". Added as methodology
v1.1 (change log, section 8).

**Note for the maintainer:** the funding wording is written as *policy*, not a
disclosure of current backers — confirm it matches reality (and whatever
`docs/monetization-strategy-review.md` plans, e.g. sponsored reports) before
relying on it.

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

Done so far (no reseed required): ~~#3 methodology page~~, ~~#4 Independence
statement~~, ~~staleness banner~~, ~~status-flag infra~~, ~~related-promises
infra~~, ~~language scaffold~~, ~~#1 official-source pill + "not linked"~~,
~~#7 Report-an-issue mailto~~.

Still to do, roughly in order:

1. **#2 per-row history table** (`promise_history`: record, old/new status,
   date, note) — needs a `drizzle-kit push`. Unlocks the on-card status change
   log *and* #6 citable permalinks.
2. **#7 public correction queue** — a real moderation table + admin review
   view; the mailto is only the stopgap.
3. **#1 admin-side source gate** + fuller source tiers (a stored
   classification, since the middle tiers aren't URL-detectable).
4. **Seed the dormant fields** — start setting `flag` / `related` on real
   promises; get the four `guide.<locale>.html` drafts natively reviewed;
   confirm the #4 funding wording against reality.
5. **#5** — flip `DATASET_DUMP_PUBLIC` when the audience and cadence justify
   it.
6. **Progress-over-time chart** — start monthly `history` snapshots now; build
   the chart once there are several points.
