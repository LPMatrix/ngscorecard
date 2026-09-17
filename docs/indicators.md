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

### state-2007-2023 (75 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 40 | 0 | 35 |
| debt | 69 | 6 | 0 |
| budget | 16 | 0 | 59 |
| capex-share | 15 | 0 | 60 |

### state-current (21 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 21 | 0 | 0 |
| debt | 21 | 0 | 0 |
| budget | 21 | 0 | 0 |
| capex-share | 21 | 0 | 0 |

## Missing core indicators, by key

- **igr** (134 admins): abdulkarim, abdullahiadamu, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, akpabio, …
- **debt** (97 admins): abdulkarim, abdullahiadamu, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ajasin, akande, aku, akume, alamieyeseigha, …
- **budget** (158 admins): abdulkarim, abdullahiadamu, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, …
- **capex-share** (159 admins): abdulkarim, abdullahiadamu, abubakar, abubakarmusa, adageorge, adamuatta, adasu, adefarati, adeleke92, adesina, agagu, ahmed, ajasin, ajimobi, akande, …

## Drift

- Unit mismatch vs registry: 0
- No registryKey (one-off or unmapped): 33
- Missing higherIsBetter: 3
  - bala/security
  - makinde/security
  - otu/security
- Points with no parsed year: 2
  - lalong/igr: "9mo 2021"
  - makinde/security: "12mo to Jan '22"
- Fewer than 2 points (excluding not-published): 65
  - abacha/poverty: 1 point(s)
  - abdulsalami/gdp: 1 point(s)
  - abdulsalami/inflation: 1 point(s)
  - abdulsalami/naira: 1 point(s)
  - abdulsalami/reserves: 1 point(s)
  - abdulsalami/debt: 1 point(s)
  - abdulsalami/unemployment: 1 point(s)
  - aiyedatiwa/igr: 1 point(s)
  - bago/revenue-share: 1 point(s)
  - bala/security: 1 point(s)
  - buhari/debt: 1 point(s)
  - buharimilitary/gdp: 1 point(s)
  - buharimilitary/inflation: 1 point(s)
  - buharimilitary/naira: 1 point(s)
  - buharimilitary/reserves: 1 point(s)
  - buharimilitary/debt: 1 point(s)
  - diri/debt-service-ratio: 1 point(s)
  - fubara/allocation-dependence: 1 point(s)
  - gowon/fuel: 1 point(s)
  - ibrahimidris/debt: 1 point(s)
  - idris/outofschool: 1 point(s)
  - ihedioha/debt: 1 point(s)
  - inuwa/gratuity: 1 point(s)
  - inuwa/roads: 1 point(s)
  - ishaku/budget: 1 point(s)
  - jonathan/debt: 1 point(s)
  - lawal/outofschool: 1 point(s)
  - makinde/outofschool: 1 point(s)
  - makinde/security: 1 point(s)
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
  - obasanjo/poverty: 1 point(s)
  - obasanjomilitary/fuel: 1 point(s)
  - ododo/debt-cleared: 1 point(s)
  - ododo/mining-licences: 1 point(s)
  - ododo/igr: 1 point(s)
  - okpebholo/igr: 1 point(s)
  - otti/education-share: 1 point(s)
  - otti/health-share: 1 point(s)
  - otti/electric-buses: 1 point(s)
  - otu/health: 1 point(s)
  - otu/security: 1 point(s)
  - radda/education: 1 point(s)
  - radda/gratuity: 1 point(s)
  - radda/outofschool: 1 point(s)
  - sanwoolu/revenue-share: 1 point(s)
  - sanwoolu/rice-capacity: 1 point(s)
  - shagari/fuel: 1 point(s)
  - shagari/poverty: 1 point(s)
  - shonekan/fuel: 1 point(s)
  - sylva/debt: 1 point(s)
  - ubasani/external-debt: 1 point(s)
  - ubasani/outofschool: 1 point(s)
  - yakowa/debt: 1 point(s)
  - yaradua/debt: 1 point(s)
  - yaradua/poverty: 1 point(s)
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

As of 2026-09-17: 114 of 211 administrations (54%) have at least one indicator. Registry, structured points, and an upserting seed are in place (server/seed.js, data/seed/indicators.json); the backfill (plan Step 9, Phases A-F) is under way — see the Backlog section below for what's done and what's left per phase. Core-key gaps above are the actual state, not memory of what "should" exist. Re-run this script after each backfill session and update the Backlog section by hand.

<!-- BACKLOG-START: everything from here down is hand-maintained; this script preserves it verbatim on every regeneration. -->

## Backlog

A running log for Plan Step 9 (the multi-session indicator backfill). The
section above is the generated source of truth for *what's* missing; this
one is for *why* and what to do about it — notes that don't survive a
script re-run. Update as items get resolved or new ones surface; delete a
line once it's done rather than checking it off.

### Phase C — current governors (fiscal 4 + social pair)

**Phase C is done for every current governor** (fiscal 4 + under-5
mortality; out-of-school sparse by design — see below), including the
three who were missing seed files until 2026-09-17: Sokoto/aliyu,
Ondo/aiyedatiwa, Osun/adeleke. state-current now reads 21/21 on the
fiscal 4 (Adeleke's termStart 2022 puts him in state-2007-2023; he
still has the fiscal 4 + U5MR). North Central, North East, South East,
North West, South South and South West all have IGR + debt + budget +
capex-share + U5MR.

- **Social pair** — under-5 mortality is done for all 36 current
  governors (2018 NDHS + 2024 NDHS; MICS 2021 on 13). Out-of-school
  remains sparse by design (see below).
- **Budget/capex-share for Kefas (Taraba)** — done 2026-09-17.
- **Aliyu / Aiyedatiwa / Adeleke seed files** — created 2026-09-17
  (Aliyu dumped from existing DB content plus fiscal 4 + U5MR;
  Aiyedatiwa and Adeleke are indicator/budget-only until a full
  profile pass). Aliyu's old ₦m IGR 2020–21 (Tambuwal years) and
  debt-to-revenue points mistagged as `debt` were overwritten and the
  orphan points deleted by hand. Aiyedatiwa series starts 2024
  (Akeredolu died 27 Dec 2023 — 2023 IGR added to Akeredolu). Adeleke
  2022 IGR is the transition year (sworn 27 Nov 2022).
- **Off-cycle election trap** — Kogi, Bayelsa, and Imo hold governorship
  elections off the standard cycle, so their governors don't hand over on
  the usual 29 May date other states use. This caused a real attribution
  bug in Kogi (caught and fixed — see below). **Imo is checked**: Uzodinma
  was sworn in 15 Jan 2020 (Supreme Court judgment 14 Jan 2020 sacking
  Ihedioha), so his IGR/debt series starts 2020 and 2019 stays with
  Ihedioha/Okorocha. **Bayelsa is checked**: Diri was sworn in 14 Feb
  2020 (Supreme Court judgment 13 Feb 2020 sacking Lyon), so his series
  starts 2020 and 2019 (₦16.34bn NBS) stays with Dickson. All three
  off-cycle states resolved.

### Phase C — social pair + leftovers (2026-09-17)

**Under-5 mortality: all 33 seedable current governors have it.**
2018 NDHS (DHS GF46) as a baseline on every file; 2024 NDHS (FR395
Table 8.3, 10-year rates, Map 8.1: Jigawa 161 / Kwara 14) on every
file; 2021 MICS where an HTML-citable state figure exists (13:
Kebbi, Jigawa, Katsina, Bauchi, Borno, Zamfara, Gombe, Plateau,
Bayelsa, Rivers, Ogun, Nasarawa via BudgIT, Lagos via a published
MICS-microdata analysis). Points sit at survey years, not tenure
years. Borno 2021 covered 7 LGAs only (noted). Seeded 2026-09-17.

**Under-5 mortality leftover:** the full MICS 2021 37-state table
still isn't HTML-citable (UNICEF PDF 403). The 24 missing MICS-2021
states could come from MICS microdata (microdata.worldbank.org
catalog 5959) in a later pass — not blocking; every file already has
two NDHS rounds.

**Out-of-school: sparse, as expected.** Published thousand-counts
filed for Kano 1,890k, Katsina 1,400k, Kebbi 1,060k (NMPI/ICIR
~2024/25); Bauchi 1,500k/500k (unit drift fixed million→thousand);
Oyo 674k (2022/23 Annual School Census via Vanguard — replaced the
wrong-unit 20.9% point); Zamfara 884k (UBEC 2022 via Daily Trust);
Kaduna 769k (Oct 2024, Kaduna SBS via Nairametrics — government
claim, flagged). Everything else stays missing: UBEC 2022 NPA PDF
has no state OOSC table, and MICS-2021/UNICEF figures are rates (%),
not the registry's thousand unit — deliberately not converted.

**Kefas budget/capex done.** 2024 presented ₦311.39bn (cap
₦199.9bn/rec ₦111.6bn), 2025 supplementary-revised signed ₦574.8bn
(split unknown), 2026 proposed ₦650.50bn (cap ₦457.74bn/rec
₦192.89bn) — budget table built from scratch (was empty) plus budget
indicator and 2024/2026 capex-share. Presented-vs-signed status noted
per point; the 2025 Tribune source is homepage-indexed (full article
URL not exposed).

**Mutfwang attribution fixed.** His IGR 2021-2022 points duplicated
Lalong's (same bug class as the NC fix) — removed; 2023 transition
year stays. Lalong already carries 2021-2022, untouched.

**Audit-script fix.** `era()` coerced full-date termStarts
("2007-05-29") to NaN, which fell through into state-current —
alaoakala/sambo/sylva/yakowa inflated that bucket to 23. Now parses
the leading year; state-current reads 19 admins at 19/19 fiscal-4
complete. The former Sokoto/Ondo/Osun seed-file gaps were filled
  2026-09-17 (see above).

### Phase C bug found and fixed (2026-09-17)

Benue (Alia), Kogi (Ododo), and Niger (Bago) each got an extra IGR point
(and, for Ododo, a debt point) for a year their predecessor was still in
office, because the same NBS 2022-2024 data block was applied to all six
North Central states without checking each governor's actual inauguration
date. Fixed and moved to the correct predecessor. Worth a spot check on any
future zone's current-governor data added the same way.

### Phase C — smaller fixes made in passing (North East, 2026-09-17)

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

### Phase C — South East done, fiscal 4 (2026-09-17)

Otti, Soludo, Nwifuru, Mbah, Uzodinma all have IGR + debt (NBS/DMO
published) + budget + capex-share (derived from each file's own budget
table). Figures seeded to the DB; four orphan points the seed upsert
can't remove (it matches by label/year, never deletes) were deleted by
hand: nwifuru/igr 2025, mbah/igr 2022 + 2025, uzodinma/igr 2025.

- **Nwifuru (Ebonyi)** IGR was wrong two ways: 2023 was ₦18.5bn vs NBS
  ₦30.84bn, and 2024 was an MTEF projection (₦25.6bn) vs the published
  NBS actual (₦13.18bn). The 2025 figure was annualised from a monthly
  peak — removed; no full-year 2025 NBS release exists for any SE state
  yet (2024 edition only came out Oct 2025).
- **Uzodinma (Imo)** debt 2024 was ₦562.18bn — wrong for the domestic
  series (published DMO: ₦126.14bn). Replaced with the full DMO year-end
  series 2020-2025; the governor's "₦287bn → below ₦90bn" covers broader
  liabilities, noted as such. IGR backfilled 2020-2024 from NBS.
- **Soludo (Anambra)** IGR was monthly averages in a ₦bn/month unit
  (audit drift) — replaced with NBS annuals 2022-2024; debt was a single
  inherited ₦109bn point, replaced with the DMO series 2022-2025.
- **Mbah (Enugu)** 2023 IGR was a state-account claim (₦37.4bn vs NBS
  ₦33.86bn); the giant 2024 jump (₦180.5bn) *is* NBS-published. 2022
  moved out (Ugwuanyi year). DMO's Dec-2023 table carries Enugu only as
  at Sep 2023 (footnote) — labelled "Sep 2023", not Dec.
- **Otti (Abia)** was missing IGR + debt entirely (budget/capex already
  present); 2023 transition year to Otti, pre-2023 to Ikpeazu.
- Budget-indicator `higherIsBetter: true` fixed to `null` on Otti and
  Nwifuru (registry says null); Soludo/Mbah/Uzodinma budget + capex
  derived fresh from their budget tables with per-point sources.

### Phase C — North West / South South / South West done, fiscal 4 (2026-09-17)

Namadi, Uba Sani, Yusuf, Radda, Idris, Lawal, Eno, Diri, Otu,
Oborevwori, Okpebholo, Fubara, Oyebanji, Sanwo-Olu, Abiodun, Makinde
all have IGR + debt (NBS/DMO published) + budget + capex-share
(budget/capex derived from each file's own budget table). Figures
seeded to the DB; orphan points the seed upsert can't remove (it
matches by label/year, never deletes) were deleted by hand: radda/igr
2021, radda/debt Q1 2024, idris/debt "Dec 2024 Domestic" + "Dec 2024
External", lawal/igr 2026, ubasani/igr 2025, eno/debt May 2023 + Nov
2025, otu/igr 2025 + 2026, okpebholo/igr H1 2024 + H1 2025,
okpebholo/debt Q4 2024 + Q1 2025, fubara/igr 2022, oyebanji/debt 2020
+ 2024, sanwoolu/igr 2025*.

- **Re-keys** (same pattern as Zulum's external-debt): Uba Sani's $m
  external handover point and Eno's commercial-bank-debt one-off shared
  the `debt` id the domestic series needed — moved to `external-debt`
  and `debt-cleared` respectively, no registryKey. Idris's mistagged
  "Dec 2024 External" (₦bn-converted external stock in the domestic
  series) was split into a proper $m `external-debt` series
  (2023 $40.30m, 2024 $51.35m, 2025 $76.44m).
- **Big corrections**: Namadi IGR/debt were BudgIT audited-statement
  figures, not NBS/DMO (IGR 11.68→27.54, 19.01→59.46); Lawal IGR was a
  monthly framing (₦0.08bn baseline, 2026 run-rate) replaced with NBS
  annuals; Makinde debt 2025 (₦426bn, baseline + disputed ₦300bn loan)
  and 2019 (₦126bn) replaced with the DMO series; Delta debt was state
  total-liability claims (₦465.3bn/₦303.4bn) replaced with DMO
  domestic; Cross River debt was DSA totals (₦284bn/₦382bn) replaced
  with DMO domestic; Oyebanji debt 2024 (₦228.49bn total) replaced with
  the DMO series; Sanwo-Olu 2023 IGR (₦895bn) corrected to NBS
  (₦815.86bn).
- **Stale-date DMO footnotes** (labelled, not smoothed): Kano's Dec-2023
  release carries the state as at Dec 2022; Rivers' Dec-2023 release
  carries it as at Mar 2023 (Wike-era, kept as context in the note,
  not a Fubara point).
- **Single-sourced or provisional points, kept with explicit notes**:
  Zamfara debt 2024/2025, Delta debt 2024/2025, Edo debt 2024 (rounded),
  Katsina debt 2025, Lagos debt 2025, Oyo debt 2025, Rivers debt 2025.
  Bayelsa debt skips 2021 (single-sourced, possible press typo) and the
  unextracted 2024/2025 year-end cells — latest exactly-labelled point
  is Jun 2025. Ekiti debt has no true Dec-2024 point (state EFU-FSP-BPS
  prints an inconsistent ₦2.72bn) — Sep 2024 shown instead.
- **Budget-table drive-by fixes**: Kebbi was missing its 2024 budget
  row entirely — added (₦250.13bn signed, split unknown, nulls not
  estimates). Ekiti's 2025 budget-table source URL pointed at an
  unrelated Sanwo-Olu/EFCC article — corrected to Channels.
  Sanwo-Olu's budget indicator was in ₦tn with hib true (audit drift)
  — converted to the registry's ₦bn with hib null. Radda/Otu budget
  hib fixed to null.
- **Thin but honest**: Okpebholo IGR is a single 2024 NBS point (flags
  "fewer than 2 points" until the 2025 NBS release); Edo 2024 budget is
  the supplementary he signed days after inauguration, so all three
  budget years are his.

### Phase D — former governors 2007-2023

**North Central debt is done (2026-09-17).** Suswam, Ortom, Jang,
Lalong, Babangida Aliyu, Sani Bello, Ibrahim Idris, Yahaya Bello,
Al-Makura and Ahmed all have DMO domestic year-end debt; Doma and
Saraki got honest `not-published` debt markers (DMO's online series
starts Dec 2011, in their successors' tenures). Seeded to DB; Lalong's
orphaned 2023 point deleted by hand.

- **Lalong's old points were both political claims**: 2015=₦222bn was
  the inherited-total claim (DMO domestic: ₦96.2bn) and 2023=₦307bn
  was Mutfwang's total-burden claim for his own era — Lalong's DMO
  exit is Dec 2022 (₦149.0bn). Same treatment as the NC/NE/SE
  total-vs-domestic corrections.
- **2019 derived points** (Ortom 98.7, Lalong 134.0, Bello 132.5,
  Al-Makura 66.1, Ahmed 63.7) come from validated 2016-2020
  net-borrowing arithmetic, not published year-end cells — marked
  provisional on each entry. Sani Bello 2019 has no citable year-end
  at all (gap, not interpolated). Bello 2023 (121.81) is DMO-via-govt
  and anomalous against the NBS Q1-2024 print — flagged.
- **Kwara 2014**: the published DMO table says ₦22.15bn; one press
  retrospective prints ₦15.9bn — DMO governs, discrepancy noted on
  the entry.

**North East debt is done (2026-09-17).** Nyako, Suntai, Yuguda,
Gaidam, Dankwambo, Shettima, Abubakar, Bindow and Ishaku all have DMO
domestic year-end debt, seeded to DB (no orphans — all new blocks).
Nyako's series ends 2013 (impeached July 2014, 2014 to successor).
2019 cells for the five 2019 handovers (to Fintiri/Bala/Zulum/Inuwa/
Buni) plus Ishaku 2019-2022 come from press-tabulated DMO releases;
Shettima 2019 and Ishaku 2018/2022 carry Sep-vintage footnotes in the
DMO releases — flagged as proxies on each entry. The cross-check
caught bad prompt targets (not bad extraction): the parsed 2011-2018
DMO tables verify cleanly against press (Adamawa 2015 ₦47.20bn not
₦79.13bn, Yobe 2016 ₦13.58bn, Adamawa 2018 ₦89.66bn).

**North West debt is done (2026-09-17).** Dakingari, Lamido, Wamakko,
Badaru, Bagudu, El-Rufai, Ganduje, Masari, Tambuwal, Matawalle and
Yakowa (single 2011 — died in office Dec 2012) all have DMO domestic
year-end debt; Shinkafi and Sambo got honest `not-published` debt
markers (nothing citable pre-Dec-2011). Seeded to DB; El-Rufai's
orphaned 2014/2023 debt points and his 2023 IGR point (transition
year belongs to Uba Sani, who already carries a better-sourced
₦62.49bn) deleted by hand. El-Rufai's 2015 IGR (₦11.5bn) still wants
an NBS check in a later pass.

- **El-Rufai's old debt points**: 2014 was an explicit pre-tenure
  baseline (belongs to the Yero era) and 2023 belongs to Uba Sani;
  his farewell-claim ₦64.54bn domestic is set aside for the published
  DMO ₦78.90bn (2019).
- **Bagudu 2015→2016 drop** (₦63.79bn→₦20.65bn) confirmed by the
  Kebbi DSA but unexplained in press — verified, flagged, likely a
  settlement/reconciliation.
- **Masari 2019/2020/2022** carry off-quarter vintages
  (Jun-2019/Sep-2020/Sep-2022) — proxies, flagged.
- **Tambuwal 2023** belongs to Aliyu — now filed on `aliyu.json`.

**South South debt is done (2026-09-17).** Akpabio, Amaechi, Imoke,
Uduaghan, Sylva (single 2011 — left Feb 2012), Oshiomhole (2011-2015;
2016 transition to Obaseki), Dickson (2012-2019), Ayade, Emmanuel,
Okowa, Wike and Obaseki (2016-2023) all have DMO domestic year-end
debt, seeded to DB (no orphans — all new blocks). Rivers is
chronically stale in DMO releases (2019/2020 carry Dec-2018 forward,
2021 is Sep-2021, 2022 carries Sep-2021 forward) — all flagged as
proxies. Okowa 2021 (₦154.61bn, same figure reported for Bayelsa)
flagged as a possible transcription tie.

**South West debt is done (2026-09-17) — Phase D debt complete.**
Ajimobi, Amosun, Ambode and Fayemi (2018-2021; 2022 transition to
Oyebanji) have DMO domestic year-end debt; Oni and Alao-Akala got
honest `not-published` debt markers (nothing citable pre-Dec-2011).
Seeded to DB (no orphans — all new blocks). Ajimobi/Amosun/Ambode
series end 2018 because their 2019 transition-year cells already sit
on Makinde/Abiodun/Sanwo-Olu. Every 2007-2023 administration now
carries either published debt or a checked not-published marker
(debt missing-entirely: 0). Only 6 admins in the
2007-2023 era still lack debt — all South West (Oni, Alao-Akala,
Ajimobi, Amosun, Ambode, Fayemi).

**South East debt is done (2026-09-17).** Elechi, Orji, Obiano,
Ikpeazu, Ugwuanyi, Umahi and Ihedioha (single 2019 — took office May
2019, sacked Jan 2020) all have DMO domestic year-end debt; Ohakim
got an honest `not-published` debt marker (Dec 2011 falls in
Okorocha's tenure). Seeded to DB (no orphans — all new blocks).
Ugwuanyi 2021 is filed as press-tabulated ₦69.17bn with the later
₦74.86bn DMO revision flagged; Umahi's 2022 jump is DSA-corroborated
(bank + bridging + airport loans); Ihedioha 2019 is DSA-corroborated.

**DMO archive map (the Phase D debt unlock — verified 2026-09-17).**
DMO's server rejects non-browser user-agents (HTTP 406 — send a
Chrome UA) and the real file URLs are root-relative
(`dmo.gov.ng/<id>-<slug>/file`), not under
`/debt-profile/sub-national-debts/`. Dec year-end domestic docs:
2011: doc 1062; 2012: 1061; 2013: 1082 (revised); 2014: 1059; 2015:
1060; 2016: 2033; 2017: 2476; 2018: 2757; 2019: 3122; 2020: 3493;
2021: 3854; 2022: 4231. Full quarterly archive back to 2011 is on the
index (`?direction=asc&limit=100&sort=title`). Extract with
`pdftotext -layout`: 2013-2018 are raw-naira ALL-CAPS tables;
2011-2012 are Title Case IN MILLIONS (divide by 1e3, not 1e9);
2011-2012 spell Nasarawa "Nassarawa"; 2018 has `*` footnotes (Akwa
Ibom/Borno/Kaduna/Kano/Lagos/Nasarawa/Ondo/Rivers as at earlier
quarters, Katsina as at Dec 2017); 2017 note: Akwa Ibom, Katsina,
Lagos as at Sep 2017, Borno as at Jun 2017. Earliest online domestic
file is Dec 2011 — pre-2011 needs DMO Annual Reports, not worth it
per admin.

**North Central and North East (Taraba only) IGR status (unchanged).**

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

### Phase E — governors 1999-2007 (~40 admins)

Not started. Plan expects this to be "mostly not-published rows" since
citable pre-2011 subnational data is thin; the main task is a systematic
NBS/DMO/CBN Statistical Bulletin check per state, then honest
`not-published` markers where nothing turns up, rather than research per
admin from scratch.

### Phase F — pre-1999 states (60 admins)

Not started. Plan expects ~240 `not-published` rows after checking the CBN
Statistical Bulletin — a systematic sweep, not deep research per admin.

### Smaller open items

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
