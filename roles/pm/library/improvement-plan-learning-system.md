# Improvement Plan: From "Scoring Tool" to "Learning System"
> Source: Cross-mind synthesis — PM + Researcher + Scientist
> Date: 2026-04-06
> Prerequisite reading: `library/scientific-assessment-learning-loop.md`
> Effort breakdown: `library/effort-estimation-code-grounded.md`

---

## The Core Problem

seeneyu currently produces *moments of feedback*. A learning system produces *trajectories
of improvement*. The gap between the two is the gap between users who churn after 3 sessions
and users who practice for 90 days. Every gap identified maps directly to this.

---

## Initiative 1 — Session Delta: Make Progress Visible

**Scientific basis:** Ericsson's deliberate practice model requires users to perceive their
own improvement. Without visible trajectory, there is no evidence the practice mechanism is
working, and intrinsic motivation collapses (meta-analysis: 26% variance explained — but
users need to *see* that 26%).

**What to build:**
On the feedback page, when a user has a previous session on the same clip, show a delta
card above the score ring:
```
Eye Contact      6.2 → 7.4  (+1.2) ↑
Posture          5.1 → 5.8  (+0.7) ↑
Vocal Pacing     7.0 → 6.5  (-0.5) ↓   ← regression is also data
Overall         61  →  74  (+13)
```

**Implementation:** Single additional Prisma query in `FeedbackPage` server component —
`findFirst where clipId = X and userId = Y and completedAt < current, orderBy desc`.
No schema changes. All data exists.

**Progress page extension:** Replace static average scores with per-clip time-series
sparklines using scores already stored in `session.feedback`. Users should see
"my eye contact over 8 sessions" as a line, not a number.

**New API route:** Extract progress query to `/api/progress/route.ts` for mobile reuse.

**Success metric to track:** "Second attempt rate" — % of users who attempt the same
clip again after receiving feedback. The delta card should increase this because users
can see the improvement they're chasing.

---

## Initiative 2 — Feedforward: Surface the User's Best Moment

**Scientific basis:** Dowrick's feedforward mechanism (Grade A, ~200 studies) is the
strongest VSM effect. Showing users *themselves succeeding* — not the full recording —
raises self-efficacy and accelerates the next attempt most powerfully.

**What to build:**
1. Store `snapshotScores` per session (see schema note in effort doc)
2. Find 3–5 second peak window from stored snapshot data
3. On feedback page, surface as:
   > **Your Best Moment** — *at 0:04–0:07, your posture alignment peaked at 89.*
   > `[▶ Play this clip]`
4. The button seeks both the `<video>` recording and the YouTube iframe to the same
   timestamp (YouTube JS API `player.seekTo(sec)`)

**Longer-term virality:** The highlight reel is the thing the user shares.
*"seeneyu caught my best eye contact moment."* Social proof at zero incremental cost.

**Technical blocker:** `UserSession.scores` stores only aggregate. Must add
`snapshotScores Json?` field to schema before UI work can begin.

---

## Initiative 3 — Spaced Review: The Morning Cron Already Exists

**Scientific basis:** Spaced repetition is the single most evidence-backed finding in
learning science. Skills practiced once decay rapidly. Optimal review intervals:
`Score < 50 → 1 day | 50–70 → 3 days | 71–85 → 7 days | 86+ → 21 days`

**What to build:**

**Schema:**
```prisma
model UserSession {
  nextReviewAt  DateTime?
  reviewCount   Int       @default(0)
  @@index([nextReviewAt])
}
```

**After each session:** Compute and write `nextReviewAt` based on score in the feedback
route. When a review session completes (same clip, second+ attempt), update `nextReviewAt`
again with the new score's interval.

**Morning cron extension** (`/api/cron/morning/route.ts`): Query sessions where
`nextReviewAt <= now()`, include in daily plan, create `ScheduledNotification` records.

**Dashboard:** Add "Ready to Review" section above existing content — clip cards where
`nextReviewAt <= now()`, showing last score and days since practiced.

**Gamification hooks:**
- Add `review_session: 25` XP to `xp-engine.ts`
- Add weekly quest: "Complete 3 scheduled reviews this week" in `quest-generator.ts`
- Aligns scientifically optimal behavior with the gamification reward system

**Email trigger (M72 integration):** Add `review_reminder` trigger — fires when user
has ≥ 2 clips due for review and hasn't logged in for 24h.
Subject: *"Your eye contact practice from Tuesday is ready for round 2."*

---

## Initiative 4 — Ungate Dimension Bars for Free Users

**Scientific basis:** VSM and deliberate practice both require *specific* feedback.
A score of 74/100 gives no actionable information. "Eye contact: 6.2/10" does.
Without it, Basic users do "naive practice" — repetition that produces plateau, not growth.

**The current upgrade logic is counterproductive:** A user who can see *exactly* which
dimension is weak is a user who believes the system can help them. That belief drives
upgrades far more reliably than the frustration of an uninterpretable number.

**Revised tier structure:**
- **Basic (free):** Dimension bars visible — gives specific practice target
- **Standard:** Positives + improvements text + action plan steps
- **Advanced:** Holistic breakdown (visual/temporal/voice) + AI tips + highlight reel

This preserves a meaningful upgrade ladder while ensuring all users can actually do
deliberate practice.

**Implementation:** One line in `src/lib/access-control.ts`:
```typescript
// getFeedbackSections() default case — change:
dimensions: false  →  dimensions: true
```

---

## Sequencing Recommendation

| Priority | Initiative | Effort | Why this order |
|---|---|---|---|
| **1** | Ungate dimension bars | 15 min | Zero risk, unblocks 80% of users from deliberate practice loop immediately |
| **2** | Session delta + progress sparklines | 1 day | Same sprint, no schema changes, highest visible impact per hour |
| **3** | Feedforward best-moment highlight | 3 days | Requires schema migration; own PR |
| **4** | Spaced review scheduling | 5 days | Coordinate with M72 email triggers; most architectural |

**Total: ~9.5 engineering days** to close all four gaps.

---

## What This Plan Does NOT Include (By Design)

- **Redesigning Watch/Record as single-page flow** — scientifically optimal but high UX
  complexity. Motor priming gap is real but marginal vs. feedback loop gaps.
- **Building first-party outcome studies** — that's Scientist Sprint 2 work. Instrument
  after fixing the feedback loop so the data collected is clean.
- **New content types** — the gaps are in the learning mechanism, not the content library.

---

## The Learning Velocity Index (LVI) — New Core Metric

After these four initiatives, the platform can compute:

> **Average score improvement per skill, per user, over their first 5 sessions.**

This number is:
- The product's core investor claim ("users improve X points in Y sessions")
- The referral engine ("I improved 18 points in 2 weeks — try seeneyu")
- The internal signal for which clips and skills are actually working
- The differentiator from every competitor who cannot show this

**Target LVI to validate product-market fit:** +15 points in first 5 sessions per skill.
