# NGScorecard Feature Concepts

Eight proposed additions to the accountability tracker. Four are shipped; four are not yet wired into the app.

*Updated: 19 Sep 2026 · 4 of 8 shipped*

---

## F1 · Promise Lineage
**Status:** ✅ Shipped · `/themes/<slug>`

Threads a single recurring commitment through every administration that made it — each with its own outcome, in one vertical view.

Nigeria's biggest promises are made again and again. Shown side by side across 45 years, the pattern becomes the story: the artifact a journalist screenshots. Nothing else on the platform does cross-administration narrative.

**Leans on:** existing promise records + status + sources. Added a free-text `theme` field back-filled by editors; the `/themes/<slug>` route.

---

## F2 · Term Report Card
**Status:** ✅ Shipped · `/<admin>/report`

One auto-generated verdict page per administration: promises made, share kept, standout wins and failures, fraud cases by outcome, budget delivery — at a stable, shareable URL with its own share image.

A real page ranks for "[president] scorecard", updates itself as ratings change, and unfurls with a proper card when shared. Covers all tracked administrations — presidents and governors alike. Fraud is counted by outcome, not summed by amount (amounts are free text in mixed currencies).

**Leans on:** promise, fraud and budget data already on file. Added `/<admin>/report` and a server-rendered share image at `/api/og/report/<admin>.png`.

---

## F3 · "As It Happened" Timeline
**Status:** Not shipped · Build: M

A single chronological spine per administration, merging promise status-changes, executive orders, court judgments, fraud milestones and budget cycles into one scrollable record.

The tabs answer "how did they do on X". This answers "what actually happened, in order" — the question a reader new to an administration is really asking.

**Leans on:** every section already carries an `updated` / `signed` / `ruled` date. New: a merge-and-sort view; icons per entry type.

---

## F4 · Watch & Notify
**Status:** Not shipped · Build: L

Follow an administration, a state or a single promise. Get one email when a rating changes, a stronger source is added, or a reader correction is accepted.

Every other feature is a visit. This is what brings people *back* — and turns a lookup tool into something a beat reporter keeps on subscription. The change feed already exists; it just isn't pushed anywhere.

**Leans on:** the per-entry change log. New: email capture (no account), a weekly digest job, unsubscribe tokens.

---

## F5 · Rankings
**Status:** ✅ Shipped · `/rankings`

One rankings page, three lenses on the same comparison — administrations overall, by policy category, and by fraud exposure — for federal and state governments alike.

Rankings are per year in office, not raw totals, so a two-year term isn't judged against an eight-year one. Rows with too few promises are flagged † and listed last. Fraud is ranked by cases per year, counted by outcome.

**Leans on:** promise, category and fraud data already on file. Added `/rankings`, an aggregation in `getRankings()`, and one sortable table reused for all three lenses.

---

## F6 · How Is My State Doing
**Status:** Not shipped · Build: M

Pick a state and see the sitting governor's scorecard, the full line of past governors with each one's keeping rate, and a state-level aggregate.

Most Nigerians care more about their governor than the president. This is the entry point that makes the tracker feel local — and it plugs straight into the zone grid on the landing page.

**Leans on:** every state already has its current + former governors linked. New: a `/states/<slug>` rollup and per-state aggregation.

---

## F7 · Election & Manifesto Tracker
**Status:** Not shipped · Build: M

Before a vote, log a candidate's published manifesto as dated, sourced commitments. On inauguration day it converts into their scorecard — every promise already recorded, pinned to the campaign document it came from.

The tracker only starts *after* someone takes office, reconstructing what they pledged from archives. Capturing manifestos at publication ends the "did they really promise that" argument — and gives the platform a reason to exist during a campaign, as a side-by-side of what every candidate is offering, instead of going quiet between handovers.

**Leans on:** the promise fields (title, category, source); the compare view for candidate columns. New: a `prospective` administration state; one manifesto source per candidate; a convert-on-inauguration step.

---

## F8 · Full-App Localisation
**Status:** ✅ Shipped · `/ha/…`, `/yo/…`, `/ig/…`, `/pcm/…`

The interface, status labels, category names, guide, press kit and API docs localised into Hausa, Yoruba, Igbo and Pidgin, with `hreflang` and locale-prefixed routes.

This is the single biggest expansion of who the tracker actually reaches. Assessments stay English until translations land — but a native-language shell removes the main barrier for most of the audience.

**Leans on:** the guide's translation workflow and locale routing. Added a UI string catalogue (500+ keys); localised status/category vocab; per-locale SSR. All four locales are unreviewed machine drafts pending native review — switchable in the header, held back from search until then.

---

## Build Priority

| # | Feature | Status | Effort |
|---|---------|--------|--------|
| F1 | Promise Lineage | ✅ Shipped | — |
| F2 | Term Report Card | ✅ Shipped | — |
| F3 | "As It Happened" Timeline | Not built | M |
| F4 | Watch & Notify | Not built | L |
| F5 | Rankings | ✅ Shipped | — |
| F6 | How Is My State Doing | Not built | M |
| F7 | Election & Manifesto Tracker | Not built | M |
| F8 | Full-App Localisation | ✅ Shipped | — |
