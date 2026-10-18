# AI Tools for NGScorecard

Potential AI-powered features that amplify accountability and accelerate editorial workflows.

---

## 1. Outcome Verifier

**What it does:** Analyzes news articles, government statements, and reports to extract evidence supporting or contradicting tracked promises. Suggests status updates and surfaces missing evidence.

**Why it matters:** Journalists spend hours manually fact-checking promises against news. This automates the evidence extraction, flagging contradictions and new outcomes automatically.

**How it works:**
- Input: Article URL or text + promise ID
- Process: LLM extracts claims about budget spend, project completion, target achievement; cross-references against promise definition
- Output: Confidence score (high/medium/low) + suggested status (kept/partial/broken) + evidence snippet + link to source
- Editorial flow: Editor reviews suggestion, clicks "approve" to update

**Impact:** Reduces fact-checking time by 60-80%. Keeps promise ratings current. Surfaces new evidence journalists might miss.

**Effort:** Medium (API integration + prompt engineering + editorial UI)

**Status:** ✅ In progress — Web form built (OutcomeVerifier.vue), core API endpoints ready, can be integrated into app routes

---

## 2. Promise Classifier

**What it does:** Given a new government promise (campaign speech, manifesto, budget announcement), automatically categorizes it into existing promise buckets, flags similar historical promises, detects contradictions with prior statements.

**Why it matters:** New promises arrive constantly. Manual classification is slow. AI reduces intake friction and surfaces when a leader contradicts their own past.

**How it works:**
- Input: New promise text + administration
- Process: LLM embeds promise, finds closest matches in historical dataset, categorizes into sectors (health, energy, infrastructure, etc.)
- Output: Suggested category + matching promises from past administrations + contradiction alerts (if applicable) + confidence scores
- Editorial flow: Editor reviews, adjusts category if needed, adds to tracker

**Impact:** Accelerates data intake 5-10x. Catches contradictions that reveal political patterns. Deepens institutional memory.

**Effort:** Medium-High (embedding model + semantic search + contradiction detection)

**Status:** ✅ In progress — Core API endpoints ready, admin dashboard form built

---

## 3. Pattern Detector

**What it does:** Scans the entire NGScorecard dataset to identify statistically significant patterns: which sectors have highest failure rates, which governors deliver best, which administrations keep energy promises, which states consistently underfunded.

**Why it matters:** Patterns are where investigative stories live. "X administration breaks infrastructure promises 75% of the time, while Y state delivers 60%." Journalists need these insights to pitch investigations.

**How it works:**
- Input: Full promise dataset (status, sector, administration, state, amount, date)
- Process: Aggregate statistics by sector/admin/state/leader; flag anomalies (e.g., one governor outperforms all peers by 30%; one sector universally broken)
- Output: Pattern cards ("Infrastructure promises: 30% kept, 50% broken, 20% partial — lowest across all sectors")
- UI: Filterable dashboard; exportable for journalists

**Impact:** Unlocks investigative angles. Shifts NGScorecard from record-keeping to insight generation. High-impact stories.

**Effort:** Medium (data pipeline + statistical analysis + visualization)

**Status:** ✅ In progress — SQL aggregations + Claude insights + admin dashboard built

---

## 4. Real-time Tracker

**What it does:** Monitors official government sources (press releases, budget announcements, campaign statements, legislative notices) and flags trackable new promises. Routes to editorial queue.

**Why it matters:** NGScorecard is reactive (promises added after the fact). Real-time capture means tracking starts on day one, catching promises at their peak media moment.

**How it works:**
- Input: RSS feeds from presidency, state governments, National Assembly, news outlets covering government
- Process: LLM screens for promise-like statements ("will build," "commit to," "allocate budget to," "target is X by date Y")
- Output: Queue of flagged statements with suggested classification, confidence score, fact-check status
- Editorial flow: Editor reviews, decides to track or skip, adds to dashboard

**Impact:** Keeps dataset current. Catches promises at their moment. Better baseline for outcome tracking.

**Effort:** Medium (feed aggregation + real-time LLM + queue UI)

**Status:** ✅ In progress — RSS scanning + Claude screening + editorial queue in admin dashboard

---

## 5. Accountability Alert System

**What it does:** Pushes accountability into voters' and journalists' hands. Subscribers get alerts when tracked promises are due, when deadlines pass, when new evidence emerges, or when a leader makes contradictory statements.

**Why it matters:** Voters care about promises, but don't check NGScorecard daily. Alerts bring accountability into their attention stream (email, SMS, WhatsApp, push).

**How it works:**
- Input: Voter/journalist subscribes to topics (e.g., "healthcare promises by sitting governor")
- Triggers:
  - Deadline approaching (e.g., "promised hospital by June 2026, 3 months left")
  - Deadline passed with no update
  - New evidence added (outcome verifier flags an update)
  - Contradiction detected (leader contradicts own promise)
  - Sector performance drop (e.g., "infrastructure promises this quarter: 10% kept, was 40% last quarter")
- Output: Actionable alert + link to promise card + suggested action for journalist

**Impact:** Makes accountability real-time and personal. Amplifies NGScorecard's reach to non-specialist audiences.

**Effort:** Medium-High (alert engine + subscription UI + multi-channel delivery + personalization)

---

## 6. Comparative Impact Calculator

**What it does:** Quantifies the human cost of broken promises. "If the power plant promised for Kano had been built, how many jobs? How many households electrified? What was the economic cost of the delay?"

**Why it matters:** "Promise broken" is abstract. "2 million people still without reliable power, economic loss: ₦50bn/year" is real. Journalists use this to write impact pieces.

**How it works:**
- Input: Promise (e.g., "build 500 MW power plant in Kano by 2024")
- Process: LLM estimates counterfactual impact using public data (population served, project cost, historical impact of similar projects, opportunity cost)
- Output: Impact card ("If kept: 2M people with 24/7 power, ₦100K/household/year economic benefit. Kept: No. Cost: ₦50bn/year lost productivity")
- UI: Impact cards on promise cards; exportable for reports

**Impact:** Makes consequences visible. Drives emotional resonance. Journalists pitch "cost of broken promises" stories.

**Effort:** High (impact modeling + data sourcing + validation)

---

## 7. Contradiction Finder

**What it does:** Scans a leader's entire promise history and flags internal contradictions ("In 2019 you promised to reduce government spending by 20%. In 2023 you promised a ₦5tn infrastructure budget. How do both work?").

**Why it matters:** Contradictions expose inconsistency and can be political ammunition or story hooks. Journalists use them in accountability pieces.

**How it works:**
- Input: One administration's full promise set
- Process: LLM identifies logical conflicts (incompatible targets, conflicting budget allocations, impossible timelines)
- Output: Contradiction cards ("Promise A (2019) conflicts with Promise B (2023): both can't be true")
- Editorial use: Flagged in context when editing promises; journalists export for analysis pieces

**Impact:** Surfaces hypocrisy and inconsistency. Ammunition for investigative journalism. Holds leaders accountable for their own contradictions.

**Effort:** Medium (logical reasoning + semantic understanding)

---

## 8. Promise Recommendation Engine

**What it does:** For a voter or journalist, recommends which promises to pay attention to based on their interests, geography, or sector focus.

**Why it matters:** NGScorecard has 1000+ promises. A voter in Lagos cares about Lagos promises. A tech journalist cares about digital economy promises. Personalization drives engagement.

**How it works:**
- Input: User profile (state, sector interests, role—voter/journalist/researcher)
- Process: Collaborative filtering + content-based recommendation; prioritize high-impact broken promises + upcoming deadlines
- Output: Personalized feed ("5 promises affecting you this month"; "top 3 at-risk promises in your sector")
- UI: Dashboard; email digest option

**Impact:** Increases engagement with non-specialist audiences. Makes NGScorecard sticky. Drives accountability at local level.

**Effort:** Medium (recommendation system + personalization + feed UI)

---

## 9. Data Quality Audit Tool

**What it does:** Scans the dataset for gaps, flags promises missing evidence or verification, suggests high-value sources to fill gaps.

**Why it matters:** Data credibility is NGScorecard's core asset. Auditing ensures it stays high-quality and trustworthy.

**How it works:**
- Input: Full promise dataset
- Process: LLM flags:
  - Promises with no source link
  - Outcomes with no evidence
  - Suspicious timelines (promise made after deadline, or retroactively)
  - Low-confidence ratings
  - Duplicates or near-duplicates
- Output: Quality report + remediation queue (e.g., "10 promises need sources, suggested: INEC, budget office, news archive")
- Editorial flow: Editor triages, assigns to researchers

**Impact:** Maintains data integrity. Surfaces blind spots. Guides research priorities.

**Effort:** Low-Medium (data validation + gap analysis)

---

## 10. Lie Detector / Policy Fact-Checker

**What it does:** Given a government statement or budget document, checks if the claims match what NGScorecard has on file. Flags new contradictions in real-time.

**Why it matters:** Officials sometimes claim they delivered promises they didn't. Or they redefine what they promised. This catches those moves in real-time.

**How it works:**
- Input: Press release, budget speech, or official statement
- Process: LLM extracts factual claims ("We built 500 hospitals"; "Spent ₦2tn on healthcare"); cross-references against promise database and outcome records
- Output: Fact-check card ("Claimed: '500 hospitals built.' Reality: 120 promised, 80 built as of last update.")
- Use: Journalists cite in real-time fact-checking; social media integration

**Impact:** Real-time accountability. Catches officials in false claims immediately. Supports fact-checking journalism.

**Effort:** Medium (claim extraction + entity linking + cross-reference logic)

**Status:** ✅ In progress — Claim extraction + database cross-reference + verdict cards in admin dashboard

---

## Priority Ranking

**Build first (Highest ROI, lowest friction):**
1. **Outcome Verifier** — Plugs into editorial workflow, saves journalist time immediately
2. **Promise Classifier** — Accelerates data intake, catches contradictions
3. **Pattern Detector** — Unlocks investigative angles

**Build second (Medium effort, high impact):**
4. **Real-time Tracker** — Keeps dataset fresh and relevant
5. **Data Quality Audit** — Ensures credibility as you scale

**Build after scale (Higher effort, long-term impact):**
6. **Accountability Alerts** — Needs a user base first; drives engagement once core tools mature
7. **Comparative Impact** — Requires external data sources and validation; high-value but complex
8. **Contradiction Finder** — Nice-to-have for investigative journalism; lower priority than core tools

---

## Implementation Notes

- **MVP approach:** Start with Outcome Verifier. Build as a browser extension or Slack bot for editorial team. Gather feedback, iterate.
- **Data dependencies:** Outcome Verifier and Contradiction Finder need your full promise dataset. Classifier and Pattern Detector work better after 500+ promises are tracked.
- **API strategy:** Consider exposing these as APIs so external developers can build on NGScorecard (e.g., a voter alert app that uses your Recommendation Engine).
- **Transparency:** Every AI-generated insight should be flagged as such and linked back to sources. Maintain trust by being clear about where suggestions come from.
