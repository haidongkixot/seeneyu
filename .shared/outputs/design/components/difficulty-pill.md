# Component: DifficultyPill
> Owner: Designer | Created: 2026-03-21

## Purpose
Small pill-shaped indicator showing clip difficulty (Beginner / Intermediate / Advanced). Used in ClipCards, Clip Detail headers, filter bars, and Feedback screen.

## Visual

| Level        | Text    | Background | Border     | Color (hex) |
|---|---|---|---|---|
| beginner     | #86efac | #052e16    | #16a34a    | green       |
| intermediate | #fde68a | #451a03    | #ca8a04    | amber       |
| advanced     | #fca5a5 | #450a0a    | #dc2626    | red         |

## Sizes

### SM (default — ClipCard overlay)
```
height: ~20px
padding: px-2 py-0.5
text: text-xs font-medium
rounded: rounded-pill
```

### MD (Clip Detail, filter bar)
```
height: ~28px
padding: px-3 py-1
text: text-sm font-medium
rounded: rounded-pill
optional: score in parentheses — "Intermediate (7)"
```

## Display Label + Icon

| Level        | Label          | Icon (Lucide)    |
|---|---|---|
| beginner     | Beginner       | Circle (1 dot)   |
| intermediate | Intermediate   | TrendingUp       |
| advanced     | Advanced       | Zap              |

Icons only shown in MD+ size.

## Props

```ts
interface DifficultyPillProps {
  level: 'beginner' | 'intermediate' | 'advanced'
  score?: number     // raw score 4–12, shown in MD size only
  size?: 'sm' | 'md'
  showIcon?: boolean // default true for md, false for sm
}
```

## Tailwind Classes

```
Base:
  "inline-flex items-center gap-1 rounded-full font-medium border"

SM:
  "px-2 py-0.5 text-xs"

MD:
  "px-3 py-1 text-sm"

Colors (via inline style or CSS vars — not expressible as Tailwind):
  style={{ color, backgroundColor, borderColor }}
```

## Usage Note
Same note as SkillBadge: use inline `style` prop for color values since they're dynamic per level and cannot be expressed with standard Tailwind utilities.
