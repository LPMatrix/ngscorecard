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

## 3. A written, versioned methodology — *Idea*

**Wikipedia:** NPOV and notability are *documented, enforceable policies*, not
vibes.

**Here:** `public/guide.html` is the place. It should state:

- How kept / partial / broken / pending are decided, and the evidence bar for
  each.
- **What counts as a trackable promise** — manifesto only? campaign speeches?
  a tweet? Without an explicit inclusion rule, the *selection* of promises
  looks biased even when every individual rating is fair.
- A "last changed" date on the rubric itself. When the criteria change, say so
  (and ideally note which past ratings were re-checked against the new bar).

**Effort:** writing, not code. One page. Highest credibility-per-hour on this
list.

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

- **Standardised status banners** — "disputed", "needs updating", "verified
  April 2026" — instead of ad-hoc prose per card.
- **Summary-first progressive disclosure** — headline kept/broken counts →
  card → full assessment → sources. Largely already the shape; keep the top
  skimmable and honest.
- **Language editions** — methodology + headline verdicts in Hausa / Yoruba /
  Igbo / Nigerian Pidgin widens both reach and perceived legitimacy. Static
  per-locale pages before any full i18n effort.
- **"What links here"** — for overlapping promises (multiple energy/oil
  entries), a "related promises" link group, per the `FEATURES.md` "related
  promises grouping" note.

---

## Rough priority

1. **#3 methodology page** and **#2 staleness banner** — cheap, pure trust.
2. **#1 unsourced badge + source tiers** — makes the existing `source` field
   earn its keep.
3. **#2 per-row history table** — unlocks #6 permalinks for free.
4. **#7 public correction queue** — scales the data work.
5. **#4 funding/independence statement** — a paragraph, do it anytime.
6. **#5** — flip the flag when the audience and cadence justify it.
