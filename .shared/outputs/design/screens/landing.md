# Screen: Landing / Hero
> Owner: Designer | Created: 2026-03-21

## Purpose
First impression. Convert visitors into users. Communicate the core concept in under 5 seconds: watch Hollywood stars, record yourself, get AI feedback.

## Full Desktop Layout (1440px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  seeneyu         Library    Progress    About         [Sign In] [Get Started]│  ← NavBar
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔════════════════════════════════════════════════════════════════════════╗  │
│  ║                    HERO — 100vh, hero-gradient bg                     ║  │
│  ║                                                                        ║  │
│  ║   ┌──────────────────────────────────┐  ┌────────────────────────┐   ║  │
│  ║   │  TEXT COLUMN (left 55%)          │  │ FLOATING CLIP PREVIEW  │   ║  │
│  ║   │                                  │  │  (right 40%)           │   ║  │
│  ║   │  ┌──────────────────────────┐    │  │                        │   ║  │
│  ║   │  │ [Eye Contact] skill chip │    │  │  ╔════════════════╗    │   ║  │
│  ║   │  └──────────────────────────┘    │  │  ║                ║    │   ║  │
│  ║   │                                  │  │  ║  movie clip    ║    │   ║  │
│  ║   │  Learn to command                │  │  ║  thumbnail     ║    │   ║  │
│  ║   │  any room                        │  │  ║                ║    │   ║  │
│  ║   │                                  │  │  ╚════════════════╝    │   ║  │
│  ║   │  From Hollywood's greatest       │  │                        │   ║  │
│  ║   │  performances — one scene        │  │  Gone with the Wind    │   ║  │
│  ║   │  at a time.                      │  │  [Eye Contact] [Beg]   │   ║  │
│  ║   │                                  │  │                        │   ║  │
│  ║   │  [● Start Learning — It's Free]  │  │  "Scarlett holds her   │   ║  │
│  ║   │                                  │  │   gaze through the     │   ║  │
│  ║   │  [Browse the Library →]          │  │   entire scene..."     │   ║  │
│  ║   │                                  │  │                        │   ║  │
│  ║   │  ─────────────────────────────   │  │  ┌──────────────────┐  │   ║  │
│  ║   │  Trusted skills:                 │  │  │ AI Score: 82/100 │  │   ║  │
│  ║   │  [Eye Contact] [Posture]         │  │  │ ████████████░░░  │  │   ║  │
│  ║   │  [Listening] [Vocal Pacing]      │  │  └──────────────────┘  │   ║  │
│  ║   │  [Confidence]                    │  │                        │   ║  │
│  ║   │                                  │  └────────────────────────┘   ║  │
│  ║   └──────────────────────────────────┘                               ║  │
│  ║                                                                        ║  │
│  ╚════════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ╔════════════════════════════════════════════════════════════════════════╗  │
│  ║   HOW IT WORKS — 3-step section                                        ║  │
│  ║                                                                        ║  │
│  ║   ┌────────────┐    ┌────────────┐    ┌────────────┐                  ║  │
│  ║   │  Watch     │ →  │  Mimic     │ →  │  Improve   │                  ║  │
│  ║   │  [icon]    │    │  [icon]    │    │  [icon]    │                  ║  │
│  ║   │  Study     │    │  Record    │    │  AI scores │                  ║  │
│  ║   │  the scene │    │  yourself  │    │  your work │                  ║  │
│  ║   └────────────┘    └────────────┘    └────────────┘                  ║  │
│  ╚════════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ╔════════════════════════════════════════════════════════════════════════╗  │
│  ║   SKILLS GRID — "What you'll master"                                  ║  │
│  ║                                                                        ║  │
│  ║   [Eye Contact card] [Open Posture card] [Active Listening card]       ║  │
│  ║   [Vocal Pacing card]     [Confident Disagreement card]                ║  │
│  ║                                                                        ║  │
│  ╚════════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ╔════════════════════════════════════════════════════════════════════════╗  │
│  ║   CTA BANNER — "Ready to transform how you communicate?"              ║  │
│  ║   [● Start Learning — It's Free]    [Browse Library →]               ║  │
│  ╚════════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  Footer: seeneyu © 2026 · Privacy · Terms                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Hero Section Spec

```
Height: min-h-screen (100vh minimum)
Background: hero-gradient (see design-system.md)

Left column content:
  Skill chip: SkillBadge (eye-contact, md size) — rotates through skills every 3s
  Headline: text-5xl lg:text-6xl font-black text-text-primary leading-tight
    "Learn to command"  ← line 1
    "any room."         ← line 2 (amber gradient: text-accent-400)
  Subhead: text-xl text-text-secondary mt-4 max-w-md leading-relaxed
    "From Hollywood's greatest performances — one scene at a time."

  Primary CTA: [● Start Learning — It's Free]
    bg-accent-400 text-text-inverse rounded-pill px-8 py-4 text-lg font-semibold
    shadow-glow mt-8
    hover: bg-accent-500 scale-[1.02]

  Secondary CTA: [Browse the Library →]
    ghost, text-text-secondary hover:text-text-primary
    mt-3 text-sm

  Skill chip row (trust signals):
    "Trusted skills:" — text-xs text-text-tertiary uppercase tracking-widest mt-12 mb-3
    All 5 SkillBadge chips in a row (sm size, non-interactive)
    flex-wrap gap-2

Right column — Floating Clip Preview Card:
  bg-bg-surface border border-white/10 rounded-2xl shadow-xl p-4
  Width: ~380px, slight rotation: rotate-2 (CSS transform)
  Floating animation: gentle bob — keyframes translateY(-8px) → translateY(0)
    animation: 3s ease-in-out infinite alternate

  Contents:
    Movie thumbnail (aspect-video, rounded-xl)
    Movie title + badges row (SkillBadge + DifficultyPill)
    Quote text: text-sm text-text-secondary italic mt-2
    AI Score mini-card: bg-bg-elevated rounded-xl p-3 mt-3
      "AI Score" text-xs text-text-tertiary
      Score bar: progress bar showing 82/100
      Score number: text-2xl font-black text-success
```

## How It Works Section

```
Background: bg-bg-surface
Padding: py-24 px-4

Section title: "How seeneyu works"
  text-3xl font-bold text-text-primary text-center mb-16

3-step grid: grid grid-cols-1 md:grid-cols-3 gap-8
  Each step card:
    bg-bg-elevated rounded-2xl p-8 text-center
    Icon: Lucide icon in 48px amber circle (bg-accent-400/10 rounded-full p-3)
    Step number: text-xs font-bold text-accent-400 uppercase tracking-widest mb-3
    Title: text-xl font-semibold text-text-primary mb-2
    Description: text-sm text-text-secondary leading-relaxed

Steps:
  1. Watch — Film icon — "Study how Hollywood actors command attention"
  2. Mimic — Video icon — "Record yourself attempting the same behavior"
  3. Improve — Sparkles icon — "Get AI coaching with a score and specific tips"
```

## Skills Grid Section

```
Background: bg-bg-base
Padding: py-24 px-4

Title: "5 skills that change how people see you"
  text-3xl font-bold text-text-primary text-center mb-4

Subtitle: text-base text-text-secondary text-center mb-16

Skill cards: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
  (5 cards — last one centered on its row)

Each skill card:
  bg-bg-surface border border-white/8 rounded-2xl p-6 shadow-card
  hover: shadow-card-hover -translate-y-1 cursor-pointer

  Skill icon: 40px circle in skill color, Lucide icon 24px
  Skill name: text-xl font-semibold text-text-primary mt-4
  Description: text-sm text-text-secondary mt-2 leading-relaxed
    (1–2 sentence explanation of why this skill matters)
  "X clips" count: text-xs text-text-tertiary mt-3
```

## Mobile Adaptations

- Hero: single column, clip preview card hidden (or shown below hero text as smaller version)
- Headline: text-4xl
- CTA: full-width
- How it works: vertical stack
- Skills grid: 1 col → 2 col on sm
