# Editor guide

For researchers and data editors working in `/admin`. The rating rules live in
the methodology ([`/guide`](https://ngscorecard.com/guide)) and the direction in
[`PRINCIPLES.md`](PRINCIPLES.md); this is the practical part.

## Getting access

1. The owner adds you under **/admin → Team** and sends you a temporary
   password privately (not by posting it in a channel).
2. Sign in at `/admin` with your email and that password. You are asked to
   choose your own (12+ characters) before anything else loads.
3. Never share your login. Each person has their own so changes can be traced
   and access can be removed individually. If you think your password leaked,
   tell the owner and they will reset it.

## What you can and can't do

You can edit every content table, work the Corrections inbox, and import in
bulk. You cannot see API keys or donor records, manage the team, or read the
activity log.

Every create, edit and delete you make is recorded privately with your name and
the full before/after row. Two things follow from that:

- **Deletes are recoverable.** The owner can restore a deleted row exactly as it
  was from **Activity log → Restore**. Still, check twice before deleting.
- **The public change history is anonymous.** It records what changed on a rated
  entry (and your optional change note), never who changed it. Write the note
  for a reader: say what was wrong and what you checked.

## Standards that have caught real errors here

- **Every claim is dated and sourced.** No source, no entry. Pick the honest
  source tier: `official` is a government or official record only. A newspaper
  quoting a ministry is `reporting`; a company press release is not `official`.
- **Attribute to the right administration.** Before saving a project or promise
  under a governor, check the source is about *their* term, not their
  predecessor's or successor's. Look at the dates and at whose name is in the
  article. Copy-paste between neighbouring administrations was the most common
  error found in the dataset.
- **Unknown is `null`, never `0`.** A budget or spend figure nobody published is
  left empty, not zero.
- **Promises are not projects.** A manifesto pledge belongs in Promises. A
  Capital Project needs a named thing that exists or is being built.
- **Report what the source says, not what you infer.** If two official figures
  disagree, say so (use the *disputed* flag) instead of picking one.
- **Check the whole row, not just the headline.** A correct title with someone
  else's source URL is still wrong.
- **Don't bulk-import without a dry run.** Try a few rows first. Imports are
  logged as a single entry, so a bad batch is harder to unpick than single edits.

## When something goes wrong

Tell the owner straight away, with the table and row. Errors are fixed and
logged, not quietly changed (see [`Governance.md`](Governance.md)). "We got this
wrong" is an acceptable line.
