# Nigeria: LGA to Federal Constituency Mapping

## Is there a GitHub repo, INEC document, or structured dataset mapping LGAs to federal constituencies?

### Takeaway
The best structured open dataset is a community-built SQL database on GitHub (`nuhu-ibrahim/lga-districs`) that directly maps each LGA to its representative (federal) constituency. INEC publishes state-level delimitation PDFs that contain the same mapping but not in machine-readable form. No official INEC CSV or JSON is publicly available.

### Cited Findings
- **GitHub: `nuhu-ibrahim/lga-districs`** — A SQL database dump (MariaDB/phpMyAdmin) with an `lga_tbl` that stores `representative_district_id` as a foreign key linking each LGA to its federal constituency. The `representative_district_tbl` holds all 360 constituency names. A single SQL JOIN produces the complete LGA → constituency crosswalk. — [GitHub repo page](https://github.com/nuhu-ibrahim/lga-districs); [Ecosyste.ms listing](https://awesome.ecosyste.ms/projects/github.com%2Fnuhu-ibrahim%2Flga-districs)
- **Wikipedia: "List of Nigerian federal constituencies"** — A web table of all 360 constituencies (as of November 2024), organised by state and senatorial district. Constituency names encode the LGAs they cover (e.g., "Aba North/Aba South"). The table is not downloadable but is scrapable. — [Wikipedia](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- **situationroomng.org 2015 PDFs** — State-by-state PDFs listing each federal constituency with its constituent LGAs, registration-area (RA) count, and polling-unit (PU) count. The Enugu PDF explicitly confirms the 8 federal constituencies for Enugu's 17 LGAs and their compositions (e.g., "Aninri/Awgu/Oji River FC/115/EN: 3 LGAs"). Source is INEC data prepared for 2015 elections; may not reflect any post-2015 boundary changes. — [Enugu PDF](https://situationroomng.org/wp-content/uploads/2015/02/ENUGU.pdf) (other states at same path pattern)
- **INEC delimitation PDFs** — INEC has published delimitation-data booklets (e.g., for the 2023 Bayelsa/Imo/Kogi elections) that list constituencies, their LGAs, and collation centres. However, most PDF URLs tested returned 404 at the time of research, and the `wp1.inecnigeria.org` subdomain was unreachable. — [INEC search results](https://inecnigeria.org/)
- **Africa Open Data "Nigeria Legislatures" dataset** — Two CSV/JSON files are listed, but their content covers members of parliament and their identifiers, not constituency-LGA mappings. — [Africa Open Data](https://open.africa/dataset/nigeria-legislatures)
- **HDX (data.humdata.org)** — Lists an "INEC LGA and Wards" dataset; however, the resource view page returned HTTP 403 during research, so its exact content and whether it includes constituency mapping could not be confirmed. — [HDX listing](https://data.humdata.org/dataset/nigeria-independent-national-electoral-commission-lga-and-wards)

### Inferences
- The nuhu-ibrahim SQL database is the most usable structured source for an LGA → constituency crosswalk but has not been officially attributed to INEC and should be verified against the Wikipedia table or a state-level INEC PDF before use in production.
- The Wikipedia table is effectively a mirror of INEC delimitation data, but its exact vintage is not stated.

### Gaps
- INEC does not appear to publish a machine-readable (CSV/JSON/GeoJSON) national LGA-to-constituency crosswalk on its public website. Direct confirmation would require contacting INEC or requesting the data through FOIA.
- The Africa Open Data and HDX datasets could not be accessed to confirm their contents.

---

## Do some LGAs span multiple constituencies (i.e. a large LGA split into 2+ constituencies)? Which ones?

### Takeaway
Yes. At least six LGAs are confirmed to be divided across two federal constituencies, primarily in Lagos State, Oyo State, and Rivers State. These are the cases where a single LGA name appears with Roman numerals (I, II) or directional qualifiers in two separate constituency names.

### Cited Findings
- **Lagos Island LGA** is split into Lagos Island I and Lagos Island II (both in Lagos Central Senatorial District). — [Wikipedia Lagos section](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies); [2019 Lagos HoR election](https://en.wikipedia.com/wiki/2019_Nigerian_House_of_Representatives_elections_in_Lagos_State)
- **Mushin LGA** is split into Mushin I and Mushin II (both in Lagos West Senatorial District). — [Wikipedia Lagos section](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- **Surulere LGA** is split into Surulere I and Surulere II (both in Lagos Central Senatorial District). — [Wikipedia Lagos section](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- **Oshodi-Isolo LGA** is split into Oshodi/Isolo I and Oshodi/Isolo II (both in Lagos West Senatorial District). Note: "Oshodi/Isolo" might itself be a combined name for two LGAs; this needs confirmation from an INEC document. — [Wikipedia Lagos section](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- **Port Harcourt LGA (Rivers)** is split into Port Harcourt I and Port Harcourt II. — [Wikipedia Rivers section](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- **Ibadan LGAs (Oyo)**: Multiple Ibadan-named constituencies exist — Ibadan North, Ibadan North East/Ibadan South East, Ibadan North West/Ibadan South West — suggesting that several Ibadan-named LGAs (Ibadan North, Ibadan North East, Ibadan South, etc.) are distributed across multiple constituencies. — [Wikipedia Oyo section](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- Lagos has 24 federal constituencies for 20 LGAs, which arithmetically requires at least 4 LGAs to each be split across 2 constituencies. — [Wikipedia](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- The House of Representatives noted: "In some places, there are two federal constituencies in one local government." — [The Cable via search result](https://www.thecable.ng/?p=531848)
- A proposed Alimosho split (into 3 constituencies) was discussed at constitutional amendment hearings in 2025, but has NOT been enacted. Alimosho is currently a single constituency. — [Blog report](https://alwaysglobalnews.blogspot.com/2025/07/breaking-one-voice-is-not-enough-why-alimosho-deserves-three-federal-constituencies-aya.html)

### Inferences
- The split-LGA pattern is concentrated in Lagos State (at least 4 cases: Lagos Island, Mushin, Surulere, Oshodi-Isolo), Rivers State (Port Harcourt), and possibly a few other states.
- The total number of split LGAs nationwide is likely small (fewer than 10) based on the visible data.

### Gaps
- A definitive national list of all split LGAs is not available from the sources found. The nuhu-ibrahim SQL database would reveal this if queried, but the SQL file was not fully inspected.
- The Oshodi-Isolo case needs INEC confirmation on whether it is one LGA or two combined.

---

## Do some constituencies span multiple LGAs (i.e. small LGAs merged into one constituency)?

### Takeaway
Yes — the overwhelming majority of Nigeria's 360 federal constituencies combine two or more LGAs. Single-LGA constituencies are the minority.

### Cited Findings
- **Typical pattern is multi-LGA per constituency.** The constituency names routinely use slashes to denote the LGAs they combine: e.g., "Aba North/Aba South", "Arochukwu/Ohafia", "Umuahia North/Umuahia South/Ikwuano" (3 LGAs). — [Wikipedia Abia section](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- **Some constituencies span 4+ LGAs.** Osun examples: "Atakunmosa East/Atakunmosa West/Ilesha East/Ilesha West" (4 LGAs), "Ede North/Ede South/Egbedore/Ejigbo" (4 LGAs), "Ife Central/Ife North/Ife South/Ife East" (4 LGAs). — [Wikipedia Osun section](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- **Single-LGA constituencies exist** in high-population states: Alimosho, Agege, Apapa, Eti-Osa, Ikorodu in Lagos; Bende in Abia; Wase in Plateau; Chanchaga in Niger; Oluyole in Oyo. — [Wikipedia various state sections](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- **Mathematical structure**: 360 constituencies cover 774 LGAs and 6 FCT area councils = 780 units total, giving a mean of ~2.17 LGAs per constituency. — [IDEA International (constituency count)](https://www.idea.int/answer/ans9386599546096); [situationroomng.org](https://situationroomng.org/wp-content/uploads/2015/02/ENUGU.pdf)
- The Kontagora/Wushishi/Mariga/Mashegu constituency in Niger State combines 4 LGAs; the Bida/Gbako/Katcha constituency combines 3 LGAs. — [Wikipedia Niger section](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- Enugu State: all 8 federal constituencies combine 2–3 LGAs each, for a total of 17 LGAs. No single-LGA constituency exists in Enugu. — [situationroomng.org Enugu PDF](https://situationroomng.org/wp-content/uploads/2015/02/ENUGU.pdf)

### Inferences
- Multi-LGA constituencies are the norm; single-LGA ones are exceptions found mainly in the most populous states (Lagos, Kano).
- In the north and southeast, nearly every constituency groups 2–4 LGAs.

### Gaps
- An exhaustive count of single-LGA vs multi-LGA constituencies is not available without querying the full SQL database or scraping Wikipedia.

---

## What is the source/authority for this mapping — is it INEC's official constituency delineation?

### Takeaway
The authoritative source is INEC, acting under Section 71 of the 1999 Constitution. The current delineation dates to the transition to the Fourth Republic (1999) and has not been comprehensively revised. INEC has resisted a full redraw and only one targeted delineation (Warri Federal Constituency) has occurred recently.

### Cited Findings
- **Constitutional authority:** Section 71(b) of the 1999 Constitution (as amended) empowers INEC to divide Nigeria into 360 federal constituencies. Section 73(1) requires review at intervals of no less than 10 years, and allows alteration after a national census, creation of states, or by Act of the National Assembly. — [Street Lawyer Naija analysis](https://streetlawyernaija.com/?p=7748)
- **No comprehensive review since 1999:** A House of Representatives motion noted that INEC has not complied with Section 73(1) since the commencement of the Fourth Republic. INEC's position is that no new states have been created since 1999 and it may require constitutional amendment. — [NAN News](https://nannews.ng/reps-task-inec-on-constituency-delineation/)
- **Warri exception (active case):** Following a Supreme Court judgment (*Timinimi & Others v INEC*, SC.413/2016), INEC conducted a delineation of the Warri Federal Constituency (covering Warri North, Warri South, and Warri South West LGAs) and released a final report in May 2026. New state constituency assignments in Delta State are now being implemented. — [The Frontier NG](https://thefrontierng.com/?p=93128); [Guardian NG](https://guardian.ng/news/senate-in-heated-clash-over-inec-delineation-of-warri-federal-constituency/)
- **Changes by constitutional amendment:** The Ifo/Ewekoro Federal Constituency (Ogun State) was being pursued for a split via a constitutional amendment bill in 2025. This route — altering the Constitution's constituency list directly — is how new constituencies are created in practice. — [Search results (web)]
- **Community datasets not officially INEC:** The nuhu-ibrahim SQL database on GitHub is not attributed to INEC and its authority/accuracy is unverified. The Wikipedia list reflects the current constitutional text but does not cite each row's primary source.

### Inferences
- Any dataset outside INEC's own publications (PDFs, official notices) carries unverified accuracy. The safest approach is to use the INEC state-level PDF booklets as the canonical source and build a machine-readable crosswalk from them.
- The Warri delineation (2026) is the most recent boundary change; all other constituency-LGA assignments appear to be unchanged from 1999.

### Gaps
- INEC has not published a single authoritative national LGA-to-constituency document in machine-readable form. Verifying the complete list would require collecting and parsing all 37 state-level PDFs from situationroomng.org or INEC's archive.

---

## Is there a downloadable CSV or JSON of this mapping anywhere?

### Takeaway
No confirmed, authoritative, machine-readable CSV or JSON of the full LGA-to-federal-constituency mapping was found. The closest is the nuhu-ibrahim SQL dump on GitHub, which can be imported into any SQL database and then exported to CSV/JSON, but it is community-sourced.

### Cited Findings
- **nuhu-ibrahim/lga-districs (GitHub, SQL):** The only structured, complete dataset found that maps LGAs to federal constituencies. Format is a `.sql` dump; no CSV or JSON files are in the repo. Describes "760+ local governments" (not 774), so completeness is uncertain. — [GitHub](https://github.com/nuhu-ibrahim/lga-districs)
- **Wikipedia (web table):** A complete HTML table scrapable with Python or similar tools. Not downloadable as a flat file. — [Wikipedia](https://en.wikipedia.org/wiki/List_of_Nigerian_federal_constituencies)
- **Africa Open Data:** Has CSVs and JSONs labeled "Nigeria legislatures" but they contain members of parliament identifiers, not constituency-LGA mappings. — [Open Africa resource](https://open.africa/dataset/nigeria-legislatures)
- **HDX:** Lists an "INEC LGA and Wards" dataset (resource ID `38f164cf-2000-49a6-be2c-47ce4f90f4da`), but the download page returned HTTP 403 during research. The dataset description suggests it might include ward-level detail under federal constituencies, but contents were inaccessible. — [HDX listing](https://data.humdata.org/dataset/nigeria-independent-national-electoral-commission-lga-and-wards/resource/38f164cf-2000-49a6-be2c-47ce4f90f4da)
- **Stears**: Built constituency polygons from GRID3 LGA/ward boundaries and published a methodology article, but the resulting dataset was not found to be publicly downloadable. — [Stears article (currently returns HTTP 526)](https://api.stearsng.com/article/where-is-my-constituency-stears-journey-to-mapping-nigerias-boundaries/)
- **INEC PDFs:** State-level delimitation booklets contain the complete LGA-constituency mapping but are PDFs, not flat files.

### Inferences
- The fastest path to a complete, usable CSV is to import the nuhu-ibrahim SQL dump, query it (one JOIN), and export to CSV, then cross-check a sample against the Wikipedia table.
- A more authoritative path is to parse the 37 state-level situationroomng.org/INEC PDFs, which contain verified data per state.
- The HDX dataset is worth retrying from a different network/session, as it may have been temporarily blocked.

### Gaps
- No download was successfully completed during this research session; all structured sources either require SQL import (GitHub) or scraping/parsing (Wikipedia, PDFs).
- TheirRepresentatives.ng and EiE Nigeria were named as potential civic-tech sources, but no dataset from either was found in searches.
