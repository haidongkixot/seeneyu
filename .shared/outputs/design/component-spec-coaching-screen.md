# Component Spec: Coaching Screen
> Owner: Designer | Status: COMPLETE | Milestone: M1
> Route: `/clip/[id]`

## Purpose
The core coaching interface. Left panel: YouTube clip with annotation overlays. Right panel: webcam preview, recording controls, and side-by-side comparison. Drives the Watch → Observe → Mimic → Feedback loop.

---

## Layout (Desktop — lg+)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back to Library          "Eye Contact"  ●● Intermediate  1:45    │  ← top nav bar, h-14
├─────────────────────────────────┬────────────────────────────────────┤
│                                 │                                    │
│        VIDEO PANEL              │         RECORD PANEL               │
│        (left, ~60%)             │         (right, ~40%)              │
│                                 │                                    │
│  ┌───────────────────────────┐  │  ┌──────────────────────────────┐  │
│  │                           │  │  │                              │  │
│  │    YouTube IFrame         │  │  │   Webcam Preview             │  │
│  │    (16:9)                 │  │  │   (16:9 mirrored)            │  │
│  │                           │  │  │                              │  │
│  │  [annotation overlay]     │  │  └──────────────────────────────┘  │
│  └───────────────────────────┘  │                                    │
│                                 │  [● REC 0:00]  [■ Stop]  [↺ Retry]│  ← record controls
│  ┌───────────────────────────┐  │                                    │
│  │  📌 Annotation card       │  │  ┌──────────────────────────────┐  │
│  │  Watch how she holds      │  │  │  Observation checklist       │  │
│  │  gaze 2-3 sec, then       │  │  │  □ Eye stays on target       │  │
│  │  breaks naturally         │  │  │  □ 2-3 second hold           │  │
│  └───────────────────────────┘  │  │  □ Natural break direction   │  │
│                                 │  └──────────────────────────────┘  │
│  [Watch Again]  [I'm Ready →]   │  [Submit for AI Feedback →]        │
└─────────────────────────────────┴────────────────────────────────────┘
```

## Layout (Mobile — below lg)

Stacked vertically:
1. Top nav bar
2. Video panel (full width)
3. Annotation cards (scrollable horizontal chips)
4. Record panel (full width)
5. Controls row
6. Checklist (collapsible)

---

## Panels

### Left — Video Panel

**YouTube IFrame:**
- `width="100%" height="auto"` in aspect-video container
- Params: `controls=1&rel=0&modestbranding=1&start={startSec}&end={endSec}&enablejsapi=1`
- No autoplay — user clicks Play
- `pointer-events: auto` only on play button area (annotations intercept gesture area)
- On video end: auto-scroll/show "Watch Again" + "I'm Ready" CTAs

**Annotation Overlay System:**
- Timed annotations displayed as glass cards
- Appear/fade based on video `currentTime` events
- Position: `absolute bottom-4 left-4 right-4` (below video controls safe zone)
- Glass style: `bg-[rgba(13,13,20,0.82)] backdrop-blur-xl border border-white/10 rounded-xl p-4`
- Annotation type icons:
  - 👁 eye_contact
  - 🫸 posture
  - 🤝 gesture
  - 🗣 voice
  - 😶 expression

**Annotation Card:**
```
[type icon]  [time stamp mm:ss]
[note text — text-text-primary text-sm leading-relaxed]
```

Animation: fade-in 300ms, stays 4s, fade-out 300ms (or until next annotation fires)

---

### Right — Record Panel

**Webcam Preview:**
- Mirror: `transform: scaleX(-1)` (natural selfie view)
- Aspect: 16:9
- While recording: pulsing red dot badge overlay `top-3 right-3`
- States:
  - `idle`: black bg with camera icon, "Camera will start when you record"
  - `ready`: live webcam feed
  - `recording`: live feed + `animate-pulse` red REC badge
  - `recorded`: shows thumbnail preview of last recording
  - `error`: text-error "Camera access denied — check browser permissions"

**Recording Controls:**
```
[● Start Recording]   ← accent-400 bg, pill, text-inverse, text-base font-semibold
                         icon: Lucide Circle (filled red) or Radio, size 18

While recording:
[■ Stop & Save]        ← ghost button, Lucide Square icon
[⟳ Discard & Retry]   ← danger button

After recording:
[▷ Review]            ← ghost
[↺ Record Again]      ← ghost
[→ Submit for Feedback] ← accent CTA (primary action)
```

**Observation Checklist:**
- Title: "What to watch for" in text-text-secondary text-sm uppercase tracking-wider
- Items driven by `annotation` field from clip data (1 item per skill signal)
- Each item: `□ checkbox` + text (interactive — user ticks off while watching)
- Checked state: text-accent-400, line through optional
- Not saved to DB — purely local state, encourages active engagement

---

## Top Nav Bar

```
[← Back]  [Skill Badge] [Movie · Character]  [Difficulty Badge]  [Duration]
```

- Back: ghost icon button, navigates to `/library`
- Center: clip identity (from clip data)
- Right: metadata chips

---

## Phase Progression

**Watch Phase** (initial state):
- Video panel is primary (full attention)
- "I'm Ready →" CTA appears after video ends or 10s into clip
- Record panel shows checklist + instructions only (no camera yet)

**Mimic Phase** (after "I'm Ready"):
- Camera activates (request permissions if needed)
- Controls become active
- Annotation cards continue to fire as reference

**Review Phase** (after recording):
- Side-by-side: left = video replay from start, right = user recording
- Sync: both play simultaneously from t=0 (startSec on YouTube, 0:00 on recording)
- "Submit for AI Feedback →" becomes primary CTA

---

## Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| < lg (< 1024px) | Stacked — video first, record below |
| lg+ (≥ 1024px) | Side-by-side split ~58% / 42% |

---

## Key Tailwind Classes

```
Page:
  "min-h-screen bg-bg-base flex flex-col"

Nav bar:
  "sticky top-0 z-raised h-14 bg-bg-surface/80 backdrop-blur-md
   border-b border-white/8 flex items-center justify-between px-4 lg:px-8"

Main content area:
  "flex-1 flex flex-col lg:flex-row gap-0"

Video panel:
  "lg:w-[58%] bg-bg-base flex flex-col gap-4 p-4 lg:p-6"

Record panel:
  "lg:w-[42%] bg-bg-surface border-l border-white/8 flex flex-col gap-4 p-4 lg:p-6"

Webcam preview:
  "relative aspect-video bg-black rounded-xl overflow-hidden"

Controls row:
  "flex items-center gap-3"

Checklist:
  "bg-bg-elevated rounded-xl p-4 flex flex-col gap-3"
```

---

## Accessibility

- `<main>` wraps content area
- `<section aria-label="Movie clip">` for video panel
- `<section aria-label="Recording area">` for record panel
- Webcam start triggers accessible status: `aria-live="polite"` region announces "Camera active"
- Recording start: `aria-live="assertive"` announces "Recording started"
- Keyboard: Tab order → Back → Watch Controls → Record Controls → Submit
