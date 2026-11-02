# 2006 Nigerian Census Population Data at LGA Level

## Is there a GitHub repo or structured download with all 774 LGAs and 2006 populations?

### Takeaway
No GitHub repository with complete 2006 census LGA population data was found. The best machine-readable structured source is an Open Africa CSV from the National Population Commission, though its completeness is unconfirmed due to access restrictions. The authoritative source is a series of official PDF tables.

### Cited Findings
- Open Africa lists a CSV dataset titled "2006 Census Population Distribution by L.G.A," attributed to the National Population Commission and originally hosted on Edo State's open-data portal. The CSV resource ID is `51aa18bb-ab54-47dd-a144-494f41496bc8` — [Source](https://open.africa/dataset/2006-census-population-distribution-by-l-g-a1/resource/51aa18bb-ab54-47dd-a144-494f41496bc8)
- The official NPC 2006 census Priority Tables are available as PDFs through the IHSN Data Catalog. Priority Table Volume III (Population Distribution by Sex, State, LGA & Senatorial District, 7.05 MB PDF) is the authoritative LGA-level source — [Source](https://datacatalog.ihsn.org/catalog/3340/related-materials)
- Priority Table Volume IV (Population by Age and Sex, State and LGA, 32.63 MB PDF) and Volumes VII and VIII also contain LGA-level breakdowns, all as PDFs — [Source](https://datacatalog.ihsn.org/catalog/3340/related-materials)
- GitHub repo `Igbah/nigeria-explorer` contains LGA-level population data but uses GRID3/WorldPop 2025 satellite-based estimates, not 2006 census counts — [Source](https://github.com/Igbah/nigeria-explorer)
- GitHub repo `temikeezy/nigeria-geojson-data` offers LGA geographic data (boundaries and coordinates) but does not include population figures — [Source](https://github.com/temikeezy/nigeria-geojson-data)
- HDX (Humanitarian Data Exchange) hosts "Nigeria - Subnational Population Statistics" (`cod-ps-nga`) and "Nigeria Subnational Population and Housing Data Tables with Administrative Boundaries" but both pages return HTTP 403 errors; from search snippets, one dataset includes 2006 census totals alongside 2019 projections — [Source](https://data.humdata.org/dataset/cod-ps-nga); [Source](https://data.humdata.org/dataset/nigeria-subnational-boundaries-and-tabular-data)
- Statoids.com publishes a table of LGA populations drawn from the 2006 census (described as "provisional results"), including HASC code, population, area, and headquarters for each LGA. It covers 775 LGAs (per the 1999 Constitution) and is a web page, not a downloadable CSV — [Source](https://statoids.com/yng.html)
- CityPopulation.de has per-LGA 2006 census figures accessible from state index pages but provides no bulk download — [Source](https://citypopulation.de/en/nigeria/admin/)

### Inferences
- The Open Africa CSV is almost certainly derived from the NPC Priority Tables, since the NPC is listed as the author and the only official machine-readable extraction known from that era. The Edo State data portal may have published extracts for their state only; the national dataset may be a concatenation of state-level files.
- Building a complete, clean CSV with all 774 LGAs will likely require either: (a) successfully downloading the Open Africa file, or (b) extracting text from the NPC PDF (Priority Table Volume III, 7.05 MB).

### Gaps
- The Open Africa dataset page and its CSV resource both return HTTP 403 Forbidden, so the exact column list, row count, and LGA coverage were not confirmed. It is unclear whether it covers all 774 (or 775) LGAs nationally or only Edo State.
- The HDX datasets also returned 403 errors; their exact file formats, LGA coverage, and license terms could not be directly verified.
- No GitHub repository with the 2006 census LGA figures as a ready-to-use CSV or JSON was found.

---

## Does the dataset match official NPC figures? Any known discrepancies or incomplete states?

### Takeaway
The 2006 census figures are broadly contested, with high-profile disputes over Lagos and Kano populations, and citypopulation.de explicitly notes "high error rates" and disputed results across all Nigerian census figures.

### Cited Findings
- The National Population Commission conducted the census from March 21–27, 2006, and the final results were published in a Government Gazette dated February 2, 2009; the national total is 140,431,790 — [Source](https://archive.gazettes.africa/archive/ng/2009/ng-government-gazette-dated-2009-02-02-no-2.pdf)
- CityPopulation.de states: "All population figures for Nigeria show high error rates; census results are disputed" — [Source](https://citypopulation.de/en/nigeria/admin/)
- The 2006 Metro Lagos census population is reported as 8,048,430 by NPC, but this figure reportedly differs from the simple sum of its constituent LGA counts — [Source](https://citypopulation.de/en/nigeria/metrolagos/)
- Lagos State's 2006 census figure (9,113,605) and Kano State's figure (9,401,288) are among the most disputed; Lagos authorities and analysts disputed the relative ranking, which showed Kano as more populous — [Source](https://en.wikipedia.org/wiki/Demographics_of_Nigeria)
- The Statoids.com table describes its source as "2006-03-21 census provisional results," suggesting it may reflect preliminary rather than final NPC figures — [Source](https://statoids.com/yng.html)
- Sample LGA figures that appear consistently across secondary sources: Alimosho (Lagos) = 1,319,571 (most populous LGA); Bakassi = 31,641 (least populous LGA) — [Source](https://www.legit.ng/ask-legit/top/1130107-largest-local-government-area-nigeria-by-population-top-10/)
- The NPC Priority Tables list Nigeria as having 775 LGAs (matching the 1999 Constitution), while many datasets and references cite 774 — [Source](https://statoids.com/yng.html)

### Inferences
- The discrepancy between 774 and 775 LGAs is likely due to one entry covering a "Disputed Areas" zone, which may be excluded from some compilations but included in others.
- State-level cross-checks against the confirmed total of 140,431,790 are feasible since state-level figures are widely published; these can be used to detect incomplete or corrupted LGA-level files.

### Gaps
- A direct comparison of the Open Africa CSV against the authoritative NPC PDF could not be performed due to the 403 access error.
- The extent to which any secondary dataset deviates from the final 2009 gazette figures at LGA level is not documented in any source found.

---

## What is the licence or terms of use?

### Takeaway
The NPC official tables carry no explicit open licence; the IHSN catalog requires attribution but does not state a CC or open-data licence. The Open Africa listing's licence was not confirmable due to access errors.

### Cited Findings
- The IHSN catalog record for the 2006 census states that the access policy requires citation (primary investigator, survey title, country, acronym, year, reference number, source, and download date) but does not name a Creative Commons or open-data licence — [Source](https://catalog.ihsn.org/catalog/3340)
- The Open Africa dataset page could not be accessed (HTTP 403), so its stated licence is unknown — [Source](https://open.africa/dataset/2006-census-population-distribution-by-l-g-a1)
- The HDX "Nigeria - Subnational Population Statistics" (`cod-ps-nga`) dataset was also inaccessible (HTTP 403); from prior knowledge, HDX Common Operational Datasets are typically CC BY — licence not confirmed for this session — [Source](https://data.humdata.org/dataset/cod-ps-nga)
- The Nigerian Government Gazette is an official government publication, and Nigerian government publications are generally in the public domain under Nigerian copyright law, but no explicit licence statement was found in the gazette itself — [Source](https://archive.gazettes.africa/archive/ng/2009/ng-government-gazette-dated-2009-02-02-no-2.pdf)

### Inferences
- Government census data from the NPC is likely in the public domain or available for non-commercial use, but the absence of an explicit licence is a real constraint for data reuse in a published product.
- If the HDX dataset is confirmed to be CC BY (as is standard for HDX CODs), it would be the safest choice for licence clarity.

### Gaps
- Could not confirm the licence of the Open Africa CSV due to access errors.
- Could not confirm the HDX `cod-ps-nga` licence; direct access was blocked.
- No explicit statement of "public domain" or CC-type licence was found for the NPC tables themselves.

---

## Are there alternative sources (World Bank, HDX/OCHA) that might be more complete or accurate?

### Takeaway
HDX hosts at least two relevant datasets that appear to include 2006 LGA-level data alongside more recent estimates, but both returned access errors during this session. The World Bank does not appear to have an independent LGA-level 2006 census extract.

### Cited Findings
- HDX dataset "Nigeria - Subnational Population Statistics" (`cod-ps-nga`) is described in search snippets as covering 2006 census totals alongside 2019 population estimates. The U.S. Census Bureau is listed as a creator alongside the Centre for Humanitarian Data — [Source](https://data.humdata.org/dataset/cod-ps-nga)
- HDX dataset "Nigeria Subnational Population and Housing Data Tables with Administrative Boundaries, Based on National Census and Surveys" (`nigeria-subnational-boundaries-and-tabular-data`) appears to combine population tables with administrative boundary data — [Source](https://data.humdata.org/dataset/nigeria-subnational-boundaries-and-tabular-data); corroborated by BTAA Geoportal metadata — [Source](https://geo.btaa.org/catalog/1caa305c-2d52-4361-a1bc-ce9b850859c6)
- A World Bank microdata library entry (catalog 2159) exists for Nigeria, but search results indicate its files are demographic projections and historical national-level population series, not a 2006 LGA census extract — [Source](https://microdata.worldbank.org/catalog/2159/data-dictionary)
- The NPC's population.gov.ng official website has an expired SSL certificate and was inaccessible during this session — [Source](https://population.gov.ng)
- data.gov.ng returned no search results for 2006 LGA population data
- Open Africa also hosts a national "Nigeria Census Data" dataset and state-level 2006 age-distribution files, all attributed to the NPC — [Source](https://open.africa/dataset/nigeria-census-data)

### Inferences
- The HDX `cod-ps-nga` dataset is the most likely to be machine-readable, well-structured, and clearly licensed, but it requires direct access to confirm LGA coverage. It should be the first dataset to check if access is restored.
- CityPopulation.de likely derives its per-LGA 2006 figures from the same NPC Priority Tables, making it a useful validation tool but not an independent source.

### Gaps
- Whether the HDX `cod-ps-nga` dataset has all 774 LGAs at admin2 level with 2006 figures confirmed — access was blocked.
- Whether the World Bank has any dedicated sub-national 2006 census extract for Nigeria — not confirmed.

---

## What is the total national population from 2006 (sanity check: ~140 million)?

### Takeaway
The official total is confirmed at 140,431,790, published in the Nigerian Government Gazette of 2 February 2009. This figure is accepted by NPC, NBS, and international sources, even though it is disputed by some analysts.

### Cited Findings
- The Nigerian Government Gazette dated February 2, 2009 (No. 2) records the final 2006 census total as 140,431,790 for both sexes combined — [Source](https://archive.gazettes.africa/archive/ng/2009/ng-government-gazette-dated-2009-02-02-no-2.pdf)
- The Wikipedia article "Demographics of Nigeria" and the "List of Nigerian states by population" both cite 140,431,790 as the 2006 census total — [Source](https://en.wikipedia.org/wiki/Demographics_of_Nigeria)
- State-level headline figures from the same gazette: Kano = 9,401,288; Lagos = 9,113,605; Kaduna = 6,113,503; Katsina = 5,792,578; Oyo = 5,591,589; Benue = 4,219,244; Edo = 3,233,366; FCT = 1,406,239 — [Source](https://en.wikipedia.org/wiki/List_of_Nigerian_states_by_population)
- The afrik-news.com article from the census period confirms the male/female split: "Men outnumber women by millions" in the 2006 census — [Source](https://www.afrik-news.com/news12691.html)

### Inferences
- Any LGA-level dataset that, when summed, yields a national total close to 140,431,790 is internally consistent with the official figures. Datasets deviating significantly (e.g. more than 1–2%) from this sum should be treated with caution.
- The state-level figures above can be used to cross-check any LGA dataset: summing a state's LGAs should match the state figure.

### Gaps
- No gap. The national total is firmly established at 140,431,790 from the primary source (Government Gazette).

---

## Recommended Action Plan

Based on this research, the recommended approach for obtaining a complete, machine-readable 2006 LGA population dataset is:

1. **First attempt**: Access the Open Africa CSV at `https://open.africa/dataset/2006-census-population-distribution-by-l-g-a1` (returned HTTP 403 during this session; retry from a different network or browser). If accessible, download and validate by summing to confirm ~140,431,790 national total.

2. **Second attempt**: Access the HDX `cod-ps-nga` dataset at `https://data.humdata.org/dataset/cod-ps-nga` — this may have better licensing (CC BY is standard for HDX CODs) and was also blocked during this session. Check if it includes admin2 (LGA-level) breakdown for 2006.

3. **Fallback**: Extract text from the NPC Priority Table Volume III PDF (7.05 MB) at `https://datacatalog.ihsn.org/catalog/3340/download/48521`. This is the authoritative source and, with `pdftotext` or similar, can yield a structured table.

4. **Validation source**: CityPopulation.de (`https://citypopulation.de/en/nigeria/admin/`) has per-LGA 2006 figures that can be used for spot-checking any dataset against the official NPC figures, though it is not itself a primary source and notes census results are disputed.
