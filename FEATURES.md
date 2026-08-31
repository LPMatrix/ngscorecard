# Feature Ideas

## High Impact

- **Deep-link per promise** — shareable URL like `?id=6` that opens a specific card expanded. Makes it easy for journalists or social media users to link directly to one promise.
- **Last updated / data freshness banner** — a single line at the top showing when the tracker was last reviewed. Builds trust and answers the first question a new visitor has.
- **Progress over time chart** — a simple timeline showing how the kept/broken/partial counts have shifted since 2023. Even a static one makes the tracker feel authoritative.

## Medium Impact

- **Export / embed** — a "copy link to filtered view" button (e.g. `?status=broken&cat=Energy`) so someone can share a pre-filtered list.
- **Promise detail pages** — individual promise URLs (`/promise/6`) would improve SEO and shareability significantly.
- **Related promises grouping** — some promises overlap (e.g. multiple energy/oil entries). Linking them together under a "See also" section would help readers understand the bigger picture.

## Lower Effort, Still Useful

- **Status change log on each card** — a line like "Status changed from *pending* to *broken* — April 2026" to show the tracker is actively maintained.
- **Search suggestions / autocomplete** — show "3 results" as you type rather than silent filtering.
- **Print / PDF view** — a clean print stylesheet so a reporter can print a summary.

## Biggest Single Win

Deep-link + shareable filtered URL. ~20 lines of JS, makes the tracker dramatically more useful as a reference tool heading into the 2027 election.

---

## Status (updated Aug 2026)

**Shipped**

- **Deep-link per promise** — `?id=<pk>` opens a card expanded, read on the
  server too; the share button on each card copies that URL. Shared links now
  also get a per-promise `<title>` / OpenGraph / Twitter card (the promise
  text), built in `src/entry-server.js` → `buildMeta()`.
- **Last updated banner** — `LAST_REVIEWED` in the sidebar, plus a "Review
  due" (amber) state once an administration's `reviewed` date is ≥9 months
  old. See `docs/wikipedia-product-lessons.md`.
- **Shareable filtered URL** — `syncUrl()` now mirrors `&status=&cat=&q=&response=`
  into the query string, restored on load; a **Copy link** button sits next to
  Compare.
- **Result count** — "Showing N of M" under the promises filters when a
  search/filter is active.
- **Related promises "See also"** — mechanism shipped (`related` column +
  chips in `PromiseCard`); dormant until seed data links promises.

**Deliberately not doing** (see the discussion that produced this list)

- **Dedicated `/promise/N` routes** — superseded by `?id=` + the OG tags
  above; promise `id` isn't globally unique anyway.
- **Search autocomplete / suggestions** — the result count is the right-sized
  version for ~50 items per tab.
- **Print / PDF stylesheet** — low real usage; `@media print` blocks rot
  silently. Browser print-to-PDF is the fallback. Revisit only on request.

**Deferred**

- **Progress-over-time chart** — needs historical snapshots first. Start a
  monthly job writing current counts to the `history` table; build the chart
  once there are several data points.
- **Status change log per card** — only worth it as the proper per-row history
  table (which also unlocks citable permalinks), with an admin workflow that
  logs changes. A dateline with no real history behind it is theatre.
