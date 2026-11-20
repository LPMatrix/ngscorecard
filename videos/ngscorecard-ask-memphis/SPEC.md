# NGScorecard Ask — Memphis cut · SPEC

Fresh build. Visual language inherited from the Civic Ledger social cards (Memphis),
not the editorial-forest cut. 1920×1080, 30 fps, ~34.5 s. Destination: X / LinkedIn.
Arc: **Stamp of approval** (cited = verified).

## Design system (from Civic Ledger gallery)

- **Paper** `#fff4dc` · **Ink** `#132a1d` · **Green** `#0a6b45`
- Accents: **Yellow** `#ffc93c` · **Sky** `#7fd3e0` · **Coral** `#ff6b57`
- Display/numbers/stamps: **Archivo Black** (bundled). Labels/docks/meta: **IBM Plex Mono** (bundled).
  Body: **Inter** (bundled, standing in for Instrument Sans).
- Signature motifs: thick ink borders (.4–.5cqw), **hard offset shadows** (`Xcqw Ycqw 0 ink`),
  rotated sticker chips/stamps (−4°…+3°), **yellow highlight spans** on headline words,
  **checkerboard strip** (conic gradient), **dark dock bar** (ink bg, mono, yellow tag),
  deco shapes (outline circles, half-circles, dot grids).

## Product truth (do not invent — capture was blocked, rebuilt from page text/tokens)

- Page heading: **Ask about government services**
- Subtitle: *Answers come from the Government Service Portal and NHREC, with the sources shown.*
- Question (real example): **How do I register a business in Nigeria?**
- Searching state: **Searching documents…**
- Answer (real): To register a business in Nigeria, apply to the Corporate Affairs Commission (CAC).
  Start by reserving a business name on the CAC portal, then submit form CAC 2 (business name)
  or CAC 7 (company) with the filing fee… Certificate of Incorporation / RC, usually 1–5 working days.
- Sources (real): **[1] CAC — Business Registration Process** · **[2] CAC — CAC (Company Registration)**
- Product's own palette: forest green `#006b45`, cream `#fffef9`, white. The product UI shows as
  ITSELF (not Memphis-ified); Memphis is the film's framing, titles, stamps and transitions.
- CTA: **ngscorecard.ng/ask** · Crest: dark-green rounded rect, two cream pillars, one green diagonal.

## Scenes

| # | id | start | dur | ground | beat |
|---|----|-------|-----|--------|------|
| 01 | hook | 0 | 4.5 | paper | The question slams in, word by word; yellow highlight on "register a business". |
| 02 | old-way | 4.5 | 4 | coral | The old way: a buried stack of gov PDFs / tabs / hours. Coral tension, "BURIED" stamp. |
| 03 | ask | 8.5 | 5.5 | paper→product | Real Ask page on a Memphis card; question types into the bar; "Searching documents…". |
| 04 | answer | 14 | 7 | product | CAC answer types out; the two CAC sources slide in beneath. |
| 05 | stamp | 21 | 5 | paper | Payoff: the two sources THUNK down as rotated rubber stamps; green "SOURCED"; "Every answer, sourced." |
| 06 | tagline | 26 | 4 | ink | Ask. Get answers. See the sources. (cream + yellow highlight on dark) |
| 07 | end | 30 | 4.5 | ink | N crest performs in, wordmark wipes beside it, CTA ngscorecard.ng/ask on a yellow dock tag. |

## Motion grammar

- Everything arrives: slam/thunk (overshoot `back.out`/`power4.out`, 0.14–0.22 s) + settle. Cut on the beat.
- Stamps rotate into place with a tiny bounce; hard shadow snaps a frame after the stamp lands.
- Product actions are real: cursor → click Ask → spinner → answer draws → sources slide. No faked controls.
- Transitions caused by an object: the question headline hands into the question bubble; the answer card
  becomes the two stamps; the dark tagline world holds into the end card.

## Audio

- Reuse approved `assets/bgm.aac` (confident civic underscore), vol 0.75, full length.
- Optional SFX pass (offer): stamp thunks on 05, cut hit on 02. Not in v1 unless approved.
