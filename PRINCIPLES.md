# Principles

NGScorecard is built to the norms of the international civic-technology and
open-government community. This document states the commitments that follow
from that, and what they require of the project. It is the direction; when a
decision is unclear, it should be resolved in favour of these.

## Where this comes from

The project aligns itself with:

- **The Open Definition** (Open Knowledge Foundation) and the **Open Data
  Charter** — data that is genuinely free to use, reuse, and redistribute.
- **The Principles for Digital Development** — design with the user,
  understand the existing ecosystem, build for sustainability, be
  collaborative, use open standards and open source.
- The tradition of **independent accountability projects**: promise trackers
  such as *Del Dicho al Hecho* (Fundación Ciudadano Inteligente, Chile) and
  PolitiFact's Obameter; fact-checkers such as Full Fact and **Africa Check /
  Dubawa** in Nigeria; and the civic-tech institution-building of **mySociety**
  (TheyWorkForYou, WhatDoTheyKnow), **Code for America / Code for All**, and
  **OpenCorporates**.

## Commitments

### 1. Open by default

- The dataset is under an open licence (CC BY 4.0), machine-readable, and
  available in bulk. The one-request full export is a **committed milestone,
  not a maybe** — it ships once provenance is audited across every record
  type; `DATASET_DUMP_PUBLIC` is only the switch.
- The code is under a copyleft open-source licence (AGPL-3.0) so improvements
  and forks stay open.
- The methodology is public and versioned; every material change is logged.

### 2. Independence over access

- No government, party, candidate, campaign, or funder sees or approves any
  output before it is published.
- No money is taken from any of the above. A paid layer, if one exists, only
  sustains the free version, is walled off from the rating process, and its
  sponsors are disclosed.
- The free version is always complete. Paid tiers may add convenience (bulk
  access, support, guarantees) — never remove a fact from the free tier.

### 3. Show your work

- Every rated entry is dated and linked to its original source.
- Where an official figure has not been published, the field is left blank —
  never filled with an estimate.
- Anyone can reproduce or challenge a conclusion from the published data and
  methodology alone.

### 4. One standard for everyone

- The same inclusion test and the same evidence bar for every president and
  governor, whatever their party.
- Non-partisan by construction, not by disclaimer.

### 5. Built for Nigeria

- The parts that carry the most trust — the methodology, and in time the
  headline verdicts — are offered in Hausa, Yorùbá, Igbo, and Nigerian Pidgin.
- Designed around how the audience actually reads and shares: mobile first,
  link-friendly, light on bandwidth.

### 6. Durable and forkable

- Standard formats, a stable and versioned API, minimal lock-in.
- Mirroring and rehosting the dataset are encouraged — the record is more
  durable in more than one place, and harder to capture or censor.
- Documented well enough that someone else could run it. The record should
  outlast any single maintainer.

### 7. Correct in the open

- Errors are fixed and logged, not quietly changed or defended.
- There is a public route to report a problem and to submit evidence.
- Known limitations are published, not hidden.

### 8. Do no harm

- The subject is public officials and their conduct in office. Private
  individuals, junior staff, and family members are not.
- No personal data beyond what is necessary to hold public office to account.

## What this implies next

Consequences of the principles above:

- ~~A **public per-entry change history**~~ — done. Every change to a rating,
  a source tier, or an assessment is written to `entry_history` and shown on
  the card, with the editor's reason.
- ~~A **governance note**~~ — done: [`GOVERNANCE.md`](GOVERNANCE.md) (who
  decides, disputes, conflicts of interest, continuity). Names still to fill.
- ~~An **API deprecation policy**~~ — done: `/developers` §6 (additive-only in
  `v1`, breaking changes to `v2`, ≥12 months overlap, `Sunset` header).
- ~~A **public corrections / evidence queue**~~ — done. A "Suggest a
  correction" modal on every card posts to `POST /api/corrections` (rate
  limit + honeypot + submit-timing guards, no captcha); nothing is published,
  it lands in the `/admin` "Corrections inbox" for moderation. Still open: a
  visible back-and-forth *dispute thread* beside a contested rating.
- Turning on the full dataset export once provenance is audited everywhere
  (see `docs/monetization-strategy-review.md`).

## References

- The Open Definition — <https://opendefinition.org>
- Open Data Charter — <https://opendatacharter.net>
- Principles for Digital Development — <https://digitalprinciples.org>
- mySociety — <https://www.mysociety.org>
