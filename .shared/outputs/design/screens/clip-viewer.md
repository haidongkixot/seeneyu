# Screen: Clip Viewer
> Owner: Designer | Created: 2026-03-21

## Purpose
The observation step. Learner watches the curated clip with timed annotation overlays that direct attention to specific body-language signals. After watching, they proceed to record themselves.

## Desktop Layout (1024px+)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ NavBar                                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  max-w-6xl mx-auto px-8 py-8                                                 │
│                                                                              │
│  ← Back to Library                                                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │              16:9 VIDEO PLAYER (YouTube iframe)                     │    │
│  │              max-w: 100%, rounded-2xl overflow-hidden              │    │
│  │                                                                     │    │
│  │    ┌─────────────────────┐                                         │    │
│  │    │ 👁 Eye Contact       │  ← AnnotationOverlay component          │    │
│  │    │  Watch how he holds │     (bottom-left zone, timed)           │    │
│  │    │  the gaze through   │                                         │    │
│  │    │  the entire pause   │                                         │    │
│  │    └─────────────────────┘                                         │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  CLIP INFO ROW                                                      │    │
│  │                                                                     │    │
│  │  Gone with the Wind (1939)                    [Eye Contact] [Beg]  │    │
│  │  Making Eye Contact Under Pressure            0:47                  │    │
│  │                                                                     │    │
│  │  "In this scene, Scarlett must hold eye contact to assert           │    │
│  │   dominance during a high-stakes negotiation. Notice how           │    │
│  │   the gaze never breaks, even when under pressure."                │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  WHAT TO OBSERVE — checklist                                        │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  ☐  Gaze duration — how many seconds before she breaks contact      │    │
│  │  ☐  Head position — stays neutral, doesn't tilt defensively        │    │
│  │  ☐  When she DOES look away — is it intentional or reactive?       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│                    [↺ Watch Again]   [I'm Ready to Mimic →]                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Video Player Area

```
Container:
  position: relative (for annotation overlay positioning)
  aspect-video width-full rounded-2xl overflow-hidden shadow-xl
  bg-bg-inset (shows while iframe loads)

YouTube iframe:
  width: 100% height: 100% absolute inset-0
  Allow: autoplay; picture-in-picture
  No branding when possible (use yt-nocookie.com)
  Start at clip startSeconds, end at clip endSeconds
  (YouTube IFrame API — onStateChange to detect clip end)

Annotation overlays:
  AnnotationOverlay component rendered as absolute children
  z-overlay (z-20) — above iframe content via pointer-events:none

On clip end:
  Semi-transparent overlay appears:
    "Clip ended — watch again or start recording"
    Two buttons: [↺ Watch Again] [I'm Ready →]
    Centered, glass-panel style
```

## Clip Info Row

```
Layout: flex items-start justify-between flex-wrap gap-4 mt-6

Left:
  Movie title: text-sm text-text-tertiary
  Clip title: text-xl font-semibold text-text-primary mt-0.5
  Description: text-sm text-text-secondary mt-2 leading-relaxed max-w-prose

Right (top):
  Row: SkillBadge (md) + DifficultyPill (md) + duration chip
  Duration: "0:47" text-xs font-mono text-text-tertiary
            bg-bg-elevated rounded-pill px-2 py-0.5
```

## What To Observe Checklist

```
Container: bg-bg-surface border border-white/8 rounded-2xl p-6 mt-6 shadow-card

Header: "What to observe"
  text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4

Checklist items (3–4 max):
  Each: flex items-start gap-3
  Checkbox: 20px Lucide Square icon (unchecked default)
            becomes CheckSquare2 when tapped — checked state
            color: text-accent-400 when checked, text-text-tertiary when unchecked
  Text: text-sm text-text-primary leading-relaxed
  Tap to toggle (encourages active viewing)

Note: Checklist is cosmetic / engagement only — does not affect scoring
```

## Action Buttons

```
Container: flex items-center justify-center gap-4 mt-8 flex-wrap

[↺ Watch Again]:
  ghost — border border-white/10 text-text-secondary rounded-xl px-6 py-3
  Icon: Lucide RotateCcw
  Action: seeks YouTube iframe to startSeconds, plays

[I'm Ready to Mimic →]:
  primary CTA — bg-accent-400 text-text-inverse rounded-pill px-8 py-3.5 font-semibold
  Icon: Lucide ArrowRight (trailing)
  hover: bg-accent-500 shadow-glow
  Routes to: /library/[clipId]/record
```

## Mobile Layout (375px)

```
Video: full-width, aspect-video
Annotations: same (positioned absolutely over video)
Clip info: stacked (no justify-between — all left-aligned)
Badges: row flex-wrap
Checklist: same
Actions: full-width stacked buttons
  [I'm Ready] → full-width pill
  [Watch Again] → full-width ghost below
```

## Loading State

```
Video area: skeleton shimmer aspect-video rounded-2xl
Clip info: skeleton lines (2 rows)
Checklist: 3 skeleton rows
Buttons: skeleton pill shapes
```

## Error State (Clip Unavailable)

```
Video area: bg-bg-surface rounded-2xl aspect-video
  flex items-center justify-center flex-col
  Lucide VideoOff 48px text-text-tertiary
  "This clip is no longer available" text-base text-text-secondary mt-3
  "YouTube may have removed the video" text-sm text-text-tertiary mt-1
  [Browse Similar Clips →] amber CTA mt-6
```

## URL Structure

```
/library/[clipId]         → clip detail (this screen)
/library/[clipId]/record  → record yourself screen
```
