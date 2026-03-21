# Component: ClipCard
> Owner: Designer | Created: 2026-03-21

## Purpose
Display a curated movie clip in the library grid. Scannable at a glance — skill, difficulty, movie title, and duration are immediately visible without hovering.

## Layout

```
┌────────────────────────────────────────┐
│  ┌──────────────────────────────────┐  │  ← rounded-2xl card
│  │                                  │  │
│  │         16:9 THUMBNAIL           │  │  ← rounded-xl img
│  │                                  │  │
│  │  [Skill Badge]  [Diff Pill]      │  │  ← bottom-left overlay
│  │                             0:47 │  │  ← bottom-right: duration
│  └──────────────────────────────────┘  │
│                                        │
│  Gone with the Wind (1939)             │  ← text-xs text-text-tertiary
│  Making Eye Contact Under Pressure     │  ← text-sm font-semibold text-text-primary
│                                        │
└────────────────────────────────────────┘
```

## States

### Default
```
Container: bg-bg-surface border border-white/8 rounded-2xl shadow-card overflow-hidden
           cursor-pointer select-none

Thumbnail: w-full aspect-video object-cover rounded-xl

Overlay (bottom of thumbnail):
  bg gradient: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)
  padding: px-3 pb-3 pt-8

Skill Badge: [SkillBadge component — see skill-badge.md]
Difficulty Pill: [DifficultyPill component — see difficulty-pill.md]

Duration badge: bottom-right, text-xs font-mono text-white bg-black/60
               rounded-md px-1.5 py-0.5

Title area (below thumbnail):
  Movie title: text-xs text-text-tertiary mt-3 px-4
  Clip title:  text-sm font-semibold text-text-primary px-4 pb-4 mt-0.5
               line-clamp-2 (max 2 lines)
```

### Hover
```
Card: shadow-card-hover -translate-y-1 border-accent-400/20
      transition-all duration-200 ease-smooth

Play button overlay fades in:
  Position: absolute center of thumbnail
  Element: 48x48px circle, bg-accent-400/90 backdrop-blur-sm
           flex items-center justify-center rounded-full
  Icon: Lucide Play (filled), 20px, text-text-inverse
  Animation: opacity-0 → opacity-100, scale-90 → scale-100, duration-200
```

### Active / Pressed
```
Card: scale-[0.98] translate-y-0 transition-transform duration-100
```

### Loading (skeleton)
```
Thumbnail: skeleton shimmer, aspect-video rounded-xl
Movie title: skeleton shimmer h-3 w-24 rounded mt-3 mx-4
Clip title:  skeleton shimmer h-4 w-48 rounded mt-1.5 mx-4
```

### Locked (future state)
```
Thumbnail: blur-sm opacity-60
Lock icon overlay: center of thumbnail, Lucide Lock 24px text-white/60
Overlay pill: "COMING SOON" — top-right, text-xs bg-bg-elevated/80 text-text-tertiary
              rounded-pill px-2 py-0.5
CTA interaction: cursor-not-allowed, no hover effects
```

## Props

```ts
interface ClipCardProps {
  id: string
  title: string               // "Making Eye Contact Under Pressure"
  movieTitle: string          // "Gone with the Wind"
  movieYear?: number          // 1939
  skillTag: SkillType         // 'eye-contact' | 'open-posture' | etc.
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  difficultyScore: number     // raw sum 4–12
  thumbnailUrl: string        // from YouTube: https://img.youtube.com/vi/{id}/maxresdefault.jpg
  duration: string            // "0:47" formatted
  isLocked?: boolean
  isLoading?: boolean
  onClick?: () => void
}
```

## Tailwind Classes Summary

```
Card wrapper:
  "group relative bg-bg-surface border border-white/8 rounded-2xl shadow-card
   overflow-hidden cursor-pointer select-none
   hover:shadow-card-hover hover:-translate-y-1 hover:border-accent-400/20
   active:scale-[0.98]
   transition-all duration-200 ease-smooth"

Thumbnail:
  "w-full aspect-video object-cover rounded-xl"

Play overlay (hover-reveal):
  "absolute inset-0 flex items-center justify-center
   opacity-0 group-hover:opacity-100 transition-opacity duration-200"

Play button circle:
  "w-12 h-12 rounded-full bg-accent-400/90 backdrop-blur-sm
   flex items-center justify-center
   scale-90 group-hover:scale-100 transition-transform duration-200"
```

## Responsive

| Breakpoint | Columns | Card min-width |
|---|---|---|
| Mobile (375px) | 1 col (full width) | — |
| Tablet (768px) | 2 col | — |
| Desktop (1024px) | 3 col | — |
| Wide (1440px) | 4 col | — |

Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6`

## Accessibility
- `role="button"` on card wrapper
- `aria-label`: `{title} — {movieTitle} — {difficulty} difficulty — {duration}`
- Keyboard: focusable, Enter/Space triggers click
- Focus ring: `focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base`
