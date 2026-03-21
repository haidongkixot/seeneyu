# Component: AnnotationOverlay
> Owner: Designer | Created: 2026-03-21

## Purpose
Timed floating callout boxes that appear over the YouTube clip player at specific timestamps to direct the learner's attention. They highlight exactly what to observe — "Watch his eye contact here", "Notice the pause before responding".

## Layout (on top of 16:9 video)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    [YouTube iframe]                          │
│                                                              │
│                                                              │
│    ┌─────────────────────────┐                               │
│    │ 👁  Eye Contact          │  ← glass annotation callout  │
│    │  He holds steady gaze   │                               │
│    │  for 3 full seconds     │                               │
│    │  before looking away    │                               │
│    └─────────────────────────┘                               │
│                                                              │
│  ──────────────────────────────── ← progress bar            │
│  ◀  0:12          ♦ 0:23  0:47  ▶ │ ⛶  ⚙                   │
└──────────────────────────────────────────────────────────────┘
               ↑ annotation diamond markers on timeline
```

## Annotation Callout Visual

```
Width: 200–280px (auto based on text)
Background: rgba(13,13,20,0.84) backdrop-blur-xl
Border: 1px solid rgba(255,255,255,0.10)
Border-radius: rounded-2xl
Padding: p-4
Shadow: shadow-lg

Header row:
  [Skill Icon 16px] [Skill name — text-xs font-semibold skill-badge-color]

Body:
  text-sm text-text-primary leading-relaxed
  max lines: 3 (truncate after)

Optional: highlight arrow pointing toward the relevant area
  CSS: ::before pseudo triangle or SVG arrow
  Direction: configurable (up/down/left/right)

Entrance animation:
  opacity-0 scale-95 → opacity-100 scale-100
  duration-300 ease-spring
  transform-origin: bottom-left (default)

Exit animation:
  opacity-100 → opacity-0 scale-95
  duration-200 ease-retract
```

## Timeline Diamond Markers

Small diamond shapes on the video progress bar at annotation timestamps:
```
  16px × 16px diamond (rotate-45 square)
  fill: skill color (matches annotation)
  border: 2px solid bg-bg-base
  position: absolute, vertically centered on progress bar
  hover: scale-125 + tooltip showing annotation preview text
```

## Pause Indicator

When annotation appears, video can optionally auto-pause:
```
Centered overlay (on top of paused video frame):
  background: none (transparent — video is paused, no blur needed)
  Center icon: large Play button (same as ClipCard hover)
  Bottom text: glass chip — "Annotation paused — tap to continue"
               rounded-pill bg-bg-base/80 backdrop-blur text-sm text-text-secondary
```

## Annotation Data Structure

```ts
interface Annotation {
  id: string
  timestampSeconds: number    // when to show (e.g., 23)
  durationSeconds: number     // how long to show (e.g., 4) — 0 = until dismissed
  skill: SkillType
  text: string                // max 120 characters
  position: {
    x: 'left' | 'center' | 'right'      // horizontal zone
    y: 'top' | 'middle' | 'bottom'      // vertical zone
  }
  arrowDirection?: 'up' | 'down' | 'left' | 'right' | 'none'
  autoPause?: boolean         // default false
}
```

## Props

```ts
interface AnnotationOverlayProps {
  annotations: Annotation[]
  currentTimeSeconds: number  // from YouTube player API
  onPauseRequest?: () => void
  onResumeRequest?: () => void
}
```

## Positioning Logic

Divide the video into a 3×3 grid (left/center/right × top/middle/bottom).
Each annotation specifies its zone. Multiple annotations at the same timestamp: stack vertically within zone (gap-2).

Avoid overlapping the center-bottom zone (YouTube controls live there).

## Tailwind Classes

```
Callout container:
  "absolute z-overlay pointer-events-none
   max-w-[280px] rounded-2xl p-4 shadow-lg
   bg-[rgba(13,13,20,0.84)] backdrop-blur-xl border border-white/10
   transition-all duration-300"

Callout visible:
  "opacity-100 scale-100"

Callout hidden:
  "opacity-0 scale-95 pointer-events-none"

Header:
  "flex items-center gap-1.5 mb-2"

Skill icon:
  "w-4 h-4" (Lucide icon, skill color)

Skill name:
  "text-xs font-semibold uppercase tracking-wide"
  (color matches skill badge)

Body text:
  "text-sm text-text-primary leading-relaxed"
```

## Accessibility
- Annotations are `aria-live="polite"` — screen readers announce text when they appear
- `role="status"` on the overlay container
- Dismiss button on each annotation (visible on keyboard focus): `aria-label="Dismiss annotation"`
