# M14 UI Spec — Library Expansion (Film Filter + Screenplay Badge)
> Owner: Designer | Milestone: M14 | Delivered: 2026-03-23

## Overview
M14 expands the clip library to 100+ clips and surfaces screenplay availability as a first-class feature. Three surfaces to update:
1. Library Filter Panel — add Film + Screenplay rows
2. ClipCard — screenplay availability badge
3. Clip detail page — "Read Screenplay" link button

---

## 1. Library Filter Panel

### Current state
Two filter rows: SKILL and DIFFICULTY (in LibraryFilters.tsx).

### New state — 4 filter rows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SKILL       [All ✓]  [Eye Contact]  [Open Posture]  [Listening]  [Vocal]   │
│                        [Confident Disagreement]                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  DIFFICULTY  [All ✓]  [Beginner]  [Intermediate]  [Advanced]                │
├─────────────────────────────────────────────────────────────────────────────┤
│  FILM        [All Films ▾]  (searchable dropdown, shows unique movie titles) │
├─────────────────────────────────────────────────────────────────────────────┤
│  SCREENPLAY  [📄 Has Screenplay]  ← toggle chip, amber when active          │
│                                                    [× Clear all]            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Film Filter component
**Type**: `'use client'` — searchable dropdown
**Props**: `filmOptions: string[]`, `activeFilm?: string`
**Behavior**:
- Shows a pill button "All Films" (default selected, amber fill)
- When clicked: dropdown opens with list of all unique movie titles
- Selecting a film adds `?film=<movieTitle>` to URL
- Active film pill shown inline: `[× The Dark Knight]`
- URL param: `film`

**Tailwind classes:**
```
// "All Films" button (inactive):
"inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-semibold border
 border-white/10 bg-white/5 text-text-secondary hover:border-white/20 hover:text-text-primary
 transition-all duration-150"

// Active film badge:
"inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-semibold border
 border-accent-400/50 bg-accent-400/15 text-accent-400"

// Dropdown container:
"absolute top-full left-0 mt-1 z-50 bg-bg-surface border border-white/10 rounded-xl
 shadow-xl max-h-64 overflow-y-auto min-w-[200px]"

// Dropdown item:
"px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5
 cursor-pointer transition-colors"
```

### Screenplay Filter component
**Type**: `'use client'` — toggle chip
**Props**: `hasScreenplay?: boolean`
**URL param**: `screenplay=true`

**States:**
```
// Inactive:
"inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium border
 border-white/10 bg-white/5 text-text-tertiary hover:text-text-secondary hover:border-white/20
 cursor-pointer transition-all duration-150"

// Active (screenplay=true):
"inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium border
 border-amber-400/40 bg-amber-400/10 text-amber-400 cursor-pointer transition-all duration-150"
```

**Label**: `📄 Has Screenplay`

### LibraryFilters.tsx updated props
```typescript
interface LibraryFiltersProps {
  activeSkill?: SkillCategory
  activeDifficulty?: Difficulty
  activeFilm?: string          // NEW
  hasScreenplay?: boolean      // NEW
  filmOptions: string[]        // NEW — list of unique movie titles from DB
}
```

### Library page (page.tsx) updates
- Fetch `filmOptions` from `prisma.clip.findMany({ distinct: ['movieTitle'], select: { movieTitle: true } })`
- Add `film` and `screenplay` to searchParams type
- Filter: `...(film && { movieTitle: film })`
- Filter: `...(screenplay === 'true' && { screenplaySource: { not: null } })`

---

## 2. ClipCard — Screenplay Badge

### Position
Top-right corner of the thumbnail image, overlaid as absolute positioned element.

```
┌──────────────────────────────────────┐
│                          [📄 Script] │  ← amber badge, top-right
│                                      │
│        [YouTube Thumbnail]           │
│                          ▶ 1:30      │
└──────────────────────────────────────┘
│  Eye Contact             Beginner    │
│  The Dark Knight — 2008              │
│  Scene description here...           │
└──────────────────────────────────────┘
```

### Tailwind classes
```tsx
{clip.screenplaySource && (
  <div className="absolute top-2 right-2 z-10">
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                     text-amber-400 bg-bg-base/80 backdrop-blur-sm
                     border border-amber-400/25 rounded-full px-2 py-0.5">
      📄 Script
    </span>
  </div>
)}
```

### ClipCard prop update
Add `screenplaySource?: string | null` to the Pick<> type on ClipCardProps.
Update the `select` in the library page query to include `screenplaySource: true`.

---

## 3. Clip Detail — "Read Screenplay" Button

### Position
Below the movie title / character info area, before the skill badge row. Renders only when `clip.screenplaySource` is truthy.

```
┌─────────────────────────────────────────────────┐
│  ← Back to Library                              │
│                                                 │
│  👁 The Dark Knight (2008)                       │
│  Heath Ledger as The Joker                      │
│                                                 │
│  [📄 Read Screenplay →]  ← amber ghost button   │
│                                                 │
│  [Eye Contact]  [Advanced]                      │
│                                                 │
│  "Watch how The Joker uses..."                  │
└─────────────────────────────────────────────────┘
```

### Tailwind classes
```tsx
{clip.screenplaySource && (
  <a
    href={clip.screenplaySource}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 text-sm font-medium text-amber-400
               hover:text-amber-300 border border-amber-400/25 hover:border-amber-400/50
               rounded-xl px-4 py-2 transition-all duration-150 w-fit"
  >
    📄 Read Screenplay
    <span className="text-xs opacity-60">→</span>
  </a>
)}
```

---

## Implementation notes
- `filmOptions` should be sorted alphabetically
- Film dropdown should include a search/filter input for 100+ films
- Clear All button should reset all 4 filters (skill, difficulty, film, screenplay)
- LibraryFilters is `'use client'` — all filter state via URL params (not React state)
- ClipCard `screenplaySource` should be included in the `select` query in page.tsx
