# Component Spec: Clip Card
> Owner: Designer | Status: COMPLETE | Milestone: M1

## Purpose
Displays a single curated clip in the library grid. Communicates skill, difficulty, movie, and duration at a glance. Navigates to the coaching screen on click.

---

## Anatomy

```
┌─────────────────────────────────────┐  ← bg-bg-surface, rounded-2xl, shadow-card
│ ┌─────────────────────────────────┐ │  ← thumbnail wrapper, rounded-xl, aspect-video
│ │                                 │ │
│ │         THUMBNAIL               │ │  ← YouTube thumbnail (maxresdefault.jpg)
│ │         (16:9)                  │ │
│ │                                 │ │
│ │  [skill badge]    [difficulty]  │ │  ← absolute bottom-left / bottom-right
│ └─────────────────────────────────┘ │
│                                     │
│  Movie Title — "Scene description"  │  ← text-text-primary text-base font-semibold
│  Character · Movie (Year)           │  ← text-text-secondary text-sm
│                                     │
│  ─────────────────────────────────  │  ← border-white/6
│                                     │
│  [▷ 1:45]           [eye-contact]  │  ← duration icon-text left, skill tag right
└─────────────────────────────────────┘
```

---

## States

| State    | Visual treatment |
|---|---|
| Default  | shadow-card, border border-white/8 |
| Hover    | -translate-y-1, shadow-card-hover, border-accent-400/20, cursor-pointer |
| Active   | translate-y-0, scale-[0.99] |
| Loading  | skeleton shimmer on all zones |
| Disabled | opacity-50, cursor-not-allowed (e.g. clip unavailable) |

---

## Props

```ts
interface ClipCardProps {
  id: string
  youtubeVideoId: string
  movieTitle: string
  characterName?: string
  year?: number
  sceneDescription: string
  skillCategory: 'eye-contact' | 'open-posture' | 'active-listening' | 'vocal-pacing' | 'confident-disagreement'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  durationSeconds: number   // endSec - startSec
  onClick?: () => void
}
```

---

## Thumbnail

- URL pattern: `https://img.youtube.com/vi/{youtubeVideoId}/maxresdefault.jpg`
- Fallback: `hqdefault.jpg` if maxres 404s
- `object-fit: cover` inside aspect-video container
- `loading="lazy"` for library grid performance

---

## Skill Badge (bottom-left of thumbnail)

```
bg: skill[category].bg
border: skill[category].border
text: skill[category].text
padding: px-2 py-0.5
font: text-xs font-semibold uppercase tracking-wide
radius: rounded-pill
backdrop: backdrop-blur-sm (sits on top of image)
```

**Skill label map:**
| category | display label |
|---|---|
| eye-contact | Eye Contact |
| open-posture | Open Posture |
| active-listening | Active Listening |
| vocal-pacing | Vocal Pacing |
| confident-disagreement | Confident Disagreement |

---

## Difficulty Badge (bottom-right of thumbnail)

```
bg: difficulty[level].bg
border: difficulty[level].border
text: difficulty[level].text
padding: px-2 py-0.5
font: text-xs font-medium
radius: rounded-pill
backdrop: backdrop-blur-sm
```

Icons: ● Beginner | ●● Intermediate | ●●● Advanced (dot count)

---

## Duration Display

Format: `M:SS` — e.g. "1:45"
Icon: Lucide `Play` (size 14, strokeWidth 2)
Color: text-text-tertiary

---

## Grid Layout

```
Library page grid:
  mobile:  grid-cols-1
  sm:      grid-cols-2
  lg:      grid-cols-3
  xl:      grid-cols-4
  gap-5
```

---

## Tailwind Class Summary

```
Card wrapper:
  "group relative bg-bg-surface border border-white/8 rounded-2xl shadow-card
   hover:shadow-card-hover hover:-translate-y-1 hover:border-accent-400/20
   transition-all duration-200 cursor-pointer overflow-hidden"

Thumbnail container:
  "relative aspect-video overflow-hidden rounded-t-2xl"

Thumbnail img:
  "w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"

Badges overlay row:
  "absolute bottom-2 left-2 right-2 flex justify-between items-end"

Body:
  "p-4 flex flex-col gap-3"

Title:
  "text-text-primary text-base font-semibold leading-snug line-clamp-2"

Meta:
  "text-text-secondary text-sm"

Footer:
  "flex items-center justify-between pt-3 border-t border-white/6"
```

---

## Accessibility

- `role="article"` on card wrapper
- `aria-label="{skillCategory} clip: {sceneDescription} from {movieTitle}"`
- Keyboard: focusable, `Enter` triggers click
- Focus ring: `focus-visible:ring-2 focus-visible:ring-accent-400/60 focus-visible:outline-none`
