# Milestone M11 — Observation Guide (Pre-Practice Clip Analysis)
**Status**: COMPLETE (code) — tester sign-off pending
**Tester approved**: Pending
**Completed**: 2026-03-23
**Owner**: Backend Engineer
**Commits**: 6dff36e, 538cbac

---

## What was built
Before learners click Record, they now see a structured breakdown of exactly how the clip scene was conducted — specific techniques, timestamps, and why each works.

**Deliverables:**
- `prisma/schema.prisma` — `observationGuide Json?` added to Clip model
- `src/lib/types.ts` — `ObservationMoment` + `ObservationGuide` interfaces
- `src/app/api/admin/clips/[id]/observation/route.ts` — POST route: AI generates observation guide for a clip
- `src/components/ObservationGuide.tsx` — Vertical timeline: headline + timestamped moments with why-it-works
- `src/components/ClipDetailTabs.tsx` — Tab bar: Watch | How It Works (switches between clip player and observation guide)
- `src/app/library/[clipId]/page.tsx` — Updated to use `ClipDetailTabs`
- `src/app/admin/clips/[id]/edit/page.tsx` — "Generate Observation Guide" button added
- `.shared/outputs/data/clips-seed.json` — observation_guide data for all 15 clips (via Data Engineer)
- `prisma/seed.ts` — patch + create logic for observationGuide field

## Key decisions
- Observation guide is AI-generated per clip (admin triggers via button) — not hardcoded per clip
- Data Engineer pre-populated observation guides for all 15 seed clips
- Tab pattern chosen over inline section: keeps clip viewer uncluttered, guide is opt-in before recording
- Guide headline + 5–6 timestamped moments per clip

## Tests passed
- Build: 0 TypeScript errors
- Designer spec compliance confirmed

## Bugs found + resolved
- None

## What's unlocked next
- M12 (Micro-Practice Stepper) — was blocked on M11 schema; now unblocked
