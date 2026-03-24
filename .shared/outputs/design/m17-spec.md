# M17 — Library UX Spec
> Designer: M17 delivery
> Date: 2026-03-24
> Status: READY FOR IMPLEMENTATION

---

## Overview

Three UX improvements to the Library page:
1. **Collapsible filter panel** — all filter rows inside a toggle (default: collapsed on mobile, expanded on desktop)
2. **Search bar** — above filter toggle, debounced, shows clip count
3. **4-column thumbnail grid** — desktop changes from 3 → 4 cols, more compact ClipCards

---

## 1. Search Bar

### Position
Rendered above the filter panel toggle — first element inside the sticky bar.

### Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍  Search clips, films, characters…              48 clips  │
│                                                         [×]  │
└─────────────────────────────────────────────────────────────┘
```

- **Left icon**: `Search` (Lucide, 16px, `text-text-tertiary`)
- **Placeholder**: `Search clips, films, characters…`
- **Right side**: clip count (`48 clips` — `text-xs text-text-tertiary`) + clear button `×` when text present
- **Clear button**: `X` icon (Lucide, 14px), appears only when `searchQuery !== ''`

### Tailwind Classes

```tsx
// Outer wrapper
<div className="relative flex items-center mb-3">

// Input
<input
  className="w-full bg-bg-inset border border-white/10 rounded-xl
             pl-9 pr-24 py-2.5 text-sm text-text-primary
             placeholder:text-text-tertiary
             focus:border-accent-400/60 focus:shadow-glow-sm focus:outline-none
             transition-all duration-150"
  placeholder="Search clips, films, characters…"
/>

// Search icon (absolute left)
<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />

// Right cluster (absolute right)
<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
  {clipCount !== undefined && (
    <span className="text-xs text-text-tertiary tabular-nums whitespace-nowrap">
      {clipCount} clips
    </span>
  )}
  {searchQuery && (
    <button onClick={clearSearch} className="text-text-tertiary hover:text-text-primary transition-colors p-0.5">
      <X size={14} />
    </button>
  )}
</div>
```

### Behavior
- **Debounced**: 300ms after typing stops → update URL `?search=` param
- **On clear**: remove `search` param, restore full clip list
- **Count**: reflects filtered result count from the API; shows `0 clips` gracefully (no crash)
- **URL param**: `?search=gladiator` — URL-shareable, survives refresh

### State (in library page or FilterPanel parent)

```tsx
const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '')
const debouncedSearch = useDebounce(searchQuery, 300)

useEffect(() => {
  // update URL when debouncedSearch changes
}, [debouncedSearch])
```

---

## 2. Collapsible Filter Panel

### Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search bar — always visible]                                        │
├────────────────────────────────────────────────────────────────────────┤
│  Filters  [2 active]  ▾                                  [Clear all ×]  │  ← toggle row
├────────────────────────────────────────────────────────────────────────┤
│  (when expanded):                                                       │
│  Skill  [All] [eye-contact] [open-posture] [active-listening]…         │
│  Level  [All] [Beginner] [Intermediate] [Advanced]                     │
│  Film   [All Films] [Gladiator] [The Pursuit of Happyness]…  +N more ▾ │
│  Extra  [📄 Has Screenplay]                                             │
└────────────────────────────────────────────────────────────────────────┘
```

### Toggle Row

```tsx
// Toggle button row — always visible
<div className="flex items-center justify-between">
  <button
    onClick={() => setPanelOpen(!panelOpen)}
    className="flex items-center gap-2 text-sm font-medium text-text-secondary
               hover:text-text-primary transition-colors duration-150"
  >
    <SlidersHorizontal size={16} />
    <span>Filters</span>
    {activeFilterCount > 0 && (
      <span className="inline-flex items-center justify-center
                       min-w-[20px] h-5 px-1.5 rounded-pill
                       bg-accent-400 text-text-inverse text-xs font-semibold">
        {activeFilterCount}
      </span>
    )}
    <ChevronDown
      size={16}
      className={`text-text-tertiary transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}
    />
  </button>
  {hasFilters && (
    <button
      onClick={clearAll}
      className="flex items-center gap-1 text-xs text-text-tertiary
                 hover:text-text-primary transition-colors duration-150"
    >
      <X size={12} />
      Clear all
    </button>
  )}
</div>
```

### Panel Animation (CSS max-height transition)

```tsx
// Collapsible content wrapper
<div
  className={`overflow-hidden transition-all duration-300 ease-smooth ${
    panelOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
  }`}
>
  <div className="flex flex-col gap-3 pt-3">
    {/* Skill row, Level row, Film row, Extra row — unchanged content */}
  </div>
</div>
```

### Default State Logic

```tsx
// In FilterPanel component
const isDesktop = useMediaQuery('(min-width: 768px)')
const [panelOpen, setPanelOpen] = useState<boolean | null>(null)

// On mount: respect localStorage, fallback to device default
useEffect(() => {
  const saved = localStorage.getItem('library-filter-panel')
  if (saved !== null) {
    setPanelOpen(saved === 'open')
  } else {
    setPanelOpen(isDesktop) // desktop: open, mobile: closed
  }
}, [isDesktop])

// Persist toggle choice
const togglePanel = () => {
  const next = !panelOpen
  setPanelOpen(next)
  localStorage.setItem('library-filter-panel', next ? 'open' : 'closed')
}
```

### Active Filter Count Badge

```tsx
const activeFilterCount = [
  activeSkill,
  activeDifficulty,
  activeFilm,
  hasScreenplay,
].filter(Boolean).length
```

- Badge only appears when `activeFilterCount > 0`
- Badge: amber filled pill, white text — same as primary CTA style scaled to `h-5`
- When panel is collapsed and there are active filters, the count badge is the primary visual cue

### Active Filter Chips (bonus — collapsed state)

When panel is collapsed and filters are applied, show compact chips below the toggle row:

```
Filters [2] ▾                                              Clear all ×
[eye-contact ×]  [Beginner ×]
```

```tsx
{!panelOpen && activeFilterCount > 0 && (
  <div className="flex flex-wrap gap-1.5 mt-2">
    {activeSkill && (
      <ActiveFilterChip label={activeSkill} onRemove={() => navigate(undefined, activeDifficulty, activeFilm, hasScreenplay)} />
    )}
    {activeDifficulty && (
      <ActiveFilterChip label={activeDifficulty} onRemove={() => navigate(activeSkill, undefined, activeFilm, hasScreenplay)} />
    )}
    {activeFilm && (
      <ActiveFilterChip label={activeFilm} onRemove={() => navigate(activeSkill, activeDifficulty, undefined, hasScreenplay)} />
    )}
    {hasScreenplay && (
      <ActiveFilterChip label="Has Screenplay" onRemove={() => navigate(activeSkill, activeDifficulty, activeFilm, false)} />
    )}
  </div>
)}
```

**ActiveFilterChip**:
```tsx
// Compact removable chip
<span className="inline-flex items-center gap-1 rounded-pill
                  px-2 py-0.5 text-xs font-medium
                  bg-accent-400/15 text-accent-400 border border-accent-400/30">
  {label}
  <button onClick={onRemove} className="ml-0.5 hover:text-accent-300">
    <X size={10} />
  </button>
</span>
```

---

## 3. Thumbnail Grid Resize

### Grid Change

```tsx
// Before (3-col)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// After (4-col)
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

Gap reduced: `gap-6` → `gap-4` (more compact).

### ClipCard Compact Variant

All content still present — just tighter spacing:

```
┌──────────────────────┐
│  [16:9 thumbnail]    │ ← rounded-xl overflow-hidden
│  [play overlay]      │
├──────────────────────┤
│ [Skill Badge] [Diff] │ ← flex row, gap-1.5
│ Title (2 lines max)  │ ← text-sm font-semibold, line-clamp-2
│ Film · Duration      │ ← text-xs text-secondary
└──────────────────────┘
```

**Tailwind changes for compact card**:

```tsx
// Card wrapper
<div className="group relative rounded-xl overflow-hidden bg-bg-surface
                border border-white/8 shadow-card
                hover:shadow-card-hover hover:-translate-y-0.5
                transition-all duration-200 cursor-pointer">

  {/* Thumbnail */}
  <div className="relative aspect-video overflow-hidden">
    <Image ... className="rounded-t-xl object-cover" />
    {/* Play overlay — appears on hover */}
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="w-10 h-10 rounded-full bg-accent-400/90 flex items-center justify-center">
        <Play size={18} fill="currentColor" className="text-text-inverse ml-0.5" />
      </div>
    </div>
  </div>

  {/* Card body — compact */}
  <div className="p-3">
    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
      <SkillBadge skill={skill} size="xs" />
      <DifficultyPill difficulty={difficulty} size="xs" />
    </div>
    <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug mb-1">
      {title}
    </h3>
    <p className="text-xs text-text-tertiary">
      {filmTitle} · {duration}s
    </p>
  </div>
</div>
```

Key differences vs current card:
- `rounded-2xl` → `rounded-xl` (slightly tighter)
- `p-4` → `p-3` body padding
- `text-base` title → `text-sm` title
- Badge size: `sm` → `xs`
- Play icon: `24px` → `18px`

### Mobile (2-col default)

At 375px (mobile) the 2-col grid means cards are ~160px wide. At this size:
- Thumbnail still renders correctly (aspect-video)
- Title clips at 2 lines
- Badges fit horizontally (xs size)
- No layout breakage

---

## 4. Full Sticky Bar Composition

```tsx
// Complete sticky filter bar structure
<div className="sticky top-14 z-raised bg-bg-base/90 backdrop-blur-md
                border-b border-white/6 pb-4 mb-8
                -mx-4 px-4 lg:-mx-8 lg:px-8">
  <div className="flex flex-col gap-3 pt-4">

    {/* 1. Search bar */}
    <SearchBar
      value={searchQuery}
      onChange={setSearchQuery}
      clipCount={totalClips}
    />

    {/* 2. Filter toggle + active chips */}
    <FilterPanel
      panelOpen={panelOpen}
      onToggle={togglePanel}
      activeSkill={activeSkill}
      activeDifficulty={activeDifficulty}
      activeFilm={activeFilm}
      hasScreenplay={hasScreenplay}
      filmOptions={filmOptions}
      activeFilterCount={activeFilterCount}
    />

  </div>
</div>
```

---

## 5. New Component: `FilterPanel`

**File**: `src/components/FilterPanel.tsx`

**Props**:
```tsx
interface FilterPanelProps {
  panelOpen: boolean
  onToggle: () => void
  activeSkill?: SkillCategory
  activeDifficulty?: Difficulty
  activeFilm?: string
  hasScreenplay?: boolean
  filmOptions: string[]
  activeFilterCount: number
  onNavigate: (skill?, difficulty?, film?, screenplay?) => void
}
```

The existing filter row JSX from `LibraryFilters.tsx` moves inside this component's collapsible body. `LibraryFilters.tsx` becomes the orchestrator that holds state and passes to `FilterPanel`.

---

## 6. Files to Modify

| File | Change |
|---|---|
| `src/app/library/page.tsx` | Add search param parsing, pass `totalClips` to filter bar, pass `search` to data fetch |
| `src/app/library/LibraryFilters.tsx` | Add `SearchBar`, add `FilterPanel` wrapper with collapse logic, receive `totalClips` prop |
| `src/components/FilterPanel.tsx` | **NEW** — collapsible panel component |
| `src/components/ClipCard.tsx` | Add compact variant (smaller padding/font/badge sizes) |
| `src/app/api/clips/route.ts` | Add `?search=` support: `Prisma contains mode: insensitive` on title, filmTitle, character, skillCategory |

---

## 7. Responsive Summary

| Breakpoint | Grid | Filter panel | Search |
|---|---|---|---|
| Mobile (375px) | 2-col | Collapsed by default | Full width |
| Tablet (768px) | 3-col | Expanded by default | Full width |
| Desktop (1024px) | 4-col | Expanded by default | Full width |
| Wide (1440px) | 4-col (wider cards) | Expanded | Full width |

---

## 8. Edge Cases

- **0 results**: show `0 clips` count in search bar; show empty state in grid ("No clips match your filters")
- **Search + filters combined**: both active simultaneously, results are ANDed
- **Long film names**: pill truncates at `max-w-[120px] truncate` on desktop
- **Very long search text**: input scrolls horizontally (default browser behavior, fine)
- **Filter panel height overflow**: `max-h-[400px]` scrolls if content exceeds (unlikely with current filters)
