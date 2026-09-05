# Data license

> **Scope.** This licence applies now to the dataset as published in this
> repository (`data/seed/`) and as served by the keyed public API
> (`/api/v1/…`). The one-request **bulk export** (`GET /api/v1/dump` and a
> static dataset file) is built but not yet enabled — gated behind the
> `DATASET_DUMP_PUBLIC` flag in `server/publicApi.js`. Turning it on doesn't
> change these terms; it just makes the whole dataset downloadable in one call.

---


The **dataset** compiled by NGScorecard — every record in `data/seed/`, the
contents of the database it seeds, and everything served by the public API
(`/api/v1/…`, including `/api/v1/dump`) and the static export at
`/ngscorecard-dataset.json` — is released under the

**Creative Commons Attribution 4.0 International licence (CC BY 4.0)**
<https://creativecommons.org/licenses/by/4.0/>

You are free to copy, redistribute, adapt, and build on it, for any purpose
including commercially, provided you:

- **give attribution** — credit "NGScorecard — ngscorecard.com" and link back
  where practical, and indicate if you made changes;
- **keep source references intact** — every record carries its own `source`
  and `sourceLabel`. Those primary sources (government data, courts, reputable
  reporting) are the authority; cite them, not this dataset alone.

Mirroring and rehosting the full dataset is explicitly encouraged — an
accountability record is more durable when it exists in more than one place.

## What this does *not* cover

- **Source code** in this repository is licensed separately, under the GNU
  Affero General Public License v3.0 — see [`LICENSE`](LICENSE).
- **Third-party material** the records link to or quote — government
  documents, news articles, photographs — remains under its own terms.
- **Assessments and status ratings** are editorial judgements offered in good
  faith. Reusing them under CC BY does not imply the original authors endorse
  your use or conclusions.

## Attribution examples

> Data: NGScorecard (ngscorecard.com), CC BY 4.0.

> Contains information from NGScorecard, licensed under CC BY 4.0, with
> modifications.
