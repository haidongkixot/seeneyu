# Screen: Feedback
> Owner: Designer | Created: 2026-03-21

## Purpose
The payoff. After submitting a recording, the learner sees their AI-generated score, coaching notes, dimension breakdown, and can replay both the reference and their own recording side by side.

## URL
`/library/[clipId]/feedback` (or `/library/[clipId]/record/result` — PM to confirm)

## Processing State (shown first, ~5–15 seconds)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ NavBar                                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌───────────────────────────────┐                         │
│                    │                               │                         │
│                    │   ✦ Analyzing your            │                         │
│                    │     performance...            │                         │
│                    │                               │                         │
│                    │   ████████████░░░░  65%       │  ← animated progress    │
│                    │                               │   (indeterminate pulse) │
│                    │   Reviewing eye contact       │                         │
│                    │   and gaze patterns           │                         │
│                    │                               │                         │
│                    └───────────────────────────────┘                         │
│                                                                              │
│                    Center of page, vertically centered                       │
│                    Do not allow navigation away                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Processing card:
```
bg-bg-surface border border-white/8 rounded-2xl p-10 shadow-card
max-w-sm mx-auto text-center mt-[20vh]

Sparkles icon: Lucide Sparkles 32px text-accent-400, animate-pulse
Title: "Analyzing your performance..." text-xl font-semibold text-text-primary mt-4
Progress: skeleton bar that pulses (indeterminate) — h-2 rounded-full
          bg-gradient-to-r from-accent-500 to-accent-300 animate-pulse
Rotating tip: text-sm text-text-secondary mt-4
  cycles through messages every 3s:
  "Reviewing eye contact and gaze patterns..."
  "Checking head position and confidence signals..."
  "Generating your personalized coaching notes..."
```

## Results Screen (Desktop — 1024px+)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ NavBar                                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  max-w-5xl mx-auto px-6 py-10                                                │
│                                                                              │
│  ← Back to Library        Gone with the Wind  [Eye Contact] [Beginner]       │
│                                                                              │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │                              │  │                                      │  │
│  │     ╭──────────────────╮     │  │   Dimension Breakdown               │  │
│  │     │        78        │     │  │                                      │  │
│  │     │      / 100       │     │  │   Gaze Duration    ████████░░  78%  │  │
│  │     ╰──────────────────╯     │  │   Natural Breaks   ██████░░░░  62%  │  │
│  │                              │  │   Confidence       █████████░  88%  │  │
│  │   Good effort —              │  │   Reduced Darting  ███████░░░  70%  │  │
│  │   keep practicing            │  │                                      │  │
│  │                              │  │                                      │  │
│  └──────────────────────────────┘  └──────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ ✦ AI Coach Notes                                                     │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  Your gaze duration was strong — you maintained contact for an       │   │
│  │  average of 2.8 seconds. The main area to work on is reducing        │   │
│  │  rapid eye movement during pauses. Try softly focusing on the        │   │
│  │  bridge of the nose rather than moving between both eyes.            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │  Reference Clip            │  │  Your Recording                        │ │
│  │  ┌──────────────────────┐  │  │  ┌──────────────────────────────────┐  │ │
│  │  │  [YouTube player]    │  │  │  │  [Video player — blob URL]       │  │ │
│  │  └──────────────────────┘  │  │  └──────────────────────────────────┘  │ │
│  └────────────────────────────┘  └────────────────────────────────────────┘ │
│                                                                              │
│              [↺ Try Again]                    [Next Clip →]                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Results Screen (Mobile — 375px, stacked)

```
┌──────────────────────────┐
│ NavBar                   │
├──────────────────────────┤
│                          │
│ ← Back                   │
│ Eye Contact · Beginner   │
│                          │
│  ╭────────────────────╮  │  ← Score ring (120px)
│  │       78           │  │
│  │     / 100          │  │
│  ╰────────────────────╯  │
│  Good effort!            │
│                          │
│  Dimension Breakdown     │
│  Gaze Duration  ████ 78% │
│  Natural Breaks ████ 62% │
│  Confidence     ████ 88% │
│  Darting        ████ 70% │
│                          │
│  ✦ AI Coach Notes        │
│  ─────────────────────── │
│  "Your gaze duration was │
│   strong — 2.8 second    │
│   average. Work on       │
│   reducing rapid eye     │
│   movement during..."    │
│  [Read more]             │
│                          │
│  Reference Clip          │
│  ┌──────────────────────┐│
│  │ [YouTube player]     ││
│  └──────────────────────┘│
│                          │
│  Your Recording          │
│  ┌──────────────────────┐│
│  │ [Video player]       ││
│  └──────────────────────┘│
│                          │
│  [↺ Try Again]           │  ← full-width ghost
│  [Next Clip →]           │  ← full-width amber
│                          │
└──────────────────────────┘
```

## Score Ring Animation Sequence

```
On mount (results screen):
  1. Score ring SVG stroke-dashoffset animates from 0 → score (700ms ease-smooth)
  2. Score number counts up from 0 → score (700ms, linear tick)
  3. Dimension bars animate in — staggered 50ms per bar (500ms each)
  4. AI Notes panel fades in (300ms, after bars complete)
  5. Video comparison fades in (300ms)
  6. Action buttons slide up from below (200ms, ease-spring)
```

## Share / Save (Future Enhancement — Note Only)

```
[Save to Progress] button (future M4+):
  Saves this attempt to the user's history
  Not in MVP — do not implement yet, but reserve space in layout

[Copy Score Image] — share screenshot (future)
```

## Error State (AI Analysis Failed)

```
Replace AI Notes panel with:
  bg-error/10 border border-error/30 rounded-2xl p-6
  Lucide AlertCircle text-error mr-2
  "Could not analyze recording" text-base font-semibold text-text-primary
  "Our AI coach had trouble processing your video." text-sm text-text-secondary mt-1
  [↺ Retry Analysis] amber button mt-4
  [Skip — Try Again Manually] ghost button mt-2

Score ring: show "—" instead of number, track color only
Dimension bars: hidden / replaced with error state
```
