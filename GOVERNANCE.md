# Governance

How decisions get made on NGScorecard, how disputes are handled, and what
keeps the project going. This describes the process; the roles marked
_[maintainer to complete]_ name the people currently filling them.

See also: [`PRINCIPLES.md`](PRINCIPLES.md) (the direction), the methodology's
[Independence & openness section](https://ngscorecard.com/guide#independence),
and [`DATA-LICENSE.md`](DATA-LICENSE.md) / [`LICENSE`](LICENSE).

## Who runs it

- **Maintainer** — _[maintainer to complete]_. Holds the domain, the hosting,
  and the final call on releases. Responsible for keeping this project running
  or handing it on (see _Continuity_ below).
- **Editors** — _[maintainer to complete]_. The people who research entries
  and set ratings against the methodology. May be one person today; the
  structure is meant to grow.

The project is not owned or directed by any government body, political
organisation, or funder.

## How a rating is set and changed

1. An editor researches the entry and rates it against the published
   methodology (sections 1–2 of [`/guide`](https://ngscorecard.com/guide)),
   with every claim dated and linked to a source.
2. Ratings are published without prior review by the subject, any source, or
   any funder.
3. Every later change to a rating, a source classification, or an assessment
   is written to the **public change history** on the entry itself
   (`entry_history`), with the editor's reason where one is given.
4. A change to the **methodology itself** goes in the methodology change log
   (section 8 of `/guide`), and affected past ratings are re-checked against
   the new standard within one review cycle.

## Disputes

If someone contests a rating — a subject, a reader, a journalist:

1. They raise it via "Report an issue" on the entry, or the contact address
   on `/guide`.
2. An editor who was **not** the author of the entry reviews it against the
   methodology and the evidence supplied.
3. The outcome — changed, or upheld with reasons — is recorded in the entry's
   change history. A contested-but-upheld rating may be marked "disputed" on
   the card so readers can see the disagreement and judge the sources
   themselves.
4. If the maintainer authored the entry and no independent editor is
   available, the maintainer says so openly rather than reviewing their own
   call in private.

Disputes are about whether an entry follows the methodology and the evidence —
not about whether a subject is happy with the result.

## Conflicts of interest

An editor with a personal, financial, or political connection to a subject
recuses themselves from that subject's entries, and this is noted. The
project takes no payment, gift, or advertising from any subject or their
representatives.

## Corrections

Errors are fixed and logged, not quietly changed or defended. The change
history on each entry is permanent and public. "We got this wrong" is an
acceptable, expected line.

## Continuity

Because the code is AGPL-3.0 and the data is CC BY 4.0, the project does not
depend on any one person to survive — anyone can stand it back up from the
public repository and dataset.

The maintainer's commitment is to **hand the project on** — to co-maintainers
or a civic-tech organisation — rather than let it lapse silently, and to give
notice here and on the site before stepping away. If the site goes dark, the
last published dataset export and this repository are the canonical record.

## Changing this document

Material changes to governance are noted in the commit history and summarised
in the methodology change log.
