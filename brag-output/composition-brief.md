# Hyperframes Composition Brief: NGScorecard

## Objective
Create a short launch-style brag video for NGScorecard, an independent civic-accountability tracker of Nigerian government promises and delivery.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `/Users/mubaraq/Documents/Projects/Dev/JavaScript/ngscorecard`
- Primary files read: `index.html`, `README.md`, `FEATURES.md`, `src/assets/main.css`, `src/components/LandingView.vue`, `src/components/PromiseCard.vue`, `src/App.vue`, `src/lib/scorecardImage.js`, `data/seed/tinubu.json`
- Product name: NGScorecard
- Tagline / strongest claim: "Nigeria has had 207 governments since 1999." (derived stat: 207 tracked administrations, 1,058 promises, 271 fraud cases across `data/seed/*.json`)
- Key UI or visual moment to recreate: the `PromiseCard` component — a card with a category/title header, a color-coded status badge (kept/partial/broken/pending), and an expand interaction revealing a sourced assessment paragraph with a "Source →" link. Also the Fraud tab's amount-specific entries (e.g. "₦109.5 billion") and the Compare view's side-by-side administration tallies.
- Copy that must appear verbatim:
  - "NIGERIA HAS HAD 207 GOVERNMENTS SINCE 1999."
  - "Ahmed Idris — Accountant General" / "₦109.5 billion" / "Ongoing" (real fraud entry, `data/seed/tinubu.json` id 1)
  - "Sourced. Dated. Not written by the people it rates."
  - "ngscorecard.com"

## Creative Direction
- Tone preset: cinematic
- Creative direction: a civic-accountability dossier trailer — serious, high-contrast, big type; the drama comes from the real scale and real numbers, never from mockery of any person or party.
- Interpretation: wide confident shots, few scenes, longer holds than a chaotic edit; big Playfair Display headlines; dramatic wipes between beats; restrained SFX (2-3 big, tasteful hits, not a dense layer).
- Angle: This isn't a landing-page pitch, it's a ledger nobody asked to be kept — 207 administrations, 1,058 promises, 271 fraud cases, each sourced, none written by the people it's rating. The video opens like a dossier, shows the real product proving its claims (a sourced promise card, a real fraud figure), and lands on independence and citability.
- Hook: hard cut to a dark forest-green frame, huge serif type slams in reading "NIGERIA HAS HAD 207 GOVERNMENTS SINCE 1999," a gold rule draws under "207."
- Outro / punchline: forest-green wordmark card — "NGScorecard," gold rule now complete beneath it, subhead "Sourced. Dated. Not written by the people it rates.", then "ngscorecard.com" fades up last, hard cut to black.
- Avoid:
  - Generic SaaS language ("streamline," "supercharge," etc.)
  - Abstract filler visuals (no stock motion graphics, no waveform/equalizer visuals)
  - Mocking tone toward any named official — the real allegations carry their own weight; deliver them straight
  - Any invented statistic — every number shown must trace back to the source files above

## Visual Identity
- Background: `#f6f8f3` (site light bg, in-app scenes) / `#073f2a` (deep forest, title cards)
- Text: `#1b2720` (ink, light scenes) / `#f4efe1` (parchment, dark title cards)
- Accent: `#008751` (flag green) and `#c9a227` (gold) for rules/underlines and positive accents
- Status colors (must match exactly when recreating PromiseCard badges): kept `#006b45` text on `#dff5e8` bg; partial `#8a5a00` on `#fff1cc`; broken `#a2261b` on `#ffe5e1`; pending `#52605a` on `#eef2ee`
- Display font: Playfair Display (700/800 weight; italic 400 for accents) — Google Fonts, same family the site loads
- Body font: Instrument Sans — Google Fonts
- Visual references from the project: the site's faint green grid-line background texture (`body` background in `src/assets/main.css`); the `PromiseCard` card shape (rounded corners, header + expandable detail with source link); the canvas-drawn shareable scorecard card in `src/lib/scorecardImage.js` (same forest/gold/parchment palette) as a loose reference for the outro card's composition

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 3s — Title card, "NIGERIA HAS HAD 207 GOVERNMENTS SINCE 1999," gold rule draws under "207," full sentence must hold to its reading floor.
2. Reveal — 3s — Real landing page hero copy + zone-grouped administration picker; simulated click selecting an administration.
3. Promises tab — 5s — 3 real PromiseCard rows arrive one by one with real kept/partial/broken badges; one clicked open to its sourced assessment + source link.
4. Fraud tab, the real number — 4s — Tab switch to Fraud; real "Ahmed Idris — Accountant General" card lands; "₦109.5 billion" scales up as its own emphasis beat; "Ongoing" badge and source link visible.
5. Compare + Outro — 5s — Two administration cards side by side with kept/partial/broken tallies (1s), wipe to forest-green outro wordmark card with subhead and URL, hard cut to black.

## Audio
- Audio role: cinematic support — steady bed, out of the way of reveals, one restrained swell
- Audio arc: quiet weighty open (bell + low bed) → steady rhythm under the two UI proof beats → one swell into the fraud-figure hit → settles and fades under the outro URL
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (already copied into the composition's assets folder)
- Music treatment: start low under the hook slam (~0.25-0.3 volume), hold steady through scenes 2-3, small swell into scene 4's figure reveal, resolve and fade out over the final ~1s of scene 5
- Music cue guidance: bundled preset at `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` (and matching `.md`), 109.96 BPM, planning window 0-25s. Strong cues available at 8.74s, 13.11s, 17.47s, 18.56s, 22.93s. Suggested locks: bias the fraud-figure scale-up (scene 4, ~11-12s into the timeline) toward the 13.11s cue, and the outro wordmark landing (scene 5, ~16-17s in) toward the 17.47s or 18.56s cue — both within ±0.15s if it doesn't hurt pacing. Use 1-3 locks total; do not force the sequential card reveals in scene 3 onto the grid if it would rush their reading time — natural timing with a ~0.5-0.6s stagger takes priority over exact beat-grid snapping for those, since they carry text that must be read.
- Audio-reactive treatment: subtle — the hook's gold underline and the fraud-figure scale-up may gain a faint presence/glow bump tied to bass energy; no waveform, equalizer, or particle visuals.
- Audio-coupled moments:
  - Scene 1 hook slam — bell hit at the moment the full headline is settled
  - Scene 3 card arrivals — soft drop/card sound per card, accent the 1st and 3rd, thin the middle one; click sound on the expand interaction
  - Scene 4 tab switch — switch/toggle sound; bell hit exactly when "₦109.5 billion" reaches full size
  - Scene 5 outro wordmark — bell hit on landing; nothing on the URL, let it sit in near-silence as music fades
- SFX selection guidance: cinematic posture — 2-3 big, restrained hits (`impact/impactBell_heavy_000/_003/_004` family for the hook, tab-figure, and outro beats; `interface/drop_*` for card arrivals; `interface/click_*` / `ui/mouseclick1` for simulated clicks; `interface/switch_*` for the tab change). No glitch, error, or comedic SFX — the subject matter (real corruption allegations) rules out anything that reads as jokey.
- SFX analysis guidance: consult `~/.claude/skills/brag/assets/sfx/sfx-analysis.md` (or the marketplace copy at `/Users/mubaraq/.claude/plugins/marketplaces/brag/skills/brag/assets/sfx/sfx-analysis.md`) and prefer low/medium high-frequency-risk files, since this is a polished, repeated-motif edit.
- Exact SFX choice: Hyperframes should choose exact filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: music is already copied to `brag-output/composition/assets/music/` (with its cue preset under `assets/music/cues/`); Hyperframes should copy any SFX it selects into `brag-output/composition/assets/sfx/...` following the same convention.

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). `/brag` is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (the PromiseCard recreation and the real fraud entry both satisfy this — implement at least the PromiseCard one faithfully).
- Keep all text readable in the final render — respect the reading-time floors in `brag-plan.md` (short label ~0.8s settled, sentence ~0.3s/word).
- Keep the video within 15-25 seconds (target 20s per the plan).
- Include the planned music/SFX layer — audio was not disabled by the user.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints; ignore cues that hurt readability, scene pacing, or the product story. Use only 1-3 strong cue locks.
- Use SFX to support motion and interaction, and stay restrained given the subject matter.
- Honor the planned fade-out under the outro URL.
- When music is present, extract audio data and wire at least one existing visual element (glow/presence, not a waveform) to RMS/frequency energy — subtle only.
- Use local assets for audio (already staged in `composition/assets/`).
- Run `hyperframes check` before render — it is brag's single gate.
