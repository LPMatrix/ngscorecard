# Product lessons from Wikipedia

Wikipedia is one of the few web products that made *contested factual claims*
feel trustworthy at scale — which is exactly NGScorecard's problem. This doc
captures the transferable ideas and how each maps onto what the codebase
already has.

Status legend: **Done** · **Planned** · **Idea**

---

## 1. Verifiability as a UI primitive, not a footer — *Idea*

**Wikipedia:** every claim carries an inline citation; the *absence* of one is
visibly flagged ("citation needed").

**Here:** promise / inherited / fraud / order / bill rows already have `source`
and `sourceLabel` (`server/schema.js`). Push it from "a field" to "a visible
contract":

- Render a **"unsourced" / "weak source" badge** on any card whose `source` is
  empty, a dead link, or a low-tier domain.
- In the admin editor (`server/adminRoutes.js`), **reject a status change that
  isn't accompanied by a source** on the change itself — not just on the row.
- Introduce a **source tier** (primary government data / court record >
  reputable reporting > commentary) and show it as a small indicator.

**Effort:** badge + tier field is ~½ day; the admin-side gate is a validation
rule.

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

## 4. Neutral governance, visibly — *Idea*

**Wikipedia:** part of its authority is being non-commercial and un-ownable.

**Here:** `docs/monetization-strategy-review.md` exists. The lesson: whatever
pays the bills (API tiers, sponsorship, grants), **wall the rating layer off
from it and say so on the page.** Any hint that a score tracks who's paying
kills the product. A short "How this is funded / who decides ratings"
statement — linked from the footer and `press.html` — pre-empts the
accusation.

**Effort:** a paragraph + a link.

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

## 7. Low-friction contribution + a review gate — *Idea*

**Wikipedia:** anyone can edit, but sensitive pages go through pending-changes
review.

**Here:** there's already an admin dashboard (`server/adminRoutes.js`,
`server/adminAuth.js`, `public/admin.html`). Add a **public "submit a
correction / evidence" form** that lands in a moderation queue rather than
writing directly. Scales sourcing without opening the gates. The `press.html`
/ `developers.html` footers already invite "found a data issue?" — this gives
that invitation a real destination.

**Effort:** one public form + one queue table + a review view in the existing
admin UI.

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
- **Language editions** — *Scaffold done; `pcm` + `yo` + `ig` fully drafted.*
  `public/guide.<ha|yo|ig|pcm>.html` + shared `guide-i18n.css`, `hreflang`
  alternates and a language switcher on `public/guide.html`.
  `guide.pcm.html` (Nigerian Pidgin), `guide.yo.html` (Yorùbá) and
  `guide.ig.html` (Igbo) are full draft translations of all seven sections,
  pending native review (English stays authoritative — noted on each page;
  the `yo` and `ig` draft-notes flag the higher error risk for non-lexified
  languages). `ha` (Hausa) is still a shell. See `docs/i18n-plan.md`.
- **"What links here" / related promises** — *Done (dormant).* Optional
  `related` field on a promise (JSON array of sibling ids) → a "See also" chip
  group in PromiseCard that expands and scrolls to the linked card
  (`App.vue` `goto` / `relatedFor`). Renders nothing until seed data links
  promises. `FEATURES.md`'s "related promises grouping" note.

---

## Rough priority

1. ~~**#3 methodology page**~~ — done (`public/guide.html`).
2. ~~**staleness banner**~~ + ~~status-flag infra~~ + ~~related-promises infra~~
   + ~~language scaffold~~ — done (see Smaller borrows above).
3. **#1 unsourced badge + source tiers** — makes the existing `source` field
   earn its keep, and the source hierarchy is now documented in guide §6.
   The `flag` infra from the smaller borrows can carry an `unsourced` value.
4. **#2 per-row history table** — unlocks #6 permalinks for free.
5. **#7 public correction queue** — scales the data work; a natural producer
   of `flag: 'correction'` and `flag: 'review'` values.
6. **#4 funding/independence statement** — a paragraph, do it anytime.
7. **Seed the dormant fields** — start setting `flag` / `related` on real
   promises. Get `guide.pcm.html` + `guide.yo.html` + `guide.ig.html` natively
   reviewed, then fill the `ha` shell from them.
8. **#5** — flip the flag when the audience and cadence justify it.
