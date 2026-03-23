# Milestone M12 — Micro-Practice Stepper (Duolingo-Style Chunked Learning)
**Status**: COMPLETE (code) — tester sign-off pending
**Tester approved**: Pending
**Completed**: 2026-03-23
**Owner**: Backend Engineer
**Commit**: 538cbac

---

## What was built
Practice is now split into 3–5 micro-steps. Each step focuses on one skill element, has a max 30s recording, and delivers instant AI feedback on just that element. Completing all steps unlocks the Full Performance challenge.

**Deliverables:**
- `prisma/schema.prisma` — `PracticeStep` model + `MicroSession` model
- `src/lib/types.ts` — `PracticeStep` + `MicroFeedback` interfaces
- `src/app/api/micro-sessions/route.ts` — POST: upload micro-recording + instant AI feedback
- `src/app/library/[clipId]/practice/page.tsx` — Step-by-step practice page (new route)
- `src/components/StepCard.tsx` — Step card: title, focus, instruction, progress
- `src/components/PracticeRecorder.tsx` — 30s max recorder with SVG countdown ring
- `src/components/MicroFeedbackCard.tsx` — Instant per-step feedback card (animate-slide-up)
- `src/components/PerformanceUnlockScreen.tsx` — Celebration screen when all steps complete
- `src/components/MicroPracticeFlow.tsx` — Master stepper: orchestrates steps, recorder, feedback, unlock
- Clip detail page CTA updated: now routes to `/library/[clipId]/practice` instead of `/record`
- Data Engineer pre-populated practice_steps for all 15 clips in clips-seed.json

## Key decisions
- 30s hard limit per micro-step (enforced in PracticeRecorder) — enough for one focused behavior
- Instant feedback per step — no waiting; keeps learner engaged between steps
- Short recordings (≤30s) always produce ≥1 frame for AI analysis (fallback ensured)
- PerformanceUnlockScreen gates the full-length recording — micro-steps first
- Whisper audio for vocal-pacing clips — transcribes speech for pacing analysis

## Tests passed
- Build: 0 TypeScript errors
- Designer spec compliance confirmed (5 components match m12-spec.md)

## Bugs found + resolved
- None

## What's unlocked next
- M13 (Onboarding Assessment + Learning Path) — was blocked on M12; now unblocked
- Tester sign-off required to formally close M11 + M12
