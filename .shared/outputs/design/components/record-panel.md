# Component: RecordPanel
> Owner: Designer | Created: 2026-03-21

## Purpose
The core mimicry interface. Learner sees the reference clip on the left and their webcam on the right simultaneously. They record themselves mimicking the observed skill and submit the recording for AI analysis.

## Full Screen Layout (Desktop — 1024px+)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ NavBar                                                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   REFERENCE CLIP                    YOUR RECORDING                       │
│   ┌──────────────────────────┐     ┌──────────────────────────┐          │
│   │                          │     │                          │          │
│   │   [YouTube iframe]       │     │   [Webcam feed]          │          │
│   │                          │     │                          │          │
│   │   16:9 ratio             │     │   16:9 ratio             │          │
│   │                          │     │   (mirrored)             │          │
│   └──────────────────────────┘     └──────────────────────────┘          │
│   "Made in Heaven" · Eye Contact      ● REC  0:12                        │
│                                                                          │
│   Skill tip:                                                             │
│   "Hold gaze 2–3 seconds before looking away. Don't break early."       │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │    [Watch Again ↺]    [● Start Recording]    [Submit →]     │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout (375px — stacked)

```
┌────────────────────────────────┐
│ NavBar                         │
├────────────────────────────────┤
│                                │
│  REFERENCE CLIP                │
│  ┌──────────────────────────┐  │
│  │   [YouTube iframe]       │  │
│  └──────────────────────────┘  │
│                                │
│  YOUR RECORDING                │
│  ┌──────────────────────────┐  │
│  │   [Webcam feed]          │  │
│  └──────────────────────────┘  │
│                                │
│  "Hold gaze 2–3 seconds..."    │
│                                │
│  [ ● Start Recording ]         │
│  [Watch Again] · [Submit]      │
│                                │
└────────────────────────────────┘
```

## Recording States

### State 1: Idle (Pre-recording)

```
Webcam panel: shows live camera preview, mirrored
Record button: large amber pill button
  "● Start Recording"
  64px height, full-width on mobile, centered on desktop
  icon: Lucide Circle (filled red) + text

Submit button: disabled / ghost, opacity-40

Skill tip: visible, text-sm text-text-secondary
  italic prefix "Tip: " in accent color
```

### State 2: Countdown (3-2-1)

```
Countdown overlay on webcam panel:
  Full overlay: rgba(0,0,0,0.6) backdrop over webcam feed
  Large number: text-8xl font-black text-white
  Entrance per number: scale-110 → scale-100, opacity-0 → 1
  Duration per digit: 800ms
  After "1": overlay fades, recording begins

Record button: disabled during countdown, shows countdown progress
```

### State 3: Recording

```
Webcam panel: shows live feed, NO overlay
  Top-right badge: "● REC  0:12" — pulsing red dot, mono timer
  Red dot: Lucide Circle (filled), text-red-500, animate-pulse

Record button transforms → "■ Stop Recording"
  bg: dark with red border — border-red-500/60 text-red-400
  hover: bg-red-500/10

Recording indicator bar: thin red line animating at top of webcam panel
  height: 2px, width: 0% → 100% (over max recording time if set)
  bg: linear-gradient(90deg, red-500, accent-400)
```

### State 4: Processing / Uploading

```
Both panels: slight blur overlay
Center overlay (between panels, or above controls):
  Spinner + "Uploading recording..." → "Analyzing with AI..."
  Progress indication: indeterminate

Buttons: all disabled

Do NOT navigate away — disable browser back button warning
```

## Reference Panel Header

```
Film slate chip (top-left corner of reference panel):
  Small chip: "[Movie Title] · [Skill Badge]"
  bg-bg-elevated/80 backdrop-blur rounded-pill px-3 py-1
  text-xs text-text-secondary
```

## Webcam Panel — Permission Flow

```
If no camera permission granted:
  Panel shows: camera-off icon (Lucide VideoOff, 48px, text-text-tertiary)
  Text: "Camera access needed"
  Subtext: text-sm text-text-tertiary "Allow camera in your browser to record yourself"
  CTA button: ghost "Allow Camera" → triggers getUserMedia()
```

## Props

```ts
interface RecordPanelProps {
  clip: {
    videoId: string           // YouTube video ID
    startSeconds: number      // clip start time
    endSeconds: number        // clip end time
    movieTitle: string
    skill: SkillType
    skillTip: string          // "Hold gaze 2–3 seconds before looking away..."
  }
  onSubmit: (blob: Blob) => void
  onWatchAgain: () => void
  maxRecordingSeconds?: number  // default 60
}
```

## Tailwind Classes Summary

```
Page wrapper:
  "min-h-screen bg-bg-base"

Content area:
  "max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8"

Panels grid (desktop side-by-side):
  "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"

Panel wrapper:
  "relative rounded-2xl overflow-hidden bg-bg-surface shadow-card"

Webcam video:
  "w-full aspect-video object-cover [transform:scaleX(-1)]"
  (mirrored for natural selfie feel)

REC badge:
  "absolute top-3 right-3 flex items-center gap-1.5
   bg-bg-base/80 backdrop-blur rounded-pill px-2.5 py-1
   text-xs font-mono text-red-400"

Record button (idle):
  "w-full lg:w-auto px-8 py-4 rounded-pill
   bg-accent-400 text-text-inverse font-semibold text-base
   hover:bg-accent-500 hover:shadow-glow-sm
   transition-all duration-150"

Stop button (recording):
  "w-full lg:w-auto px-8 py-4 rounded-pill
   border border-red-500/60 text-red-400 font-semibold text-base
   hover:bg-red-500/10 transition-all duration-150"
```

## Accessibility
- `aria-live="polite"` on timer/status region
- `aria-label` on record button matches current state
- Countdown: `aria-label="Recording starts in {n} seconds"` updates each second
- Webcam: `aria-label="Live webcam preview (mirrored)"`
