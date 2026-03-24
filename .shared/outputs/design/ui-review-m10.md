# UI Review — M10 Script-Aware Coaching Loop
> Reviewer: Designer
> Date: 2026-03-23
> Files reviewed: CharacterBanner.tsx, ScriptPanel.tsx, feedback/[sessionId]/page.tsx (ActionPlan), record/page.tsx

---

## Verdict: PASS ✅

All three components are spec-compliant. Implementation closely follows the M10 spec. Two low-priority notes below.

---

## CharacterBanner — PASS ✅

| Check | Result |
|---|---|
| Container classes | ✅ Exact match |
| Icon badge (accent-400/10, rounded-xl) | ✅ Match |
| Character name typography (text-lg→xl, font-semibold) | ✅ Match |
| Byline (actor · movie, text-secondary) | ✅ Match — `actorName` nullable handled cleanly |
| "NOW MIMICKING" chip (hidden md:flex, pill, tracking-wider) | ✅ Exact match |
| Conditional render (only when clip.characterName) | ✅ Correct |
| Placement (full-width, above split columns) | ✅ Correct |

**Note (low)**: Component uses `animate-fade-in` but the tailwind.config only defines `fade-in-up` (added for ActionPlan). Ensure `animate-fade-in` is also defined, otherwise the animation silently does nothing. Suggest either: add `fade-in` keyframe, or change to `animate-fade-in-up` for consistency.

---

## ScriptPanel — PASS ✅

| Check | Result |
|---|---|
| Container (`rounded-2xl p-4 md:p-5 space-y-3`) | ✅ Exact match |
| Label row + icon (FileText / ListOrdered) | ✅ Match |
| Dividers (`border-white/6`) | ✅ Match |
| Dialogue mode: `border-l-2 border-accent-400`, `<blockquote>`, italic | ✅ Exact match |
| Action mode: `<ol>/<li>`, accent step numbers, aria-hidden | ✅ Exact match |
| Tip row: Lightbulb icon, text-secondary italic | ✅ Match |
| Accessibility (role="region", aria-label) | ✅ Implemented |
| Conditional render (only when script exists) | ✅ Correct |
| Placement (left column, below Reference card) | ✅ Matches page layout diagram |

**Note (low)**: `type="dialogue"` is hardcoded in `record/page.tsx:79` for all clips. For physical-skill clips (eye-contact, posture, active-listening), the script content will likely be action instructions — these would read better as `type="action"`. Suggest: add a `scriptType: 'dialogue' | 'action'` field to the Clip schema (or infer from content), and pass it through. Non-blocking for M10 launch — all content still renders correctly.

---

## ActionPlan — PASS ✅

| Check | Result |
|---|---|
| Placement (between improvements grid and AI Tips) | ✅ Exact position |
| Absolute left accent border (`w-[3px] bg-accent-400`) | ✅ Correct — not border-l-4 |
| Step card classes (`rounded-xl, pl-0, pr-4, shadow-card`) | ✅ Exact match |
| Stagger animation (`animationDelay: index * 80ms`) | ✅ Implemented |
| `animate-fade-in-up` on each step | ✅ Implemented |
| Step number (font-mono, text-xl, aria-hidden) | ✅ Match |
| Action/why typography (font-semibold / text-secondary) | ✅ Match |
| Conditional render (steps exists AND length > 0) | ✅ Correct |
| Accessibility (`role="region"`, `aria-label`, `<ol>/<li>`) | ✅ Implemented |

---

## Summary

| Component | Verdict | Notes |
|---|---|---|
| CharacterBanner | ✅ PASS | `animate-fade-in` may need keyframe definition |
| ScriptPanel | ✅ PASS | `type` hardcoded to `'dialogue'` — future improvement |
| ActionPlan | ✅ PASS | Fully spec-compliant |

**No P0 or P1 blockers.** M10 UI is ready for Tester sign-off.

---

## Post-M10 backlog (designer-filed)

1. **ScriptPanel action mode** — Add `scriptType` field to Clip schema so physical-skill clips display as numbered instructions rather than blockquote. File as M11 or minor task.
2. **CharacterBanner `animate-fade-in`** — Confirm keyframe exists in tailwind.config or swap to `animate-fade-in-up`.
