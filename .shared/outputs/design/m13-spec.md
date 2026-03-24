# M13 UI Specs — Onboarding Assessment & Learning Path
> Owner: Designer
> Milestone: M13
> Delivered: 2026-03-23
> Status: READY FOR IMPLEMENTATION

---

## Overview

Two parts:
- **Part A**: Onboarding Assessment — a 5-screen skill-rating flow shown after first sign-up, before the learner reaches the library. Establishes a baseline for each skill category.
- **Part B**: Learning Path Dashboard — a persistent dashboard at `/dashboard` (and/or home section) showing the learner's progress track for each skill.

---

# PART A — Onboarding Assessment

**Route**: `/onboarding` (redirect here after first sign-up; skip if `user.onboardingComplete === true`)

---

## Screen Flow

```
/onboarding
    │
    ├── Screen 1/5: Eye Contact
    ├── Screen 2/5: Open Posture
    ├── Screen 3/5: Active Listening
    ├── Screen 4/5: Vocal Pacing
    └── Screen 5/5: Confident Disagreement
           │
           ▼
    /onboarding/processing   ← "Assessing your level…" animation
           │
           ▼
    /onboarding/complete     ← "Your Learning Path Is Ready"
           │
           ▼
    /dashboard  (or /library)
```

---

## Component: OnboardingShell

**Purpose**: The persistent chrome around all 5 assessment screens. Contains the progress bar, step counter, and the seeneyu logo.

**Props**:
```ts
interface OnboardingShellProps {
  currentStep: number   // 1–5
  totalSteps: number    // 5
  children: React.ReactNode
}
```

**Tailwind Classes**:
```
page:           "min-h-screen bg-bg-base flex flex-col"

top bar:        "px-6 py-4 flex items-center justify-between border-b border-white/8"
logo:           "text-lg font-bold text-text-primary"  (seeneyu wordmark)
step label:     "text-sm text-text-secondary"  e.g. "2 of 5"

progress bar:   "h-1 bg-white/8 w-full"
progress fill:  "h-1 bg-accent-400 transition-all duration-500 ease-smooth"

content area:   "flex-1 flex items-center justify-center px-4 py-10"
```

---

## Component: AssessmentSkillScreen

**Purpose**: One of the 5 skill assessment screens. The learner reads a description of the skill, then rates themselves.

**Props**:
```ts
interface AssessmentSkillScreenProps {
  skillCategory: SkillCategory
  skillIcon: LucideIcon
  skillName: string           // e.g. "Eye Contact"
  description: string         // 2-3 sentences on what this skill is
  onRate: (level: 'beginner' | 'intermediate' | 'advanced') => void
  onOptionalRecord?: () => void  // optional: record a 10s sample
}
```

**Layout** (centered card, max-w-md):

```
┌────────────────────────────────────────────────────┐
│                                                    │
│    [Skill Icon — large, 48px, accent ring]         │
│                                                    │
│    Eye Contact                                     │
│    ──────────────────────────────────────────      │
│    The ability to hold steady eye contact with     │
│    another person while speaking or listening.     │
│    It signals confidence, presence, and trust.     │
│                                                    │
│    How would you rate yourself?                    │
│                                                    │
│    ┌──────────┐  ┌────────────────┐  ┌──────────┐ │
│    │ Beginner │  │ Intermediate   │  │ Advanced │ │
│    └──────────┘  └────────────────┘  └──────────┘ │
│                                                    │
│    ──────────────────────────────────────────      │
│    [○ Record a 10s sample instead — optional]      │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Tailwind Classes**:
```
card:           "bg-bg-surface border border-white/8 rounded-3xl p-8 flex flex-col
                 items-center gap-6 w-full max-w-md text-center"

icon ring:      "w-16 h-16 rounded-2xl bg-accent-400/10 border border-accent-400/20
                 flex items-center justify-center"
icon:           size=32, className="text-accent-400"

skill name:     "text-2xl font-bold text-text-primary"
divider:        "w-full border-t border-white/8"
description:    "text-sm text-text-secondary leading-relaxed max-w-xs"

rate label:     "text-sm font-semibold text-text-tertiary uppercase tracking-widest"

level buttons:  "w-full grid grid-cols-3 gap-2"

level btn base: "py-3 rounded-xl border text-sm font-medium transition-all duration-150"
level unsel:    "border-white/10 text-text-secondary hover:border-white/20 hover:bg-bg-overlay"
level selected: "border-accent-400/60 bg-accent-400/10 text-accent-400 shadow-glow-sm"

optional row:   "flex items-center gap-2 text-sm text-text-tertiary"
optional radio: "w-4 h-4 rounded-full border border-white/20"
optional label: "hover:text-text-secondary transition-colors cursor-pointer"
```

**States**:
- No level selected: level buttons in unselected state, "Continue" button disabled
- Level selected: that button switches to selected style, "Continue" becomes active amber pill
- Optional record: clicking "Record a 10s sample" triggers an inline mini-recorder (no full UI — just a small video card that appears below)

**Continue Button** (appears after selection):
```
"w-full bg-accent-400 text-text-inverse rounded-pill py-3.5 text-base font-semibold
 hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150
 disabled:opacity-40 disabled:cursor-not-allowed"
```

**Transition between screens**: Slide-left exit + slide-right enter, 200ms smooth. (CSS: translateX(-100%) → translateX(0), opacity 0→1.)

---

## Screen: ProcessingScreen

**Purpose**: The "AI is assessing" interstitial after all 5 ratings are submitted. Plays for 2–3s while the baseline scores are saved.

**Layout**:
```
        [animated amber pulsing ring]

   Assessing your starting level…

   We're personalising your learning path
   based on your self-assessment.
```

**Tailwind Classes**:
```
screen:         "flex flex-col items-center justify-center gap-6 text-center py-20 px-6"

spinner ring:   "w-16 h-16 rounded-full border-4 border-white/10 border-t-accent-400
                 animate-spin"

headline:       "text-xl font-semibold text-text-primary"
subtext:        "text-sm text-text-secondary max-w-xs leading-relaxed"
```

---

## Screen: OnboardingCompleteScreen

**Purpose**: The payoff screen. Confirms the path is ready. Routes to `/dashboard`.

**Layout**:
```
        ✦ (star/sparkle icon, amber, 48px)

   Your Learning Path Is Ready

   We've set your starting level for all 5 skills.
   Start with the clips we've picked for you, or
   explore the full library.

   ────────────────────────────────────────

   [  Go to My Learning Path  →  ]
   [     Explore All Clips       ]
```

**Tailwind Classes**:
```
screen:         "flex flex-col items-center justify-center gap-6 text-center py-20 px-6"

sparkle:        "w-16 h-16 rounded-2xl bg-accent-400/10 border border-accent-400/20
                 flex items-center justify-center"
  icon: Sparkles from Lucide, size=32, "text-accent-400"

headline:       "text-2xl md:text-3xl font-bold text-text-primary"
subtext:        "text-sm text-text-secondary max-w-xs leading-relaxed"
divider:        "w-16 border-t border-white/10"

primary CTA:    "w-full max-w-xs bg-accent-400 text-text-inverse rounded-pill py-4 text-base
                 font-semibold hover:bg-accent-500 hover:shadow-glow transition-all duration-150
                 flex items-center justify-center gap-2"
secondary link: "text-sm text-text-secondary hover:text-text-primary transition-colors"
```

---

# PART B — Learning Path Dashboard

**Route**: `/dashboard`

**Also**: Embed a condensed version on the home page (`/`) for returning logged-in users, above the hero or in a "Continue Learning" section.

---

## Component: LearningPathDashboard

**Purpose**: Shows 5 skill track columns side by side. Each column shows the learner's current level, progress bar, and next recommended clip.

**Props**:
```ts
interface SkillTrack {
  skillCategory: SkillCategory
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  clipsCompleted: number
  clipsTotal: number          // for the current level
  nextClip: {
    id: string
    title: string
    thumbnailUrl?: string
    difficulty: Difficulty
  } | null
}

interface LearningPathDashboardProps {
  tracks: SkillTrack[]  // length 5
}
```

**Page Layout**:
```
/dashboard
├── Section header: "Your Learning Path"
│   Subtitle: "Track your progress across all 5 communication skills."
│
└── 5-column skill grid (scroll horizontally on mobile)
    ├── [SkillTrackColumn] — Eye Contact
    ├── [SkillTrackColumn] — Open Posture
    ├── [SkillTrackColumn] — Active Listening
    ├── [SkillTrackColumn] — Vocal Pacing
    └── [SkillTrackColumn] — Confident Disagreement
```

**Tailwind Classes**:
```
section header: "space-y-1 mb-6"
title:          "text-2xl font-bold text-text-primary"
subtitle:       "text-sm text-text-secondary"

grid:           "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
```

---

## Component: SkillTrackColumn

**Purpose**: One skill's progress column. Contains the skill identity, level badge, progress bar with milestone markers, and the next recommended clip card.

**Props**:
```ts
interface SkillTrackColumnProps {
  track: SkillTrack
}
```

**Layout**:

```
┌─────────────────────────────────┐
│  [Eye icon]  Eye Contact        │  ← skill icon + name
│  ─────────────────────────────  │
│  [BEGINNER]  Level badge        │  ← current level
│                                 │
│  SkillProgressBar               │  ← progress within current level
│  ○─────●─────────○  (milestones)│
│  3 / 5 clips                    │  ← count
│  ─────────────────────────────  │
│  NEXT UP                        │
│  [LearningPathCard]             │  ← next recommended clip
└─────────────────────────────────┘
```

**Tailwind Classes**:
```
column card:    "bg-bg-surface border border-white/8 rounded-2xl p-4 flex flex-col gap-4"

header row:     "flex items-center gap-2"
skill icon:     "w-8 h-8 rounded-lg flex items-center justify-center" + skill-tinted bg
skill name:     "text-sm font-semibold text-text-primary"

divider:        "border-t border-white/8"

level badge:    "inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-semibold
                 uppercase tracking-wider"
  beginner:     "bg-success/10 text-success border border-success/30"
  intermediate: "bg-warning/10 text-warning border border-warning/30"
  advanced:     "bg-error/10 text-error border border-error/30"
  expert:       "bg-accent-400/10 text-accent-400 border border-accent-400/30"

next-up label:  "text-xs font-semibold uppercase tracking-widest text-text-tertiary"
```

---

## Component: SkillProgressBar

**Purpose**: A progress track for one skill level. Shows filled progress + milestone markers for level transitions (Beginner → Intermediate → Advanced → Expert).

**Props**:
```ts
interface SkillProgressBarProps {
  completed: number
  total: number
  currentLevel: string
}
```

**Visual design**:
```
Beginner ●────────────────────────────────○ Intermediate

         ████████████░░░░░░░░  3 / 5 clips
```

**Tailwind Classes**:
```
wrap:           "flex flex-col gap-2"

level labels:   "flex items-center justify-between"
left label:     "text-xs text-text-tertiary capitalize"
right label:    "text-xs text-text-tertiary capitalize"

track:          "relative h-2 bg-white/8 rounded-pill overflow-hidden"
fill:           "absolute left-0 top-0 h-full bg-accent-400 rounded-pill
                 transition-all duration-700 ease-smooth"
               width: `${Math.min((completed / total) * 100, 100)}%`

count label:    "text-xs text-text-secondary"  e.g. "3 of 5 clips"
```

---

## Component: LearningPathCard

**Purpose**: The next recommended clip card inside each SkillTrackColumn.

**Props**:
```ts
interface LearningPathCardProps {
  clipId: string
  title: string
  thumbnailUrl?: string
  difficulty: Difficulty
  skillCategory: SkillCategory
}
```

**Layout** (compact card):

```
┌──────────────────────────────────┐
│  [thumbnail — 16:9 rounded-xl]   │
│  ─────────────────────────────   │
│  The Wolf of Wall Street clip    │
│  [intermediate]                  │
│  [Practice Now →]                │
└──────────────────────────────────┘
```

**Tailwind Classes**:
```
card:           "bg-bg-elevated border border-white/8 rounded-xl overflow-hidden
                 hover:border-accent-400/20 hover:shadow-card-hover transition-all duration-200
                 group"

thumbnail:      "aspect-video w-full bg-bg-inset relative overflow-hidden"
thumb img:      "w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
thumb fallback: "absolute inset-0 flex items-center justify-center text-text-tertiary"
  use: PlayCircle icon, size=32

content:        "p-3 flex flex-col gap-2"
title:          "text-xs font-medium text-text-primary leading-snug line-clamp-2"
pill row:       "flex items-center gap-1.5"
difficulty:     [existing DifficultyPill size="xs"]

cta:            "text-xs font-semibold text-accent-400 flex items-center gap-1
                 group-hover:gap-1.5 transition-all duration-150"
  text: "Practice Now"
  icon: ArrowRight size=12
```

**States**:
- `default`: thumbnail + title + difficulty + CTA
- `no-thumbnail`: show PlayCircle placeholder in bg-inset
- `hover`: border tints amber, thumbnail scales subtly, arrow shifts right

---

## ASCII Mockup — Full Dashboard

```
Your Learning Path
Track your progress across all 5 communication skills.

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  👁  Eye Contact │  │  ⬛ Open Posture│  │  👂 Active List │  │  🎙  Vocal Pacing│  │  🛡  Conf.Disagr │
│ ─────────────── │  │ ─────────────── │  │ ─────────────── │  │ ─────────────── │  │ ─────────────── │
│  BEGINNER       │  │  INTERMEDIATE   │  │  BEGINNER       │  │  ADVANCED       │  │  BEGINNER       │
│  ████░░  3/5    │  │  ██████░  5/8   │  │  ██░░░░  2/5    │  │  ████████ 8/8   │  │  █░░░░░  1/5    │
│ ─────────────── │  │ ─────────────── │  │ ─────────────── │  │ ─────────────── │  │ ─────────────── │
│  NEXT UP        │  │  NEXT UP        │  │  NEXT UP        │  │  NEXT UP        │  │  NEXT UP        │
│  [clip card]    │  │  [clip card]    │  │  [clip card]    │  │  [clip card]    │  │  [clip card]    │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Responsive

| Screen | Dashboard layout |
|---|---|
| Mobile 375px | Single column, each SkillTrackColumn full-width, stacked |
| Tablet 768px | 2 columns (sm:grid-cols-2) |
| Desktop 1024px+ | 5 columns (lg:grid-cols-5) |

For the onboarding assessment: always single-column, centered card (max-w-md), no multi-column.

---

## Design Notes for Developer

1. **Onboarding redirect**: Check `user.onboardingComplete` on the auth session. If false and user lands on `/library` or `/dashboard`, redirect to `/onboarding`. Set `onboardingComplete = true` after the complete screen CTA is clicked.

2. **Baseline scoring**: The 5 self-ratings are stored as a `UserBaseline` record (new Prisma model) with fields `skillCategory` + `selfRating` ('beginner'/'intermediate'/'advanced') + `timestamp`.

3. **Level determination**: Levels advance based on clips completed at a given difficulty. Backend computes this from `UserSession` records. Designer does not spec the algorithm — that's Backend territory.

4. **LearningPathCard thumbnails**: seeneyu does not self-host video. Thumbnails can be derived from the YouTube videoId: `https://i.ytimg.com/vi/[VIDEO_ID]/mqdefault.jpg` (no auth required). Use this as the `thumbnailUrl`.

5. **Empty state for LearningPathCard** (no next clip / all clips completed): Show a "Level Complete 🏆" state in the card area with a "See Advanced Clips" link.

---

## Empty / Completion State for SkillTrackColumn

```
┌─────────────────────────────────┐
│  👁  Eye Contact                │
│  ─────────────────────────────  │
│  ADVANCED                       │
│  ██████████████████████  8/8    │
│  ─────────────────────────────  │
│  🏆 Level Complete!             │
│  [Explore Advanced Clips →]     │
└─────────────────────────────────┘
```

Tailwind: `text-accent-400 font-semibold text-sm flex items-center gap-2`

---

*End of M13 spec*
