# Monetization strategy review

A dissection of the 8-idea monetization pitch (governor/data subscriptions, API,
sponsored reports, media licensing, widgets, corporate intelligence, AI
interface, ads) against what NGScorecard actually is today, as of the state
left by this session's work (36 states + federal presidents seeded).

The pitch's shape is right — free core, paid intelligence layer, one database
powering five products is the standard civic-tech model (GovTrack, ProPublica
data services, OpenCorporates). This document isn't a counter-pitch. It's a
gap analysis: for each idea, what it assumes about the product, what's
actually true right now, and what has to exist before the idea is sellable
rather than aspirational.

**Bottom line:** every paid tier in the pitch assumes the data is
audit-grade. For the budget numbers specifically, that's now handled at the
schema level: `server/schema.js`'s budget table no longer forces a value into
`revenueBn`, `debtServiceBn`, `capitalBn`, `recurrentBn`, or `deficitBn` when
no source states one — those fields are `null`, and the UI already renders
`null` as "—" rather than a number. There is no longer a stored figure that
could be mistaken for a reported one. What's still open is everything outside
that one table: promise statuses, fraud/court verdicts, and the rest of the
dataset have no equivalent mechanism, and this exercise didn't audit whether
the same ambiguity exists there. That residual uncertainty still gates ideas
#1, #2, #3, #6, and the whole right-hand side of the tier ladder. Confirm (or
fix) provenance everywhere else next; everything else in the pitch becomes
buildable in roughly the order the original document proposed.

---

## 1. What NGScorecard actually is right now

Grounding everything below in the real system, not the aspiration:

- **Data pipeline:** hand-authored JSON files in `data/seed/*.json`, one per
  administration, loaded by [`server/seed.js`](../server/seed.js) via `npm run
  db:seed`. Seeding is additive/diff-based (`seedByKey` skips existing rows by
  a natural key) — editing a JSON file after it's been seeded has **no effect**
  until the row is deleted or `--reset` is run. There is no live-editing path;
  updating a fact means editing a file and re-running a script by hand.
- **Storage:** Turso (hosted LibSQL/SQLite), one instance, no read replicas,
  no connection pooling tuning visible. It timed out mid-seed once this
  session (`ConnectTimeoutError` on `indicator_points`) — not a capacity
  problem at today's volume, but a sign the infra hasn't been load-tested at
  all.
- **API:** two surfaces now. [`server/api.js`](../server/api.js) is the
  original internal, unauthenticated, unlimited set of routes
  (`/api/:admin/promises` etc.) — what the frontend itself calls, not a
  product. [`server/publicApi.js`](../server/publicApi.js) is the actual
  public API: `/api/v1/:admin/:category`, gated by a free self-serve API key
  (`POST /api/v1/keys` with an email, no payment), rate-limited to 60
  requests/minute per key via `express-rate-limit`, with usage
  (`requestCount`, `lastUsedAt`) tracked per key in a new `api_keys` table.
  Both surfaces share the same route logic via
  [`server/dataRoutes.js`](../server/dataRoutes.js) so they can't drift
  apart. What's still missing: paid tiers (the `tier` column exists on
  `api_keys` but nothing reads it yet — every key is `'free'`), published
  docs beyond the self-describing `GET /api/v1` JSON response, and API
  versioning/stability guarantees beyond the `v1` prefix itself.
- **Frontend:** a Vue SPA with SSR, single view + a compare view. No user
  accounts, no billing integration, no concept of a logged-in user anywhere
  in the codebase.
- **Coverage:** all 36 states + federal presidents now have at least one
  administration seeded, completed this session.
- **Data quality is uneven by construction, not by accident.** Some files
  (e.g. `otti.json`, `ododo.json`) were built by directly researching and
  citing live sources for every field. The last ~15 governor files arrived as
  pre-built JSON from an external research pass (apparently ChatGPT-assisted)
  of unknown methodology, and several budget rows had numbers that were never
  reported anywhere — filled in only to satisfy the schema's old `NOT NULL`
  constraints. Most of those have since been replaced with real, cited
  figures; where no figure exists in any source, `totalBn` is still required
  (every real budget year has a reported total), but `revenueBn`,
  `debtServiceBn`, `capitalBn`, `recurrentBn`, and `deficitBn` are now
  nullable, and are `null` rather than a guess wherever no source states
  them. That fixes the numeric-budget version of this problem specifically.
  It doesn't touch the rest of the dataset — promise statuses, fraud/court
  verdicts, and everything else still has no field marking how confident or
  how sourced a given judgment is, and that wasn't in scope of this pass.

That last point is the crux of everything below.

---

## 2. Idea-by-idea dissection

### Idea 1 — Government/institutional subscriptions ("NGScorecard Pro")

**The pitch:** ₦50k–250k/month for NGOs, researchers, journalists, consultancies —
advanced filtering, downloadable datasets, API access, custom reports, alerts.

**Gap vs. reality:**
- Bundles three separate unbuilt things (a paid UI tier, an API, and a
  reporting/alerting engine) into one SKU. Each has its own build cost.
- "Downloadable datasets" and "API access" at a price point implies the buyer
  can rely on the numbers for their own published research. Selling a
  professional researcher a dataset that contains undisclosed derived
  estimates alongside sourced facts is the fastest way to lose that customer
  permanently — researchers check their sources.
- No billing, no accounts, no seat management exists.

**Verdict:** Directionally the highest-value tier, but it's the *last* one to
build, not the first — it depends on the API (#2) existing and the data being
provenance-tagged. Premature today.

### Idea 2 — Sell the data/API

**The pitch:** structured queries like "every federal healthcare promise since
2015, status, source, ministry" served over an API; tiered from free to
₦500k+/month enterprise.

**Gap vs. reality:**
- The free tier exists now: `GET /api/v1/:admin/:category`, keyed via
  self-serve `POST /api/v1/keys`, rate-limited to 60 requests/minute per key.
  A developer can sign up and pull real data today with no human involved on
  this end.
- An API product's entire value proposition is "trust the numbers enough to
  build on them." Same provenance problem as #1, sharper here: a developer
  building a civic-tech app on this API and shipping a wrong debt-service
  figure to their users is a much worse failure mode than a human reading a
  caveat on a webpage. The budget table's `null`-for-unknown convention (see
  §1) directly helps this API specifically, since a consumer can no longer
  receive a guessed number from it.
- Still missing: a real docs page (today it's a `GET /api/v1` JSON blob, not
  a page a developer would enjoy reading), paid tiers (the `tier` column on
  `api_keys` isn't read by anything yet), and any versioning/stability
  promise beyond the `v1` path segment itself.

**Verdict:** Was the best-sequenced idea in the pitch; the free tier is now
built, which is what forced the budget-provenance fix in §1 to happen in the
first place. Paid tiers are the remaining piece, and shouldn't ship until
provenance is handled dataset-wide, not just for budgets.

### Idea 3 — Sponsored research/reports

**The pitch:** "Nigeria Government Performance Report 2026," sold access or
sponsorship, with a firm rule that sponsors can't influence scores.

**Gap vs. reality:**
- The stated rule ("sponsor never influences the score") is correct and
  necessary, but it's not sufficient on its own — it needs to be a *published,
  externally visible* editorial policy (methodology page, correction process,
  named sponsor disclosure on every sponsored piece), or it's just a promise
  nobody outside the company can verify. Trust is the product; an unstated
  internal rule doesn't protect it.
- This is the idea with the most legal exposure. The dataset already contains
  named, specific fraud allegations, EFCC case statuses, and court judgment
  outcomes about sitting governors and commissioners. That's fine as
  citizen-journalism-style aggregation with sources linked (as it is today).
  It becomes materially riskier the moment it's packaged into a paid,
  sponsored report with your brand's editorial authority behind it — that's
  the point where a subject is likeliest to send a lawyer's letter instead of
  a tweet.
- Requires an editorial/production process (writing, design, fact-check pass)
  that doesn't exist yet — this is a publishing business bolted onto a data
  business.

**Verdict:** Real potential, but sequence it *after* the provenance fix and
*after* writing down an explicit editorial/corrections policy — not as an
early revenue idea.

### Idea 4 — Media licensing

**The pitch:** newsrooms license the dataset/rankings instead of researching
it themselves, "Powered by NGScorecard."

**Gap vs. reality:**
- Same trust bar as #2, but for outlets whose own reputation rides on
  citing you correctly — arguably *more* sensitive to unflagged estimates than
  an individual API developer.
- Needs a license agreement, attribution requirements, and update-frequency
  guarantees — legal/contractual work, not engineering work.
- Doesn't require new infrastructure beyond what #2 builds; it's a licensing
  wrapper around the API.

**Verdict:** Natural follow-on to #2 once the API exists and one pilot
newsroom relationship validates demand. Don't build anything bespoke for this
before that.

### Idea 5 — Embeddable widgets

**The pitch:** a publisher embeds a live "38% Kept / 27% Partial / 35% Broken"
widget that auto-updates from NGScorecard.

**Gap vs. reality:**
- Built: `public/widget.js` (a dependency-free script, rendered into a
  Shadow DOM so it can't clash with a host page's CSS) plus a dedicated,
  unauthenticated, CORS-open `GET /api/v1/widget/:admin/summary` endpoint —
  deliberately separate from the keyed data routes, since a script embedded
  on someone else's site can't safely carry a secret API key. Rate-limited
  by caller IP (30/min), which naturally scales with real visitor traffic
  rather than needing per-site metering.
- This is the one idea in the pitch that's mostly *decoupled* from the
  provenance problem — a kept/partial/broken percentage bar is a simple,
  low-stakes aggregate, not a specific disputed figure like a debt-service
  number. Lower trust bar than #1–4.
- Still missing: no CDN in front of it yet (served straight from the app
  origin), and no per-domain embed analytics — right now there's no way to
  tell *which* sites are embedding it, only how many requests are coming in.
- Good distribution play regardless of monetization — even a *free* embed
  widget drives backlink traffic and brand awareness cheaply.

**Verdict:** Shipped. Cheapest-to-derisk idea with the least data-trust
exposure, and now live — next step is distribution (get a few sites to
actually embed it), not more building. Monetize later once there's real embed
volume worth metering.

### Idea 6 — Corporate intelligence ("what policies could affect our business")

**The pitch:** sell businesses a feed of new policies/orders/bills relevant to
their sector.

**Gap vs. reality:**
- This is the most different product in the list — it's not really
  "NGScorecard for companies," it's a *regulatory-intelligence* product that
  happens to reuse the same `orders`/`bills` tables as raw material.
  Businesses paying for this need low false-negative rates (missing a
  relevant policy is the failure mode that gets you fired as a vendor) — that
  requires either much broader/faster coverage than the current governor-by
  -governor research cadence provides, or a sector-tagging/alerting layer
  that doesn't exist in the schema at all today (`orders.category` is a free
  -text string, not a structured taxonomy).
- Highest revenue ceiling in the pitch, also the largest build gap from
  today's state. This is a 6-12 month product initiative, not a pricing tier.

**Verdict:** Real opportunity, wrong sequencing to lead with. Revisit once
#1–#5 validate that institutions will pay for *anything* from this dataset.

### Idea 7 — AI-powered interface ("Ask NGScorecard")

**The pitch:** natural-language Q&A over the dataset ("what has this admin
delivered on electricity?"), every claim linked to source.

**Gap vs. reality:**
- Structurally the easiest AI feature to build well, precisely *because* the
  underlying data is already structured JSON with a `source`/`sourceLabel` on
  nearly every row — this is a much safer RAG problem than "AI answers
  questions about the news," since you can force citations back to specific
  rows instead of free-generating.
- The one place the pitch's framing needs sharpening: "the moat isn't the
  LLM, it's the dataset" is correct, but only if the interface *visibly*
  surfaces the provenance gap from §1 — an AI answer that confidently states
  a derived-estimate debt-service figure as fact, with a source link that
  actually just points to the budget document that *doesn't* contain that
  number, is worse than the current UI, not better. This is the idea most
  likely to make the provenance problem *user-visible and reputationally
  costly* if shipped before that's fixed.
- No accuracy/eval harness exists to know how often the interface would be
  right.

**Verdict:** Good differentiator, but it's the feature most directly punished
by shipping before the provenance fix — build it right after #2 (API) and the
schema change, not before.

### Idea 8 — Advertising

**The pitch:** secondary revenue only, once traffic is meaningful (~500k
MAU).

**Gap vs. reality:** No disagreement — this is correctly sequenced last in
the original pitch and doesn't interact with the trust/provenance problem at
all, since it monetizes attention, not the dataset's credibility. Nothing to
add.

### The tier ladder (Free → Plus → Pro → API → Enterprise → Intelligence)

The ladder's logic ("one database powers five products") is sound *in
principle*, but it currently describes an org chart for a company that
doesn't exist yet: no accounts, no billing, no metering, no support
function. Collapsing it to **Free → API (metered) → Pro (API + reports)** for
phase one is more honest about what three engineers and one data pipeline can
actually deliver.

### "NGScorecard for States" / federal→state→LGA intelligence layer

This is really a restatement of "finish building out full state coverage,"
which — as of this session — is now **done at the top level** (all 36 states
have a governor seeded). The framing of it as a future monetization idea
undersells that it just shipped. The real next expansion axis implied by the
pitch (state legislatures, LGA-level data, budget line-item drill-down) is a
much bigger data-collection lift than anything above and shouldn't be
conflated with the monetization sequencing question.

---

## 3. Cross-cutting blockers (the few things gating almost everything)

1. **No provenance mechanism outside the budget table.** Budget figures now
   use `null` to mean "not reported" instead of a silent guess, so a number
   in `revenueBn`/`debtServiceBn`/etc. can be trusted at face value. Nothing
   equivalent exists for the rest of the dataset — `source`/`sourceLabel`
   tell you *where a claim came from*, not how directly that source supports
   the specific judgment attached to it (a promise's kept/partial/broken
   status, a fraud entry's verdict). Gates #1, #2, #3, #6, and makes #7
   dangerous. This is the single highest-leverage remaining fix — see §4.
2. **No billing.** Auth and metering exist now — free API keys, per-key rate
   limiting, per-key usage tracking (`api_keys.requestCount`,
   `lastUsedAt`). What's still missing is anything that reads the `tier`
   column for anything other than `'free'`: no payment integration, no
   tier-based rate-limit differentiation, no way to actually charge a key.
   Gates #1, #2, #4's contractual side, and any usage-based pricing. Needed
   before *any paid* tier, regardless of which idea goes first.
3. **No demand signal.** Every number in the pitch's pricing tables (₦50k,
   ₦250k, 500k MAU) is a guess — there's no traffic or user data yet to
   validate that NGOs/newsrooms will actually pay. Cheapest way to test this
   isn't a build — it's outreach: show three or four target
   newsrooms/NGOs the current free site and ask what they'd pay for and how
   much, before writing any billing code.
4. **No editorial/legal policy documented.** Needed before #3 in particular,
   given the dataset already asserts fraud/EFCC/court outcomes about named
   living officials.

---

## 4. Recommended sequencing

| Order | What | Why here |
|---|---|---|
| 1 | Extend the same discipline used for budget figures (real value or `null`, never a silent guess) to the rest of the dataset, and add whatever queryable confidence/sourcing marker qualitative fields need (promise status, fraud verdicts, etc. can't just be nulled the way a number can) | Unblocks every paid idea at once; cheapest to do now while the schema is still small, expensive to retrofit later |
| 2 | ~~Ship a free, rate-limited public API~~ — done (idea #2, free tier: `/api/v1`, keyed, 60 req/min). A real docs page beyond the `GET /api/v1` JSON response is the remaining piece of this step | Forced the budget-provenance schema fix in §1 to actually happen, as intended |
| 3 | ~~Ship a free embeddable widget~~ — done (idea #5: `public/widget.js` + `/api/v1/widget/:admin/summary`). Getting a few real sites to actually embed it is the remaining piece of this step | Low trust exposure, pure distribution, validates whether anyone wants to embed this at all |
| 4 | Talk to 3-4 real newsrooms/NGOs with the free API + widget in hand | Replaces guessed pricing with real willingness-to-pay data |
| 5 | Paid API tiers + Pro reporting (ideas #1, #2 paid, #4) | Only once #1-4 are proven, using the provenance flag as the actual product differentiator ("audited data") |
| 6 | AI interface (#7) | Right after the API, using it as the retrieval layer, provenance flag surfaced in every answer |
| 7 | Sponsored reports (#3), with a published editorial/corrections policy | After trust is established via paid API customers, not before |
| 8 | Corporate intelligence (#6) | Biggest build gap; revisit once something above is generating revenue and validates institutional appetite |
| — | Advertising (#8) | Opportunistic once traffic warrants it; no dependency on the above |

---

## 5. Appendix — concrete provenance examples

For grounding, real instances of budget rows where no source states a
figure, and the field is `null` rather than a guess:

- **Ebonyi State (`nwifuru.json`), all three budget years:** no state or
  federal source publishes an isolated debt-service figure for Ebonyi, so
  `debtServiceBn` is `null` in every year — the UI shows "—", not a number.
- **Niger State (`bago.json`), 2023 and 2025:** Niger's debt-sustainability
  reporting discusses debt-service *ratios*, not a state-budget naira figure,
  so `debtServiceBn` is `null`; 2023 and 2025 also have no stated revenue
  figure distinct from the expenditure total, so `revenueBn` is `null` there
  too (2024 is the exception — its financing sources are itemised and sum to
  the total, so `revenueBn` is populated).
- **Jigawa State (`namadi.json`), 2025 budget:** the source gives only the
  total; capital/recurrent split, revenue, and debt service are all `null`
  for that year, rather than a split extrapolated from an adjacent year.

Compare that to Jigawa's 2024 row, where the government's own Citizens'
Accountability Report states revenue at "104% of final approved estimate" —
a real reported figure, populated normally. A customer querying the budget
API today can no longer receive a number for a field that isn't actually
known; they either get a real, cited figure or nothing. What they still
can't do is query *why* a given row is missing a field, or get the same
guarantee for non-numeric judgments elsewhere in the dataset — that's the
remaining gap in §4, step 1.
