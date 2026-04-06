# Scientific Assessment: seeneyu's Learning Loop
> Source: Cross-mind analysis by PM + Researcher + Scientist
> Date: 2026-04-06
> Based on: Coach Noey's Lab Sprint 1 (4 threads, 23 sources)
> Reference: `roles/scientist/lab/evidence-brief/index.html`

---

## What seeneyu Gets Exactly Right

**The core loop architecture is scientifically sound.**
Watch → Record → AI Feedback → Repeat satisfies all four evidence threads simultaneously.
No competitor does this. That is a genuine differentiator and it's real, not marketing.

**The side-by-side comparison on the feedback page** (`/feedback/[sessionId]/page.tsx:244–272`)
is textbook VSM (Video Self-Modeling). Showing the reference clip and the user's own recording
next to each other is precisely what Dowrick's self-review mechanism describes.
Most products in this space have never done this.

**MediaPipe client-side scoring** producing dimension-level metrics (face, posture, hands,
temporal, voice) is exactly what Schmidt & Lee's motor schema theory says is required —
high-specificity feedback builds more precise motor schemas than vague human feedback.
This is the scientific argument for AI over human coaching, and it's already built.

**The Observation Guide** before the clip plays creates the intentional "watching-to-mimic"
framing. Buccino et al. (2004) showed this activates a neurologically stronger imitation
circuit than passive watching.

---

## Three Serious Scientific Gaps

### Gap 1 — The Feedback Loop Doesn't Close Across Sessions
**The biggest problem.**

The progress page shows an average score per skill across all sessions, but there is no
session-to-session trajectory. Ericsson's deliberate practice model says users must see
progressive improvement to sustain motivation. Users need to see:
`"Eye contact: 45 → 62 → 71 → 78 over 5 sessions"`

What's missing: when a user opens feedback after a second attempt at the same clip, the
page should prominently show:
> *"Eye contact: 62 → 74 (+12) since your last attempt."*

That delta is the proof of the deliberate practice mechanism working. Currently doesn't exist.

**Also:** The progress page query is missing a `userId` filter — it fetches sessions for all users. This is also a bug to fix.

### Gap 2 — The VSM Comparison Is Passive — Feedforward Mechanism Is Missing
The side-by-side exists but doesn't do the key work. Dowrick's feedforward mechanism
(Grade A, 150+ studies) — the *most effective* VSM form — requires showing users only
their *best performing moments*, not the full recording.

Currently the feedback page plays the user's entire recording. What it should do:
- Identify the 3–5 second window where the user's composite score was highest
- Surface as: *"Your best moment at 0:04–0:07 — this is what you're building toward"*
- Provide a `[▶ Play this clip]` button that seeks both the recording and the reference clip to that timestamp

**Technical blocker discovered:** `UserSession.scores` currently only stores
`{ overallScore, dimensions }` (aggregate). Per-snapshot scores are not persisted.
A new `snapshotScores Json?` field is required before this UI feature can be built.

### Gap 3 — No Spaced Review — Practice Decays Without Scheduled Return
Complete gap. No mechanism recommends *when to return* to a practiced clip.
Skills practiced once decay rapidly without review at expanding intervals:
`1 day → 3 days → 7 days → 21 days`

Streaks/XP incentivize daily activity but not *which clip* to revisit for optimal retention.

The `learning-assistant` engine with morning cron (`/api/cron/morning`) is the natural
hook — but `UserSession` has no `nextReviewAt` field and the `skill-gap-analyzer` doesn't
query `UserSession` at all (only arcade, foundation, and skill baselines).

---

## Two Things That Actively Undermine the Science

### 1. Gating Dimension Bars Behind Standard Plan
`access-control.ts:getFeedbackSections()` — default (free) returns `dimensions: false`.

Without dimension scores, Basic users cannot do deliberate practice — they have no
specific feedback to act on. This produces "naive practice" (Ericsson's term for
repetition without feedback that yields plateau, not growth). These users will churn.

The fix is one line: `dimensions: true` in the default case.

### 2. Watch and Record Are on Separate Pages
Motor neuron priming from watching the reference clip decays in seconds. By the time a
user navigates from `/library/[clipId]` to `/library/[clipId]/practice` and starts the
flow, the motor pre-activation has dissipated. Optimal: watch clip → immediately record
in the same UI with the clip visible alongside the camera feed.

(Lower priority than the three gaps above — the other gaps have greater outcome impact.)

---

## Competitive Scorecard

| Scientific Principle | seeneyu Status | Gap |
|---|---|---|
| Expert model observation (Thread 03) | ✅ Hollywood clips + Observation Guide | Minor: watch-to-record navigation gap |
| Physical practice encoding (Thread 04) | ✅ MediaPipe recording | Minor: no warm-up embodiment prompt |
| Video self-modeling review (Thread 02) | ⚠️ Side-by-side exists, not feedforward | Missing: best-moment highlight reel |
| Deliberate practice feedback loop (Thread 01) | ⚠️ Single-session scoring only | Missing: cross-session trajectory delta |
| Spaced repetition | ❌ Not implemented | Full gap |
| Specific feedback (motor schema precision) | ⚠️ Gated behind Standard plan | Basic users get insufficient specificity |

---

## The North Star Metric This Creates

After bridging these gaps, the platform can compute for the first time:

> **Average score improvement per skill, per user, over their first 5 sessions.**

Call it the **Learning Velocity Index (LVI)**. This becomes:
- The product's core investor claim
- The engine of referral ("I improved 18 points in 2 weeks")
- The feedback signal for which clips and skills are working

Everything flows from having this number. Initiative 1 (session delta) is what creates it.
