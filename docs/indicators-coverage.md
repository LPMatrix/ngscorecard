# Indicator coverage audit

Generated 2026-09-17 by `scripts/audit-indicators.mjs`. Read-only report — does not write to data/seed.

## Core-key coverage by era

### federal-pre1999 (11 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| gdp-growth | 0 | 0 | 11 |
| inflation | 0 | 0 | 11 |
| unemployment | 0 | 0 | 11 |
| fx-official | 0 | 0 | 11 |
| petrol-price | 0 | 0 | 11 |
| public-debt | 0 | 0 | 11 |
| external-reserves | 0 | 0 | 11 |
| poverty-rate | 0 | 0 | 11 |

### federal-1999+ (5 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| gdp-growth | 5 | 0 | 0 |
| inflation | 5 | 0 | 0 |
| unemployment | 5 | 0 | 0 |
| fx-official | 5 | 0 | 0 |
| petrol-price | 5 | 0 | 0 |
| public-debt | 0 | 0 | 5 |
| external-reserves | 0 | 0 | 5 |
| poverty-rate | 0 | 0 | 5 |

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
| igr | 38 | 0 | 32 |
| debt | 14 | 0 | 56 |
| budget | 3 | 0 | 67 |
| capex-share | 0 | 0 | 70 |

### state-current (22 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 14 | 0 | 8 |
| debt | 9 | 0 | 13 |
| budget | 5 | 0 | 17 |
| capex-share | 2 | 0 | 20 |

## Missing core indicators, by key

- **gdp-growth** (11 admins): abacha, abdulsalami, babangida, balewa, buharimilitary, gowon, ironsi, murtala, obasanjomilitary, shagari, shonekan
- **inflation** (11 admins): abacha, abdulsalami, babangida, balewa, buharimilitary, gowon, ironsi, murtala, obasanjomilitary, shagari, shonekan
- **unemployment** (11 admins): abacha, abdulsalami, babangida, balewa, buharimilitary, gowon, ironsi, murtala, obasanjomilitary, shagari, shonekan
- **fx-official** (11 admins): abacha, abdulsalami, babangida, balewa, buharimilitary, gowon, ironsi, murtala, obasanjomilitary, shagari, shonekan
- **petrol-price** (11 admins): abacha, abdulsalami, babangida, balewa, buharimilitary, gowon, ironsi, murtala, obasanjomilitary, shagari, shonekan
- **public-debt** (16 admins): abacha, abdulsalami, babangida, balewa, buhari, buharimilitary, gowon, ironsi, jonathan, murtala, obasanjo, obasanjomilitary, shagari, shonekan, tinubu, …
- **external-reserves** (16 admins): abacha, abdulsalami, babangida, balewa, buhari, buharimilitary, gowon, ironsi, jonathan, murtala, obasanjo, obasanjomilitary, shagari, shonekan, tinubu, …
- **poverty-rate** (16 admins): abacha, abdulsalami, babangida, balewa, buhari, buharimilitary, gowon, ironsi, jonathan, murtala, obasanjo, obasanjomilitary, shagari, shonekan, tinubu, …
- **igr** (139 admins): abdulkarim, abdullahiadamu, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, akpabio, …
- **debt** (168 admins): abdulkarim, abdullahiadamu, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, …
- **budget** (183 admins): abdulkarim, abdullahiadamu, abdulrazaq, abiodun, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, …
- **capex-share** (189 admins): abdulkarim, abdullahiadamu, abdulrazaq, abiodun, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, …

## Drift

- Unit mismatch vs registry: 5
  - bago/igr: unit "%" vs registry "₦bn" (igr)
  - bala/outofschool: unit " million" vs registry " thousand" (out-of-school)
  - makinde/outofschool: unit "%" vs registry " thousand" (out-of-school)
  - sanwoolu/budget: unit "₦tn" vs registry "₦bn" (budget)
  - soludo/igr: unit "₦bn/month" vs registry "₦bn" (igr)
- No registryKey (one-off or unmapped): 32
- Missing higherIsBetter: 3
  - bala/security
  - makinde/security
  - otu/security
- Points with no parsed year: 5
  - fintiri/igr: "2019-2021 (3yr total)"
  - idris/debt: "Dec 2024 Domestic"
  - idris/debt: "Dec 2024 External"
  - lalong/igr: "9mo 2021"
  - makinde/security: "12mo to Jan '22"
- Fewer than 2 points (excluding not-published): 31
  - alia/igr: 1 point(s)
  - bago/igr: 1 point(s)
  - bala/security: 1 point(s)
  - diri/igr: 1 point(s)
  - diri/debt-service-ratio: 1 point(s)
  - fintiri/igr: 1 point(s)
  - fubara/allocation-dependence: 1 point(s)
  - inuwa/gratuity: 1 point(s)
  - inuwa/roads: 1 point(s)
  - makinde/outofschool: 1 point(s)
  - makinde/security: 1 point(s)
  - nwifuru/health: 1 point(s)
  - nwifuru/education: 1 point(s)
  - nwifuru/infrastructure: 1 point(s)
  - ododo/debt-cleared: 1 point(s)
  - ododo/mining-licences: 1 point(s)
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
  - soludo/debt: 1 point(s)
  - sule/igr: 1 point(s)
  - ubasani/debt: 1 point(s)
  - uzodinma/debt: 1 point(s)
  - yusuf/debt: 1 point(s)
- Basis change with no note: 0
- Budget indicator vs budget table mismatch: 2
  - inuwa: indicator budget point 320 vs budget table totalBn 369.9 for 2025
  - sanwoolu: indicator budget point 4.237 vs budget table totalBn 4237 for 2026

## Execution debt

As of 2026-09-17: 64 of 207 administrations (31%) have at least one indicator. Registry, structured points, and an upserting seed are in place (server/seed.js, data/seed/indicators.json); the backfill itself (plan Step 9, Phases A-F) has not started. Core-key gaps above are the actual backlog, not memory of what "should" exist. Re-run this script after each backfill phase and update this line.
