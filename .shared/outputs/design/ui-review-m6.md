# UI Review — M6 Pre-Launch
> Reviewer: Designer role
> Date: 2026-03-22
> Scope: All implemented components vs. design specs
> Verdict: **Launch-ready with 3 recommended fixes before go-live**

---

## Summary

The implementation is high quality and faithfully implements the design system. Tailwind config, globals.css, color tokens, typography, shadows, glassmorphism, and motion — all match specs precisely. The landing page, library, and clip viewer are excellent.

Three UX gaps exist that meaningfully affect the core coaching loop. Two are strong recommendations before launch; one can follow post-launch.

---

## ✅ Spec-Compliant (Excellent)

| Area | File | Assessment |
|---|---|---|
| Tailwind config | `tailwind.config.ts` | 100% match — all tokens, scales, shadows, motion |
| Global CSS | `globals.css` | hero-gradient, glass-panel, skeleton, float-animation — all match |
| Landing page | `src/app/page.tsx` | Hero, how-it-works, skills grid, CTA, footer — excellent |
| Library page | `src/app/library/page.tsx` | Grid, empty state, skeleton, filter count — spec-correct |
| Clip Viewer | `ClipViewerClient.tsx` | YouTube IFrame + timed annotations + glass-panel overlay — matches spec |
| SkillBadge | `SkillBadge.tsx` | Inline styles, interactive mode, a11y — correct approach |
| DifficultyPill | `DifficultyPill.tsx` | Dot system (●●●) is a nice unspecced enhancement |
| ClipCard (core) | `ClipCard.tsx` | Card hover states, thumbnail, fallback, skeleton — good |
| FeedbackPoller | `FeedbackPoller.tsx` | Processing state, aria-live, Sparkles icon — matches |
| Score ring | `FeedbackPage` | SVG ring with gradient, dashoffset math, countdown text — correct |
| Score breakdown | `FeedbackPage` | Bars with stagger-ready structure, positives/improvements grid |
| NavBar (desktop) | `NavBar.tsx` | Sticky, backdrop-blur, Get Started CTA — functional |
| RecordClient (core) | `RecordClient.tsx` | Camera stream, MediaRecorder, mirror, checklist, upload — functional |

---

## ⚠️ Deviations — Prioritized

### P0 — Fix Before Launch (UX-breaking)

#### 1. RecordPanel: No reference clip during recording
**File**: `src/app/library/[clipId]/record/RecordClient.tsx`
**Spec**: `record-panel.md` — left: reference clip (YouTube embed), right: webcam
**Implementation**: Only webcam panel. Reference clip is on the previous page.
**Impact**: The core value prop is "mimic what you just watched." Without seeing the reference while recording, learners can't compare in real-time — they have to hold it in memory. This weakens the learning mechanism.
**Fix**: Wrap the RecordClient in the record page layout with a 2-column grid. Embed the YouTube clip (read-only, no controls needed) on the left at reduced size, webcam on the right. Can reuse `ClipViewerClient` or a simpler static embed.
**Effort**: Low — add a split layout to the record page wrapper (`page.tsx`), not RecordClient itself.

---

#### 2. RecordPanel: No 3-2-1 countdown
**File**: `src/app/library/[clipId]/record/RecordClient.tsx`
**Spec**: `record-panel.md` — countdown overlay (3→2→1) on webcam panel before recording starts
**Implementation**: Clicking "Start Recording" goes directly to `recording` state.
**Impact**: Users are surprised into recording with no preparation. Countdown gives a 3-second mental reset — standard UX pattern for all recording apps (Loom, Zoom, etc.). Psychologically important for a coaching app where the user is performing.
**Fix**: Add a `countdown` state between `ready` and `recording`. On "Start Recording" click, set state to `countdown`, decrement from 3 to 0 via `setInterval(fn, 800)`, then trigger `startRecording()`.
**Effort**: Low — ~20 lines of logic + overlay div in the webcam panel.

---

### P1 — Strong Recommendation (significant gap, acceptable to ship without)

#### 3. FeedbackPage: No video comparison
**File**: `src/app/feedback/[sessionId]/page.tsx`
**Spec**: `feedback-score-card.md` — reference clip + user recording shown side-by-side
**Implementation**: Neither video is shown on the feedback page.
**Impact**: Users can't watch themselves back alongside the reference to identify what to fix. Self-comparison is a core coaching technique.
**Fix**: Add a 2-column video row below the AI tips section. Left: YouTube embed (read-only). Right: `<video>` tag pointing to the user's recording blob URL (available from `session.recordingUrl`).
**Note**: Requires `recordingUrl` to be returned from the API and accessible. Check `UserSession.recordingUrl` in schema.
**Effort**: Medium — video row component + data fetching.

---

### P2 — Polish (post-launch)

#### 4. ClipCard: Duration in body footer, not thumbnail overlay
**Spec**: Duration badge in bottom-right of thumbnail with `bg-black/60` pill
**Implementation**: Duration in card body with Play icon
**Impact**: Minor — still readable. Not worth delaying launch.

#### 5. ClipCard: Missing play button overlay on hover
**Spec**: Centered 48px amber circle with Play icon fades in on hover
**Implementation**: Only thumbnail scale-up on hover
**Impact**: Minor UX polish. Cards still clearly clickable.

#### 6. NavBar: No active route highlighting
**Spec**: `usePathname()` to highlight current route with `text-accent-400`
**Implementation**: Static links, no active state
**Impact**: Low — orientation cue is missing but site is small enough to not be disorienting.

#### 7. NavBar: No mobile hamburger drawer
**Spec**: `768px` breakpoint — hamburger opens a slide-down drawer
**Implementation**: Text labels hidden on mobile (`hidden sm:inline`), icons remain visible
**Impact**: Links still accessible via icons. Functional on mobile.

#### 8. FeedbackPage: max-w-2xl (too narrow on desktop)
**Spec**: `max-w-5xl` to support score ring + dimensions side-by-side
**Implementation**: `max-w-2xl` — single column layout
**Impact**: On large screens the feedback page feels narrow. Desktop users see a lot of empty space. Functional, not a blocker.

#### 9. FeedbackPage: Score ring color static (always amber)
**Spec**: Ring stroke color changes → green ≥80, amber 50-79, red <50
**Implementation**: Always uses amber gradient regardless of score
**Impact**: Slightly less expressive feedback signal. Score number already changes color correctly.

#### 10. FeedbackPoller: No rotating coaching tips during wait
**Spec**: Message cycles every 3s during processing
**Implementation**: Animated dots only
**Impact**: Minimal. Processing state is clean and functional.

---

## Annotation Overlay — Design Note
**File**: `ClipViewerClient.tsx`
The annotation overlay correctly uses `.glass-panel` and `animate-fade-in`. One note: the overlay appears at `bottom-16 left-4 right-4` (spanning full width) rather than at a positioned callout per annotation. This works well as a single active annotation display. The spec envisioned position zones (left/center/right × top/middle/bottom) but the current implementation is simpler and equally effective for MVP.

---

## Recommended Launch Sequence

```
Before launch (P0):
  □ Add 3-2-1 countdown to RecordClient
  □ Add reference clip to record page (split layout)

At launch:
  □ Verify env vars + seed data → M6 unblocked

Week 1 post-launch (P1):
  □ Add video comparison row to FeedbackPage

Month 1 (P2):
  □ NavBar active states + mobile drawer
  □ ClipCard play-button hover overlay
  □ FeedbackPage widen to max-w-5xl + score ring color
```

---

## Files Reviewed

| File | Lines |
|---|---|
| `tailwind.config.ts` | 153 |
| `src/app/globals.css` | 84 |
| `src/app/page.tsx` | 207 |
| `src/app/library/page.tsx` | 112 |
| `src/app/library/[clipId]/ClipViewerClient.tsx` | 153 |
| `src/app/library/[clipId]/record/RecordClient.tsx` | 239 |
| `src/app/feedback/[sessionId]/page.tsx` | 188 |
| `src/app/feedback/[sessionId]/FeedbackPoller.tsx` | 52 |
| `src/components/ClipCard.tsx` | 88 |
| `src/components/SkillBadge.tsx` | 47 |
| `src/components/DifficultyPill.tsx` | 59 |
| `src/components/NavBar.tsx` | 35 |
