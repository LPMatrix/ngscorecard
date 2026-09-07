# Obasanjo-era governors — scorecard build-out

Adding tracked administrations for the 1999–2007 state governors, to extend
coverage below the federal level for the Obasanjo years. Each is a
`presidents.json` entry with `level: "state"` plus a `data/seed/<key>.json`
scorecard, seeded to Turso with `node server/seed.js <key>`.

**Sourcing rule:** every entry cites a URL verified to resolve — mostly
Wikipedia biographies and state / event articles. Depth follows the record:
well-documented governors (corruption cases, court rulings, signature policies)
get 8–15 entries; thinly-documented 1999–2003 governors get 2–5. `budget` and
`indicators` are left empty — no state fiscal series for 1999–2007 is citable
at reporting tier.

## Done — 41 of 41 (complete)

| Key | State | Governor | Term |
|---|---|---|---|
| `tinubulagos` | Lagos | Bola Tinubu (AD) | 1999–2007 |
| `ibori` | Delta | James Ibori (PDP) | 1999–2007 |
| `odili` | Rivers | Peter Odili (PDP) | 1999–2007 |
| `alamieyeseigha` | Bayelsa | Diepreye Alamieyeseigha (PDP) | 1999–2005 |
| `jonathanbayelsa` | Bayelsa | Goodluck Jonathan (PDP) | 2005–2007 |
| `dariye` | Plateau | Joshua Dariye (PDP) | 1999–2007 |
| `nyame` | Taraba | Jolly Nyame (PDP) | 1999–2007 |
| `kalu` | Abia | Orji Uzor Kalu (PDP) | 1999–2007 |
| `turaki` | Jigawa | Ibrahim Saminu Turaki (ANPP) | 1999–2007 |
| `ngige` | Anambra | Chris Ngige (PDP) | 2003–2006 |
| `mbadinuju` | Anambra | Chinwoke Mbadinuju (PDP) | 1999–2003 |
| `kwankwaso` | Kano | Rabiu Kwankwaso (PDP) | 1999–2003 |
| `yaraduakatsina` | Katsina | Umaru Musa Yar'Adua (PDP) | 1999–2007 |
| `makarfi` | Kaduna | Ahmed Makarfi (PDP) | 1999–2007 |
| `duke` | Cross River | Donald Duke (PDP) | 1999–2007 |
| `attah` | Akwa Ibom | Victor Attah (PDP) | 1999–2007 |
| `igbinedion` | Edo | Lucky Igbinedion (PDP) | 1999–2007 |
| `akume` | Benue | George Akume (PDP) | 1999–2007 |
| `bafarawa` | Sokoto | Attahiru Bafarawa (ANPP) | 1999–2007 |
| `yerima` | Zamfara | Ahmad Sani Yerima (ANPP) | 1999–2007 |
| `bukarabbaibrahim` | Yobe | Bukar Abba Ibrahim (ANPP) | 1999–2007 |
| `abdullahiadamu` | Nasarawa | Abdullahi Adamu (PDP) | 1999–2007 |
| `haruna` | Adamawa | Boni Haruna (PDP) | 1999–2007 |
| `fayose` | Ekiti | Ayodele Fayose (PDP) | 2003–2006 |
| `ladoja` | Oyo | Rashidi Ladoja (PDP) | 2003–2007 |
| `nnamani` | Enugu | Chimaroke Nnamani (PDP) | 1999–2007 |
| `udenwa` | Imo | Achike Udenwa (PDP) | 1999–2007 |
| `muazu` | Bauchi | Adamu Mu'azu (PDP) | 1999–2007 |
| `akande` | Osun | Bisi Akande (AD) | 1999–2003 |
| `osoba` | Ogun | Olusegun Osoba (AD) | 1999–2003 |
| `niyiadebayo` | Ekiti | Niyi Adebayo (AD) | 1999–2003 |
| `adefarati` | Ondo | Adebayo Adefarati (AD) | 1999–2003 |
| `adesina` | Oyo | Lam Adesina (AD) | 1999–2003 |
| `egwu` | Ebonyi | Sam Egwu (PDP) | 1999–2007 |
| `aliero` | Kebbi | Adamu Aliero (ANPP) | 1999–2007 |
| `audu` | Kogi | Abubakar Audu (ANPP) | 1999–2003 |
| `kure` | Niger | Abdulkadir Kure (PDP) | 1999–2007 |
| `kachalla` | Borno | Mala Kachalla (ANPP) | 1999–2003 |
| `hashidu` | Gombe | Abubakar Habu Hashidu (ANPP) | 1999–2003 |
| `lafiagi` | Kwara | Shaaba Lafiagi (PDP) | 1999–2003 |
| `olurin` | Ekiti | Tunji Olurin — sole administrator | 2006–2007 |

## Complete

All 41 files built and seeded across 8 batches. State-level tracked
administrations: **105 → 146**. 214 sourced entries across the 41 new files;
every `source` URL verified to resolve.

## Deepening pass (partial)

First pass over the thinnest files, adding concrete sourced detail:

- **adesina, osoba, adefarati, niyiadebayo, akande** — 1999 vote results
  (share, totals, opponent) added from the per-state `1999 … gubernatorial
  election` Wikipedia articles, which now source the "served the term" entry.
- **akande** — new `inherited` entry: the Ife–Modakeke communal war, whose last
  major phase ended in 2000 during his term (source: *Ife–Modakeke conflict*).
- **egwu** — Ebonyi State University (founded 1999) added as an `order` and
  worked into the education promise (source: *Ebonyi State University*).
- **kure** — IBB University, Lapai (2005/06 session) added to the development
  promise (source: *IBB University*).

Still thin and hard to deepen at reporting tier: `jonathanbayelsa` and `olurin`
(inherently short tenures), and the lightly-documented 1999–2003 northern
governors (`muazu`, `kachalla`, `bukarabbaibrahim`).
State budget / indicator series for 1999–2007 remain unavailable at
reporting tier for every state.

## Wayback Machine dig

Digging archived Nigerian news (`web.archive.org`) for the remaining thin files
yielded modestly:

- **Data-error fix — Kwara.** The archived Nation retrospective *"1999 governors:
  Where are they now?"* confirmed the Kwara 1999–2003 governor was **Rear Admiral
  (rtd) Mohammed Alabi Lawal** (APP), ex-military governor of Ogun, Saraki
  protégé who lost 2003 after Saraki backed his son Bukola; died Nov 2006 —
  **not "Shaaba Lafiagi"** (who governed Kwara in 1992–93). File renamed
  `lafiagi` → `malawal`; `obasanjo.json` `governors[]`, `presidents.json` and
  Turso all corrected.
- **`abdullahiadamu`** — the Farin Ruwa Hydro-Electric scheme (2004 Korea trip,
  KOTRA / Yooshing Engineering, contract signed, plant never built) added as a
  promise, sourced to an archived *Nigerian Newsday* piece.
- **`hashidu`** — the March 2007 campaign-violence arrest and the storming of the
  magistrate's court (supporters freed him, injured the judge), sourced to the
  archived Nation retrospective.

Confirmed but not expanded: Kachalla's APP affiliation, Turaki as "the most
absentee governor", Odili's perpetual anti-EFCC injunction, Igbinedion's
$24m/£12m figure. IA was intermittently offline during the dig; most 1999–2007
state-government coverage is either unarchived or is bare name/party tables.
Wayback source URLs use the durable `web.archive.org/web/<timestamp>/<url>`
permalink form.

Already tracked via their post-2007 terms (no new file): Ondo/`agagu`,
Ogun/`danielgbenga`, Gombe/`goje`, Kogi/`ibrahimidris`, Anambra/`obi`,
Osun/`oyinlola`, Kwara/`saraki`, Kano/`shekarau`, Borno/`sheriff` — these cover
the 2003–2007 governor of those states.


## Data-error fixes to `obasanjo.json` `governors[]` (apply as each state is reached)

- Oyo 1999–2003: **"Lam Adesanya" → Lam Adesina** (AD) *(fixed)*
- Enugu 1999–2007: **"Chimaroke Nnamdi" → Chimaroke Nnamani** *(fixed)*
- Ekiti 2006–2007: **"Tunji Oni" → Brig-Gen Tunji Olurin** (sole administrator under the state of emergency) *(fixed)*
- Jigawa: Turaki party **ANPP** (not PDP) *(fixed)*
- Gombe: Hashidu party **ANPP** (not PDP) *(fixed)*
- Kebbi: the two entries were wrong; merged to **Adamu Aliero, ANPP, 1999–2007** *(fixed earlier)*
