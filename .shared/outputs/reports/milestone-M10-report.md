# Milestone M10 — Script-Aware Coaching Loop
**Status**: COMPLETE ✓
**Tester approved**: Pending (code complete + deployed)
**Completed**: 2026-03-23
**Owner**: Backend Engineer
**Commit**: ae12429

---

## What was built
Enhanced the coaching loop so learners see the character they're mimicking, the exact script used in the scene, and receive structured AI feedback with numbered action steps.

**Deliverables:**
- `prisma/schema.prisma` — `script String? @db.Text` added to Clip model
- `src/lib/types.ts` — `ActionPlanStep` type + `steps[]` in `FeedbackResult` + `script` in `Clip`
- `src/app/api/sessions/[id]/feedback/route.ts` — GPT prompt includes character name + script context; returns structured `steps[]`; no-frames fallback added
- `tailwind.config.ts` — `fade-in-up` keyframe animation added
- `src/components/CharacterBanner.tsx` — Character name + film + role context coaching card
- `src/components/ScriptPanel.tsx` — Dialogue/action script display with syntax distinction
- `src/app/library/[clipId]/record/page.tsx` — CharacterBanner + ScriptPanel integrated
- `src/app/feedback/[sessionId]/page.tsx` — ActionPlan section (numbered improvement steps)
- `src/app/admin/clips/ClipForm.tsx` — Script/Dialogue textarea added to admin form
- `prisma/seed.ts` — script field added; Data Engineer wrote all 15 scripts to clips-seed.json

## Key decisions
- Script display distinguishes dialogue clips (quoted lines) vs. physical skill clips (numbered action instructions)
- AI prompt injects character + script context to produce more relevant, personalized feedback
- `steps[]` in feedback follows a deterministic JSON schema — always at least 2 action steps
- No-frames fallback: feedback API continues even if no frames captured (text-only response)
- BUG-001 fix applied here: ClipForm dimension scores now min=1 max=3, difficultyScore min=4 max=12

## Tests passed
- Designer UI review: PASS (no P0/P1 issues)
- Build: 0 TypeScript errors

## Bugs found + resolved
- BUG-001 (from M8): Fixed — ClipForm score range corrected to 1–3 per dimension

## What's unlocked next
- M11 (Observation Guide) — adds pre-practice clip analysis tab
- Data Engineer needs user to run: `npm run db:push` + `npx prisma generate` + `npx prisma db seed` to apply script field
