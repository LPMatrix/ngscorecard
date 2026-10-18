# Q&A assistant evals

Scores retrieval and answer quality against `dataset.json`. The corpus is
`corpus/portal-snapshot.json`, a dated, trimmed copy of the Government Service
Portal's data, turned into documents by the same code that loads the live corpus,
so there is no database to set up and no text written by hand.

```bash
npm run eval:rag:corpus      # refresh the corpus copy from data/portal-snapshot.json
```

After refreshing it, run the eval; if scores moved for understood reasons, accept
them with `--write-baseline`.

```bash
npm run eval:rag                       # retrieval only: offline, free, ~1s
npm run eval:rag -- --verbose          # also list unanswerable questions that reach the model
npm run eval:rag -- --generate         # also call the model; needs OPENROUTER_API_KEY, costs money
npm run eval:rag -- --write-baseline   # accept current retrieval scores as the new floor
```

`npm test` runs the retrieval gate: it fails if `hitAtK`, `mrr` or `evidenceAtK`
drop below `baseline.json`.

## Adding a case

- **answerable**: `expectedSources` are agency codes from the corpus, e.g. `FRSC` (any one counts);
  `evidence` is a literal string from the *body* of the answering document (not a
  heading; headings are stored apart from chunk text); `answerMentions` are
  strings a generated answer must contain (`a|b` means either).
- **unanswerable**: the corpus does not contain the answer. Add `forbidden`
  regexes for near-misses where the topic is covered but the figure is not.

- **follow-up**: add `history` (earlier turns, a user question first) and a bare
  `question` such as "What about for minors?". Offline retrieval is scored with
  the no-model fallback query; `--generate` scores the model's rewrite.

Write the question the way a user would, not the way the document words it.
Add a case whenever a real user question goes wrong.

## What the scores do not tell you

They measure whether the assistant faithfully reflects the corpus. They do not
check that the corpus itself is correct.
