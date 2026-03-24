# M10 UI Specs — Script-Aware Coaching Loop
> Owner: Designer
> Milestone: M10
> Delivered: 2026-03-22
> Status: READY FOR IMPLEMENTATION

---

## Overview

Three new components extending the Record and Feedback pages to make the coaching loop script-aware. All use the existing seeneyu design system (amber accent, dark glass panels, Plus Jakarta Sans).

---

## Component 1 — CharacterBanner

**Purpose**: Compact horizontal banner at the top of the record page (above the webcam). Tells the learner exactly who they are mimicking. Motivational tone — like a coaching card before a big game.

**Placement**: Record page → between page header and the two-column layout (clip + webcam)

**Layout**: Single horizontal row. Fixed height ~72px on mobile, ~80px on desktop.

**Content**:
- Left: Skill category icon badge (Lucide icon, 20px, accent-tinted)
- Center (flex-1): Character name (prominent), Actor + Movie (secondary, same line or two small lines)
- Right: Motivational label chip — "NOW MIMICKING" — in amber pill

**Props**:
```ts
interface CharacterBannerProps {
  characterName: string       // e.g. "Jordan Belfort"
  actorName: string           // e.g. "Leonardo DiCaprio"
  movieTitle: string          // e.g. "The Wolf of Wall Street"
  skillCategory: string       // e.g. "vocal-pacing"
  skillIcon?: LucideIcon      // optional override
}
```

**States**:
- `default`: rendered with all data
- `loading`: skeleton shimmer (character name bar + actor/movie bar)

**Tailwind Classes**:
```
container: "flex items-center gap-4 px-4 py-4 md:px-6 bg-bg-surface border border-white/8 rounded-2xl shadow-card"
icon badge: "flex items-center justify-center w-10 h-10 rounded-xl bg-accent-400/10 text-accent-400"
character name: "text-lg md:text-xl font-semibold text-text-primary leading-tight"
actor + movie: "text-sm text-text-secondary"
now-mimicking chip: "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-accent-400/10 border border-accent-400/30 text-accent-400 text-xs font-semibold uppercase tracking-wider"
```

**Responsive**:
- Mobile (375px): icon + name + actor/movie stacked, chip hidden
- Desktop (1024px+): full row with "NOW MIMICKING" pill visible on right

**ASCII Mockup**:
```
┌─────────────────────────────────────────────────────────────────────┐
│  [🎙]   Jordan Belfort                         [ NOW MIMICKING ▸ ]  │
│         Leonardo DiCaprio · The Wolf of Wall Street                 │
└─────────────────────────────────────────────────────────────────────┘

Mobile:
┌─────────────────────────────┐
│  [🎙]  Jordan Belfort       │
│        Leonardo DiCaprio    │
│        Wolf of Wall Street  │
└─────────────────────────────┘
```

**Motion**:
- Entrance: fade-in + slide-down 8px, 300ms spring easing
- Skeleton → content: cross-fade 200ms smooth

**Micro-detail**: The skill icon tint matches the skill badge color (e.g. vocal-pacing → amber tint). Use the `skill` color tokens from the design system.

---

## Component 2 — ScriptPanel

**Purpose**: Card on the record page, placed below the observation checklist (in the clip-viewer column). Shows the exact dialogue or physical behavior the learner must perform. Must be highly readable while the webcam is live — learner glances at it between takes.

**Placement**: Record page → left column (clip side), below checklist, above any existing action buttons

**Layout**: Vertical card. Two modes determined by `type` prop:
- `"dialogue"` → blockquote-style script text
- `"action"` → numbered instruction list

**Props**:
```ts
interface ScriptPanelProps {
  type: 'dialogue' | 'action'
  label?: string              // default: "YOUR SCRIPT" (dialogue) | "WHAT TO DO" (action)
  content: string | string[]  // string for dialogue, string[] for action steps
  tip?: string                // e.g. "Say this out loud while recording."
}
```

**States**:
- `default`: content rendered
- `loading`: skeleton (2 lines of text placeholder)
- `empty`: hidden (do not render if no script data)

**Dialogue Mode Layout**:
```
LABEL: "YOUR SCRIPT"
─────────────────────
[left amber border bar]
  "Quoted dialogue text here —
   spanning multiple lines if needed."
─────────────────────
💡 Tip text
```

**Action Mode Layout**:
```
LABEL: "WHAT TO DO"
─────────────────────
  1. First instruction
  2. Second instruction
  3. Third instruction
─────────────────────
💡 Tip text
```

**Tailwind Classes**:
```
container:        "bg-bg-surface border border-white/8 rounded-2xl p-4 md:p-5 space-y-3"
label row:        "flex items-center gap-2"
label text:       "text-xs font-semibold uppercase tracking-widest text-text-tertiary"
label icon:       "w-4 h-4 text-text-tertiary"  (FileText or ListOrdered from Lucide)
divider:          "border-t border-white/6"

--- DIALOGUE MODE ---
blockquote wrap:  "border-l-2 border-accent-400 pl-4"
quote text:       "text-base md:text-lg font-medium text-text-primary leading-relaxed italic"

--- ACTION MODE ---
list:             "space-y-2"
list item:        "flex items-start gap-3"
step number:      "flex-shrink-0 w-6 h-6 rounded-full bg-accent-400/15 text-accent-400 text-xs font-bold flex items-center justify-center"
step text:        "text-base text-text-primary leading-relaxed"

--- SHARED ---
tip row:          "flex items-start gap-2 pt-1"
tip icon:         "w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5"  (Lightbulb icon)
tip text:         "text-sm text-text-secondary italic"
```

**Responsive**:
- Mobile: full-width card, text-base
- Desktop: constrained within clip column (no change needed, inherits column width)

**ASCII Mockup — Dialogue Mode**:
```
┌──────────────────────────────────────────────────────┐
│  📄 YOUR SCRIPT                                       │
│  ─────────────────────────────────────────────────   │
│  ▌                                                   │
│  ▌  "Did you know that the most successful people    │
│  ▌   in the world look people directly in the eye   │
│  ▌   when they speak?"                              │
│  ─────────────────────────────────────────────────   │
│  💡 Say this out loud while recording.              │
└──────────────────────────────────────────────────────┘
```

**ASCII Mockup — Action Mode**:
```
┌──────────────────────────────────────────────────────┐
│  ≡  WHAT TO DO                                        │
│  ─────────────────────────────────────────────────   │
│   ①  Stand with feet shoulder-width apart            │
│   ②  Keep shoulders back, chest open                 │
│   ③  Maintain eye contact with the camera            │
│  ─────────────────────────────────────────────────   │
│  💡 Hold each position for 3 seconds.               │
└──────────────────────────────────────────────────────┘
```

**Motion**:
- First render: fade-in 300ms smooth
- No hover effects (it's a reference card, not interactive)

**Accessibility**:
- `role="region"` on container
- `aria-label="Script panel"` or `aria-label="Action instructions"`
- Quote text uses `<blockquote>` element in dialogue mode
- Action mode uses `<ol>` with `<li>` elements

---

## Component 3 — ActionPlan

**Purpose**: Personalized improvement plan on the feedback page. Placed between the improvements grid and AI Tips section. Each step is ordered by priority (highest impact first). Imperative, forward-motion tone.

**Placement**: Feedback page → after score + improvements grid, before AI Tips

**Layout**: Vertical stack of step cards. Header section (title + subtitle) + numbered step list.

**Props**:
```ts
interface ActionPlanStep {
  action: string   // Bold imperative. e.g. "Hold eye contact for 3 full seconds"
  why: string      // Muted 1-line reason. e.g. "Your gaze broke early in 4 of 5 attempts"
}

interface ActionPlanProps {
  steps: ActionPlanStep[]  // ordered by priority, max 5 recommended
  title?: string           // default: "YOUR ACTION PLAN"
  subtitle?: string        // default: "Do these in order at your next practice session."
}
```

**States**:
- `default`: all steps visible
- `loading`: skeleton (3 placeholder step rows)
- `empty`: hidden (do not render if steps array is empty)

**Step Card Anatomy**:
```
[ step number ]  [ action text (bold) ]
                 [ why text (muted)   ]
      with left border accent bar
```

**Tailwind Classes**:
```
outer container: "space-y-4"

header:          "space-y-0.5"
title:           "text-xs font-semibold uppercase tracking-widest text-text-tertiary"
subtitle:        "text-sm text-text-secondary"

steps list:      "space-y-3"

step card:       "flex items-start gap-4 bg-bg-surface border border-white/8 rounded-xl
                  pl-0 pr-4 py-4 shadow-card overflow-hidden relative"

accent border:   "absolute left-0 top-0 bottom-0 w-[3px] bg-accent-400 rounded-l-xl"

step number:     "flex-shrink-0 w-10 h-10 flex items-center justify-center ml-4
                  text-accent-400 text-xl font-bold font-mono"

step content:    "flex-1 space-y-0.5"
action text:     "text-base font-semibold text-text-primary leading-snug"
why text:        "text-sm text-text-secondary leading-relaxed"
```

**Responsive**:
- Mobile: full-width, step number 36px, text-sm for why
- Desktop: same layout, step number 40px, normal sizing

**ASCII Mockup**:
```
YOUR ACTION PLAN
Do these in order at your next practice session.

┌──────────────────────────────────────────────────────┐
│▌  1   Hold eye contact for 3 full seconds            │
│▌       Your gaze broke early in 4 of 5 attempts      │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│▌  2   Slow your speaking pace to ~130 WPM            │
│▌       You averaged 165 WPM — too fast to land well  │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│▌  3   Open your posture — uncross your arms          │
│▌       Closed posture reduces perceived confidence   │
└──────────────────────────────────────────────────────┘
```

**Motion**:
- Staggered entrance: each step fades in + slides up 12px, 200ms delay per step (0ms, 80ms, 160ms…)
- Easing: spring cubic-bezier
- No hover state (informational, read-only)

**Accessibility**:
- Container: `role="region"` with `aria-label="Action plan"`
- Steps rendered as `<ol>` with `<li>` elements
- Step numbers are `aria-hidden="true"` (visual only — `<li>` order conveys sequence)

---

## Page Layout Context

### Record Page — Updated Column Layout (left/clip side)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [CharacterBanner — full width above columns]                        │
├───────────────────────────────┬──────────────────────────────────────┤
│  YouTube clip embed           │  Webcam preview                      │
│  ───────────────────────      │  ────────────────────                │
│  Observation checklist        │  Recording controls                  │
│  ───────────────────────      │                                      │
│  [ScriptPanel]                │                                      │
│  ───────────────────────      │                                      │
│  Start Recording button       │                                      │
└───────────────────────────────┴──────────────────────────────────────┘
```

### Feedback Page — Updated Section Order

```
1. Score ring + overall grade
2. Dimension scores grid (strengths / improvements)
3. [ActionPlan]   ← NEW, inserted here
4. AI Tips section
5. Retry / Next Clip CTAs
```

---

## Design Notes for Developer

1. **CharacterBanner** is always rendered server-side data (clip metadata). No client-side fetch needed — data comes from the existing clip object already loaded on the record page.

2. **ScriptPanel** renders only when `clip.script` is non-null. Use conditional rendering (`{clip.script && <ScriptPanel ... />}`). Do not show an empty card.

3. **ActionPlan** data comes from the AI feedback response. It expects `feedbackResult.steps: ActionPlanStep[]`. The AI prompt must be updated to return this array. If steps is empty or undefined, hide the component entirely.

4. **Left accent border on ActionPlan steps**: use `relative overflow-hidden` on the step card + an `absolute` element `left-0 top-0 bottom-0 w-[3px] bg-accent-400`. Do NOT use `border-l-4` — it doesn't support the exact amber color from the design token without Tailwind arbitrary values.

5. **Stagger animation**: implement with inline `style={{ animationDelay: \`${index * 80}ms\` }}` and a Tailwind `animate-fade-in-up` keyframe (add to tailwind.config.js). Or use a simple CSS class with `animation-fill-mode: both`.

---

## Keyframe to Add to Tailwind Config

```js
// tailwind.config.js → theme.extend.keyframes / animation
keyframes: {
  'fade-in-up': {
    '0%':   { opacity: '0', transform: 'translateY(12px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  'fade-in-up': 'fade-in-up 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
},
```

---

*End of M10 UI Specs*
