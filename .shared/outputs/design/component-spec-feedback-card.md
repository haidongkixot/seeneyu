# Component Spec: Feedback Card
> Owner: Designer | Status: COMPLETE | Milestone: M1
> Route: `/feedback/[sessionId]`

## Purpose
Displays GPT-4o Vision AI feedback after the user submits their recording. Shows an overall score ring, per-dimension score breakdown, AI-generated tips, comparison highlights, and a clear next-step CTA.

---

## Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back   "Eye Contact Feedback"                      Share  ↻ Retry │  ← nav
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│         ┌─────────┐                                                  │
│         │   78    │  ← score ring (amber stroke, animated draw)     │
│         │   /100  │                                                  │
│         └─────────┘                                                  │
│      "Good progress! Your gaze is consistent."                       │  ← summary line
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SCORE BREAKDOWN                                                     │
│  ┌──────────────────────────────────────┐                           │
│  │ Gaze Duration      ████████░░  8/10  │                           │
│  │ Break Direction    ███████░░░  7/10  │                           │
│  │ Eye Opening        █████████░  9/10  │                           │
│  │ Consistency        ███████░░░  7/10  │                           │
│  └──────────────────────────────────────┘                           │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  WHAT YOU DID WELL                        WHAT TO IMPROVE           │
│  ✓ Gaze duration at 2.4s avg              ✗ Look slightly left      │
│  ✓ Natural brow expression                ✗ Head tilts forward      │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  AI TIPS                                                             │
│  [tip 1 card]  [tip 2 card]  [tip 3 card]   ← horizontal scroll    │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [↻ Try This Clip Again]     [→ Next Clip: Intermediate →]          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Score Ring

- SVG circular progress, `r=54`, `cx/cy=60` (120×120 viewport)
- Background ring: `stroke: rgba(255,255,255,0.08)` strokeWidth 8
- Score ring: `stroke: url(#scoreGradient)` strokeWidth 8
  - Gradient: `#fbbf24 → #f59e0b → #d97706`
- Animation: `stroke-dashoffset` from full → calculated offset, 700ms ease-out
- Center text: score number in `text-4xl font-extrabold text-text-primary` + `/100` in `text-sm text-text-secondary`
- Container: `w-32 h-32 mx-auto`

**Score → color mapping:**
| Range | Ring color | Summary tone |
|---|---|---|
| 0–49 | error.DEFAULT | "Keep practicing — here's how to improve" |
| 50–69 | warning.DEFAULT | "Good start! Focus on these areas" |
| 70–84 | accent.400 | "Good progress! [specific feedback]" |
| 85–100 | success.DEFAULT | "Excellent! You've nailed this skill" |

---

## Score Breakdown Bar

Each dimension row:
```
[Dimension Label]   [████████░░]   [N/10]
```

- Label: `text-text-secondary text-sm w-36 shrink-0`
- Bar track: `bg-white/8 rounded-pill h-2 flex-1`
- Bar fill: `bg-accent-400 rounded-pill h-2` — width animated from 0% → `${score*10}%` (700ms)
- Score: `text-text-primary text-sm font-semibold w-10 text-right`

Dimensions vary per skill. Default for eye-contact:
- Gaze Duration (avg time holding gaze)
- Break Direction (natural vs awkward break)
- Eye Opening (appropriate, not wide/squinted)
- Consistency (maintained through clip)

---

## What You Did Well / What to Improve

Two-column grid (stacks to 1-col on mobile):
```
Left card (success):  bg-success/5 border border-success/20 rounded-xl p-4
Right card (error):   bg-error/5   border border-error/20   rounded-xl p-4
```

Each item: icon (✓ success-400 / ✗ error-400) + `text-text-primary text-sm`

---

## AI Tips (Horizontal Scroll Cards)

Container: `flex gap-4 overflow-x-auto pb-2 scrollbar-hide`

Each tip card:
```
┌─────────────────────────────────┐  w-64 shrink-0
│  💡  Tip Title                  │  ← text-accent-400 text-sm font-semibold
│                                 │
│  Tip body text...               │  ← text-text-secondary text-sm leading-relaxed
│                                 │
│  [Try this exercise →]          │  ← text-accent-400 text-xs underline
└─────────────────────────────────┘
bg-bg-elevated border border-white/8 rounded-2xl p-5
```

---

## Props / Data Shape (from AI response)

```ts
interface FeedbackData {
  sessionId: string
  clipId: string
  overallScore: number          // 0–100
  summary: string               // one-sentence AI summary
  dimensions: {
    label: string
    score: number               // 0–10
  }[]
  positives: string[]           // 2–3 things done well
  improvements: string[]        // 2–3 things to improve
  tips: {
    title: string
    body: string
    exerciseLink?: string
  }[]
  nextClipId?: string           // suggested next clip (same skill, next difficulty)
}
```

---

## Navigation

**Back**: `← Back` → returns to `/clip/[clipId]`
**Retry**: `↻ Try This Clip Again` → returns to `/clip/[clipId]` (resets recording state)
**Next**: `→ Next Clip: [Difficulty] →` → navigates to `/clip/[nextClipId]`
- If no nextClipId (e.g. Advanced completed): replace with `→ Browse More Clips`

---

## Loading State

While AI feedback is processing (streaming):
- Score ring shows skeleton shimmer
- Breakdown bars show skeleton bars
- Tips area: 2 skeleton cards
- Summary: skeleton line
- "Analyzing your recording..." text with loading spinner below ring

---

## Key Tailwind Classes

```
Page:
  "min-h-screen bg-bg-base"

Content container:
  "max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8"

Score section:
  "flex flex-col items-center gap-3 py-6"

Summary text:
  "text-text-secondary text-lg text-center"

Section title:
  "text-text-tertiary text-xs font-semibold uppercase tracking-widest mb-4"

Breakdown card:
  "bg-bg-surface border border-white/8 rounded-2xl p-6 flex flex-col gap-4"

Positives/improvements grid:
  "grid grid-cols-1 md:grid-cols-2 gap-4"

CTA row:
  "flex flex-col sm:flex-row gap-4 pt-4"

Primary CTA (next clip):
  "flex-1 bg-accent-400 text-text-inverse rounded-pill py-3.5 text-base font-semibold
   text-center hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150"

Secondary CTA (retry):
  "flex-1 border border-white/10 text-text-primary rounded-xl py-3.5 text-base
   text-center hover:border-white/20 hover:bg-bg-overlay transition-all duration-150"
```

---

## Accessibility

- `<main>` with `aria-label="AI Feedback for {skillCategory}"`
- Score ring: `role="img" aria-label="Score: {score} out of 100"`
- Feedback sections: `<section aria-labelledby="...">` with descriptive heading IDs
- Loading: `aria-live="polite"` announces "Feedback ready" when analysis completes
- Tips scroll: `role="list"`, each tip `role="listitem"`
