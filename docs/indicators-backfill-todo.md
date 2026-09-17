# Key indicators backfill — pending work

A running backlog for Plan Step 9 (the multi-session indicator backfill —
see `docs/indicators-coverage.md` for the generated coverage matrix, which
is the source of truth for *what's missing*; this file is for *why it's
missing and what to do about it* — notes that don't survive a script
re-run). Update this file as items get resolved or new ones surface;
delete a line once it's done rather than checking it off.

## Phase C — current governors (fiscal 4 + social pair)

**North Central** (6 states) and **North East** (6 states) are started;
both are incomplete in the same way:

- **Plateau (Mutfwang)** — has no seed file and zero DB rows of any kind,
  not just missing indicators. A background task is already queued
  (`task_958aaac1`, "Build base content for Plateau governor") to build
  his base profile; his Key Indicators can't be added until that lands.
- **Social pair (out-of-school children, under-5 mortality)** — not
  attempted for any of the 11 North Central + North East states that do
  have fiscal indicators (Bauchi/Bala already had a pre-existing
  `out-of-school` entry from before this effort; that's the only one).
  Source is NDHS 2023-24 / MICS 2021 / UNICEF, and per the plan these are
  filled "only when a published state figure exists" — expect this to be
  sparse, not a clean 36-state sweep like IGR was.
- **Budget/capex-share for Kefas (Taraba)** — has IGR and debt now, but no
  budget appropriation article was sourced this pass; needs a fresh
  search (`"Kefas" budget 2023 OR 2024 Taraba appropriation`).
- **North West, South East, South South, South West** — not started.
  24 states, 4 zones' worth of the original "six sessions by geopolitical
  zone" estimate.
- **Off-cycle election trap** — Kogi, Bayelsa, and Imo hold governorship
  elections off the standard cycle, so their governors don't hand over on
  the usual 29 May date other states use. This caused a real attribution
  bug in Kogi (caught and fixed — see below); **check Bayelsa and Imo for
  the same issue** when South South / South East are done: don't assume
  the "incoming governor gets the transition year" convention lines up
  with a plain termStart year for these three states without checking the
  actual handover date.

## Phase C bug found and fixed (2026-09-17)

Benue (Alia), Kogi (Ododo), and Niger (Bago) each got an extra IGR point
(and, for Ododo, a debt point) for a year their predecessor was still in
office, because the same NBS 2022-2024 data block was applied to all six
North Central states without checking each governor's actual inauguration
date. Fixed and moved to the correct predecessor. Worth a spot check on any
future zone's current-governor data added the same way.

## Phase C — smaller fixes made in passing (North East, 2026-09-17)

- **Zulum (Borno)** had an existing `debt` entry that was actually external
  debt in $m, mistagged with the `debt`/₦bn id this pass needed. Re-keyed
  it to a one-off `external-debt` (no registryKey), matching the
  bago/revenue-share precedent from North Central, then added a proper
  domestic ₦bn `debt` entry from DMO.
- **Fintiri (Adamawa)** had a rough, self-reported "repaid 50%" estimate
  standing in for 2024 debt. Replaced with a precise dated DMO figure;
  kept the 2019 self-reported inherited-debt claim since it's a distinct,
  still-useful political data point with no DMO equivalent that far back.
- **Inuwa (Gombe)**'s existing 2024 debt point was actually a Q1 2024
  figure (already said so in its own note, just not in the label);
  relabeled it "Q1 2024" and added a proper year-end 2024 point alongside.
- **Inuwa (Gombe)**'s `budget` array (369.9bn for 2025) and its existing
  `budget` *indicator* (320bn for 2025) disagree — looks like presented
  vs. signed budget, per the array's own source URL slug. Not reconciled;
  left both as found, capex-share derived from the array's figure only.

## Phase D — former governors 2007-2023

**North Central and North East (Taraba only) have IGR added; nothing
else.**

- **Done**: Ortom (Benue), Yahaya Bello (Kogi), Sani Bello (Niger), Lalong
  (Plateau) got IGR for 2019-2022/2023, sourced from the same combined NBS
  file already used for Phase C. AbdulRazaq and Sule (current Kwara/
  Nasarawa governors) got their missing 2019 transition-year IGR point.
- **Not done — genuinely needs older archives, not a quick add**:
  - **Almakura** (Nasarawa, 2011-2019) and **Ahmed** (Kwara, 2011-2019) —
    zero IGR data. The NBS combined file only goes back to 2019, and 2019
    itself belongs to their successors. Their actual tenure (2011-2018)
    needs NBS's older half-year/quarterly PDF reports (e.g.
    `nigerianstat.gov.ng/download/497`, "Internally Generated Revenue At
    State Level (Jan-Jun 2016)") — these are scattered single-period
    documents, not one clean multi-year table, so expect to fetch and
    reconcile several PDFs per state.
  - **Suswam** (Benue), **Jang** (Plateau), **Babangida Aliyu** (Niger) —
    all 2007-2015, entirely before the 2019 data. Same older-archive
    problem, worse (further back).
  - **Doma** (Nasarawa, 2007-2011), **Ibrahim Idris** (Kogi, 2003-2012),
    **Saraki** (Kwara, 2003-2011) — boundary-spanning terms. DMO/NBS data
    generally starts 2011, so at most a single year (2011, or 2011-2012
    for Idris) might be findable; likely `not-published` in practice.
  - **Ishaku** (Taraba, 2015-2023) got IGR for 2019-2022 (his 2023
    transition year correctly went to Kefas instead). His 2015-2018 years
    have the same older-archive problem as Almakura/Ahmed above.
  - **Debt, budget, capex-share for every former governor above** (Ortom,
    Yahaya Bello, Sani Bello, Lalong, Ishaku) — none attempted yet, even
    for the ones with IGR now. DMO's subnational debt archive
    (`dmo.gov.ng/debt-profile/sub-national-debts`) paginates past Dec 2022
    on its index page; older quarters need direct guesses at the numeric
    slug or a paginated crawl, not yet tried.
- **North West, South East, South South, South West former governors** —
  not started. Also not started: the *other five* North East predecessors
  who were never touched at all (Nyako/Bindow before Fintiri in Adamawa;
  Yuguda/Abubakar before Bala in Bauchi; Sheriff/Shettima before Zulum in
  Borno; Goje/Dankwambo before Inuwa in Gombe; Gaidam before Buni in
  Yobe) — this pass only did Taraba's predecessor because Taraba's current
  governor (Kefas) took office in 2023, creating the same misattribution
  risk already fixed once in North Central; the other five North East
  states' current governors all took office in 2019, so there was no
  transition-year bug to fix and their predecessors were left alone. This
  is the bulk of the plan's "~85 admins, twelve sessions" estimate.

## Phase E — governors 1999-2007 (~40 admins)

Not started. Plan expects this to be "mostly not-published rows" since
citable pre-2011 subnational data is thin; the main task is a systematic
NBS/DMO/CBN Statistical Bulletin check per state, then honest
`not-published` markers where nothing turns up, rather than research per
admin from scratch.

## Phase F — pre-1999 states (60 admins)

Not started. Plan expects ~240 `not-published` rows after checking the CBN
Statistical Bulletin — a systematic sweep, not deep research per admin.

## Smaller open items

- **Federal pre-1999 public debt** (Phase B) uses external-debt-only
  figures converted to naira via WDI's own FX rate, flagged with
  `basis: "external debt only, converted from USD"`. A real CBN
  Statistical Bulletin domestic+external total, if findable, would be
  more accurate than the conversion — not urgent, just noted as a known
  approximation.
- **BudgIT's `stateofstates.budgit.org`** interactive map only exposes a
  composite sustainability *rank*, not raw IGR/debt/budget figures, and
  its underlying PDF reports (60MB+) need `pdftotext`, not `WebFetch`
  (which fails on files that large). Useful to remember before trying it
  again for a different zone.
