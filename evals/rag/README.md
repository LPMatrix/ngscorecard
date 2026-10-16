# Q&A assistant evals

Scores retrieval and answer quality against `dataset.json`, using the corpus in
`scripts/government-data-sources.mjs` (no database needed).

```bash
npm run eval:rag                       # retrieval only: offline, free, ~1s
npm run eval:rag -- --verbose          # also list unanswerable questions that reach the model
npm run eval:rag -- --generate         # also call the model; needs OPENROUTER_API_KEY, costs money
npm run eval:rag -- --write-baseline   # accept current retrieval scores as the new floor
```

`npm test` runs the retrieval gate: it fails if `hitAt5`, `mrr` or `evidenceAt5`
drop below `baseline.json`.

## Adding a case

- **answerable**: `expectedSources` are source codes from the corpus (any one counts);
  `evidence` is a literal string from the *body* of the answering document (not a
  heading; headings are stored apart from chunk text); `answerMentions` are
  strings a generated answer must contain (`a|b` means either).
- **unanswerable**: the corpus does not contain the answer. Add `forbidden`
  regexes for near-misses where the topic is covered but the figure is not.

Write the question the way a user would, not the way the document words it.
Add a case whenever a real user question goes wrong.

## What the scores do not tell you

They measure whether the assistant faithfully reflects the corpus. They do not
check that the corpus itself is correct.
