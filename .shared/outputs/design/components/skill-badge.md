# Component: SkillBadge
> Owner: Designer | Created: 2026-03-21

## Purpose
Small colored chip that identifies the body-language skill a clip teaches. Used in ClipCards, filter bars, Clip Detail headers, and Feedback screens.

## Appearance

Each skill has a unique color palette (dark tinted bg + light text + mid-saturated border):

| Skill                   | Text      | Background | Border    |
|---|---|---|---|
| eye-contact             | #c4b5fd   | #2e1065    | #7c3aed   |
| open-posture            | #67e8f9   | #083344    | #0891b2   |
| active-listening        | #6ee7b7   | #052e16    | #059669   |
| vocal-pacing            | #fde68a   | #451a03    | #d97706   |
| confident-disagreement  | #fca5a5   | #450a0a    | #dc2626   |

## Sizes

### SM (default — for ClipCard overlay, compact lists)
```
height: 20px
padding: px-2 py-0.5
text: text-xs font-medium
rounded: rounded-pill
```

### MD (for filter chips, Clip Detail header)
```
height: 28px
padding: px-3 py-1
text: text-sm font-medium
rounded: rounded-pill
```

### LG (for hero/featured use)
```
height: 36px
padding: px-4 py-2
text: text-base font-semibold
rounded: rounded-pill
icon: 16px Lucide icon, gap-1.5
```

## Skill Labels & Icons

| Skill ID                | Display Label          | Lucide Icon    |
|---|---|---|
| eye-contact             | Eye Contact            | Eye            |
| open-posture            | Open Posture           | PersonStanding |
| active-listening        | Active Listening       | Ear            |
| vocal-pacing            | Vocal Pacing           | Mic            |
| confident-disagreement  | Confident Disagreement | ShieldCheck    |

## States

### Default (on dark surface)
```
border: 1px solid [skill.border]
background: [skill.bg]
color: [skill.text]
```

### Interactive (filter chip — toggleable)
```
inactive: opacity-60, border-white/10, bg-bg-surface, text-text-secondary
hover:    opacity-100, border [skill.border], bg [skill.bg], text [skill.text]
          transition-all duration-150
active/selected: full color + shadow-[0_0_10px_{skill.glow}]
```

## Props

```ts
interface SkillBadgeProps {
  skill: 'eye-contact' | 'open-posture' | 'active-listening' | 'vocal-pacing' | 'confident-disagreement'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean      // default false for sm, true for lg
  interactive?: boolean   // renders as toggleable filter chip
  selected?: boolean      // only when interactive=true
  onClick?: () => void    // only when interactive=true
}
```

## Tailwind Classes

```
Base (sm):
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full
   text-xs font-medium border
   [skill-specific inline styles or CSS vars]"

Filter chip (interactive):
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full
   text-sm font-medium border cursor-pointer select-none
   transition-all duration-150
   focus-visible:ring-2 focus-visible:ring-accent-400"
```

**Note to developer**: Skill colors cannot be expressed as Tailwind utility classes directly (they are per-skill dynamic values). Use `style={{ backgroundColor: skill.bg, color: skill.text, borderColor: skill.border }}` inline or define CSS custom properties per skill.
