# Brag Plan: NGScorecard

## What is this app?
NGScorecard is an independent, open civic-accountability tracker that rates every Nigerian president and governor since 1999 on their campaign promises — kept, partial, or broken — alongside fraud cases, executive orders, and budgets, with every entry dated and linked to its original source.

## The angle
This isn't a landing-page pitch, it's a ledger nobody wanted kept: 207 administrations, 1,058 promises, 271 fraud cases — each one sourced, none of them written by the people it's rating. The video plays it like a dossier being opened: stark stats, then the actual receipts (a real ₦109.5 billion fraud entry, a real broken promise), landing on the fact that this record is free, independent, and always checkable.

## Hook (first 2-3 seconds)
Hard cut to a dark forest-green frame with the site's faint grid texture. Huge Playfair Display serif type slams in, all caps, tight tracking:
"NIGERIA HAS HAD 207 GOVERNMENTS SINCE 1999."
A thin gold rule draws under "207" as it lands. Hold long enough to read in full.

## Key moments (the middle)
- **The Promises tab, live**: the real PromiseCard UI — three or four cards arrive one by one, each snapping in with its actual color-coded badge (green "Kept", gold "Partial", red "Broken"). Cursor clicks one card; it expands to reveal real assessment copy and a clickable source link — proving these aren't vibes, they're cited.
- **The Fraud tab, live**: cut to a real fraud entry — "Ahmed Idris — Accountant General" — with the ₦109.5 billion figure scaling up hard as its own beat, "ongoing" status badge beside it, source link visible underneath.
- **Compare view**: two administration cards sit side by side (e.g. Buhari vs. Tinubu), each with its own kept/partial/broken tally — the product's "receipts, side by side" moment.

## Outro / punchline
Wordmark "NGScorecard" on the forest-green field, gold underline from the hook now complete beneath it. One line beneath: "Sourced. Dated. Not written by the people it rates." Then the URL: ngscorecard.com. Hard cut to black.

## User flow worth showing
Landing page (pick an administration from the zone/era picker) → open the Promises tab and expand a real card to its sourced assessment → switch to the Fraud tab to see a real, amount-specific allegation → (framing beat) Compare view showing two administrations' tallies side by side. This is the actual product being used, not a marketing recreation — pull real copy from `data/seed/tinubu.json` and `src/components/PromiseCard.vue`'s real markup/classes.

## Tone
- Preset: cinematic
- Creative direction: a civic-accountability dossier trailer — serious, high-contrast, big type, the drama comes from the real scale and real numbers, never from mockery.
- Interpretation: wide, confident shots; few scenes with long holds; big Playfair Display headlines; dramatic wipes between beats; restraint in humor — the content (real fraud sums, real broken promises) supplies the weight on its own.

## Format: landscape — 1920x1080
## Duration: 20s

## Visual identity (from the project)
- Background: `#f6f8f3` (site light bg) for in-app scenes; `#073f2a` (--pt-green-900, deep forest) for hook/outro title cards
- Accent: `#008751` (--pt-green-600, flag green) and `#c7931d` / `#c9a227` (gold) for the rule/underline and "Kept" positives
- Text: `#1b2720` (--pt-ink) on light scenes; `#f4efe1` (parchment) on dark title cards
- Status colors: kept `#006b45` on `#dff5e8`; partial `#8a5a00` on `#fff1cc`; broken `#a2261b` on `#ffe5e1`
- Display font: Playfair Display (700/800 weight, and italic 400 for accents)
- Body font: Instrument Sans
- Strongest visual element: the PromiseCard's color-coded status badges and the site's faint green grid-line background texture; secondary reference: the canvas-drawn shareable "scorecard" PNG in `src/lib/scorecardImage.js` (forest/gold/parchment palette, same fonts) for the Compare/outro beat

## Share copy (draft)
Nigeria has had 207 governments since 1999. NGScorecard tracks every promise, every fraud case, and every broken record — sourced, dated, and free to check. → ngscorecard.com

## Audio direction
- Role: cinematic support — a steady bed that stays out of the way of the reveals
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady, clean, ~110 BPM)
- Music treatment: starts low under the hook's slam, holds steady through the UI beats, small swell into the fraud-figure moment, settles for the outro logo card, fades out over the last ~1s
- Music cue guidance: preset read (`vol-12.music-cues.md`, 109.96 BPM). Strong cues available near 8.74s, 13.11s, 17.47s, 22.93s — bias the Fraud-figure reveal (~scene 4 start) toward the 13.11s cue and the outro logo landing toward 17.47–18.56s, within the ±0.15s tolerance; don't force sequential card reveals onto the grid, just hold each to its reading floor.
- Audio-reactive treatment: subtle — the hook's gold underline and the fraud figure's scale-up may gain a faint presence bump on bass; no waveform/equalizer visuals.
- SFX posture: 2-3 big, restrained hits per the cinematic table — `impactBell_heavy_000` or `_004` for the hook slam, `impactSoft_medium_*` for the promise-card reveals, `impactBell_heavy_003` on the outro wordmark.
- Audio-coupled moments: the three promise cards arriving one by one (soft `interface/drop_*` on each, accent the first and last only), the fraud amount scaling up (one bell hit at full size), the Compare cards landing side by side.
- Restraint rule: no glitch/comedic SFX, no dense stacking — this project tracks real corruption allegations and real people; the audio must read as serious, not sensational.

## Storyboard

### Scene 1 — Hook — 3s
Dark forest-green (`#073f2a`) frame, faint green grid texture at low opacity. Huge white/parchment Playfair Display headline slams in center: "NIGERIA HAS HAD 207 GOVERNMENTS SINCE 1999." A thin gold rule draws left-to-right under "207" as it lands, then holds.
Sequential/interaction: none — single slam-in, full sentence must hold to its reading floor (~3s for a 7-word headline at this size).
Audio intent: cold open weight — the slam should feel like a stamp landing, not a jump-scare.
Audio-coupled idea: `impactBell_heavy_000` at the moment the text is fully settled; gold rule draw gets a very soft `interface/drop_001` if it doesn't compete with the bell.
Music: bed starts quiet under the slam, holding low.
Transition mood: dramatic wipe → Scene 2

### Scene 2 — Reveal — 3s
Cut to the real NGScorecard landing page: the "Find your administration" hero copy and eyebrow label, then a fast wipe into the zone-grouped governor picker filling in. Real lede text from `LandingView.vue` ("An independent, open tracker of Nigerian government promises versus delivery").
Sequential/interaction: yes — cursor moves to and clicks "Find your administration" / selects an administration card.
Audio intent: the site becoming real and tactile after the title-card abstraction.
Audio-coupled idea: `ui/mouseclick1` or `interface/click_00x` on the click.
Music: bed lifts slightly, rhythm becomes audible.
Transition mood: clean wipe → Scene 3

### Scene 3 — Key moment: Promises tab — 5s
The real Promises tab. Three PromiseCard rows arrive one by one (kept / partial / broken badges, real category + title text), each snapping into place. Cursor clicks one card; it expands to show its real assessment paragraph and a "Source →" link.
Sequential/interaction: yes — 3 cards arrive one by one (~0.5–0.6s apart, each held to its reading floor before the next lands), then one is clicked open.
Audio intent: rhythmic build, proof-of-work feeling — this is a system, not a mockup.
Audio-coupled idea: soft `interface/drop_00x` on each card arrival (accent the 1st and 3rd clearly, thin the middle one); `interface/select_008` on the click-to-expand.
Music: steady mid-energy, no swell yet.
Transition mood: hard cut → Scene 4

### Scene 4 — Key moment: Fraud tab, the real number — 4s
Tab switches to Fraud. A real card lands: "Ahmed Idris — Accountant General," status "Ongoing." The figure "₦109.5 billion" scales up hard as its own beat, large Playfair Display numerals, source link visible beneath.
Sequential/interaction: yes — tab switch, then the amount scales in as a distinct emphasis beat after the card itself has landed.
Audio intent: the gut-punch moment — this is real money, real allegation.
Audio-coupled idea: `interface/switch_00x` on the tab change; `impactBell_heavy_004` at the instant the ₦109.5bn figure lands at full size.
Music: small swell aligned near the 13.11s strong cue.
Transition mood: dramatic wipe → Scene 5

### Scene 5 — Compare + Outro — 5s
Quick beat: two administration cards side by side (Compare view), each with its own kept/partial/broken tally row — 1s hold, enough to register "two records, same standard." Wipe to the forest-green outro card: "NGScorecard" wordmark in Playfair Display, gold rule now complete beneath it, subhead "Sourced. Dated. Not written by the people it rates." then "ngscorecard.com" fades up last.
Sequential/interaction: none in the outro card itself; the Compare beat is a single simultaneous reveal, not sequential.
Audio intent: settle and land — confidence, not hype.
Audio-coupled idea: `impactBell_heavy_003` on the wordmark landing; nothing on the URL — let it sit in silence as the music fades.
Music: resolves and fades out over the final ~1s, roughly around the 17.47–18.56s cue window for the wordmark landing.
Transition mood: hard cut to black (end)

**Music mood for this video:** cinematic — steady and clean, one restrained swell into the fraud-figure beat, resolves on the outro.
**Audio summary:** A quiet, weighty open (bell + swelling bed) carries through two UI proof beats with soft tactile SFX, punches once hard on the real ₦109.5bn figure, then settles into a calm, confident outro landing with the bed fading under the URL.
