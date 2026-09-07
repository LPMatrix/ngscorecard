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

## Not yet done

- **Governors before 1999** — Second Republic (1979–83) and military-era state
  administrators. A parallel to the Obasanjo-era governor build-out, if
  state-level pre-1999 coverage is wanted.
- Deeper `ministers` sections on the pre-1999 files (currently empty).
