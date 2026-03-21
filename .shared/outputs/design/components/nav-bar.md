# Component: NavBar
> Owner: Designer | Created: 2026-03-21

## Purpose
Top navigation bar. Persistent on all app screens. Shows brand, primary navigation links, and user account access.

## Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  seeneyu       Library    Progress    About        [Sign In]   [Get Started]│
│  ▲ logo        ▲ nav links (left-center)            ▲ ghost    ▲ amber CTA │
└────────────────────────────────────────────────────────────────────────────┘
height: 64px (h-16)
```

When authenticated:
```
┌────────────────────────────────────────────────────────────────────────────┐
│  seeneyu       Library    Progress    About                    [Avatar ▾]  │
└────────────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout (< 768px)

```
┌────────────────────────────────┐
│  seeneyu                   ☰  │
└────────────────────────────────┘
height: 56px (h-14)
```

Mobile menu (slide-down drawer):
```
┌────────────────────────────────┐
│  seeneyu                   ✕  │
├────────────────────────────────┤
│  Library                       │
│  Progress                      │
│  About                         │
├────────────────────────────────┤
│  [Sign In]                     │
│  [Get Started]                 │
└────────────────────────────────┘
```
Drawer: slides down from top, full-width, bg-bg-elevated with blur backdrop.
Animation: translateY(-100%) → translateY(0), duration-200, ease-spring.

## Visual Spec

```
Background: bg-bg-base/80 backdrop-blur-lg
Border: border-b border-white/6
Position: sticky top-0 z-50

Logo text:
  "seeneyu" — text-xl font-bold text-text-primary
  with a small amber dot or underscore accent
  Tailwind: "text-xl font-bold"
  Accent: span className="text-accent-400" → the "yu" or a dot after

Nav links (desktop):
  text-sm font-medium text-text-secondary
  hover: text-text-primary transition-colors duration-150
  active/current route: text-accent-400 font-semibold

Sign In button (unauthenticated):
  Ghost button — border border-white/10 text-text-primary rounded-xl px-4 py-1.5 text-sm

Get Started CTA:
  Primary — bg-accent-400 text-text-inverse rounded-pill px-4 py-1.5 text-sm font-semibold
  hover: bg-accent-500 shadow-glow-sm

Avatar (authenticated):
  36px circle, rounded-full, overflow-hidden
  Border: ring-2 ring-white/10
  hover: ring-accent-400/40
  Dropdown on click: bg-bg-elevated rounded-2xl shadow-xl p-2
    - My Progress
    - Settings
    - Sign Out
```

## Props

```ts
interface NavBarProps {
  isAuthenticated: boolean
  userAvatarUrl?: string
  userName?: string
  currentPath: string         // for active link highlighting
}
```

## Tailwind Classes Summary

```
Nav container:
  "sticky top-0 z-50 w-full
   bg-bg-base/80 backdrop-blur-lg
   border-b border-white/6"

Inner wrapper:
  "max-w-7xl mx-auto px-4 md:px-6 lg:px-8
   h-14 md:h-16 flex items-center justify-between"

Logo:
  "text-xl font-bold text-text-primary select-none"

Desktop nav links:
  "hidden md:flex items-center gap-6"

Nav link (inactive):
  "text-sm font-medium text-text-secondary hover:text-text-primary
   transition-colors duration-150"

Nav link (active):
  "text-sm font-semibold text-accent-400"

Mobile hamburger:
  "md:hidden p-2 rounded-lg text-text-secondary
   hover:text-text-primary hover:bg-bg-overlay"
```

## Active Link Detection
Use Next.js `usePathname()` hook. Mark as active if `pathname === href` or `pathname.startsWith(href)` for parent routes.

## Accessibility
- `<nav>` element with `aria-label="Main navigation"`
- Mobile menu toggle: `aria-expanded={isOpen}` `aria-controls="mobile-menu"`
- Mobile menu: `id="mobile-menu"` `role="dialog"` `aria-modal="true"`
- Logo: `aria-label="seeneyu — home"`
