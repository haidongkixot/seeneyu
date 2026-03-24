# M18 — PeeTeeAI Brand Refresh Spec
> Designer: M18 delivery
> Date: 2026-03-24
> Status: READY FOR IMPLEMENTATION

---

## Overview

Brand context:
- **Company**: PeeTeeAI JSC
- **Tagline**: "Your AI, your PT"
- **Website**: https://www.peetees.ai

Four deliverables:
1. **NavBar** — add "by PeeTeeAI" sub-label
2. **Footer** — new component on all pages
3. **Homepage hero** — animated gradient background
4. **Homepage new sections** — Mission, Team, Testimonials

---

## 1. NavBar Update

**File**: `src/components/NavBar.tsx`

### Change: Logo area

```
Before:           After:
┌─────────┐       ┌───────────────────┐
│ seeneyu │       │ seeneyu           │
└─────────┘       │ by PeeTeeAI  ↗   │
                  └───────────────────┘
```

The "by PeeTeeAI" is a sub-label below or inline with the logo wordmark.

### Tailwind Implementation

```tsx
// Logo area in NavBar
<Link href="/" className="flex flex-col leading-none gap-0.5">
  <span className="text-lg font-bold text-text-primary tracking-tight">
    seeneyu
  </span>
  <a
    href="https://www.peetees.ai"
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="text-[10px] font-medium text-text-tertiary hover:text-accent-400
               transition-colors duration-150 flex items-center gap-0.5"
  >
    by PeeTeeAI
    <ExternalLink size={8} className="opacity-60" />
  </a>
</Link>
```

**Notes**:
- The outer `<Link href="/">` navigates home; the inner anchor opens peetees.ai in a new tab
- `e.stopPropagation()` prevents the outer Link from firing when clicking "by PeeTeeAI"
- Font: `text-[10px]` — smaller than any design system step, but this is a secondary brand mark
- Color: `text-text-tertiary` at rest → `text-accent-400` on hover
- Icon: `ExternalLink` (Lucide, 8px)

---

## 2. Footer Component

**File**: `src/components/Footer.tsx` (new)
**Mount**: `src/app/layout.tsx` — add `<Footer />` after `{children}`

### Layout

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  seeneyu                Product         Company       Support      │
│  Your AI, your PT       Library         About         Contact      │
│  ─────────────          Foundation      PeeTeeAI ↗               │
│  [LinkedIn] [YouTube]   Arcade                                     │
│                                                                    │
│  ────────────────────────────────────────────────────────────────  │
│  © 2026 PeeTeeAI JSC. All rights reserved.                        │
└────────────────────────────────────────────────────────────────────┘
```

### Full Component Spec

```tsx
// src/components/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-bg-surface border-t border-white/6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

          {/* Brand column */}
          <div className="md:col-span-1">
            <p className="text-lg font-bold text-text-primary mb-1">seeneyu</p>
            <p className="text-sm text-text-tertiary mb-4">Your AI, your PT</p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a href="#" aria-label="LinkedIn"
                 className="text-text-tertiary hover:text-accent-400 transition-colors duration-150">
                <Linkedin size={18} />
              </a>
              <a href="#" aria-label="YouTube"
                 className="text-text-tertiary hover:text-accent-400 transition-colors duration-150">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Product links */}
          <FooterLinkGroup title="Product" links={[
            { label: 'Library', href: '/library' },
            { label: 'Foundation', href: '/foundation' },
            { label: 'Arcade', href: '/arcade' },
          ]} />

          {/* Company links */}
          <FooterLinkGroup title="Company" links={[
            { label: 'About', href: '/about' },
            { label: 'PeeTeeAI', href: 'https://www.peetees.ai', external: true },
          ]} />

          {/* Support links */}
          <FooterLinkGroup title="Support" links={[
            { label: 'Contact', href: 'mailto:hello@seeneyu.com' },
          ]} />

        </div>

        {/* Divider */}
        <div className="border-t border-white/6 pt-6">
          <p className="text-xs text-text-tertiary text-center">
            © 2026 PeeTeeAI JSC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

**FooterLinkGroup helper**:
```tsx
function FooterLinkGroup({ title, links }: { title: string; links: { label: string; href: string; external?: boolean }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer"
                 className="text-sm text-text-secondary hover:text-text-primary
                            transition-colors duration-150 flex items-center gap-1">
                {link.label}
                <ExternalLink size={10} className="opacity-50" />
              </a>
            ) : (
              <Link href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Responsive

- **Mobile**: single column stack (brand → Product → Company → Support)
- **Tablet+**: `grid-cols-4` side-by-side
- Footer only shows on non-fullscreen pages; hide on recording/arcade challenge pages via layout exclusion if needed

---

## 3. Hero Section — Animated Gradient Background

**File**: `src/app/page.tsx`

### Concept

Dark base with floating amber + violet radial glows that breathe slowly. Geometric dot grid overlay for depth. No library needed — pure CSS keyframes.

### ASCII Mockup

```
┌──────────────────────────────────────────────────────────────┐
│  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·   │
│  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·   │
│          [amber glow bloom]                                   │
│  ·  ·  ·  ·  ·  ·  [headline copy]  ·  ·  ·  ·  ·  ·  ·  │
│  ·  ·  ·  ·  ·  ·  [sub + CTA]     ·  ·  ·[violet glow]·  │
│  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·   │
└──────────────────────────────────────────────────────────────┘
```

### Implementation

```tsx
// In page.tsx — hero section wrapper
<section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">

  {/* Animated gradient layer */}
  <div className="absolute inset-0 hero-animated-bg" aria-hidden="true" />

  {/* Dot grid overlay */}
  <div className="absolute inset-0 hero-dot-grid opacity-30" aria-hidden="true" />

  {/* Content — relative so it sits above bg */}
  <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
    {/* existing hero content */}
  </div>
</section>
```

### CSS (add to `src/app/globals.css`)

```css
/* ── Animated hero gradient ───────────────────────────────── */
.hero-animated-bg {
  background: #0d0d14;
}

.hero-animated-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 60% at 20% 50%, rgba(251,191,36,0.10) 0%, transparent 65%),
    radial-gradient(ellipse 60% 50% at 80% 40%, rgba(139,92,246,0.08) 0%, transparent 65%),
    radial-gradient(ellipse 40% 40% at 50% 80%, rgba(251,191,36,0.05) 0%, transparent 60%);
  animation: hero-drift 12s ease-in-out infinite alternate;
}

@keyframes hero-drift {
  0%   {
    background:
      radial-gradient(ellipse 70% 60% at 20% 50%, rgba(251,191,36,0.10) 0%, transparent 65%),
      radial-gradient(ellipse 60% 50% at 80% 40%, rgba(139,92,246,0.08) 0%, transparent 65%),
      radial-gradient(ellipse 40% 40% at 50% 80%, rgba(251,191,36,0.05) 0%, transparent 60%);
  }
  33%  {
    background:
      radial-gradient(ellipse 80% 60% at 30% 60%, rgba(251,191,36,0.12) 0%, transparent 65%),
      radial-gradient(ellipse 50% 60% at 70% 30%, rgba(139,92,246,0.10) 0%, transparent 65%),
      radial-gradient(ellipse 45% 45% at 60% 75%, rgba(6,182,212,0.05) 0%, transparent 60%);
  }
  66%  {
    background:
      radial-gradient(ellipse 60% 70% at 15% 40%, rgba(251,191,36,0.08) 0%, transparent 65%),
      radial-gradient(ellipse 70% 50% at 85% 55%, rgba(139,92,246,0.09) 0%, transparent 65%),
      radial-gradient(ellipse 35% 40% at 45% 85%, rgba(251,191,36,0.06) 0%, transparent 60%);
  }
  100% {
    background:
      radial-gradient(ellipse 75% 55% at 25% 45%, rgba(251,191,36,0.11) 0%, transparent 65%),
      radial-gradient(ellipse 55% 65% at 75% 35%, rgba(139,92,246,0.07) 0%, transparent 65%),
      radial-gradient(ellipse 50% 35% at 55% 70%, rgba(139,92,246,0.05) 0%, transparent 60%);
  }
}

/* ── Dot grid overlay ─────────────────────────────────────── */
.hero-dot-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px);
  background-size: 32px 32px;
}
```

**Performance note**: `animation` on `::before` pseudo-element — does not trigger layout/paint reflow. Smooth on all modern browsers.

---

## 4. Our Mission Section

**Position**: immediately below hero

### Layout

Full-width band with sporty gradient background. Bold headline + sub copy.

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   Transforming how the world communicates                          │
│                                                                    │
│   seeneyu uses AI and cinematic storytelling to help you master   │
│   the non-verbal language of confident people.                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Tailwind + Copy

```tsx
<section className="relative py-20 overflow-hidden">
  {/* Sporty gradient bg */}
  <div
    className="absolute inset-0"
    style={{
      background: 'linear-gradient(135deg, rgba(180,83,9,0.25) 0%, rgba(13,13,20,1) 40%, rgba(76,29,149,0.20) 100%)',
    }}
    aria-hidden="true"
  />
  {/* Top/bottom gradient fade to bg-base */}
  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-bg-base to-transparent" />
  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-base to-transparent" />

  <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 text-center">
    <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-4">
      Our Mission
    </p>
    <h2 className="text-4xl lg:text-5xl font-extrabold text-text-primary mb-6 leading-tight">
      Transforming how the world communicates
    </h2>
    <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
      seeneyu uses AI and cinematic storytelling to help you master
      the non-verbal language of confident people.
    </p>
  </div>
</section>
```

---

## 5. Our Team Section

**Position**: below Mission section

### Layout (3-column grid)

```
┌─────────────────────────────────────────────────────────────┐
│                         Our Team                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     [HH]     │  │     [AI]     │  │     [PL]     │     │
│  │   Hai Hoang  │  │   [AI Lead]  │  │ [Product Lead│     │
│  │ Founder, CEO │  │  Coming soon │  │ Coming soon] │     │
│  │ Building the │  │              │  │              │     │
│  │ future of    │  │              │  │              │     │
│  │ communication│  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Team Card Spec

```tsx
interface TeamMember {
  initials: string
  name: string
  title: string
  bio: string
  accentColor: string // Tailwind arbitrary color for avatar bg
}

const TEAM: TeamMember[] = [
  {
    initials: 'HH',
    name: 'Hai Hoang',
    title: 'Founder & CEO',
    bio: 'Passionate about using AI to unlock human potential in communication.',
    accentColor: 'from-amber-600 to-amber-400',
  },
  {
    initials: 'AI',
    name: 'AI Lead',
    title: 'Head of AI',
    bio: 'Building the intelligence layer that makes real-time coaching possible.',
    accentColor: 'from-violet-600 to-violet-400',
  },
  {
    initials: 'PL',
    name: 'Product Lead',
    title: 'Head of Product',
    bio: 'Designing experiences that turn cinematic moments into lasting skills.',
    accentColor: 'from-cyan-600 to-cyan-400',
  },
]
```

```tsx
// Team card
<div className="flex flex-col items-center text-center p-6
                bg-bg-surface border border-white/8 rounded-2xl shadow-card
                hover:shadow-card-hover hover:-translate-y-1 hover:border-accent-400/20
                transition-all duration-300">
  {/* Avatar */}
  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.accentColor}
                   flex items-center justify-center mb-4 shadow-lg`}>
    <span className="text-xl font-bold text-white">{member.initials}</span>
  </div>
  {/* Name + title */}
  <h3 className="text-base font-semibold text-text-primary mb-0.5">{member.name}</h3>
  <p className="text-xs font-medium text-accent-400 mb-3">{member.title}</p>
  {/* Bio */}
  <p className="text-sm text-text-secondary leading-relaxed">{member.bio}</p>
</div>
```

### Section wrapper

```tsx
<section className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
  <div className="text-center mb-12">
    <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
      The People
    </p>
    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
      Our Team
    </h2>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {TEAM.map((member) => <TeamCard key={member.name} {...member} />)}
  </div>
</section>
```

---

## 6. Testimonials Section

**Position**: below Team section

### Layout (3 quote cards)

```
┌─────────────────────────────────────────────────────────────┐
│                      What learners say                      │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │ ★★★★★            │  │ ★★★★★            │  │ ★★★★★   │  │
│  │ "After 2 weeks   │  │ "The AI feedback │  │ "I used  │  │
│  │  with seeneyu,   │  │  is surprisingly  │  │  to avoid│  │
│  │  I got the job." │  │  spot-on."       │  │  eye     │  │
│  │                  │  │                  │  │  contact."│  │
│  │  Sarah Chen      │  │  Marcus Williams │  │  Priya   │  │
│  │  UX Designer     │  │  Sales Manager   │  │  Patel   │  │
│  └──────────────────┘  └──────────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Testimonial Data

```tsx
const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'UX Designer',
    quote: 'After just 2 weeks with seeneyu, I landed a job interview and the hiring manager specifically complimented my presence. I'm not kidding.',
    rating: 5,
  },
  {
    name: 'Marcus Williams',
    role: 'Sales Manager',
    quote: 'The AI feedback is surprisingly spot-on. It caught a habit I had of looking away when answering tough questions. My close rate has gone up.',
    rating: 5,
  },
  {
    name: 'Priya Patel',
    role: 'PhD Student',
    quote: 'I used to avoid eye contact in presentations. Two months in, my advisor told me my defense was the most confident she'd seen from a first-year.',
    rating: 5,
  },
]
```

### Testimonial Card Spec (glassmorphism)

```tsx
<div className="relative p-6 rounded-2xl overflow-hidden
                bg-[rgba(13,13,20,0.60)] backdrop-blur-xl
                border border-white/8 shadow-card
                hover:border-accent-400/15 hover:shadow-card-hover
                transition-all duration-300">

  {/* Quote mark decoration */}
  <div className="absolute top-4 right-5 text-6xl font-serif text-accent-400/10
                  leading-none select-none pointer-events-none">
    "
  </div>

  {/* Stars */}
  <div className="flex gap-0.5 mb-4">
    {Array.from({ length: testimonial.rating }).map((_, i) => (
      <Star key={i} size={14} className="text-accent-400 fill-accent-400" />
    ))}
  </div>

  {/* Quote */}
  <p className="text-sm text-text-primary leading-relaxed mb-5 relative z-10">
    "{testimonial.quote}"
  </p>

  {/* Attribution */}
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-bg-elevated border border-white/10
                    flex items-center justify-center text-xs font-semibold text-text-secondary">
      {testimonial.name.split(' ').map(n => n[0]).join('')}
    </div>
    <div>
      <p className="text-sm font-semibold text-text-primary leading-tight">{testimonial.name}</p>
      <p className="text-xs text-text-tertiary">{testimonial.role}</p>
    </div>
  </div>
</div>
```

### Section wrapper

```tsx
<section className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
  <div className="text-center mb-12">
    <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
      Real Results
    </p>
    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
      What learners say
    </h2>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {TESTIMONIALS.map((t) => <TestimonialCard key={t.name} {...t} />)}
  </div>
</section>
```

---

## 7. Homepage Section Order

```
1. Hero (with animated gradient bg)       ← existing, enhanced
2. Our Mission                            ← NEW (sporty gradient)
3. [existing feature highlights if any]
4. Our Team                               ← NEW
5. Testimonials                           ← NEW
6. CTA banner (if exists)
Footer
```

---

## 8. Files to Create / Modify

| File | Change |
|---|---|
| `src/components/NavBar.tsx` | Add "by PeeTeeAI" sub-label with external link |
| `src/components/Footer.tsx` | **NEW** — full footer component |
| `src/app/layout.tsx` | Import + render `<Footer />` |
| `src/app/page.tsx` | Add animated hero bg, Mission, Team, Testimonials sections |
| `src/app/globals.css` | Add `.hero-animated-bg`, `.hero-dot-grid`, `@keyframes hero-drift` |

---

## 9. Responsive Notes

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| NavBar brand | Stacked (seeneyu / by PeeTeeAI) | Stacked | Stacked |
| Footer | Single column | 2-col | 4-col |
| Mission | Centered, 90vw max | Centered | max-w-4xl centered |
| Team | 1 col | 3 col | 3 col |
| Testimonials | 1 col | 3 col | 3 col |
