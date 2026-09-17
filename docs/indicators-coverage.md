# Key indicators — coverage audit & backlog

Generated 2026-09-17 by `scripts/audit-indicators.mjs`. The script only ever writes this section, down to the `BACKLOG-START` marker; run it with `node --env-file=.env scripts/audit-indicators.mjs --out docs/indicators.md` after any backfill session to refresh it. Everything from the marker onward is hand-maintained and preserved verbatim across regenerations — that's where *why* something is missing and what to do about it lives, since that context doesn't survive a script re-run.

## Core-key coverage by era

### federal-pre1999 (11 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| gdp-growth | 9 | 2 | 0 |
| inflation | 9 | 2 | 0 |
| unemployment | 3 | 8 | 0 |
| fx-official | 9 | 2 | 0 |
| petrol-price | 8 | 3 | 0 |
| public-debt | 8 | 3 | 0 |
| external-reserves | 9 | 2 | 0 |
| poverty-rate | 3 | 8 | 0 |

### federal-1999+ (5 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| gdp-growth | 5 | 0 | 0 |
| inflation | 5 | 0 | 0 |
| unemployment | 5 | 0 | 0 |
| fx-official | 5 | 0 | 0 |
| petrol-price | 5 | 0 | 0 |
| public-debt | 5 | 0 | 0 |
| external-reserves | 5 | 0 | 0 |
| poverty-rate | 4 | 1 | 0 |

### state-pre1999 (49 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 0 | 0 | 49 |
| debt | 0 | 0 | 49 |
| budget | 0 | 0 | 49 |
| capex-share | 0 | 0 | 49 |

### state-1999-2007 (50 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 0 | 0 | 50 |
| debt | 1 | 1 | 48 |
| budget | 0 | 0 | 50 |
| capex-share | 0 | 0 | 50 |

### state-2007-2023 (74 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 39 | 0 | 35 |
| debt | 26 | 1 | 47 |
| budget | 15 | 0 | 59 |
| capex-share | 14 | 0 | 60 |

### state-current (19 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 19 | 0 | 0 |
| debt | 19 | 0 | 0 |
| budget | 19 | 0 | 0 |
| capex-share | 19 | 0 | 0 |

## Missing core indicators, by key

- **igr** (134 admins): abdulkarim, abdullahiadamu, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, akpabio, …
- **debt** (144 admins): abdulkarim, abdullahiadamu, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ajasin, ajimobi, akande, akpabio, …
- **budget** (158 admins): abdulkarim, abdullahiadamu, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, …
- **capex-share** (159 admins): abdulkarim, abdullahiadamu, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, …

## Drift

- Unit mismatch vs registry: 1
  - makinde/outofschool: unit "%" vs registry " thousand" (out-of-school)
- No registryKey (one-off or unmapped): 33
- Missing higherIsBetter: 3
  - bala/security
  - makinde/security
  - otu/security
- Points with no parsed year: 2
  - lalong/igr: "9mo 2021"
  - makinde/security: "12mo to Jan '22"
- Fewer than 2 points (excluding not-published): 79
  - abacha/poverty: 1 point(s)
  - abdulrazaq/under5: 1 point(s)
  - abdulsalami/gdp: 1 point(s)
  - abdulsalami/inflation: 1 point(s)
  - abdulsalami/naira: 1 point(s)
  - abdulsalami/reserves: 1 point(s)
  - abdulsalami/debt: 1 point(s)
  - abdulsalami/unemployment: 1 point(s)
  - alia/under5: 1 point(s)
  - bago/revenue-share: 1 point(s)
  - bago/under5: 1 point(s)
  - bala/security: 1 point(s)
  - buhari/debt: 1 point(s)
  - buharimilitary/gdp: 1 point(s)
  - buharimilitary/inflation: 1 point(s)
  - buharimilitary/naira: 1 point(s)
  - buharimilitary/reserves: 1 point(s)
  - buharimilitary/debt: 1 point(s)
  - buni/under5: 1 point(s)
  - diri/debt-service-ratio: 1 point(s)
  - eno/under5: 1 point(s)
  - fintiri/under5: 1 point(s)
  - fubara/allocation-dependence: 1 point(s)
  - gowon/fuel: 1 point(s)
  - ibrahimidris/debt: 1 point(s)
  - idris/outofschool: 1 point(s)
  - inuwa/gratuity: 1 point(s)
  - inuwa/roads: 1 point(s)
  - ishaku/budget: 1 point(s)
  - jonathan/debt: 1 point(s)
  - kefas/under5: 1 point(s)
  - makinde/outofschool: 1 point(s)
  - makinde/security: 1 point(s)
  - makinde/under5: 1 point(s)
  - mbah/under5: 1 point(s)
  - murtala/gdp: 1 point(s)
  - murtala/inflation: 1 point(s)
  - murtala/naira: 1 point(s)
  - murtala/reserves: 1 point(s)
  - murtala/debt: 1 point(s)
  - murtala/fuel: 1 point(s)
  - mutfwang/igr: 1 point(s)
  - nwifuru/health: 1 point(s)
  - nwifuru/education: 1 point(s)
  - nwifuru/infrastructure: 1 point(s)
  - nwifuru/under5: 1 point(s)
  - obasanjo/poverty: 1 point(s)
  - obasanjomilitary/fuel: 1 point(s)
  - oborevwori/under5: 1 point(s)
  - ododo/debt-cleared: 1 point(s)
  - ododo/mining-licences: 1 point(s)
  - ododo/igr: 1 point(s)
  - ododo/under5: 1 point(s)
  - okpebholo/igr: 1 point(s)
  - okpebholo/under5: 1 point(s)
  - otti/education-share: 1 point(s)
  - otti/health-share: 1 point(s)
  - otti/electric-buses: 1 point(s)
  - otti/under5: 1 point(s)
  - otu/health: 1 point(s)
  - otu/security: 1 point(s)
  - otu/under5: 1 point(s)
  - oyebanji/under5: 1 point(s)
  - radda/education: 1 point(s)
  - radda/gratuity: 1 point(s)
  - radda/outofschool: 1 point(s)
  - sanwoolu/revenue-share: 1 point(s)
  - sanwoolu/rice-capacity: 1 point(s)
  - shagari/fuel: 1 point(s)
  - shagari/poverty: 1 point(s)
  - shonekan/fuel: 1 point(s)
  - soludo/under5: 1 point(s)
  - ubasani/external-debt: 1 point(s)
  - ubasani/under5: 1 point(s)
  - uzodinma/under5: 1 point(s)
  - yaradua/debt: 1 point(s)
  - yaradua/poverty: 1 point(s)
  - yusuf/under5: 1 point(s)
  - yusuf/outofschool: 1 point(s)
- Basis change with no note: 6
  - abdulrazaq/debt: basis changed to "domestic" at Dec ’25 with no note
  - bala/debt: basis changed to "domestic" at 2024 with no note
  - buni/debt: basis changed to "domestic" at 2024 with no note
  - fintiri/debt: basis changed to "domestic" at 2023 with no note
  - inuwa/debt: basis changed to "domestic" at 2023 with no note
  - inuwa/debt: basis changed to "domestic" at 2024 with no note
- Budget indicator vs budget table mismatch: 1
  - inuwa: indicator budget point 320 vs budget table totalBn 369.9 for 2025

## Execution debt

As of 2026-09-17: 85 of 208 administrations (41%) have at least one indicator. Registry, structured points, and an upserting seed are in place (server/seed.js, data/seed/indicators.json); the backfill (plan Step 9, Phases A-F) is under way — see the Backlog section below for what's done and what's left per phase. Core-key gaps above are the actual state, not memory of what "should" exist. Re-run this script after each backfill session and update the Backlog section by hand.

<!-- BACKLOG-START: everything from here down is hand-maintained; this script preserves it verbatim on every regeneration. -->

## Backlog

_Nothing recorded yet — add hand-written notes on why gaps exist and what to do about them below this line; the generated section above will keep refreshing on top of it._
