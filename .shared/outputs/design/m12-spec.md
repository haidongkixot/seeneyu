# M12 UI Specs — Micro-Practice Stepper
> Owner: Designer
> Milestone: M12
> Delivered: 2026-03-23
> Status: READY FOR IMPLEMENTATION

---

## Overview

A Duolingo-style step-by-step practice flow. Instead of a single long recording, the learner works through 3–5 focused micro-steps — each targeting one annotation/technique. Each step has a 30-second max recording with a visible countdown ring. After each step: instant micro-feedback. After all steps: celebrate + unlock Full Performance mode.

**Route**: `/library/[clipId]/practice/` (new route, separate from existing `/record`)

---

## Flow Diagram

```
/library/[clipId]/practice/
        │
        ▼
┌─────────────────────┐
│  Step 1 of 4        │  ← StepCard + PracticeRecorder
│  [Micro-feedback]   │  ← MicroFeedbackCard (slides in after stop)
│  Next Step →        │
└─────────────────────┘
        │  (repeat ×N)
        ▼
┌─────────────────────┐
│  All Steps Done!    │  ← PerformanceUnlockScreen
│  Full Performance   │
│  [Record It All →]  │
└─────────────────────┘
        │
        ▼
   /library/[clipId]/record   (existing full recorder)
```

---

## Component: PracticeStepperLayout

**Purpose**: The shell/chrome of the entire practice flow. Contains: progress bar at top, step content in the middle, navigation controls at the bottom.

**Props**:
```ts
interface PracticeStepperLayoutProps {
  totalSteps: number
  currentStep: number       // 1-indexed
  clipTitle: string
  skillCategory: string
  children: React.ReactNode
}
```

**Tailwind Classes**:
```
page shell:     "min-h-screen bg-bg-base flex flex-col"

top bar:        "sticky top-0 z-raised bg-bg-surface/90 backdrop-blur-md border-b border-white/8
                 px-4 py-3 flex items-center gap-4"
back link:      "text-sm text-text-secondary hover:text-text-primary transition-colors"
step counter:   "text-sm font-semibold text-text-primary"  e.g. "Step 2 of 4"
skill badge:    [existing SkillBadge component, size="sm"]
close link:     "ml-auto text-text-tertiary hover:text-text-secondary transition-colors"

progress track: "h-1.5 bg-white/8 w-full"
progress fill:  "h-1.5 bg-accent-400 transition-all duration-500 ease-smooth"
               width: `${(currentStep / totalSteps) * 100}%`

main:           "flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-4 py-6 gap-6"
```

**Progress dots** (mobile — below top bar):
```
dot container:  "flex items-center justify-center gap-2 py-2"
dot completed:  "w-2 h-2 rounded-full bg-accent-400"
dot active:     "w-3 h-3 rounded-full bg-accent-400 ring-2 ring-accent-400/30"
dot locked:     "w-2 h-2 rounded-full bg-white/20"
```

**ASCII Mockup — Top Bar**:
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back   Step 2 of 4   [vocal-pacing]              ✕      │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (progress)  │
│           ●  ●  ○  ○   (dots, mobile only)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component: StepCard

**Purpose**: The instruction card for the current step. Shows what to do before the learner presses Record.

**Props**:
```ts
interface StepCardProps {
  stepNumber: number
  totalSteps: number
  focusLabel: string      // e.g. "Vocal Pacing"
  instruction: string     // e.g. "Slow your speech to match Jordan's delivery pace"
  tip?: string            // e.g. "Breathe before each sentence to control your speed"
  referenceSecond?: number // if set, show a "Jump to [0:09] in reference" link
}
```

**Layout** (left column on desktop, above recorder on mobile):

```
┌──────────────────────────────────────────────────────┐
│  STEP 2 OF 4                                          │
│  ─────────────────────────────────────────────────   │
│  🎯  Vocal Pacing                                     │
│                                                       │
│  Slow your speech to match Jordan's delivery pace.   │
│  Take a beat before each new idea.                   │
│                                                       │
│  💡 Breathe before each sentence to control speed.   │
│  ─────────────────────────────────────────────────   │
│  ▶ Jump to 0:09 in reference clip                    │
└──────────────────────────────────────────────────────┘
```

**Tailwind Classes**:
```
card:           "bg-bg-surface border border-white/8 rounded-2xl p-5 flex flex-col gap-4"

step counter:   "text-xs font-semibold uppercase tracking-widest text-text-tertiary"
divider:        "border-t border-white/6"

focus row:      "flex items-center gap-2"
target icon:    "w-5 h-5 text-accent-400"  (Target from Lucide)
focus label:    "text-base font-semibold text-accent-400"

instruction:    "text-base text-text-primary leading-relaxed"

tip row:        "flex items-start gap-2"
tip icon:       "w-4 h-4 text-accent-400 shrink-0 mt-0.5"  (Lightbulb)
tip text:       "text-sm text-text-secondary italic"

jump link:      "inline-flex items-center gap-1.5 text-sm text-text-secondary
                 hover:text-text-primary transition-colors duration-150"
```

---

## Component: PracticeRecorder

**Purpose**: The webcam recorder for the current step. Same core as RecordClient but with a 30-second countdown ring overlaid on the webcam, and a simpler control set.

**Key difference from RecordClient**: visible 30s countdown ring, hard stop at 30s.

**Props**:
```ts
interface PracticeRecorderProps {
  stepNumber: number
  onComplete: (blob: Blob, frames: Blob[]) => void  // called when recording stops
}
```

**Layout**:
```
┌──────────────────────────────────────────┐
│                                          │
│    [webcam preview — aspect-video]       │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  ○ countdown ring (30s → 0s)    │   │  ← SVG ring overlay, bottom-right
│   └──────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
[  Start Recording  ]  or  [ Stop & Save ]
```

**Countdown Ring Spec**:
```
SVG ring:  width=72 height=72, viewBox="0 0 72 72"
  r=30, cx=36, cy=36
  track:     stroke="rgba(255,255,255,0.12)" strokeWidth=5
  fill:      stroke="accent-400" strokeWidth=5 strokeLinecap="round"
             strokeDasharray: circumference (2π×30 ≈ 188.5)
             strokeDashoffset: animates from 0 → circumference over 30s
  center text: remaining seconds, font-mono text-white text-sm

Ring position: absolute bottom-3 right-3
Ring color change:
  >10s: accent-400 (amber)
   5–10s: warning (orange-ish #f59e0b)
   <5s: error (#ef4444) + pulse animation
```

**Tailwind Classes**:
```
recorder wrap:  "relative aspect-video w-full rounded-xl overflow-hidden bg-black"
ring overlay:   "absolute bottom-3 right-3 z-raised pointer-events-none"
controls:       "flex items-center gap-3 mt-3"
record btn:     [same amber pill style as RecordClient]
stop btn:       [same ghost-xl style as RecordClient]
```

**States**: idle → ready → countdown (3-2-1) → recording (with ring) → recorded
Hard stop: when ring reaches 0, auto-stop recording and call `onComplete`.

---

## Component: MicroFeedbackCard

**Purpose**: The instant feedback shown after a step recording is submitted. Slides in from the bottom, overlays the recorder area. Shows pass/needs-work verdict + 1-2 lines.

**Props**:
```ts
interface MicroFeedbackCardProps {
  verdict: 'pass' | 'needs-work'
  headline: string      // e.g. "Good — pace was steady!" or "A bit fast — try again"
  detail?: string       // e.g. "Your WPM was ~135, right in the target range."
  onNext: () => void    // proceed to next step
  onRetry: () => void   // redo this step
  isLastStep: boolean   // if true, Next shows "See Results" instead
}
```

**Layout** (slides up from bottom of recorder):
```
┌──────────────────────────────────────────────────────┐
│  ✓ PASS               or        ✗ NEEDS WORK         │
│  ─────────────────────────────────────────────────   │
│  Good — pace was steady!                             │
│  Your WPM was ~135, right in the target range.       │
│  ─────────────────────────────────────────────────   │
│  [↩ Retry Step]                [Next Step →]         │
└──────────────────────────────────────────────────────┘
```

**Tailwind Classes**:
```
card:           "bg-bg-elevated border border-white/10 rounded-2xl p-5 flex flex-col gap-3
                 animate-slide-up"

verdict row:    "flex items-center gap-2"

PASS style:
  icon + label: "text-success text-sm font-semibold uppercase tracking-wider"
  icon: CheckCircle (Lucide) size=18

NEEDS-WORK style:
  icon + label: "text-warning text-sm font-semibold uppercase tracking-wider"
  icon: AlertCircle (Lucide) size=18

headline:       "text-base font-semibold text-text-primary"
detail:         "text-sm text-text-secondary leading-relaxed"

button row:     "flex items-center gap-3 pt-1"
retry btn:      "border border-white/10 text-text-secondary rounded-xl px-4 py-2.5 text-sm
                 hover:border-white/20 hover:bg-bg-overlay transition-all duration-150
                 flex items-center gap-1.5"
next btn:       "flex-1 bg-accent-400 text-text-inverse rounded-pill py-2.5 text-sm
                 font-semibold text-center hover:bg-accent-500 hover:shadow-glow-sm
                 transition-all duration-150"
```

**Motion**: `animate-slide-up` — translate Y from +24px → 0, opacity 0→1, 250ms spring.

Add to tailwind.config.js:
```js
keyframes: {
  'slide-up': {
    '0%':   { opacity: '0', transform: 'translateY(24px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  'slide-up': 'slide-up 250ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
},
```

---

## Component: PerformanceUnlockScreen

**Purpose**: Celebration screen shown after all steps complete. Rewards the learner and unlocks the full performance recording.

**Props**:
```ts
interface PerformanceUnlockScreenProps {
  clipId: string
  characterName?: string
  completedSteps: number
}
```

**Layout**:
```
        🏆  (large icon or animated ring)

   You nailed all [4] steps!

   You've practiced each technique separately.
   Now put them all together in one take.

   ────────────────────────────────────────

   [  Full Performance Recording  →  ]
   [ ← Back to Clip ]
```

**Tailwind Classes**:
```
screen:         "flex flex-col items-center justify-center text-center gap-6 py-16 px-6"

trophy icon:    "w-20 h-20 rounded-full bg-accent-400/10 border border-accent-400/20
                 flex items-center justify-center text-4xl"
  use: Trophy icon from Lucide, size=40, className="text-accent-400"

headline:       "text-2xl md:text-3xl font-bold text-text-primary"
subtext:        "text-base text-text-secondary max-w-sm leading-relaxed"
divider:        "w-16 border-t border-white/10"

primary CTA:    "w-full max-w-xs bg-accent-400 text-text-inverse rounded-pill py-4
                 text-base font-semibold hover:bg-accent-500 hover:shadow-glow transition-all
                 duration-150 flex items-center justify-center gap-2"
secondary link: "text-sm text-text-secondary hover:text-text-primary transition-colors"
```

**Motion**:
- Trophy icon: scale from 0.5→1 + opacity 0→1, 400ms spring
- Headline: fade-in 300ms, 150ms delay
- CTA: fade-in 300ms, 300ms delay

---

## Page Layout — Desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back   Step 2 of 4   [vocal-pacing]                         ✕   │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░  (progress bar)           │
├──────────────────────────────┬───────────────────────────────────────┤
│  [StepCard]                  │  [PracticeRecorder]                   │
│                              │                                       │
│  STEP 2 OF 4                 │  [webcam + 30s countdown ring]        │
│  🎯 Vocal Pacing             │                                       │
│  Slow your speech to match   │  [controls]                           │
│  Jordan's delivery pace.     │                                       │
│                              │  [MicroFeedbackCard — slides up]      │
│  💡 Breathe before each...   │                                       │
│  ▶ Jump to 0:09              │                                       │
└──────────────────────────────┴───────────────────────────────────────┘
```

---

## Design Notes for Developer

1. Each `step` corresponds to one annotation from the clip. Use `clip.annotations` (ordered by `atSecond`). If the clip has 4 annotations, there are 4 steps.

2. The micro-feedback call goes to a new lightweight route: `POST /api/sessions/[id]/step-feedback` — returns `{ verdict: 'pass' | 'needs-work', headline: string, detail: string }`. The prompt is the step instruction + 1 frame from the recording.

3. Full state machine for each step: `idle → ready → countdown → recording → processing → feedback-shown`. Use `useReducer` for clarity.

4. The 30s hard stop: `setTimeout(() => stopRecording(), 30000)` from when recording starts. Clear it if user stops manually first.

5. On "Retry": reset the recorder state for the current step. Do NOT advance `currentStep`.

6. On final step "See Results": skip the celebration screen if all verdicts were 'needs-work' — show a softer "Practice complete. Now try the full recording."

---

*End of M12 spec*
