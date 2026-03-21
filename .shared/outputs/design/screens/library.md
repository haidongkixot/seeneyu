# Screen: Skill Library
> Owner: Designer | Created: 2026-03-21

## Purpose
Main browsing surface. All curated clips are discoverable here. Filterable by skill type and difficulty. Mobile-friendly grid of ClipCards.

## Desktop Layout (1024px+)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ NavBar                                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  max-w-7xl mx-auto px-8 py-10                                                │
│                                                                              │
│  The Library                           15 clips available                    │
│  text-3xl font-bold                    text-sm text-text-tertiary            │
│                                                                              │
│  Filter bar:                                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Skill:  [All ✓] [Eye Contact] [Open Posture] [Listening] [Vocal] [Confid.]  │
│  Diff:   [All ✓] [Beginner]    [Intermediate]  [Advanced]                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  ClipCard    │  │  ClipCard    │  │  ClipCard    │  │  ClipCard    │    │
│  │  (16:9 img)  │  │  (16:9 img)  │  │  (16:9 img)  │  │  (16:9 img)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  ClipCard    │  │  ClipCard    │  │  ClipCard    │  │  ClipCard    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  [Load More] or pagination (future — MVP shows all 15)                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout (375px)

```
┌──────────────────────┐
│ NavBar               │
├──────────────────────┤
│                      │
│ The Library          │
│ 15 clips             │
│                      │
│ [Filter ▾]  [Sort ▾] │  ← compact: single tap opens filter drawer
│                      │
│ ┌──────────────────┐ │
│ │  ClipCard (full) │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │  ClipCard (full) │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │  ClipCard (full) │ │
│ └──────────────────┘ │
│                      │
└──────────────────────┘
```

## Filter Bar Spec (Desktop)

```
Container: sticky top-16 z-raised bg-bg-base/90 backdrop-blur-md
  border-b border-white/6 py-4 mb-8

Layout: flex items-center gap-6 flex-wrap

Row 1 — Skill filter:
  Label: "Skill" text-xs font-semibold text-text-tertiary uppercase tracking-widest mr-2
  Chips: [All] + 5 SkillBadge chips (interactive=true, size=md)
  "All" chip: custom — bg-accent-400/10 border-accent-400/30 text-accent-400
               when selected: bg-accent-400 text-text-inverse

Row 2 — Difficulty filter:
  Label: "Difficulty" text-xs font-semibold text-text-tertiary uppercase tracking-widest
  Chips: [All] + 3 DifficultyPill chips (interactive=true, size=md)

Active filter count badge (if any filters active, not "All"):
  Chip near label: "2 filters" bg-accent-400/10 text-accent-400 text-xs rounded-pill px-2 py-0.5
  [Clear all] text button: text-xs text-text-tertiary hover:text-text-primary ml-2
```

## Mobile Filter Drawer

```
Trigger: "Filter" button with Lucide SlidersHorizontal icon
  Shows active filter count badge if any selected

Drawer (bottom sheet on mobile):
  Slides up from bottom, 60% viewport height
  bg-bg-elevated rounded-t-3xl shadow-xl

  Handle: 4px bar centered at top, bg-white/20, w-12 rounded-full
  Header: "Filters" font-semibold + close X button
  Same filter rows as desktop

  Footer CTA:
    [Show X clips] — full-width amber pill button
    Count updates live as filters change
```

## Empty State (no clips match filters)

```
Center of grid area:
  Lucide SearchX icon: 64px text-text-tertiary
  Title: "No clips match your filters" — text-xl font-semibold text-text-primary mt-4
  Body: text-sm text-text-tertiary mt-2
    "Try removing some filters to see more clips"
  CTA: [Clear all filters] — ghost button
```

## Loading State (initial page load)

```
Header: skeleton shimmer (title + count)
Filter bar: skeleton shimmer chips
Grid: 8 ClipCard skeleton placeholders
  aspect-video bg-bg-surface rounded-2xl skeleton shimmer
  2 lines of text skeleton below each
```

## Filter Behavior

```
Filters are AND-logic: skill=eye-contact AND difficulty=beginner → intersection
"All" on any dimension means no filter on that dimension
Filter state lives in URL params: ?skill=eye-contact&difficulty=beginner
  (enables shareable filtered URLs and browser back button)
Grid updates with CSS opacity transition — no page reload:
  filtered-out cards: opacity-0 scale-95 → removed from layout via display:none (after 200ms)
  filter-in animation: opacity-0 → opacity-100, 200ms staggered by 30ms per card
```

## Page Spec

```
Page title: text-3xl font-bold text-text-primary
Count: text-sm text-text-tertiary — "{n} clips"
       Updates as filters change

Grid:
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"

Section max-width: max-w-7xl mx-auto

Spacing:
  Page top padding: pt-10
  Filter to grid gap: mt-8
```

## URL Structure

```
/library                    → all clips
/library?skill=eye-contact  → filtered by skill
/library?difficulty=beginner → filtered by difficulty
/library?skill=eye-contact&difficulty=beginner → both
```
