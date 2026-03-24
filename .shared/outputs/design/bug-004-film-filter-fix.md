# BUG-004 — Film Filter Collapse/Expand Fix
> **Designer spec** for LibraryFilters.tsx film row
> Status: READY FOR IMPLEMENTATION
> File to modify: `src/app/library/LibraryFilters.tsx`

---

## Problem

With 30+ films, the FILM row renders all tags in an unconstrained `flex-wrap` container,
spanning 4+ rows on desktop and covering the entire mobile viewport.

---

## Solution Summary

| Viewport     | Treatment |
|---|---|
| Mobile (<768px) | Replace pill grid with native `<select>` dropdown |
| Tablet (768–1023px) | Collapsed pills (first 4 visible) + `+ N more` toggle |
| Desktop (≥1024px) | Collapsed pills (first 6 visible) + `+ N more` toggle |

COLLAPSED_COUNT constant: `6` on desktop, `4` on tablet.
For simplicity implement a single `COLLAPSED_COUNT = 6` — the pill wrapping handles
narrower layouts naturally by showing fewer per row while still collapsing after 6 total.

---

## ASCII Mockups

### Desktop — Collapsed (default)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FILM   [All Films] [The Godfather] [Pulp Fiction] [Good Will Hunting]       │
│         [The Dark Knight] [Fight Club] [Schindler's List] [+ 24 more ▾]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Exactly 6 film tags shown (not counting "All Films")
- `+ N more ▾` pill immediately follows the 6th tag in the same flex row
- If active film is beyond position 6, it always renders in the visible set (swap it in)

---

### Desktop — Expanded

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FILM   [All Films] [The Godfather] [Pulp Fiction] [Good Will Hunting]       │
│         [The Dark Knight] [Fight Club] [Schindler's List] [American Beauty] │
│         [A Beautiful Mind] [The Social Network] [Forrest Gump] [Gladiator]  │
│         [... all remaining films ...]                                        │
│         [Show fewer ▴]                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

- All tags visible, wrapped naturally
- `Show fewer ▴` pill appears at the end of the last row
- Expand/collapse animates with `transition-all duration-300`

---

### Mobile — `<select>` dropdown

```
┌─────────────────────────────────┐
│ FILM                            │
│ ┌─────────────────────────────┐ │
│ │ All Films               ▾   │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

- Stacked layout: label on its own line (full width), select below
- Native browser dropdown on tap — no custom overlay needed
- Shows "All Films" as first/default option
- Active film is pre-selected

---

## Component State

```tsx
// Inside LibraryFilters (already 'use client')
const COLLAPSED_COUNT = 6
const [filmExpanded, setFilmExpanded] = useState(false)

// Ensure active film is always visible when collapsed
const activeFilmIndex = filmOptions.indexOf(activeFilm ?? '')
const visibleFilms = filmExpanded
  ? filmOptions
  : filmOptions.slice(0, COLLAPSED_COUNT)
// If active film is beyond COLLAPSED_COUNT, inject it
const visibleFilmsWithActive =
  !filmExpanded && activeFilm && activeFilmIndex >= COLLAPSED_COUNT
    ? [...visibleFilms.slice(0, COLLAPSED_COUNT - 1), activeFilm]
    : visibleFilms

const hiddenCount = filmOptions.length - COLLAPSED_COUNT
const showToggle = filmOptions.length > COLLAPSED_COUNT
```

---

## Tailwind Classes — All Elements

### `+ N more ▾` pill (collapsed state)

```
inline-flex items-center gap-1 rounded-pill px-2.5 py-1
text-xs font-medium
border border-accent-400/30 bg-transparent text-accent-400
hover:bg-accent-400/10 hover:border-accent-400/50
transition-all duration-150 cursor-pointer whitespace-nowrap
```

### `Show fewer ▴` pill (expanded state)

Same classes as above — only text changes.

### Animated container (wraps the hidden overflow tags)

```tsx
// Wrap ONLY the overflow pills (positions 6+) in this container
// The first 6 + toggle pill are always in the main flex row
// On expand: append the rest in a second flex-wrap div that animates in

// Simpler approach: wrap ALL pills + toggle in one flex-wrap container,
// control visibility via state (no CSS animation needed — React re-render is instant)
// For smooth feel, add to the container:
transition-all duration-300
```

**Recommended implementation approach** — single flex-wrap row, control rendered items via state:
```tsx
<div className="flex items-center gap-2 flex-wrap">
  {/* "All Films" button — always visible */}
  <button ...>All Films</button>

  {/* Visible film tags (state-controlled) */}
  {visibleFilmsWithActive.map(film => (
    <button key={film} ...>{film}</button>
  ))}

  {/* Toggle pill */}
  {showToggle && (
    <button
      onClick={() => setFilmExpanded(e => !e)}
      className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1
        text-xs font-medium border border-accent-400/30 bg-transparent text-accent-400
        hover:bg-accent-400/10 hover:border-accent-400/50
        transition-all duration-150 cursor-pointer whitespace-nowrap"
    >
      {filmExpanded ? `Show fewer ▴` : `+ ${hiddenCount} more ▾`}
    </button>
  )}
</div>
```

No CSS max-height animation needed — toggling React state is instant and clean.
If a smooth animation is desired, wrap the overflow section in a `<div>` with:
```
className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out
  ${filmExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
```

---

## Mobile `<select>` — Full Spec

### Layout

```tsx
// Replaces the flex pills section on mobile
// Show this on mobile (<md), hide on md+
<div className="flex flex-col gap-1.5 md:hidden">
  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">
    FILM
  </span>
  <select
    value={activeFilm ?? ''}
    onChange={e => navigate(activeSkill, activeDifficulty,
      e.target.value || undefined, hasScreenplay)}
    className="bg-bg-inset border border-white/10 text-text-primary
      rounded-lg px-3 py-2 text-sm w-full
      focus:border-accent-400/60 focus:outline-none
      transition-colors duration-150"
  >
    <option value="">All Films</option>
    {filmOptions.map(film => (
      <option key={film} value={film}>{film}</option>
    ))}
  </select>
</div>
```

### Desktop pills container — hide on mobile

Wrap the existing pill flex row in:
```tsx
<div className="hidden md:flex items-center gap-2 flex-wrap">
  {/* label + All Films button + pill tags + toggle */}
</div>
```

---

## Breakpoint Summary

```
Mobile  (<768px / <md):  <select> dropdown shown, pill row hidden
Tablet  (768–1023px):    pill row shown (collapsed to 6), select hidden
Desktop (≥1024px):       pill row shown (collapsed to 6), select hidden
```

Tailwind utilities:
- Mobile select:  `block md:hidden`
- Desktop pills:  `hidden md:flex`

---

## Edge Cases

| Case | Behavior |
|---|---|
| Active film is beyond position 6 | Inject it at position 6 (replace last visible), hiddenCount stays correct |
| Only ≤6 films total | No toggle pill rendered, all films always visible, no state needed |
| 0 films | Film row not rendered (existing `filmOptions.length > 0` guard stays) |
| Film name very long (30+ chars) | `truncate max-w-[120px]` on pill text to prevent layout break |

---

## Files to Modify

| File | Change |
|---|---|
| `src/app/library/LibraryFilters.tsx` | Add `filmExpanded` state, replace film row with conditional select/pills |

No new files needed. No schema changes.
