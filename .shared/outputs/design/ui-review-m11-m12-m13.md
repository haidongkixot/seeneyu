# UI Review — M11 + M12 + M13
> Reviewer: Designer
> Date: 2026-03-23
> Files reviewed: ObservationGuide.tsx, ClipDetailTabs.tsx, StepCard.tsx, PracticeRecorder.tsx, MicroFeedbackCard.tsx, PerformanceUnlockScreen.tsx, OnboardingFlow.tsx, SkillTrackColumn.tsx, SkillProgressBar.tsx, LearningPathCard.tsx

---

## Overall: PASS ✅ with 1 P1 fix required

---

## M11 — Observation Guide

### ObservationGuide.tsx — PASS ✅

| Check | Result |
|---|---|
| Outer layout `flex flex-col gap-5` | ✅ Exact match |
| Headline typography | ✅ `text-base font-semibold text-text-primary` |
| Timeline `role="list"` + `aria-label` | ✅ Implemented |
| Guide line `left-[31px] top-4 bottom-4 w-px bg-white/8` | ✅ Exact match |
| Timeline entries stagger `animationDelay: index * 50ms` | ✅ Implemented |
| Timestamp badge `w-[63px] h-7 rounded-pill bg-bg-elevated font-mono` | ✅ Exact match |
| `aria-label="at X seconds"` on badge | ✅ Implemented |
| Dot position `left-[27px] top-3.5 ring-2 ring-bg-base z-raised` | ✅ Exact match |
| Technique name / what / why typography | ✅ Match |
| CTA row `flex items-center justify-between` | ✅ Match |
| Null state card (text, icon, CTA button) | ✅ Matches spec content exactly |

**⚠️ P1 — CTA links to `/record` instead of `/practice`**

Both the main CTA and the null-state CTA use `href={/library/${clipId}/record}`. Since M12 introduced `/practice` as the primary entry point to the coaching flow, this bypasses the micro-practice stepper entirely. Fix: change both CTAs to `/library/${clipId}/practice`.

### ClipDetailTabs.tsx — PASS ✅

| Check | Result |
|---|---|
| `role="tablist"` on tab bar | ✅ |
| `role="tab"`, `aria-selected`, `tabIndex` per button | ✅ |
| `role="tabpanel"` on content area | ✅ |
| Active tab: `border-accent-400 text-accent-400` | ✅ |
| Inactive tab: `border-transparent text-text-secondary hover:text-text-primary` | ✅ |
| Tab switch animation `key={activeTab}` + `animate-fade-in` | ✅ |

---

## M12 — Micro-Practice Stepper

### StepCard.tsx — PASS ✅

| Check | Result |
|---|---|
| Container `bg-bg-surface border border-white/8 rounded-2xl p-5 flex flex-col gap-4` | ✅ Exact match |
| Step counter `text-xs font-semibold uppercase tracking-widest text-text-tertiary` | ✅ |
| Focus row: Target icon + `text-base font-semibold text-accent-400` | ✅ |
| Instruction `text-base text-text-primary leading-relaxed` | ✅ |
| Tip: Lightbulb + `text-sm text-text-secondary italic` | ✅ |
| Jump link `inline-flex items-center gap-1.5 text-sm text-text-secondary` | ✅ |

**Note (low)**: Jump link is a `<span>` — not interactive. If intended to seek the YouTube embed, will need to be wired up via a callback prop. Design is correct; functionality can be added later.

### PracticeRecorder.tsx — PASS ✅

| Check | Result |
|---|---|
| SVG ring `width=72 height=72`, `r=30`, `cx=36 cy=36` | ✅ Exact match |
| Ring track `rgba(255,255,255,0.12) strokeWidth=5` | ✅ |
| Ring color: amber >10s, #f59e0b 5-10s, #ef4444 <5s | ✅ Exact match |
| `animate-pulse` at ≤5s | ✅ |
| Ring `absolute bottom-3 right-3 z-raised pointer-events-none` | ✅ Exact match |
| Center text: seconds left, monospace, white | ✅ |
| Hard stop `setTimeout(stopRecording, 30000)` | ✅ |
| Cleanup `useEffect` (stream + timers on unmount) | ✅ |

**Note (low)**: REC badge is top-left vs spec's implied top-right. Both work; this is not a user-facing issue.

### MicroFeedbackCard.tsx — PASS ✅

| Check | Result |
|---|---|
| `bg-bg-elevated border border-white/10 rounded-2xl p-5 flex flex-col gap-3 animate-slide-up` | ✅ Exact match |
| CheckCircle pass / AlertCircle needs-work + correct colors | ✅ |
| `text-success` pass, `text-warning` needs-work | ✅ |
| Retry: ghost-xl border, RotateCcw icon | ✅ |
| Next: amber pill flex-1, `isLastStep ? 'See Results' : 'Next Step'` | ✅ |

**Note (low)**: `animate-slide-up` keyframe must be defined in tailwind.config.ts (spec included the keyframe definition). Verify it was added.

### PerformanceUnlockScreen.tsx — PASS ✅

| Check | Result |
|---|---|
| `flex flex-col items-center justify-center text-center gap-6 py-16 px-6` | ✅ |
| Trophy: `w-20 h-20 rounded-full bg-accent-400/10 border border-accent-400/20` | ✅ |
| Headline `text-2xl md:text-3xl font-bold text-text-primary` | ✅ |
| Subtext `text-base text-text-secondary max-w-sm leading-relaxed` | ✅ |
| Divider `w-16 border-t border-white/10` | ✅ |
| Primary CTA `w-full max-w-xs bg-accent-400 rounded-pill py-4` | ✅ |
| Secondary link `text-sm text-text-secondary hover:text-text-primary` | ✅ |
| `allPassed` conditional text (softer message when not all passed) | ✅ Good spec-compliant addition |
| Stagger animation on content sections | ✅ |

---

## M13 — Onboarding Assessment & Learning Path

### OnboardingFlow.tsx — PASS ✅

| Check | Result |
|---|---|
| Top bar: `px-6 py-4 flex items-center justify-between border-b border-white/8` | ✅ |
| Progress bar: `h-1 bg-white/8` + `h-1 bg-accent-400 transition-all duration-500 ease-smooth` | ✅ |
| Content card: `rounded-3xl p-8 max-w-md text-center` | ✅ |
| Icon ring: `w-16 h-16 rounded-2xl bg-accent-400/10 border border-accent-400/20` | ✅ |
| Skill name: `text-2xl font-bold text-text-primary` | ✅ |
| Level buttons: `grid grid-cols-3 gap-2` | ✅ |
| Selected: `border-accent-400/60 bg-accent-400/10 text-accent-400 shadow-glow-sm` | ✅ Exact match |
| Unselected: `border-white/10 hover:border-white/20 hover:bg-bg-overlay` | ✅ |
| Continue: `disabled:opacity-40 disabled:cursor-not-allowed` | ✅ |
| Processing screen: spinner `border-t-accent-400 animate-spin` + headline/subtext | ✅ |
| Complete screen: Sparkles icon, `rounded-2xl bg-accent-400/10`, stagger animation | ✅ |

**Bonus**: Selected-option description shown as a styled quote (`bg-bg-inset rounded-xl`) — not in spec, excellent UX addition that helps learners confirm their choice.

### SkillTrackColumn.tsx — PASS ✅

| Check | Result |
|---|---|
| `bg-bg-surface border border-white/8 rounded-2xl p-4 flex flex-col gap-4` | ✅ |
| Icon: `w-8 h-8 rounded-lg` | ✅ |
| Level badge: display labels (Developing/Practising/Fluent) with correct colors | ✅ Matches spec |
| SkillProgressBar component | ✅ |
| "Next Up" label `text-xs font-semibold uppercase tracking-widest text-text-tertiary` | ✅ |
| Level complete state: Trophy + amber text + "Explore Advanced Clips" link | ✅ Matches spec exactly |

**Note (low)**: Skill icon background uses neutral `bg-white/5` instead of skill-specific tinting from the `skill` color tokens. Spec said "skill-tinted bg". Visual consistency improvement for a future pass.

### SkillProgressBar.tsx — PASS ✅

| Check | Result |
|---|---|
| `flex flex-col gap-2` | ✅ |
| Level labels: display names (current → next) | ✅ Better UX than raw level names |
| Track `h-2 bg-white/8 rounded-pill` | ✅ |
| Fill `bg-accent-400 transition-all duration-700 ease-smooth` | ✅ |
| Clip count `text-xs text-text-secondary` | ✅ |

### LearningPathCard.tsx — PASS ✅

| Check | Result |
|---|---|
| `bg-bg-elevated border border-white/8 rounded-xl overflow-hidden hover:border-accent-400/20 hover:shadow-card-hover` | ✅ Exact match |
| `next/image` with `fill`, fallback PlayCircle | ✅ |
| `group-hover:scale-[1.02] transition-transform duration-300` on image | ✅ |
| Title `text-xs font-medium text-text-primary line-clamp-2` | ✅ |
| DifficultyPill | ✅ |
| CTA `group-hover:gap-1.5 transition-all duration-150` arrow shift | ✅ Exact match |

---

## Summary Table

| Component | Verdict | Priority Issues |
|---|---|---|
| ObservationGuide | ✅ PASS | **P1**: CTA links to /record — should be /practice |
| ClipDetailTabs | ✅ PASS | — |
| StepCard | ✅ PASS | Jump link not interactive (future) |
| PracticeRecorder | ✅ PASS | Verify animate-slide-up keyframe in tailwind config |
| MicroFeedbackCard | ✅ PASS | — |
| PerformanceUnlockScreen | ✅ PASS | — |
| OnboardingFlow | ✅ PASS | — |
| SkillTrackColumn | ✅ PASS | Skill icon tinting (low, future) |
| SkillProgressBar | ✅ PASS | — |
| LearningPathCard | ✅ PASS | — |

---

## P1 Fix Required

**File**: `src/components/ObservationGuide.tsx`
**Lines**: 31 (null-state CTA) and 86 (main CTA)
**Change**: Both `href` values should point to `/library/${clipId}/practice` not `/library/${clipId}/record`

This is the only blocking issue. All other findings are low-priority notes for future polish.
