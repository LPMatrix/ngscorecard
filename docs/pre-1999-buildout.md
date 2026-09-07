# Pre-1999 administrations — build-out

Extending coverage below the Fourth Republic. Same model as the Obasanjo-era
governor build-out: a `presidents.json` entry (`level: "federal"`,
`party: "Military"` for the military regimes) plus a `data/seed/<key>.json`
scorecard, seeded to Turso, every entry citing a URL verified to resolve.

Military regimes did not campaign, so the `promises` section holds their
**stated programmes and commitments** — transition timetables, SAP, Vision 2010,
the PTF — which the guide's inclusion test already allows ("an official agenda
document"). `budget` / `indicators` are empty (no citable series that far back).

## Done — the full 1960–1999 federal set (11 administrations)

| Key | Administration | Term | Type |
|---|---|---|---|
| `balewa` | Abubakar Tafawa Balewa | 1960–1966 | First Republic (NPC) |
| `ironsi` | Johnson Aguiyi-Ironsi | 1966 | Military |
| `gowon` | Yakubu Gowon | 1966–1975 | Military |
| `murtala` | Murtala Mohammed | 1975–1976 | Military |
| `obasanjomilitary` | Olusegun Obasanjo | 1976–1979 | Military |
| `shagari` | Shehu Shagari | 1979–1983 | Second Republic (NPN) |
| `buharimilitary` | Muhammadu Buhari | 1983–1985 | Military |
| `babangida` | Ibrahim Babangida | 1985–1993 | Military |
| `shonekan` | Ernest Shonekan | 1993 | Interim National Government |
| `abacha` | Sani Abacha | 1993–1998 | Military |
| `abdulsalami` | Abdulsalami Abubakar | 1998–1999 | Military |

Federal tracked administrations: **5 → 16**. Total tracked: **162**. Every
`source` URL verified to resolve (31 unique across the 11 files).

Note on keys: `obasanjomilitary` and `buharimilitary` are distinct from the
Fourth-Republic `obasanjo` / `buhari`. `party` is `Military`, `Interim National
Government`, `NPC` or `NPN` as appropriate. `budget` / `indicators` are empty
throughout — no citable series that far back.

Coverage spans: the First Republic's regional crises and Operation Wetie; the
1966 coups and Decree 34; the civil war and the 3Rs; the cement armada; the
1975–76 purge and the Abuja decision; the Land Use Decree, Operation Feed the
Nation, UPE and the 1979 handover; the Second Republic's Green Revolution,
Ajaokuta, Shagari houses and Ghana-Must-Go; the War Against Indiscipline,
Decrees 2 and 4, and the Dikko crate affair; SAP and the June 12 annulment;
the missing $12.4bn Gulf windfall; the 82-day ING and the court that voided it;
Vision 2010, the Ogoni Nine and phantom-coup tribunals, the Abacha loot and its
recovery; and the 11-month Abdulsalami transition and the 1999 Constitution.

## Done — pre-1999 elected state governors (49 administrations)

Only the **elected civilian** governorships, the clean parallel to the federal
set. Military-appointed state administrators (1967–79, 1984–99) are deliberately
excluded: most served 1–2 years with no manifesto or mandate, and there were
200-plus of them.

### Second Republic (1979–1983) — 19 states

| Key | State | Governor | Party |
|---|---|---|---|
| `jakande` | Lagos | Lateef Jakande | UPN |
| `onabanjo` | Ogun | Bisi Onabanjo | UPN |
| `bolaige` | Oyo | Bola Ige | UPN |
| `ajasin` | Ondo | Michael Ajasin | UPN |
| `alli` | Bendel | Ambrose Alli | UPN |
| `nwobodo` | Anambra | Jim Nwobodo | NPP |
| `mbakwe` | Imo | Sam Mbakwe | NPP |
| `lar` | Plateau | Solomon Lar | NPP |
| `rimi` | Kano | Abubakar Rimi | PRP |
| `balarabemusa` | Kaduna | Abdulkadir Balarabe Musa | PRP (impeached 1981) |
| `goni` | Borno | Mohammed Goni | GNPP |
| `barde` | Gongola | Abubakar Barde | GNPP |
| `okilo` | Rivers | Melford Okilo | NPN |
| `isong` | Cross River | Clement Isong | NPN |
| `aku` | Benue | Aper Aku | NPN |
| `tatariali` | Bauchi | Tatari Ali | NPN |
| `kangiwa` | Sokoto | Shehu Kangiwa (d. 1981) → Garba Nadama | NPN |
| `awwalibrahim` | Niger | Awwal Ibrahim | NPN |
| `adamuatta` | Kwara | Adamu Atta | NPN |

State names are the historical ones (Bendel = Edo + Delta; Gongola = Adamawa +
Taraba; the old Anambra/Borno/Cross River/Imo/Ondo/Oyo/Plateau/Rivers/Sokoto
were larger than today's). All terms ended at the 31 December 1983 coup;
`balarabemusa` ended earlier, at the first gubernatorial impeachment in Nigerian
history. Three-month October 1983 NPN successors (Onoh, Ogbemudia, Bakin Zuwo,
Olunloyo, Etiebet, Christian Onoh, Bamanga Tukur, Adebayo) are noted inside the
principal's file rather than given their own scorecards.

### Third Republic (January 1992 – November 1993) — 30 states

All 30 states of the time, one governor each, SDP or NRC only. Keys collide with
Fourth-Republic namesakes for five men who governed the same state twice —
suffixed `92`: `audu92` (Kogi), `osoba92` (Ogun), `nyame92` (Taraba),
`adeleke92` (Osun), `bukarabbaibrahim92` (Yobe). `lafiagi` is the real Shaaba
Lafiagi (Kwara 1992–93), distinct from the Kwara APP governor-elect of 1999.

Other keys: `onu` Abia, `michika` Adamawa, `isemin` Akwa Ibom, `ezeife` Anambra,
`dahirumohammed` Bauchi, `adasu` Benue, `mainalawan` Borno, `ebri` Cross River,
`ibru` Delta, `oyegun` Edo, `nwodo` Enugu, `enwerem` Imo, `birninkudu` Jigawa,
`lere` Kaduna, `gaya` Kano, `barda` Katsina, `abubakarmusa` Kebbi, `otedola`
Lagos, `musainuwa` Niger, `olumilua` Ondo, `ishola` Oyo, `tapgun` Plateau,
`adageorge` Rivers, `abdulkarim` Sokoto.

Every term ends at the same point: removed on 17 November 1993 when the Abacha
coup dissolved all elected governments. The 11 states created on 27 August 1991
(Abia, Adamawa, Delta, Edo, Enugu, Jigawa, Kebbi, Kogi, Osun, Taraba, Yobe) get
an `inherited` entry on building a state from nothing in under two years; the
rest get one on governing inside the collapsing Babangida transition. Files with
a thin public record carry a stated "not available in the summary record" note
rather than invented detail.

Every `source` URL verified to resolve. Combined pre-1999 total: **11 federal +
49 state = 60 new administrations.** Dataset total: **211** (16 federal, 195
state).

## Not yet done

- Deeper `ministers` sections on the pre-1999 files (currently empty).
- Military-appointed state administrators — deliberately out of scope.
