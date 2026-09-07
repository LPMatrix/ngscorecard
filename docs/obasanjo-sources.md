# Sourcing guide — Obasanjo administration (29 May 1999 – 29 May 2007)

A working reference for sourcing entries in [`data/seed/obasanjo.json`](../data/seed/obasanjo.json)
and for setting `source_tier` on them. Not a bibliography — a map of where the
usable records for this term actually live.

## How to use this

- Every rated entry needs a source that **resolves** and sits at `reporting`
  tier or better (the admin gate in `server/adminRoutes.js` enforces a non-blank
  `source` + `sourceLabel` on `promises` / `inherited` / `fraud` / `orders` /
  `bills`). See the four tiers in [guide §6](../public/guide.html).
- Prefer a **contemporaneous** source (published 1999–2007) for what was
  promised and what happened at the time; use retrospective pieces only for
  narrative, and check they themselves cite something contemporaneous.
- This term predates the web archives of most Nigerian outlets. **The Wayback
  Machine is not optional here** — see "Citing archived pages" at the end.
- An agency's own *"About us" / "History"* page is `weak` tier, not `primary`.
  It confirms an institution exists; it is not a record of the event that
  created it. Cite the Act, the gazette, or contemporaneous reporting for that.

## Tier reminder, applied to this era

| Tier | For 1999–2007 this means |
|---|---|
| `official` (primary) | Gazette, Act text, court judgment, CBN/NBS/DMO/BPE data series, National Assembly Order Paper/Hansard, INEC results, ICJ record |
| `reporting` | Contemporaneous ThisDay / Guardian (NG) / Vanguard / Punch / Daily Trust / Tell / TheNews; BBC / Reuters / AP / AFP / IRIN with live archives |
| `analysis` | IMF Article IV & PRSP reports, World Bank, HRW, ICG, Afrobarometer, CGD, named academic work |
| `weak` | Agency "about" pages, undated explainers, aggregator posts, anything that won't resolve |

---

## 1. Primary / official records

**Economic & fiscal data**
- **CBN** — `cbn.gov.ng`. *Statistical Bulletin* (annual; cite edition + table),
  *Annual Report & Statement of Accounts* 1999–2007, and the 2004 ₦25bn
  bank-recapitalisation circular. Exchange-rate and monetary series under
  `/rates/` and `/documents/`.
- **National Bureau of Statistics** — `nigerianstat.gov.ng/elibrary`
  (verified reachable). GDP, inflation, unemployment, poverty (the 2004 NLSS).
- **Debt Management Office** — `dmo.gov.ng`. External-debt stock series and the
  DMO's own account of the 2005 Paris Club exit. (Site bot-blocks `curl`; opens
  fine in a browser.)
- **Bureau of Public Enterprises** — `bpe.gov.ng`. Privatisation transaction
  records (NITEL/M-Tel, refineries, NICON, Ajaokuta, hotels, vehicle assembly).
  Server was flaky in testing — fall back to Wayback.
- **Budget Office** — `budgetoffice.gov.ng`. Approved budgets 2000, 2002, 2004,
  2006 and the *Fiscal Responsibility Act 2007*. **Site did not respond in
  testing (conn. timeout)** — the four budget URLs currently in the seed need
  re-checking; use Wayback snapshots if it stays down.
- **NEITI** — `neiti.gov.ng`. The first oil & gas audit (1999–2004 cycle,
  published 2006) is the primary artefact, not the "about" page.

**Legislation (clean statute texts)**
- **PLAC — Policy and Legal Advocacy Centre**, `placng.org` (verified, `/lawsofnigeria`).
  Has: ICPC Act 2000, EFCC (Establishment) Act 2004, Pension Reform Act 2004,
  Universal Basic Education Act 2004, NEITI Act 2007, Investments and Securities
  Act 2007, Fiscal Responsibility Act 2007, NIMC Act 2007.
- **National Assembly** — `nass.gov.ng` for Order Papers, Votes & Proceedings,
  and committee reports (needed for the NIPP probe and the third-term vote).

**Courts**
- **ICJ** — *Cameroon v. Nigeria (Bakassi)*, `icj-cij.org/case/94` (verified).
  Judgment 10 Oct 2002; Greentree Agreement 12 Jun 2006.
- **Nigerian Supreme Court / Court of Appeal** — *AG Lagos State v. AG Federation*
  (2004, LG-allocation withholding); *Buhari v. Obasanjo* (2003 presidential
  petition); *Atiku v. INEC* (2007, "Action Congress" ballot case). Use
  LawPavilion / NGLR / Nigeria-LII citations, or contemporaneous reporting of
  the ruling.
- Election Petition Tribunal records for 2003/2007 governorship upsets
  (Ngige/Obi in Anambra resolved later, in 2006).

**Elections**
- **INEC** — `inecnigeria.org` for 2003 and 2007 official results.
- **EU Election Observation Mission** final reports, 2003 and 2007. The old
  `eods.eu` library link **is dead (404)**; the EU moved this to
  `election-observation.europa.eu` — locate the 2007 Nigeria final report there
  or via Wayback.
- **Commonwealth Observer Group**, **IRI/NDI**, and the domestic **Transition
  Monitoring Group (TMG)** reports for 2003/2007.

**Official speeches & policy documents**
- No official OBJ-era speech archive survives live. The government portals of
  the day — `nigeriafirst.org`, `nopa.net` — exist only in the Wayback Machine
  (snapshots confirmed for 2004–2007). `dawodu.com` archived many full OBJ
  speeches and addresses.
- **NEEDS** — *National Economic Empowerment and Development Strategy*, National
  Planning Commission, 2004. The document itself is the primary source; the
  IMF assessment (below) is the check on it.

---

## 2. Independent reporting

**Nigerian, contemporaneous (via Wayback):** ThisDay, The Guardian (Nigeria),
Vanguard, Punch, Daily Trust, plus the weeklies Tell, TheNews / Newswatch.
These carried the day-to-day of the GSM auction, the bank consolidation
deadline, the Ribadu-era EFCC arrests, the Ngige abduction, the third-term
debate, and the Odi and Zaki-Biam operations.

**Nigerian, retrospective:** Premium Times, TheCable, Sahara Reporters (all
post-2010) are fine for narrative and for later court outcomes, but not as the
sole cite for a 1999–2007 event — trace them back to a contemporaneous report.

**International, with durable live archives:** BBC News, Reuters, AP, AFP,
Financial Times, The Economist, and **IRIN / The New Humanitarian**
(`thenewhumanitarian.org`, verified) — IRIN's Niger Delta and Odi/Zaki-Biam
coverage from this period is unusually detailed and still online.

---

## 3. Analysis / civil society

- **IMF** — Nigeria Article IV consultations and the 2005 Policy Support
  Instrument. Key doc: *IMF Country Report No. 05/432* (2005) assessing NEEDS
  as a PRSP. (imf.org bot-blocks `curl` → 403; the report is real — use Wayback
  or an authenticated fetch.) Also CR 03/60.
- **World Bank** — Nigeria country briefs and the privatisation / power-sector
  notes of the period; *Nigeria Economic Report*.
- **Human Rights Watch** — the 1999 Odi report ("Nigeria: Crackdown in the
  Niger Delta"), *The Warri Crisis* (2003), and *Criminal Politics: Violence,
  "Godfathers" and Corruption in Nigeria* (2007). Search `hrw.org` by title —
  older report paths have moved.
- **International Crisis Group** — the "Nigeria" Africa-report series
  2003–2007 (Niger Delta, 2007 elections). `crisisgroup.org` (bot-blocks curl).
- **Center for Global Development** — Todd Moss et al. on the Nigeria debt-relief
  deal; a standard external account of the Paris Club exit.
- **Paris Club** — `clubdeparis.org` (verified): the October 2005 and 2006
  Nigeria communiqués.
- **Transparency International** — CPI historical scores for Nigeria 1999–2007
  (the 2001 "second most corrupt" ranking and the later improvement).
- **Afrobarometer** — Rounds 1–3 (2000, 2003, 2005) for Nigerian public opinion
  on the economy, corruption and democracy under OBJ.
- **Chatham House** and academic work: *Journal of Modern African Studies*,
  *Review of African Political Economy* — several assessments of NEEDS, the
  banking consolidation, and the 2007 transition.

---

## 4. Topic → best sources

| Topic (seed entries) | Primary | Reporting / analysis |
|---|---|---|
| Paris Club debt relief, 2005 | DMO external-debt series; Paris Club communiqué Oct 2005 | CGD (Moss); IMF PSI; contemporaneous ThisDay/FT |
| Bank consolidation (₦25bn), 2004–05 | CBN recapitalisation circular; CBN Annual Report 2005 | Contemporaneous Vanguard/ThisDay; academic reviews |
| Privatisation (NITEL, refineries, etc.) | BPE transaction records | Reuters NITEL coverage; World Bank notes |
| GSM licence auction, 2001 | NCC digital-mobile licence award records | Contemporaneous ThisDay; Pyramid Research |
| Power / NIPP spending | National Assembly (Elumelu) probe report, 2008 | Contemporaneous reporting on the ~$16bn claim; later EFCC filings |
| EFCC / ICPC anti-corruption | ICPC Act 2000, EFCC Act 2004 (PLAC) | HRW 2007; contemporaneous arrest coverage (Balogun, Alamieyeseigha, Wabara/Osuji) |
| 2003 & 2007 elections | INEC results | EU EOM, Commonwealth, IRI/NDI, TMG reports |
| Third-term bid, 2006 | Senate Votes & Proceedings, May 2006 | Guardian (2006-05-16); BBC |
| Odi operation, Nov 1999 | Odi community v. FRN judgment (2013); NHRC | HRW 1999 report; IRIN |
| Bakassi | ICJ case/94; Greentree Agreement 2006 | Contemporaneous coverage |
| NEEDS reform agenda | NEEDS document (NPC, 2004) | IMF CR 05/432 |
| Pension Reform Act 2004 | Act text (PLAC); PenCom annual reports | Contemporaneous coverage |
| Universal Basic Education | UBE Act 2004 (PLAC); UBEC data | — |
| NEITI / oil transparency | First NEITI audit (1999–2004), pub. 2006 | Revenue Watch / NRGI commentary |
| Abacha loot recovery | Basel Institute (ICAR) Nigeria case page; Swiss FDFA statements | BBC; contemporaneous coverage |

---

## 5. Dead-source fix — done 2026-09-06

A link check of every `source` in `obasanjo.json` found **~40 of ~48 distinct
URLs dead or fabricated** — invented `premiumtimesng.com/news/headlines/<slug>`
and `punchng.com/<slug>.html` paths that redirect to a homepage or 404, plus
stale `eods.eu`, agency deep-links (`CONSOLIDATION.PDF`, `about-pencom`,
`thecommission/history`), and old Reuters/BBC IDs.

**Fixed:** 58 rows (all sections) re-pointed to URLs that resolve, in both
`data/seed/obasanjo.json` and Turso (via a targeted `source`/`sourceLabel`
update — `seedByKey` never updates existing rows, so a plain reseed would not
have applied it). The 8 URLs that already resolved (transparency.org, BBC
`world-africa-13949549`, HRW 1999, worldbank, nepad, icpc, efcc, ubec, nimc,
icj, the NBS e-library reads) were left as-is.

**Interim quality:** most replacements are **topical Wikipedia articles** —
each was checked to actually cover the claim, and each is stable and itself
cites primaries, but by [guide §6](../public/guide.html) they are `weak` tier.
A few are better: debt relief → CGD; bank consolidation → *Banking in Nigeria*;
elections → the dedicated election articles; ICJ/HRW kept. **These should be
upgraded to the primaries in §4** before the affected entries are rating-locked,
and `source_tier` set once they are.

Still outstanding (unchanged by this pass):

- **`weak`-tier "about" pages** still stand in for events on some `orders` /
  `bills` (ICPC, EFCC, NIMC, PenCom root, NEITI root, UBEC) — add a
  `reporting`/`official` cite for the Act or action and set `source_tier`.
- **Missing sources:** `appointments` (10) and `governors` (51) have no
  `source` field at all; `budget` (4) now point at *Economy of Nigeria* as a
  placeholder — replace with CBN/Budget Office series when reachable.

---

## 6. Citing archived pages

- Format: `https://web.archive.org/web/<YYYYMMDDhhmmss>/<original-url>`.
- Pick a snapshot **close to the event date**, not the latest one.
- Put the real date and outlet in `sourceLabel`, e.g.
  `"ThisDay, 8 Aug 2001 (via Wayback Machine)"`, so the citation still reads
  correctly if the archive link later breaks.
- For a live original that merely bot-blocks (`imf.org`, `dmo.gov.ng`,
  `crisisgroup.org`, `cgdev.org`), keep the canonical URL — it works in a
  browser. Only substitute Wayback when the original is genuinely gone.
