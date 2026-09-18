# Key indicators — coverage audit & backlog

Generated 2026-09-18 by `scripts/audit-indicators.mjs`. The script only ever writes this section, down to the `BACKLOG-START` marker; run it with `node --env-file=.env scripts/audit-indicators.mjs --out docs/indicators.md` after any backfill session to refresh it. Everything from the marker onward is hand-maintained and preserved verbatim across regenerations — that's where *why* something is missing and what to do about it lives, since that context doesn't survive a script re-run.

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
| igr | 0 | 49 | 0 |
| debt | 0 | 49 | 0 |
| budget | 0 | 49 | 0 |
| capex-share | 0 | 49 | 0 |

### state-1999-2007 (50 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 0 | 50 | 0 |
| debt | 1 | 49 | 0 |
| budget | 0 | 50 | 0 |
| capex-share | 0 | 50 | 0 |

### state-2007-2023 (75 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 75 | 0 | 0 |
| debt | 43 | 32 | 0 |
| budget | 55 | 20 | 0 |
| capex-share | 44 | 31 | 0 |

### state-current (21 administrations)

| Core indicator | Published | Not published | Missing entirely |
|---|---|---|---|
| igr | 21 | 0 | 0 |
| debt | 21 | 0 | 0 |
| budget | 21 | 0 | 0 |
| capex-share | 21 | 0 | 0 |

## Missing core indicators, by key


## Drift

- Unit mismatch vs registry: 0
- No registryKey (one-off or unmapped): 32
- Missing higherIsBetter: 3
  - bala/security
  - makinde/security
  - otu/security
- Points with no parsed year: 2
  - lalong/igr: "9mo 2021"
  - makinde/security: "12mo to Jan '22"
- Fewer than 2 points (excluding not-published): 126
  - abacha/poverty: 1 point(s)
  - abdulsalami/gdp: 1 point(s)
  - abdulsalami/inflation: 1 point(s)
  - abdulsalami/naira: 1 point(s)
  - abdulsalami/reserves: 1 point(s)
  - abdulsalami/debt: 1 point(s)
  - abdulsalami/unemployment: 1 point(s)
  - abubakar/capex: 1 point(s)
  - ahmed/igr: 1 point(s)
  - ahmed/budget: 1 point(s)
  - ahmed/capex: 1 point(s)
  - aiyedatiwa/igr: 1 point(s)
  - ajimobi/igr: 1 point(s)
  - ajimobi/capex: 1 point(s)
  - akpabio/igr: 1 point(s)
  - akpabio/capex: 1 point(s)
  - akpabio/budget: 1 point(s)
  - alaoakala/igr: 1 point(s)
  - almakura/igr: 1 point(s)
  - amaechi/igr: 1 point(s)
  - amaechi/capex: 1 point(s)
  - amosun/igr: 1 point(s)
  - ayade/budget: 1 point(s)
  - babangidaaliyu/igr: 1 point(s)
  - bago/revenue-share: 1 point(s)
  - bala/security: 1 point(s)
  - bello/budget: 1 point(s)
  - bello/capex: 1 point(s)
  - bindow/igr: 1 point(s)
  - bindow/budget: 1 point(s)
  - buhari/debt: 1 point(s)
  - buharimilitary/gdp: 1 point(s)
  - buharimilitary/inflation: 1 point(s)
  - buharimilitary/naira: 1 point(s)
  - buharimilitary/reserves: 1 point(s)
  - buharimilitary/debt: 1 point(s)
  - dakingari/igr: 1 point(s)
  - dankwambo/igr: 1 point(s)
  - dankwambo/budget: 1 point(s)
  - dankwambo/capex: 1 point(s)
  - diri/debt-service-ratio: 1 point(s)
  - doma/igr: 1 point(s)
  - elechi/igr: 1 point(s)
  - fayemi/budget: 1 point(s)
  - fayemi/capex: 1 point(s)
  - fubara/allocation-dependence: 1 point(s)
  - gaidam/igr: 1 point(s)
  - ganduje/capex: 1 point(s)
  - gowon/fuel: 1 point(s)
  - ibrahimidris/debt: 1 point(s)
  - idris/outofschool: 1 point(s)
  - ihedioha/debt: 1 point(s)
  - ihedioha/capex: 1 point(s)
  - ihedioha/budget: 1 point(s)
  - ikpeazu/igr: 1 point(s)
  - ikpeazu/capex: 1 point(s)
  - imoke/igr: 1 point(s)
  - inuwa/gratuity: 1 point(s)
  - inuwa/roads: 1 point(s)
  - ishaku/budget: 1 point(s)
  - jang/igr: 1 point(s)
  - jonathan/debt: 1 point(s)
  - lamido/igr: 1 point(s)
  - lawal/outofschool: 1 point(s)
  - makinde/outofschool: 1 point(s)
  - makinde/security: 1 point(s)
  - matawalle/igr: 1 point(s)
  - matawalle/budget: 1 point(s)
  - matawalle/capex: 1 point(s)
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
  - ohakim/igr: 1 point(s)
  - okowa/igr: 1 point(s)
  - okpebholo/igr: 1 point(s)
  - oni/igr: 1 point(s)
  - orji/igr: 1 point(s)
  - ortom/capex: 1 point(s)
  - oshiomhole/igr: 1 point(s)
  - oshiomhole/budget: 1 point(s)
  - otti/education-share: 1 point(s)
  - otti/health-share: 1 point(s)
  - otti/electric-buses: 1 point(s)
  - otu/health: 1 point(s)
  - otu/security: 1 point(s)
  - radda/education: 1 point(s)
  - radda/gratuity: 1 point(s)
  - radda/outofschool: 1 point(s)
  - sambo/igr: 1 point(s)
  - sanibello/budget: 1 point(s)
  - sanibello/capex: 1 point(s)
  - sanwoolu/revenue-share: 1 point(s)
  - sanwoolu/rice-capacity: 1 point(s)
  - shagari/fuel: 1 point(s)
  - shagari/poverty: 1 point(s)
  - shettima/igr: 1 point(s)
  - shinkafi/igr: 1 point(s)
  - shonekan/fuel: 1 point(s)
  - suntai/igr: 1 point(s)
  - suswam/igr: 1 point(s)
  - sylva/budget: 1 point(s)
  - ubasani/external-debt: 1 point(s)
  - ubasani/outofschool: 1 point(s)
  - uduaghan/igr: 1 point(s)
  - uduaghan/budget: 1 point(s)
  - uduaghan/capex: 1 point(s)
  - ugwuanyi/budget: 1 point(s)
  - wamakko/igr: 1 point(s)
  - yakowa/igr: 1 point(s)
  - yaradua/debt: 1 point(s)
  - yaradua/poverty: 1 point(s)
  - yuguda/igr: 1 point(s)
  - yuguda/budget: 1 point(s)
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

As of 2026-09-18: 211 of 211 administrations (100%) have at least one indicator. Registry, structured points, and an upserting seed are in place (server/seed.js, data/seed/indicators.json); the backfill (plan Step 9, Phases A-F) is under way — see the Backlog section below for what's done and what's left per phase. Core-key gaps above are the actual state, not memory of what "should" exist. Re-run this script after each backfill session and update the Backlog section by hand.

<!-- BACKLOG-START: everything from here down is hand-maintained; this script preserves it verbatim on every regeneration. -->

## Backlog

A running log for Plan Step 9 (the multi-session indicator backfill). The
section above is the generated source of truth for *what's* missing; this
one is for *why* and what to do about it — notes that don't survive a
script re-run. Update as items get resolved or new ones surface; delete a
line once it's done rather than checking it off.

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

**North Central and North East (Taraba only) IGR status.**

- **Budget/capex batch 2026-09-18**: added budget indicators for
  Ikpeazu (Abia), Emmanuel (Akwa Ibom), Obiano (Anambra), and Abubakar
  (Bauchi), derived only from their existing sourced budget arrays.
  Capital-share points were added where the source disclosed a split;
  unavailable splits remain absent rather than estimated. Seeded to DB.
  A second batch added Okowa (Delta), Umahi (Ebonyi), Obaseki (Edo), and
  Badaru (Jigawa) the same way. Phase D budget coverage is now 24 published
  and capex-share 23. A third batch added Fayemi (Ekiti) and Oyetola
  (Osun), bringing coverage to 26 budget and 25 capex-share indicators.
  Ambode (Lagos) was then added from his 2016, 2018, and 2019 budget
  tables, bringing coverage to 27 budget and 26 capex-share indicators.
  Ayade (Cross River), Ganduje (Kano), Bagudu (Kebbi), and Bello (Kogi)
  were then added from their existing budget arrays; Ayade's source did not
  disclose a usable split. Ortom (Benue) and Ugwuanyi (Enugu) were then
  added from their existing budget arrays; only Ortom's 2016 source had a
  usable split. Matawalle (Zamfara) was then added with a 2022 budget and
  capex split, followed by Lalong (Plateau) for 2020, 2022, and 2023.
  Wike (Rivers) was then added for 2016, 2020, and 2022, with capex shares
  where disclosed. Tambuwal (Sokoto) was then added for 2018, 2019, and
  2022. Ajimobi (Oyo) was then added for 2016 and 2019, with the 2019
  capex split. Gaidam (Yobe) was then added for 2016–2018; its sources
  did not disclose a usable split. A budget-array batch then covered
  Bindow, Shettima, Dankwambo, El-Rufai, Masari, Ahmed, Sani Bello,
  Amosun, Akeredolu, Amaechi, Uduaghan, and Sylva. Coverage is now 51
  budget and 42 capex-share.
- **Capex gap pass 2026-09-18**: every remaining Phase D capex gap now has
  either a derived share from an available budget split or an explicit
  `not-published` marker where no split was disclosed. Phase D capex is now
  42 published, 33 not-published, and 0 missing.

- **New 2026-09-18**: added historical NBS IGR points for Nyako
  (2010–2013), Ohakim, Doma, Shinkafi, Alao-Akala, Sylva, Sambo, and
  Yakowa using the 2010–2014 table in the NBS 2014 report. Transition
  years were excluded where attribution was ambiguous. Phase D
  state-2007-2023 IGR coverage is now 74 published / 1 missing; the
  remaining gap is Oni (Ekiti, 2007–2010), for whom the available NBS
  annual table does not provide a clean in-term point.

- **New 2026-09-18**: added NBS 2014 full-year IGR points for 15
  former governors still in office during that year: Dakingari,
  Wamakko, Suntai, Amaechi, Oshiomhole, Akpabio, Lamido, Suswam,
  Imoke, Orji, Babangida Aliyu, Yuguda, Uduaghan, Jang, and Elechi.
  Transition years remain with successors. Seeded to DB.

- **New 2026-09-18**: added NBS 2018 full-year IGR points for Bindow
  (Adamawa ₦6.205bn), Shettima (Borno ₦6.524bn), Dankwambo (Gombe
  ₦7.344bn), Ahmed (Kwara ₦23.047bn), Al-Makura (Nasarawa ₦7.567bn),
  Amosun (Ogun ₦84.554bn), Ajimobi (Oyo ₦24.635bn), and Gaidam (Yobe
  ₦4.382bn). These are within each governor's term; 2019 belongs to
  their successors. Seeded to DB. Phase D state-2007-2023 IGR coverage
  is now 51 published / 24 missing.

- **New 2026-09-18**: Ikpeazu (Abia), Okowa (Delta), and Matawalle
  (Zamfara) each gained a sourced 2022 NBS IGR point (₦20.11bn,
  ₦85.90bn, and ₦19.44bn respectively). These are the only currently
  missing former-governor files whose terms include 2022; the 2023
  transition year belongs to Otti, Oborevwori, and Lawal.

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
  - **Debt gap pass 2026-09-18**: all 31 remaining former-governor debt
    gaps now have explicit DMO-backed `not-published` markers. No values
    were inferred where the online DMO series did not provide a clean,
    attributable point. Phase D debt coverage is now 43 published, 32
    not-published, and 0 missing.

**Budget gap closed 2026-09-18.** All 24 admins missing a `budget`
indicator entirely now have one. Four got real sourced figures: Ihedioha
(Imo, ₦197.6bn 2020, full capital/recurrent split — also upgraded his
`capex-share` from not-published to a real 53.74% point) and Akpabio
(Akwa Ibom, ₦407bn 2012, full split — same capex-share upgrade to
81.30%) both had clean signed totals with a disclosed split; Oshiomhole
(Edo, ₦159.213bn 2014) and Yuguda (Bauchi, ₦132.5bn 2012) had only
*presented*, not confirmed-signed, figures — filed with that caveat, no
capex-share derived since no split was found. The other 20 (Suswam,
Imoke, Lamido, Wamakko, Almakura, Dickson, Babangida Aliyu, Dakingari,
Doma, Elechi, Jang, Nyako, Ohakim, Oni, Orji, Sambo, Shinkafi, Suntai,
Alao-Akala, Yakowa) got honest `not-published` markers — a real check
was made per admin, nothing citable turned up. `budget` core-key
coverage is now 55 published, 20 not-published, 0 missing anywhere in
the matrix.

**Last "missing entirely" cell closed 2026-09-18: Oni's IGR.** Ekiti's
Oni (2007–2010) got a real 2010 NBS figure (₦1.554bn) — the only
missing igr cell in the whole coverage matrix. While sourcing it, found
that Ekiti has **no tracked administration for 2010–2018 at all**:
presidents.json jumps from Oni straight to Fayemi's *second* term
(2018–2022), skipping Fayemi's first term (2010–2014) and Fayose's
second term (2014–2018) entirely — an unrelated structural gap, not an
indicators problem. Flagged as a separate task (`task_fca28b1c`) rather
than fixed here. Every core indicator for every era is now either
published or honestly not-published — 0 missing entirely, full stop.

### Phase E — governors 1999-2007 (~40 admins)

Completed 2026-09-18. The final batch covers Saraki, Ibrahim Idris, Egwu,
Aliero, Audu, Kure, Kachalla, Hashidu, Malawal, and Olurin. All 50
state-1999-2007 administrations now have explicit status markers for the
four state core indicators. These markers state the limitation and keep the
missing-versus-not-published distinction honest; they are not estimates.
