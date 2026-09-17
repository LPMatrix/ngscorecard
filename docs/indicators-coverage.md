# Indicator coverage audit

Generated 2026-09-17 by `scripts/audit-indicators.mjs`. Read-only report — does not write to data/seed.

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
| debt | 0 | 0 | 50 |
| budget | 0 | 0 | 50 |
| capex-share | 0 | 0 | 50 |

### state-2007-2023 (70 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 39 | 0 | 31 |
| debt | 17 | 0 | 53 |
| budget | 9 | 0 | 61 |
| capex-share | 7 | 0 | 63 |

### state-current (23 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 17 | 0 | 6 |
| debt | 14 | 0 | 9 |
| budget | 8 | 0 | 15 |
| capex-share | 5 | 0 | 18 |

## Missing core indicators, by key

- **igr** (136 admins): abdulkarim, abdullahiadamu, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, akpabio, …
- **debt** (161 admins): abdulkarim, abdullahiadamu, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, …
- **budget** (175 admins): abdulkarim, abdullahiadamu, abiodun, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, …
- **capex-share** (180 admins): abdulkarim, abdullahiadamu, abiodun, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, …

## Drift

- Unit mismatch vs registry: 4
  - bala/outofschool: unit " million" vs registry " thousand" (out-of-school)
  - makinde/outofschool: unit "%" vs registry " thousand" (out-of-school)
  - sanwoolu/budget: unit "₦tn" vs registry "₦bn" (budget)
  - soludo/igr: unit "₦bn/month" vs registry "₦bn" (igr)
- No registryKey (one-off or unmapped): 32
- Missing higherIsBetter: 3
  - bala/security
  - makinde/security
  - otu/security
- Points with no parsed year: 4
  - idris/debt: "Dec 2024 Domestic"
  - idris/debt: "Dec 2024 External"
  - lalong/igr: "9mo 2021"
  - makinde/security: "12mo to Jan '22"
- Fewer than 2 points (excluding not-published): 59
  - abacha/poverty: 1 point(s)
  - abdulsalami/gdp: 1 point(s)
  - abdulsalami/inflation: 1 point(s)
  - abdulsalami/naira: 1 point(s)
  - abdulsalami/reserves: 1 point(s)
  - abdulsalami/debt: 1 point(s)
  - abdulsalami/unemployment: 1 point(s)
  - bago/revenue-share: 1 point(s)
  - bala/security: 1 point(s)
  - bello/debt: 1 point(s)
  - buhari/debt: 1 point(s)
  - buharimilitary/gdp: 1 point(s)
  - buharimilitary/inflation: 1 point(s)
  - buharimilitary/naira: 1 point(s)
  - buharimilitary/reserves: 1 point(s)
  - buharimilitary/debt: 1 point(s)
  - diri/igr: 1 point(s)
  - diri/debt-service-ratio: 1 point(s)
  - fubara/allocation-dependence: 1 point(s)
  - gowon/fuel: 1 point(s)
  - inuwa/gratuity: 1 point(s)
  - inuwa/roads: 1 point(s)
  - ishaku/budget: 1 point(s)
  - jonathan/debt: 1 point(s)
  - makinde/outofschool: 1 point(s)
  - makinde/security: 1 point(s)
  - murtala/gdp: 1 point(s)
  - murtala/inflation: 1 point(s)
  - murtala/naira: 1 point(s)
  - murtala/reserves: 1 point(s)
  - murtala/debt: 1 point(s)
  - murtala/fuel: 1 point(s)
  - nwifuru/health: 1 point(s)
  - nwifuru/education: 1 point(s)
  - nwifuru/infrastructure: 1 point(s)
  - obasanjo/poverty: 1 point(s)
  - obasanjomilitary/fuel: 1 point(s)
  - ododo/debt-cleared: 1 point(s)
  - ododo/mining-licences: 1 point(s)
  - ododo/igr: 1 point(s)
  - otti/education-share: 1 point(s)
  - otti/health-share: 1 point(s)
  - otti/electric-buses: 1 point(s)
  - otu/health: 1 point(s)
  - otu/security: 1 point(s)
  - radda/debt: 1 point(s)
  - radda/education: 1 point(s)
  - radda/gratuity: 1 point(s)
  - sanwoolu/revenue-share: 1 point(s)
  - sanwoolu/rice-capacity: 1 point(s)
  - shagari/fuel: 1 point(s)
  - shagari/poverty: 1 point(s)
  - shonekan/fuel: 1 point(s)
  - soludo/debt: 1 point(s)
  - ubasani/debt: 1 point(s)
  - uzodinma/debt: 1 point(s)
  - yaradua/debt: 1 point(s)
  - yaradua/poverty: 1 point(s)
  - yusuf/debt: 1 point(s)
- Basis change with no note: 6
  - abdulrazaq/debt: basis changed to "domestic" at Dec ’25 with no note
  - bala/debt: basis changed to "domestic" at 2024 with no note
  - buni/debt: basis changed to "domestic" at 2024 with no note
  - fintiri/debt: basis changed to "domestic" at 2023 with no note
  - inuwa/debt: basis changed to "domestic" at 2023 with no note
  - inuwa/debt: basis changed to "domestic" at 2024 with no note
- Budget indicator vs budget table mismatch: 2
  - inuwa: indicator budget point 320 vs budget table totalBn 369.9 for 2025
  - sanwoolu: indicator budget point 4.237 vs budget table totalBn 4237 for 2026

## Execution debt

As of 2026-09-17: 77 of 208 administrations (37%) have at least one indicator. Registry, structured points, and an upserting seed are in place (server/seed.js, data/seed/indicators.json); the backfill itself (plan Step 9, Phases A-F) has not started. Core-key gaps above are the actual backlog, not memory of what "should" exist. Re-run this script after each backfill phase and update this line.
