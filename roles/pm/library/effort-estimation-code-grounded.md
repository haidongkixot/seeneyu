# Effort Estimation — Code-Grounded
> Source: Codebase analysis by PM + Scientist
> Date: 2026-04-06
> Prerequisite: `library/scientific-assessment-learning-loop.md`
> Plan context: `library/improvement-plan-learning-system.md`

---

## Critical Pre-Discovery

Before estimating Initiative 2 (Feedforward), a schema blocker was found:

```typescript
// src/app/api/sessions/[id]/feedback/route.ts — line 195
scores: JSON.parse(JSON.stringify({
  overallScore: feedback.overallScore,
  dimensions: feedback.dimensions
}))
```

The `analysisSnapshots` array (per-frame MediaPipe data with timestamps) is processed
but **NOT persisted**. Only the aggregate score is stored. Identifying "your best moment
at 0:04" requires a schema change before any UI work can begin.

---

## Initiative 4 — Ungate Dimension Bars

**Files touched: 1 | Schema changes: 0 | Effort: 15 minutes | Risk: None**

```
src/lib/access-control.ts  — getFeedbackSections() default case, line ~85
```

**Change:**
```typescript
// Before:
default: return { score: true, summary: true, dimensions: false,
                  positives: false, improvements: false, steps: false,
                  tips: false, advancedTips: false }
// After:
default: return { score: true, summary: true, dimensions: true,
                  positives: false, improvements: false, steps: false,
                  tips: false, advancedTips: false }
```

Everything else already wired: progress bars render, data already returned from API,
`LockedFeedbackSection` wrapping already conditional on this flag. Zero regression risk.

---

## Initiative 1 — Session Delta + Progress Sparklines

**Files touched: 3 | Schema changes: 0 | Effort: 1 day | Risk: Low**

### File 1: `src/app/feedback/[sessionId]/page.tsx` (390 lines → +~40 lines)

`FeedbackPage` server component already has `userSession` with `userId` + `clipId`.
Add one query:
```typescript
const previousSession = await prisma.userSession.findFirst({
  where: {
    clipId:      userSession.clipId,
    userId:      userSession.userId,
    status:      'complete',
    id:          { not: sessionId },
    completedAt: { lt: userSession.completedAt }
  },
  orderBy: { completedAt: 'desc' }
})
```
Add `DeltaCard` component (~25 lines) rendering dimension deltas.
Pass `previousSession.scores` to `FeedbackDisplay`.

### File 2: `src/app/progress/page.tsx` (106 lines → ~200 lines, full rewrite)

**Bug found en route:** Current query has no `userId` filter — fetches sessions for ALL
users. Fix this while rewriting.

Changes:
- Group sessions by clip (not just skill) to show per-clip improvement over time
- Add SVG sparkline component (~30 lines, no library needed) using scores in
  `session.feedback` already stored
- Add auth check + userId filter

### File 3: `src/app/api/progress/route.ts` (new file, ~50 lines)

Extract progress data query from page into proper API route — cacheable and reusable
by the mobile app.

---

## Initiative 2 — Feedforward Best-Moment Highlight

**Files touched: 4 | Schema changes: 2 fields (nullable) | Effort: 3 days | Risk: Medium**

### Day 1 — Store per-snapshot scores

**`prisma/schema.prisma`** — add to UserSession:
```prisma
snapshotScores      Json?   // [{sec: number, score: number}] for peak detection
recordingDurationSec Int?   // needed for timestamp calculation
```
`npx prisma db push` — non-breaking, both nullable.

**`src/app/api/sessions/[id]/feedback/route.ts` (337 lines)**
In the MediaPipe path (~line 119), compute per-snapshot composite scores:
```typescript
const snapshotScores = analysisSnapshots.map((snap, i) => ({
  sec: (i / analysisSnapshots.length) * recordingDuration,
  score: scoreSnapshot(snap, skill)  // extract from computeHolisticScore
}))
const peakWindow = findPeakWindow(snapshotScores, 3)  // 3-second window
// Add to prisma.userSession.update: snapshotScores, recordingDurationSec
```
The `scoreSnapshot` function requires extracting per-frame logic from
`computeHolisticScore` in `src/services/holistic-scorer.ts` — a refactor,
not new logic (that function already iterates snapshots).

Client must send `recordingDurationSec` in POST body alongside `analysisData`.

### Day 2 — Feedback page UI

**`src/app/feedback/[sessionId]/page.tsx`**

Add `BestMomentCard` component:
- Shows: *"Your best moment: 0:04–0:07 · Score: 89"*
- `seekTo` button on `<video>` element: `videoRef.current.currentTime = peakSec`
- YouTube iframe `seekTo`: requires `?enablejsapi=1` in src, `onReady` callback,
  `player.seekTo(sec)` call (~30 lines)

### Day 3 — Testing + edge cases

- Handle case where `snapshotScores` is null (GPT-4o Vision path, older sessions)
- Handle very short recordings (< 3 seconds, no valid peak window)
- Verify YouTube iframe seekTo works cross-browser

**Risk:** The holistic scorer refactor is the only technically involved piece.
YouTube `seekTo` integration is straightforward but requires browser testing.

---

## Initiative 3 — Spaced Review Scheduling

**Files touched: 7 | Schema changes: 2 fields + 1 index | Effort: 5 days | Risk: Medium-High**

### Day 1 — Schema + feedback route hook

**`prisma/schema.prisma`:**
```prisma
model UserSession {
  ...
  nextReviewAt  DateTime?
  reviewCount   Int        @default(0)
  @@index([nextReviewAt])   // critical for cron query performance
}
```

**`src/app/api/sessions/[id]/feedback/route.ts`:**
After saving feedback, compute and write `nextReviewAt`:
```typescript
const score = feedback.overallScore
const days = score < 50 ? 1 : score < 70 ? 3 : score < 85 ? 7 : 21
const nextReviewAt = addDays(new Date(), days)
await prisma.userSession.update({
  where: { id: sessionId },
  data: { nextReviewAt, reviewCount: { increment: 1 } }
})
```
On review session completion (same clip, `reviewCount > 0`), update `nextReviewAt`
again with new score's interval.

### Day 2 — Learning engine integration

**`src/engine/learning-assistant/analyzers/skill-gap-analyzer.ts`**
Add `UserSession` queries alongside existing arcade/foundation queries.
Extend return type with `clipsReadyForReview: Array<{clipId, clipTitle, lastScore, nextReviewAt}>`.

**`src/engine/learning-assistant/planners/activity-planner.ts`**
Include `clipsReadyForReview` in `PlannedActivity` output. Add `review` activity type
alongside existing `practice` and `foundation` types.

### Day 3 — Morning cron + notifications

**`src/app/api/cron/morning/route.ts`**
After plan generation, add:
```typescript
const reviewsDue = await prisma.userSession.findMany({
  where: { userId, nextReviewAt: { lte: new Date() }, status: 'complete' },
  orderBy: { nextReviewAt: 'asc' },
  take: 3
})
// Create ScheduledNotification records via existing scheduleReminders planner
```
**Risk here:** Prevent duplicate notifications if user hasn't acted on review.
Needs "notified" flag or deduplication by `nextReviewAt` date window.

### Day 4 — Dashboard UI

**`src/app/dashboard/page.tsx`**
Add "Ready to Review" section (~60 new lines):
- Clip cards where `nextReviewAt <= now()`
- Shows last score + days since practiced
- Links directly to `/library/[clipId]/record`

### Day 5 — Gamification + email

**`src/services/gamification/xp-engine.ts`**
Add `review_session: 25` to `XP_AMOUNTS`.
Detect review sessions in feedback route (`reviewCount > 0`) → call
`processActivity('review_session')` instead of `practice_session`.

**`src/services/gamification/quest-generator.ts`**
Add weekly quest: `complete_3_reviews` (~20 lines, follows existing pattern).

**`src/engine/learning-assistant/triggers/email-triggers.ts`**
Add `review_reminder` trigger: fires when user has ≥ 2 clips with
`nextReviewAt <= yesterday` and hasn't logged in 24h.
Subject line: *"Your eye contact practice from Tuesday is ready for round 2."*

---

## Summary Table

| # | Initiative | Effort | Files | Schema | Risk | Blocker |
|---|---|---|---|---|---|---|
| 4 | Ungate dimension bars | **15 min** | 1 | 0 | None | None |
| 1 | Session delta + sparklines | **1 day** | 3 | 0 | Low | Fix userId filter bug en route |
| 2 | Feedforward best-moment | **3 days** | 4 | 2 nullable fields | Medium | Must persist snapshotScores first |
| 3 | Spaced review scheduling | **5 days** | 7 | 2 fields + index | Med-High | Coordinate with M72 email triggers |

**Total: ~9.5 engineering days**

---

## Ship Order

```
Week 1, Day 1:   Initiative 4 (15 min)  ← today, own commit
Week 1, Day 1–2: Initiative 1 (1 day)   ← same sprint as I4
Week 2:          Initiative 2 (3 days)  ← own PR with schema migration
Week 3–4:        Initiative 3 (5 days)  ← coordinate M72 email triggers
```

## Key Files Reference

| File | Lines | Role in plan |
|---|---|---|
| `src/app/feedback/[sessionId]/page.tsx` | 390 | I1: delta card; I2: best-moment card |
| `src/app/progress/page.tsx` | 106 | I1: sparklines (full rewrite) |
| `src/lib/access-control.ts` | 164 | I4: ungate dimensions (1 line) |
| `src/app/api/sessions/[id]/feedback/route.ts` | 337 | I1: prev session query; I2: store snapshots; I3: nextReviewAt |
| `src/engine/learning-assistant/analyzers/skill-gap-analyzer.ts` | — | I3: add UserSession queries |
| `src/engine/learning-assistant/planners/activity-planner.ts` | — | I3: review activity type |
| `src/app/api/cron/morning/route.ts` | — | I3: review queue |
| `src/app/dashboard/page.tsx` | — | I3: "Ready to Review" section |
| `src/services/gamification/xp-engine.ts` | — | I3: review_session XP |
| `src/services/gamification/quest-generator.ts` | — | I3: complete_3_reviews quest |
| `src/engine/learning-assistant/triggers/email-triggers.ts` | — | I3: review_reminder |
| `prisma/schema.prisma` | — | I2: snapshotScores, recordingDurationSec; I3: nextReviewAt, reviewCount |
