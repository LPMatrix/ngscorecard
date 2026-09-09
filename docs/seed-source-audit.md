# Seed source audit — link check & repair (Sept 2026)

Every `source` URL in `data/seed/*.json` was checked against the live web and
dead links were repaired, in both the JSON files and Turso (the running app
reads Turso; `seedByKey` never updates existing rows, so each repair was pushed
with a targeted `source` / `sourceLabel` `UPDATE`).

## What was found

Of ~1,470 distinct source URLs across 106 administration files, **~230 did not
resolve** — overwhelmingly *fabricated* citations: plausible-looking
`premiumtimesng.com/news/headlines/<slug>`, `punchng.com/<slug>.html`,
`bbc.com/news/world-africa-<id>` and old `reuters.com/article/...-idUS...`
paths that 404 or redirect to a homepage. The rot was concentrated in the five
presidential files (obasanjo, yaradua, jonathan, buhari, tinubu); the 100+
governor files were mostly sound and failed only in ones and twos.

## What was changed

| Batch | Files | Rows repaired |
|---|---|---|
| obasanjo | 1 | 58 |
| yaradua | 1 | 57 |
| jonathan / buhari / tinubu | 3 | 136 |
| governor files | 34 | 71 |
| **total** | **39** | **~322** |

Replacements are, in order of preference: a stronger primary/analysis source
where one was found (CGD for debt relief, ICJ, HRW, CBN, PLAC, the dedicated
Wikipedia election / event / case articles), then a **topical or biographical
Wikipedia article** verified to actually cover the claim, then
`Economy_of_Nigeria` as a placeholder for budget/indicator rows whose data
sources (`budgetoffice.gov.ng`, defunct NBS deep-links) are gone.

## Interim quality — read before rating-locking

Most replacements are Wikipedia articles. They resolve, they are stable, they
cite primaries, and each was checked to be on-topic — but by
[guide §6](../public/guide.html) they are `weak` tier. Before an affected entry
is rating-locked its source should be upgraded to a primary and its
`source_tier` set. The obasanjo/yaradua primaries are mapped in
[`obasanjo-sources.md`](obasanjo-sources.md).

## Left as-is (live, not dead)

The link check flags these as failures but they are reachable in a browser —
do not "fix" them:

- **`403`** — bot-blocked: `allafrica.com`, `pmnewsnigeria.com`, `thewhistler.ng`,
  `crisisgroup.org`, `transparency.org`, `chathamhouse.org`, `africacheck.org`,
  several state `.gov.ng` sites.
- **`429`** — rate-limited by the scan itself: `icirnigeria.org` (~11 entries),
  `humanglemedia.com`.
- **`0` / connection reset** — `allafrica.com/stories/*` refuses automated
  connections entirely from some networks; the article permalinks are valid.

## `governors[]` list errors — fixed (Sept 2026)

An audit of the `governors[]` reference arrays in the presidential seed files
(the same check first run on `obasanjo.json`) found 13 name/party/note errors,
now fixed in the JSON and Turso:

**`yaradua.json`**
- Ebonyi: "Onyekachi Eze" → **Martin Elechi** (2007–2015, PDP)
- Yobe: "Mamman Ali" (PDP) → **Mamman Bello Ali**, party **ANPP**; died Jan 2009, not Nov
- Zamfara: "Mahmuda Aliyu Shinkafi" → **Mahmud Aliyu Shinkafi**
- Abia: Theodore Orji party PDP → **PPA** (won 2007 on Orji Uzor Kalu's PPA; to PDP ~2010)
- Imo: Ikedi Ohakim party PDP → **PPA** (to PDP 2008)
- Nasarawa: Aliyu Akwe Doma note said "died in office in 2012" — he lost 2011 and died 2018

**`jonathan.json`**
- Ebonyi: "John Nnaji" → **Martin Elechi** (second term, 2011–2015, PDP)

**`buhari.json`**
- Nasarawa: "Usman Lafia" → **Umaru Tanko Al-Makura** (APC; 2011 CPC → 2015 APC)
- Zamfara 2019–2023: Bello Matawalle party APC → **PDP** (won 2019 on PDP after the
  courts voided the APC primaries; defected to APC 29 Jun 2021 — the old note had it backwards)
- Ondo 2015–2017: Olusegun Mimiko party PDP → **LP**
- Kwara 2015–2019: Abdulfatah Ahmed — added note on the Saraki bloc's PDP→APC→PDP moves
- Bayelsa: "Duoye Diri" → **Douye Diri** (spelling)

**`tinubu.json`**
- Bayelsa: "Duoye Diri" → **Douye Diri** (spelling)

`tinubu.json`'s list was otherwise clean. `obasanjo.json`'s were fixed earlier
(see [`obasanjo-governors-buildout.md`](obasanjo-governors-buildout.md)).

## Re-running the check

There is no committed script; the audit was a throwaway. To repeat it: extract
every `.source` from `data/seed/*.json`, `GET` each with a browser User-Agent
following redirects, and treat only `404` / `410` / `401` (and `200` that lands
on a bare domain root) as dead. Push repairs to Turso with an `UPDATE` keyed by
`administration` + the natural key (`title`, or `name`+`ministry`, or `year`,
or indicator `key`) — a plain `npm run db:seed` will **not** apply them.

## Rating correction — "In progress" on concluded administrations (Sept 2026)

The `pending` status renders as **"In progress"**, which the methodology only
permits while "the stated timeline hasn't passed and work is genuinely under
way". A sweep found **27** promises rated `pending` on administrations whose
term had ended — nonsensical for a finished tenure.

All 27 were re-rated to `kept` / `partial` / `broken` against the evidence,
each verified by web search, with the assessment rewritten to cite what was
found:

- **Yar'Adua** — "Complete privatisation of the power sector" → **broken**
  (barely advanced in term; concluded only under Jonathan, Nov 2013).
- **9 → broken:** `audu` (EFCC ₦10.97bn prosecution), `ibori` (UK guilty plea,
  £101.5m confiscated), `fayose` (Poultry Project diversion, impeached),
  `ladoja` (term lost to the Adedibu conflict + impeachment), `haruna`
  (impeachment notice for "inability to perform"), `malawal` (no record; EFCC
  probe at death), `yerima` (no verifiable delivery over two terms),
  `bindow` ×2 ('Train of Change' + Fufore rice plant, both undelivered).
- **17 → partial:** the AD South-West one-termers (`adefarati`, `adesina`,
  `osoba`, `niyiadebayo`, `hashidu` — ran the programme, no scandal, thin
  record, lost 2003); the scandal-free northern eight-year governors (`akume`,
  `makarfi`, `kure`, `bukarabbaibrahim`, `muazu` — at least one concrete
  deliverable each, broad promise only part-evidenced); `bafarawa` (acquitted
  2018, evidence "imaginary"); `kalu` (Aba roads credited by a rival successor;
  conviction nullified on procedure); `ihedioha` (recovery panel + ₦1.2bn
  recovered, cut short by removal); `jonathan` Second Niger Bridge (financing +
  groundbreaking, no substantive construction); `sanibello` (orderly handover;
  successor's allegations never tested); `udenwa` (named Owerri roads; industry
  reactivation undelivered); `olurin` (6-month caretaker mandate met).

Applied to `data/seed/*.json` and pushed to Turso by `UPDATE` keyed on
`administration` + `title` (a plain re-seed does not update existing rows).
Afterwards: **0** `pending` promises remain on any concluded administration;
the 15 that remain are all on sitting administrations.
