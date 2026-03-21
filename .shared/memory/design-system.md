# Design System — seeneyu
> Owner: Designer role
> Status: COMPLETE — M1 delivery
> Last updated: 2026-03-21

---

## Overview

Dark-first coaching app UI. Aesthetic: sophisticated dark glass with amber warmth.
Feel: premium, focused, forward-motion. Inspired by Vercel/Linear darkness with coaching energy.

Accent philosophy: **Amber** — warmth, progress, "spotlight on you". Single accent color.
Skill badges use distinct hues (violet/cyan/emerald/amber/red) for quick scanning.

---

## Color Tokens

### Tailwind Config (`tailwind.config.js → theme.extend.colors`)

```js
colors: {
  // ── Background layers ──────────────────────────────────────────────────
  bg: {
    base:     '#0d0d14',   // deepest layer — page body background
    surface:  '#13131e',   // cards, panels, sidebar
    elevated: '#1c1c2e',   // modals, dropdowns, tooltips
    overlay:  '#22223a',   // hover states, ghost overlays
    inset:    '#0a0a10',   // input fields, code blocks, inset areas
  },

  // ── Primary accent — Amber ─────────────────────────────────────────────
  // "Golden attention" — warm, energetic, progress-oriented
  accent: {
    50:   '#fffbeb',
    100:  '#fef3c7',
    200:  '#fde68a',
    300:  '#fcd34d',
    400:  '#fbbf24',   // ← primary CTA background
    500:  '#f59e0b',   // ← CTA hover
    600:  '#d97706',   // ← CTA pressed / active
    700:  '#b45309',   // ← dark variant
    glow: 'rgba(251,191,36,0.20)',  // focus ring color
  },

  // ── Text hierarchy ─────────────────────────────────────────────────────
  text: {
    primary:   '#f4f4f8',   // headlines, body
    secondary: '#9898b0',   // labels, metadata, subtext
    tertiary:  '#5c5c72',   // placeholders, disabled
    inverse:   '#0d0d14',   // text ON amber button
    link:      '#fbbf24',   // inline links
  },

  // ── Semantic states ────────────────────────────────────────────────────
  success: { DEFAULT: '#22c55e', dim: '#052e16', glow: 'rgba(34,197,94,0.20)' },
  error:   { DEFAULT: '#ef4444', dim: '#450a0a', glow: 'rgba(239,68,68,0.20)' },
  warning: { DEFAULT: '#f59e0b', dim: '#451a03', glow: 'rgba(245,158,11,0.20)' },
  info:    { DEFAULT: '#3b82f6', dim: '#1e3a5f', glow: 'rgba(59,130,246,0.20)' },

  // ── Skill badge colors ─────────────────────────────────────────────────
  // Each skill has: text (light tint), bg (dark tint), border (mid saturated)
  skill: {
    'eye-contact':             { text: '#c4b5fd', bg: '#2e1065', border: '#7c3aed' },
    'open-posture':            { text: '#67e8f9', bg: '#083344', border: '#0891b2' },
    'active-listening':        { text: '#6ee7b7', bg: '#052e16', border: '#059669' },
    'vocal-pacing':            { text: '#fde68a', bg: '#451a03', border: '#d97706' },
    'confident-disagreement':  { text: '#fca5a5', bg: '#450a0a', border: '#dc2626' },
  },

  // ── Difficulty levels ──────────────────────────────────────────────────
  difficulty: {
    beginner:     { text: '#86efac', bg: '#052e16', border: '#16a34a' },
    intermediate: { text: '#fde68a', bg: '#451a03', border: '#ca8a04' },
    advanced:     { text: '#fca5a5', bg: '#450a0a', border: '#dc2626' },
  },

  // ── Border tokens ──────────────────────────────────────────────────────
  border: {
    subtle:  'rgba(255,255,255,0.06)',   // hairline dividers
    default: 'rgba(255,255,255,0.10)',   // card borders
    strong:  'rgba(255,255,255,0.20)',   // focused/active
    accent:  'rgba(251,191,36,0.40)',    // accent border
  },
},
```

### Semantic Usage Guide

| Token        | Use case                                              |
|---|---|
| `bg.base`    | `<html>`, `<body>` background                         |
| `bg.surface` | Cards, sidebar, nav, sheet                            |
| `bg.elevated`| Modals, dropdowns, tooltips                           |
| `bg.overlay` | Hover state layers                                    |
| `bg.inset`   | Input backgrounds, code blocks                        |
| `accent.400` | Primary CTA button fill                               |
| `accent.glow`| Focus ring shadow color                               |
| `text.primary`   | H1–H6, body paragraphs                           |
| `text.secondary` | Labels, timestamps, metadata                     |
| `text.tertiary`  | Placeholder, disabled text                       |
| `text.inverse`   | Text on amber background (CTA label)             |

---

## Typography

### Font Stack

```js
// tailwind.config.js → theme.extend.fontFamily
fontFamily: {
  sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
},
```

**Rationale**: Plus Jakarta Sans — modern, slightly humanist letterforms, excellent variable-weight support, great legibility at both display and small sizes. JetBrains Mono for any time-code or data display.

#### Loading in Next.js `app/layout.tsx`

```tsx
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  axes: ['wght'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

// Apply: <body className={`${sans.variable} ${mono.variable} font-sans`}>
```

### Type Scale

```js
// tailwind.config.js → theme.extend.fontSize
fontSize: {
  'xs':   ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.01em'  }],  // 12px
  'sm':   ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.005em' }],  // 14px
  'base': ['1rem',     { lineHeight: '1.5rem',  letterSpacing: '0'       }],  // 16px
  'lg':   ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em'}],  // 18px
  'xl':   ['1.25rem',  { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],  // 20px
  '2xl':  ['1.5rem',   { lineHeight: '2rem',    letterSpacing: '-0.015em'}],  // 24px
  '3xl':  ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],  // 30px
  '4xl':  ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.025em'}],  // 36px
  '5xl':  ['3rem',     { lineHeight: '1',        letterSpacing: '-0.03em'}],  // 48px
  '6xl':  ['3.75rem',  { lineHeight: '1',        letterSpacing: '-0.035em'}], // 60px
},
```

### Type Usage

| Level          | Tag    | Size  | Weight | Color          |
|---|---|---|---|---|
| Display        | h1     | 5xl–6xl | 800  | text.primary   |
| Hero subtitle  | p      | xl–2xl  | 400  | text.secondary |
| Section title  | h2     | 3xl     | 700  | text.primary   |
| Card heading   | h3     | xl–2xl  | 600  | text.primary   |
| Body           | p      | base    | 400  | text.primary   |
| Label          | span   | sm      | 500  | text.secondary |
| Caption / meta | span   | xs      | 400  | text.tertiary  |
| CTA button     | button | base–lg | 600  | text.inverse   |
| Code / timecode| code   | sm      | 400  | text.secondary |

---

## Spacing Scale

```js
// Tailwind default 4px grid — use standard utilities
// Key landmarks: 1=4px 2=8px 3=12px 4=16px 6=24px 8=32px 10=40px 12=48px 16=64px 20=80px

// Additional custom tokens:
spacing: {
  '18':  '4.5rem',   // 72px — gap between major sections
  '22':  '5.5rem',   // 88px — nav height on desktop
  '128': '32rem',    // 512px — max content width for narrow layouts
},
```

**Rule**: use 4px increments. Never arbitrary pixel values in components.

---

## Border Radius

```js
// tailwind.config.js → theme.extend.borderRadius
borderRadius: {
  'sm':   '4px',
  'md':   '8px',
  'lg':   '12px',
  'xl':   '16px',
  '2xl':  '20px',
  '3xl':  '24px',
  'pill': '9999px',
},
```

| Element                          | Radius  |
|---|---|
| Main cards, clip cards           | `2xl`   |
| Input fields                     | `lg`    |
| Skill badges, pills, tags        | `pill`  |
| Primary CTA buttons              | `pill`  |
| Secondary / ghost buttons        | `xl`    |
| Modals, sheets, glass panels     | `2xl`   |
| Tooltips                         | `md`    |
| Thumbnails inside cards          | `xl`    |
| Score ring container             | `3xl`   |

---

## Shadows & Glow Effects

```js
// tailwind.config.js → theme.extend.boxShadow
boxShadow: {
  'sm':   '0 1px 3px rgba(0,0,0,0.40)',
  'md':   '0 4px 12px rgba(0,0,0,0.50)',
  'lg':   '0 8px 32px rgba(0,0,0,0.60)',
  'xl':   '0 16px 48px rgba(0,0,0,0.70)',

  // Amber glow — CTA focus, active elements
  'glow':     '0 0 20px rgba(251,191,36,0.25), 0 0 60px rgba(251,191,36,0.10)',
  'glow-sm':  '0 0 10px rgba(251,191,36,0.20)',

  // Skill glow — matches skill badge colors
  'glow-violet': '0 0 20px rgba(139,92,246,0.25)',
  'glow-cyan':   '0 0 20px rgba(6,182,212,0.25)',
  'glow-green':  '0 0 20px rgba(34,197,94,0.25)',
  'glow-red':    '0 0 20px rgba(239,68,68,0.25)',

  // Success state
  'glow-success': '0 0 16px rgba(34,197,94,0.30)',

  // Pressed / inset
  'inset-sm': 'inset 0 1px 4px rgba(0,0,0,0.40)',

  // Standard card — border + depth
  'card':       '0 0 0 1px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.50)',
  'card-hover': '0 0 0 1px rgba(251,191,36,0.20), 0 8px 32px rgba(0,0,0,0.60)',
},
```

---

## Motion Tokens

```js
// tailwind.config.js → theme.extend
transitionDuration: {
  '100': '100ms',
  '150': '150ms',
  '200': '200ms',
  '300': '300ms',
  '500': '500ms',
  '700': '700ms',
},
transitionTimingFunction: {
  'smooth':    'cubic-bezier(0.4, 0, 0.2, 1)',    // standard UI
  'spring':    'cubic-bezier(0.34, 1.56, 0.64, 1)', // bouncy appear
  'retract':   'cubic-bezier(0.36, 0, 0.66, -0.56)', // pull-back exit
},
```

| Interaction              | Duration | Easing    |
|---|---|---|
| Button color change      | 150ms    | smooth    |
| Card hover lift          | 200ms    | smooth    |
| Modal enter              | 200ms    | spring    |
| Modal exit               | 150ms    | retract   |
| Skeleton shimmer cycle   | 1500ms   | linear    |
| Toast appear             | 300ms    | spring    |
| Score ring draw          | 700ms    | smooth    |
| Annotation fade-in       | 300ms    | smooth    |
| Tab / page transition    | 200ms    | smooth    |

---

## Component States Reference

### Buttons

```
Primary CTA (amber fill):
  default:  bg-accent-400 text-text-inverse rounded-pill px-6 py-3 font-semibold
  hover:    bg-accent-500 shadow-glow-sm scale-[1.02]
  active:   bg-accent-600 scale-[0.98] shadow-inset-sm
  disabled: opacity-40 cursor-not-allowed (no hover effects)

Ghost / Secondary:
  default:  border border-white/10 text-text-primary bg-transparent rounded-xl px-5 py-2.5
  hover:    border-white/20 bg-bg-overlay
  focus:    border-accent-400/40 shadow-glow-sm outline-none

Danger:
  default:  bg-error/10 text-error border border-error/30 rounded-xl
  hover:    bg-error/20 border-error/50

Icon button:
  default:  text-text-secondary p-2 rounded-lg
  hover:    text-text-primary bg-bg-overlay
```

### Inputs

```
default:   bg-bg-inset border border-white/10 rounded-lg text-text-primary
           px-4 py-3 text-base placeholder:text-text-tertiary
focus:     border-accent-400/60 shadow-glow-sm outline-none ring-0
error:     border-error/60 shadow-[0_0_10px_rgba(239,68,68,0.15)]
disabled:  opacity-40 cursor-not-allowed
```

### Cards

```
default:   bg-bg-surface border border-white/8 rounded-2xl shadow-card
hover:     shadow-card-hover -translate-y-0.5 border-accent-400/20
           transition-all duration-200
active:    translate-y-0 scale-[0.99]
selected:  border-accent-400/40 shadow-glow-sm
loading:   skeleton shimmer overlay
```

---

## Glassmorphism Pattern

For panels overlaid on video or image content:

```css
/* CSS */
.glass-panel {
  background: rgba(13, 13, 20, 0.72);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Tailwind equivalent */
"bg-[rgba(13,13,20,0.72)] backdrop-blur-xl border border-white/8"
```

---

## Gradient Recipes

### Hero background (mesh gradient — CSS, behind content)

```css
.hero-gradient {
  background:
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(251,191,36,0.07) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139,92,246,0.06) 0%, transparent 60%),
    #0d0d14;
}
```

### Score / progress gradient

```css
.score-gradient {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
}
```

### Skeleton shimmer

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 200%;
  animation: shimmer 1.5s infinite linear;
}
```

---

## Responsive Breakpoints

```js
// tailwind.config.js → theme.screens (mobile-first)
screens: {
  'sm':  '375px',   // mobile
  'md':  '768px',   // tablet
  'lg':  '1024px',  // desktop
  'xl':  '1440px',  // wide desktop
},
```

**Rule**: Always design and code mobile-first. Add `md:` / `lg:` overrides for larger viewports.

---

## Icon System

- **Library**: Lucide React
- **Size scale**: 16px (xs), 20px (sm/default), 24px (lg), 32px (xl)
- **Stroke width**: 1.5 default, 2 for emphasis
- **Color**: `currentColor` — inherits from text

---

## Z-Index Scale

```js
// tailwind.config.js → theme.extend.zIndex
zIndex: {
  'base':    '0',
  'raised':  '10',   // cards in hover state
  'overlay': '20',   // annotation overlays on video
  'modal':   '50',   // modals, drawers
  'toast':   '80',   // toast notifications
  'tooltip': '90',   // tooltips
  'top':     '100',  // absolute topmost
},
```
