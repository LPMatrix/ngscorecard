# NGScorecard

**An independent, open tracker of Nigerian government promises versus delivery.**
A civic-accountability public good — free to read, cite, and reuse.

Live at [ngscorecard.com](https://ngscorecard.com). Its direction is set by
[`PRINCIPLES.md`](PRINCIPLES.md), aligned with the norms of the international
civic-technology and open-government community.

---

## What it tracks

The record of what Nigeria's leaders promised and what actually happened:
every president since 1999 (Obasanjo, Yar'Adua, Jonathan, Buhari, Tinubu) and
every governor, sitting and former, across all 36 states.

For each administration:

- **Campaign promises** — rated *kept · partial · broken · in progress*
- **Inherited fixes** — problems the administration didn't create but took on
- **Fraud cases** — allegations, amounts, and their legal outcomes
- **Executive orders**, **bills**, **appointments**, **court judgments**
- **Ministers / commissioners** — performance against stated mandates
- **Budgets** and **key economic indicators** over time

Every entry is **dated** and **linked to its original source**. Where an
official figure hasn't been published, the field is left blank — not guessed.

## How ratings work

Ratings are editorial judgements made by the project's editors against a
**published, versioned methodology**, not an algorithm. The full rubric —
what counts as a trackable promise, the evidence bar for each rating, the
source hierarchy, the review cadence, and the change log — lives at
[`/guide`](https://ngscorecard.com/guide).

## Independence

- Not affiliated with, endorsed by, or run on behalf of any government body or
  political organisation.
- Not run for profit. Takes no money from any government, party, candidate, or
  campaign. If a paid layer ever exists (e.g. bulk API access) it only
  sustains the free version and stays separate from ratings.
- No subject, source, or sponsor sees or approves a rating before it is
  published. Corrections are made and logged, not defended.

The full set of commitments is in [`PRINCIPLES.md`](PRINCIPLES.md); how
decisions and disputes are handled is in [`GOVERNANCE.md`](GOVERNANCE.md).

## Licensing

| | |
|---|---|
| **Dataset** (`data/seed/`, the public API, any export) | [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) — see [`DATA-LICENSE.md`](DATA-LICENSE.md) |
| **Source code** (this repository) | [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html) — see [`LICENSE`](LICENSE) |

Mirroring and rehosting the dataset is encouraged — an accountability record
is more durable in more than one place. Cite the primary sources on each
record, not the dataset alone.

## Using the data

- **Public API** — self-serve free key, rate-limited. `POST /api/v1/keys`
  with an email, then `GET /api/v1/<admin>/<category>`.
- **Embeddable widget** — a live promise-tracking bar for any page.
- Full docs: [`/developers`](https://ngscorecard.com/developers).

## Contributing

- **Found something wrong or out of date?** Use "Report an issue" on any card,
  or email the address on [`/guide`](https://ngscorecard.com/guide). Every
  correction is noted on the entry.
- **Translations** — the methodology is drafted in Hausa, Yorùbá, Igbo, and
  Nigerian Pidgin (`public/guide.<locale>.html`) and needs native review; see
  [`docs/i18n-plan.md`](docs/i18n-plan.md).
- **Code** — issues and pull requests welcome. By contributing you agree your
  code is licensed under the AGPL-3.0.

## Running locally

Stack: Vue 3 (SSR) · Express · Drizzle ORM on Turso (hosted libSQL/SQLite) ·
deployed on Vercel.

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run db:push        # apply the schema
npm run db:seed        # load data/seed/*.json
npm run dev            # http://localhost:5174
```

`.env` needs:

| Variable | Purpose |
|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | database (omit both to fall back to a local SQLite file) |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | the `/admin` editor |

Other scripts: `npm run build` (client + SSR), `npm run db:studio`,
`npm run export:dataset`.

## Layout

```
data/seed/        one hand-authored JSON file per administration (the source of truth)
server/           Express API, Drizzle schema, seed script, SSR render
src/              Vue app (App.vue + components), SSR + client entrypoints
public/           static pages: guide (methodology), developers, press, admin
docs/             methodology notes, i18n plan, product-lessons write-ups
```
