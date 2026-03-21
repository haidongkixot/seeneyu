# Component: FeedbackScoreCard
> Owner: Designer | Created: 2026-03-21

## Purpose
The payoff screen. Shows AI analysis of the user's recording: overall score, per-dimension breakdown, written coaching notes, and side-by-side reference vs. user recording comparison. Motivates retry or progression.

## Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back to Library                                    Eye Contact        │
│                                                       SkillBadge (lg)    │
│                                                                          │
│  ┌────────────────────────┐   ┌────────────────────────────────────────┐ │
│  │                        │   │                                        │ │
│  │     Score Ring         │   │  Dimension Scores                      │ │
│  │                        │   │                                        │ │
│  │    ╭──────────╮        │   │  Gaze Duration     ████████░░  78%     │ │
│  │    │   78     │        │   │  Natural Breaks    ██████░░░░  62%     │ │
│  │    │  / 100   │        │   │  Confidence Level  █████████░  88%     │ │
│  │    ╰──────────╯        │   │  Reduced Darting   ███████░░░  70%     │ │
│  │                        │   │                                        │ │
│  │   Great effort!        │   │                                        │ │
│  │                        │   │                                        │ │
│  └────────────────────────┘   └────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AI Coach Notes                                                  │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │  Your gaze duration was strong — you held contact for an         │   │
│  │  average of 2.8 seconds before breaking naturally. The main      │   │
│  │  area to improve is reducing rapid eye movement during pauses.   │   │
│  │  Try focusing on a single point at the bridge of the nose.       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │  Reference              │  │  Your Recording          │              │
│  │  [video player]         │  │  [video player]          │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
│                                                                          │
│                [↺ Try Again]              [Next Clip →]                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Score Ring Component

```
Size: 160px × 160px (mobile: 120px)
SVG with two circles:
  Track: full circle, rgba(255,255,255,0.08), strokeWidth 8
  Fill:  stroke-dashoffset animated from 0% → score%
         color: gradient from accent-400 → accent-600
         strokeWidth 8, strokeLinecap="round"

Inner text:
  Score number: text-4xl font-black text-text-primary  (e.g. "78")
  Label:        text-xs text-text-tertiary             ("/ 100")

Color by score range:
  ≥ 80: success.DEFAULT (#22c55e)
  ≥ 50: accent.400 (#fbbf24)
  < 50: error.DEFAULT (#ef4444)

Entry animation: draw from 0 to score over 700ms ease-smooth
Label below ring:
  ≥ 80: "Excellent! 🔥" (only emojis in output if app supports them — keep as text otherwise)
  ≥ 60: "Good effort — keep practicing"
  ≥ 40: "Nice try — watch the tip below"
  < 40:  "Keep going — this skill takes repetition"
```

## Dimension Score Bars

Per-dimension breakdown (4 dimensions matching difficulty scoring system):

```
Each row:
  Label (left):  text-sm font-medium text-text-secondary, min-w-[140px]
  Bar (middle):  h-2 rounded-full bg-bg-inset (track)
                 Inner fill: rounded-full, width = score%
                   ≥ 70: bg-success (green)
                   ≥ 40: bg-accent-400 (amber)
                   < 40: bg-error (red)
                 Animate: width from 0% → score% over 500ms, staggered (50ms per bar)
  Score (right): text-sm font-mono text-text-secondary, min-w-[40px] text-right

Labels (per skill — these come from AI/data layer):
  eye-contact:             Gaze Duration, Natural Breaks, Confidence Level, Reduced Darting
  open-posture:            Spine Alignment, Arm Position, Shoulder Openness, Foot Stance
  active-listening:        Head Nods, Lean Response, Expression Match, Wait Time
  vocal-pacing:            Pause Usage, Speed Variation, Silence Comfort, Rhythm
  confident-disagreement:  Body Openness, Vocal Steadiness, Hold Position, Non-Reactivity
```

## AI Coach Notes Panel

```
Container: bg-bg-surface border border-white/8 rounded-2xl p-6 shadow-card

Header: "AI Coach Notes" — text-base font-semibold text-text-primary
Divider: 1px border-white/8 mt-3 mb-4

Body text:
  text-sm text-text-primary leading-relaxed
  Max 3–4 sentences from GPT-4o
  line-clamp-6 with "Read more" expand if longer

Icon: Lucide Sparkles 16px text-accent-400 — inline with header
```

## Video Comparison Row

```
Two panels side-by-side (full-width on mobile: stack vertically)
Each panel:
  Header label: "Reference" / "Your Recording"
    text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2

  Video player: bg-bg-inset rounded-xl aspect-video
    Standard HTML5 video controls (no custom controls needed here)
    Your recording: local blob URL
    Reference: YouTube iframe (same clip, same start/end)

Grid: grid grid-cols-1 md:grid-cols-2 gap-4
```

## Action Buttons

```
Container: flex gap-4 justify-center mt-8 flex-wrap

[↺ Try Again]:
  Ghost button — border border-white/10 text-text-primary rounded-xl px-6 py-3
  Icon: Lucide RotateCcw 16px
  hover: border-white/20 bg-bg-overlay

[Next Clip →]:
  Primary CTA — bg-accent-400 text-text-inverse rounded-pill px-8 py-3 font-semibold
  Icon: Lucide ArrowRight 16px (trailing)
  hover: bg-accent-500 shadow-glow-sm
```

## Props

```ts
interface FeedbackScoreCardProps {
  overallScore: number            // 0–100
  dimensions: Array<{
    label: string
    score: number                  // 0–100
  }>
  coachNotes: string              // AI-generated paragraph
  userRecordingUrl: string        // blob URL
  referenceClip: {
    videoId: string
    startSeconds: number
    endSeconds: number
    movieTitle: string
  }
  skill: SkillType
  onRetry: () => void
  onNextClip: () => void
}
```

## Mobile Adaptations

- Score ring: 120px
- Dimensions: same (bars are already responsive)
- Video comparison: stacked (grid-cols-1)
- Action buttons: full-width stacked on mobile

## Tailwind Classes Summary

```
Page:
  "max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12"

Top grid (score ring + dimensions):
  "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"

Score ring container:
  "bg-bg-surface rounded-2xl p-8 shadow-card
   flex flex-col items-center justify-center"

Dimensions container:
  "bg-bg-surface rounded-2xl p-6 shadow-card"

Dimension row:
  "flex items-center gap-3 mb-4"

Bar track:
  "flex-1 h-2 rounded-full bg-bg-inset overflow-hidden"

Bar fill:
  "h-full rounded-full transition-all duration-500 ease-smooth"

AI Notes panel:
  "bg-bg-surface border border-white/8 rounded-2xl p-6 shadow-card mb-8"
```
