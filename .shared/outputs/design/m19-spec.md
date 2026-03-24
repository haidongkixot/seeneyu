# M19 — Micro Training Arcade Zone Spec
> Designer: M19 delivery
> Date: 2026-03-24
> Status: READY FOR IMPLEMENTATION

---

## Overview

A new gamified zone at `/arcade`. Users do rapid (<10s) challenge activities: watch a description of a facial expression or body gesture, record themselves, get instant AI scoring.

**Visual language**: Fast, game-like, energetic. Contrasts with the reflective coaching tone of the main app. Uses the same dark base + amber accent but adds XP badges, streaks, neon score rings, and countdown pressure.

---

## Design Vocabulary

| Token | Use |
|---|---|
| **XP Badge** | Amber pill `+20 XP` — awarded on completion |
| **Streak fire** | 🔥 icon + count — consecutive challenge completions |
| **Score ring** | Circular progress ring 0–100, color-coded |
| **Locked overlay** | Dim + lock icon over challenge cards not yet unlocked |
| **Countdown bar** | Full-width amber progress bar depleting over 10s |
| **Bundle card** | Square-ish card with theme icon, difficulty dots, challenge count |

---

## Screen 1: `/arcade` — Bundle Browser

### Header

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚡ Arcade Zone                       🔥 5 streak    ⭐ 340 XP total │
│ Quick challenges. Instant scores.                                     │
└──────────────────────────────────────────────────────────────────────┘
```

```tsx
// Page header
<div className="flex items-start justify-between mb-8">
  <div>
    <div className="flex items-center gap-2 mb-1">
      <Zap size={24} className="text-accent-400" />
      <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
        Arcade Zone
      </h1>
    </div>
    <p className="text-text-secondary text-sm">Quick challenges. Instant scores.</p>
  </div>

  {/* Stats cluster */}
  <div className="flex items-center gap-3">
    <StatPill icon="🔥" label={`${streak} streak`} />
    <StatPill icon="⭐" label={`${totalXP} XP`} />
  </div>
</div>
```

**StatPill**:
```tsx
<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill
                bg-bg-surface border border-white/10 text-sm font-semibold text-text-primary">
  <span>{icon}</span>
  <span>{label}</span>
</div>
```

### Bundle Grid

```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│  🏆                │  │  💛                │  │  ⚡                │
│                    │  │                    │  │                    │
│  Confidence &      │  │  Empathy &         │  │  Tension &         │
│  Authority         │  │  Warmth            │  │  Conflict          │
│                    │  │                    │  │                    │
│  10 challenges     │  │  10 challenges     │  │  10 challenges     │
│  ●●○ Intermediate  │  │  ●○○ Beginner      │  │  ●●● Advanced      │
│                    │  │                    │  │                    │
│  [Start →]         │  │  [Start →]         │  │  [Start →]         │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

**Bundle Card Spec**:

```tsx
<Link href={`/arcade/${bundle.id}`}>
  <div className="group relative flex flex-col p-6 rounded-2xl
                  bg-bg-surface border border-white/8 shadow-card
                  hover:shadow-card-hover hover:-translate-y-1 hover:border-accent-400/20
                  transition-all duration-300 cursor-pointer
                  min-h-[200px]">

    {/* Theme emoji / icon — large */}
    <div className="text-4xl mb-4">{bundle.themeEmoji}</div>

    {/* Title */}
    <h3 className="text-lg font-bold text-text-primary mb-1">{bundle.title}</h3>
    <p className="text-sm text-text-secondary mb-4 flex-1">{bundle.description}</p>

    {/* Footer row */}
    <div className="flex items-center justify-between mt-auto">
      <div className="flex flex-col gap-1">
        {/* Challenge count */}
        <p className="text-xs text-text-tertiary">
          {bundle.challengeCount} challenges
        </p>
        {/* Difficulty dots */}
        <DifficultyDots level={bundle.difficulty} />
      </div>

      {/* XP total for bundle */}
      <span className="text-xs font-semibold px-2 py-1 rounded-pill
                       bg-accent-400/15 text-accent-400 border border-accent-400/30">
        {bundle.xpReward} XP
      </span>
    </div>

    {/* Start arrow — appears on hover */}
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100
                    transition-opacity duration-200">
      <ArrowRight size={18} className="text-accent-400" />
    </div>
  </div>
</Link>
```

**DifficultyDots**:
```tsx
// 3 dots: filled = active level
function DifficultyDots({ level }: { level: 'beginner' | 'intermediate' | 'advanced' }) {
  const filled = { beginner: 1, intermediate: 2, advanced: 3 }[level]
  return (
    <div className="flex items-center gap-1">
      {[1,2,3].map(i => (
        <div key={i} className={`w-2 h-2 rounded-full ${
          i <= filled ? 'bg-accent-400' : 'bg-white/15'
        }`} />
      ))}
      <span className="text-xs text-text-tertiary ml-1 capitalize">{level}</span>
    </div>
  )
}
```

### Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {bundles.map(bundle => <BundleCard key={bundle.id} {...bundle} />)}
</div>
```

---

## Screen 2: `/arcade/[bundleId]` — Challenge List

### Header

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to Arcade         Confidence & Authority    3/10 complete     │
│                          ████░░░░░░ 30%                              │
└──────────────────────────────────────────────────────────────────────┘
```

```tsx
// Bundle progress header
<div className="mb-8">
  <Link href="/arcade" className="flex items-center gap-1 text-sm text-text-tertiary
                                   hover:text-text-primary transition-colors mb-4">
    <ArrowLeft size={16} />
    Back to Arcade
  </Link>
  <div className="flex items-start justify-between mb-3">
    <div>
      <h1 className="text-2xl font-bold text-text-primary">{bundle.title}</h1>
      <p className="text-sm text-text-secondary mt-1">{bundle.description}</p>
    </div>
    <span className="text-sm text-text-tertiary whitespace-nowrap ml-4 mt-1">
      {completedCount}/{totalCount} complete
    </span>
  </div>
  {/* Progress bar */}
  <div className="h-1.5 bg-white/8 rounded-pill overflow-hidden">
    <div
      className="h-full bg-accent-400 rounded-pill transition-all duration-500"
      style={{ width: `${(completedCount / totalCount) * 100}%` }}
    />
  </div>
</div>
```

### Challenge Card List

```
┌──────────────────────────────────────────────────────────────────────┐
│  1  ✓  The Power Stance                           +20 XP  [●○○ Beg]  │
│     Facial  │  Complete                                               │
├──────────────────────────────────────────────────────────────────────┤
│  2  →  Commanding Eye Contact                     +20 XP  [●●○ Int]  │
│     Facial  │  Not started                                [Start →]  │
├──────────────────────────────────────────────────────────────────────┤
│  3  🔒 Deliberate Stillness                       +20 XP  [●●● Adv]  │
│     Gesture │  Locked                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

```tsx
// Challenge list item
<div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
  challenge.isLocked
    ? 'border-white/6 bg-bg-surface/50 opacity-50 cursor-not-allowed'
    : challenge.isComplete
    ? 'border-success/20 bg-success/5'
    : 'border-white/8 bg-bg-surface hover:border-accent-400/20 hover:bg-bg-elevated cursor-pointer'
}`}>

  {/* Index + status icon */}
  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  text-sm font-bold border border-white/10">
    {challenge.isLocked ? (
      <Lock size={14} className="text-text-tertiary" />
    ) : challenge.isComplete ? (
      <CheckCircle size={16} className="text-success" />
    ) : (
      <span className="text-text-secondary">{challenge.orderIndex}</span>
    )}
  </div>

  {/* Main info */}
  <div className="flex-1 min-w-0">
    <p className={`font-semibold text-sm leading-tight ${
      challenge.isLocked ? 'text-text-tertiary' : 'text-text-primary'
    }`}>
      {challenge.title}
    </p>
    <div className="flex items-center gap-2 mt-1">
      <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
        challenge.type === 'facial'
          ? 'bg-violet-500/15 text-violet-300'
          : 'bg-cyan-500/15 text-cyan-300'
      }`}>
        {challenge.type === 'facial' ? 'Facial' : 'Gesture'}
      </span>
      <span className="text-xs text-text-tertiary">
        {challenge.isComplete ? 'Complete' : challenge.isLocked ? 'Locked' : 'Not started'}
      </span>
    </div>
  </div>

  {/* Right: XP + start */}
  <div className="flex items-center gap-3 flex-shrink-0">
    <span className="text-xs font-semibold text-accent-400">+{challenge.xpReward} XP</span>
    {!challenge.isLocked && !challenge.isComplete && (
      <div className="text-accent-400 group-hover:translate-x-0.5 transition-transform">
        <ArrowRight size={16} />
      </div>
    )}
    {challenge.isComplete && challenge.bestScore !== undefined && (
      <ScoreBadge score={challenge.bestScore} size="sm" />
    )}
  </div>
</div>
```

**Unlock logic**: complete challenge N to unlock challenge N+1. First challenge always unlocked.

---

## Screen 3: Challenge Active State (Modal or Full-page)

Presented as a full-page overlay (replaces challenge list, back button returns).

### Layout — Split Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│  [←] Challenge 2 of 10                              ⏱ 10s           │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐  │
│  │                              │  │                              │  │
│  │  📸 Reference                │  │  📹 You                      │  │
│  │                              │  │                              │  │
│  │  [reference image or        │  │  [live camera preview        │  │
│  │   description illustration] │  │   with flip mirror]          │  │
│  │                              │  │                              │  │
│  │  Commanding Eye Contact      │  │                              │  │
│  │                              │  │                              │  │
│  │  Maintain direct, unwavering │  │                              │  │
│  │  eye contact for 8-10s while │  │                              │  │
│  │  delivering your message.    │  │                              │  │
│  │                              │  │                              │  │
│  │  Context: Harvey Specter in  │  │                              │  │
│  │  Suits boardroom confrontation│  │                              │  │
│  └──────────────────────────────┘  └──────────────────────────────┘  │
│                                                                       │
│  ████████████░░░░░░░░░░░░░░░░  [7.4s remaining]                      │  ← countdown
│                                                                       │
│               [  ⏸ Pause  ]    [  Submit →  ]                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Full Page Structure

```tsx
<div className="min-h-screen bg-bg-base flex flex-col">

  {/* Top bar */}
  <div className="flex items-center justify-between px-4 py-4 border-b border-white/6">
    <button onClick={exitChallenge} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors">
      <ArrowLeft size={16} />
      Exit
    </button>
    <span className="text-sm font-semibold text-text-primary">
      Challenge {challenge.orderIndex} of {totalChallenges}
    </span>
    {/* Recording state indicator */}
    {isRecording && (
      <div className="flex items-center gap-1.5 text-sm font-semibold text-error">
        <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
        REC
      </div>
    )}
  </div>

  {/* Split screen */}
  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:p-6">

    {/* Left: Reference panel */}
    <div className="flex flex-col bg-bg-surface rounded-2xl border border-white/8 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/6">
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">
          Reference
        </span>
      </div>
      <div className="flex-1 flex flex-col p-5">
        {/* Reference image if available, else illustration placeholder */}
        {challenge.referenceImageUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-bg-inset">
            <img src={challenge.referenceImageUrl} alt="Reference" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-bg-elevated border border-white/8
                          flex items-center justify-center mb-4 text-4xl">
            {challenge.type === 'facial' ? '😐' : '🧍'}
          </div>
        )}
        <h2 className="text-xl font-bold text-text-primary mb-2">{challenge.title}</h2>
        <p className="text-sm text-text-primary leading-relaxed mb-4">{challenge.description}</p>
        {challenge.context && (
          <div className="p-3 rounded-lg bg-bg-inset border border-white/6">
            <p className="text-xs text-text-tertiary leading-relaxed italic">{challenge.context}</p>
          </div>
        )}
      </div>
    </div>

    {/* Right: Camera preview */}
    <div className="flex flex-col bg-bg-surface rounded-2xl border border-white/8 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">
          You
        </span>
        <CountdownDisplay secondsLeft={secondsLeft} />
      </div>
      <div className="flex-1 relative bg-black rounded-b-2xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]" // mirror
        />
        {/* Not-started overlay */}
        {!isRecording && !hasRecorded && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm
                          flex flex-col items-center justify-center gap-3">
            <Camera size={40} className="text-text-tertiary" />
            <p className="text-sm text-text-secondary">Camera ready</p>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Countdown bar */}
  <div className="px-4 lg:px-6 pb-2">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-text-tertiary">
        {isRecording ? `${timeLeft.toFixed(1)}s remaining` : 'Ready'}
      </span>
      <span className="text-xs text-text-tertiary">10s max</span>
    </div>
    <div className="h-2 bg-white/8 rounded-pill overflow-hidden">
      <div
        className={`h-full rounded-pill transition-all duration-100 ${
          timeLeft > 5 ? 'bg-accent-400' : timeLeft > 2 ? 'bg-warning' : 'bg-error'
        }`}
        style={{ width: `${(timeLeft / 10) * 100}%` }}
      />
    </div>
  </div>

  {/* Action buttons */}
  <div className="flex items-center justify-center gap-4 px-4 py-4 pb-6">
    {!isRecording && !hasRecorded && (
      <button
        onClick={startRecording}
        className="flex items-center gap-2 px-8 py-3 rounded-pill
                   bg-error text-white font-semibold text-base
                   hover:bg-error/80 transition-colors duration-150
                   shadow-[0_0_20px_rgba(239,68,68,0.30)]">
        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
        Start Recording
      </button>
    )}
    {isRecording && (
      <>
        <button onClick={stopRecording}
                className="px-6 py-3 rounded-pill border border-white/20
                           text-text-secondary hover:text-text-primary hover:border-white/30
                           text-sm font-medium transition-all duration-150">
          Stop Early
        </button>
        <button onClick={submitRecording}
                className="flex items-center gap-2 px-8 py-3 rounded-pill
                           bg-accent-400 text-text-inverse font-semibold text-base
                           hover:bg-accent-500 shadow-glow-sm transition-all duration-150">
          Submit
          <ArrowRight size={18} />
        </button>
      </>
    )}
  </div>
</div>
```

### CountdownDisplay

```tsx
function CountdownDisplay({ secondsLeft }: { secondsLeft: number }) {
  const isUrgent = secondsLeft <= 3
  return (
    <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${
      isUrgent ? 'text-error animate-pulse' : 'text-accent-400'
    }`}>
      <Timer size={14} />
      {secondsLeft.toFixed(1)}s
    </div>
  )
}
```

---

## Screen 4: Score Result Screen

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                         ┌──────────────┐                            │
│                         │              │                            │
│                         │     78       │  ← score ring (amber)      │
│                         │   ─────      │                            │
│                         │    /100      │                            │
│                         └──────────────┘                            │
│                                                                      │
│                         Great Performance!                           │
│                         +20 XP earned                                │
│                                                                      │
│  ────────────────────────────────────────────────────────────────   │
│                                                                      │
│    Expression Match     Intensity          Context Fit               │
│    ████████░░  72%      ███████░░  68%    █████████  80%            │
│                                                                      │
│  ────────────────────────────────────────────────────────────────   │
│                                                                      │
│    "Strong direct gaze. Try softening slightly at corners            │
│     to avoid appearing aggressive."                                  │
│                                                                      │
│                                                                      │
│           [  ↺ Retry  ]       [  Next Challenge →  ]                │
└──────────────────────────────────────────────────────────────────────┘
```

### Score Ring

Pure CSS/SVG animated ring — no library:

```tsx
function ScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const ringColor = score >= 70 ? '#22c55e'   // green
                  : score >= 40 ? '#f59e0b'   // amber
                  : '#ef4444'                  // red

  const label = score >= 70 ? 'Great Performance!'
              : score >= 40 ? 'Good Effort!'
              : 'Keep Practicing!'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          {/* Track */}
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          {/* Fill — animated */}
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 8px ${ringColor}60)`,
            }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-text-primary tabular-nums">{score}</span>
          <span className="text-xs text-text-tertiary">/100</span>
        </div>
      </div>
      <p className="text-lg font-bold text-text-primary">{label}</p>
    </div>
  )
}
```

### XP Earned Animation

```tsx
// Appears after score reveal with a pop animation
<div className="flex items-center gap-2 px-4 py-2 rounded-pill
                bg-accent-400/15 border border-accent-400/30
                animate-[pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
  <Star size={16} className="text-accent-400 fill-accent-400" />
  <span className="text-sm font-bold text-accent-400">+{xpEarned} XP earned</span>
</div>
```

Add to `globals.css`:
```css
@keyframes pop {
  0%   { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```

### Breakdown Bars

```tsx
function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-semibold text-text-primary tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-pill overflow-hidden">
        <div
          className="h-full bg-accent-400/70 rounded-pill transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
```

**Breakdown categories** (from API response `breakdown` JSON):
- Expression Match
- Intensity
- Context Fit

### Feedback Line

```tsx
{feedbackLine && (
  <div className="p-4 rounded-xl bg-bg-elevated border border-white/8 text-sm text-text-secondary leading-relaxed">
    "{feedbackLine}"
  </div>
)}
```

### Action Buttons

```tsx
<div className="flex items-center justify-center gap-4 pt-2">
  <button
    onClick={retry}
    className="flex items-center gap-2 px-6 py-3 rounded-pill
               border border-white/15 text-text-secondary
               hover:border-white/25 hover:text-text-primary
               text-sm font-semibold transition-all duration-150">
    <RotateCcw size={16} />
    Retry
  </button>
  <button
    onClick={nextChallenge}
    className="flex items-center gap-2 px-8 py-3 rounded-pill
               bg-accent-400 text-text-inverse font-semibold text-base
               hover:bg-accent-500 shadow-glow-sm transition-all duration-150">
    Next Challenge
    <ArrowRight size={18} />
  </button>
</div>
```

**If last challenge in bundle**: "Next Challenge" becomes "Complete Bundle 🏆"

---

## 5. Gamification Elements Detail

### ScoreBadge (reusable — also shown on challenge list after completion)

```tsx
function ScoreBadge({ score, size = 'default' }: { score: number; size?: 'sm' | 'default' }) {
  const color = score >= 70 ? 'text-success border-success/30 bg-success/10'
              : score >= 40 ? 'text-warning border-warning/30 bg-warning/10'
              : 'text-error border-error/30 bg-error/10'

  return (
    <span className={`inline-flex items-center font-bold rounded-pill border
                      ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
                      ${color}`}>
      {score}
    </span>
  )
}
```

### Type badge colors (challenge type chip)

```tsx
// Facial expression challenges — violet
'bg-violet-500/15 text-violet-300 border-violet-500/20'

// Body gesture challenges — cyan
'bg-cyan-500/15 text-cyan-300 border-cyan-500/20'
```

### Streak Counter

Shown in arcade header. Uses fire emoji with count. If streak === 0, show gray `—`.

---

## 6. Mobile Behavior

| Screen | Mobile |
|---|---|
| Bundle browser | Single-column cards, full-width |
| Challenge list | Single-column list items, compact |
| Challenge active | Stack: reference panel on top (collapsed), camera below |
| Score result | Single-column: ring → breakdown → buttons |

**Mobile split screen**: on `< lg`, reference panel collapses to a banner at top (shows title + description in 2 lines). Camera takes full height below. Tap banner to expand reference details in a sheet.

---

## 7. Files to Create / Modify

| File | Change |
|---|---|
| `src/app/arcade/page.tsx` | **NEW** — bundle browser |
| `src/app/arcade/[bundleId]/page.tsx` | **NEW** — challenge list |
| `src/app/arcade/[bundleId]/challenge/[challengeId]/page.tsx` | **NEW** — active challenge (or modal) |
| `src/components/arcade/BundleCard.tsx` | **NEW** |
| `src/components/arcade/ChallengeListItem.tsx` | **NEW** |
| `src/components/arcade/ArcadeRecorder.tsx` | **NEW** — 10s recorder |
| `src/components/arcade/ScoreRing.tsx` | **NEW** |
| `src/components/arcade/ScoreResultScreen.tsx` | **NEW** |
| `src/components/NavBar.tsx` | Add "Arcade" link |
| `src/app/globals.css` | Add `@keyframes pop` |

---

## 8. NavBar Link

Add to the main nav links (after Foundation):

```tsx
<Link href="/arcade" className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
  <Zap size={16} className="text-accent-400" />
  Arcade
</Link>
```

On mobile nav, include as a nav item with the ⚡ icon.
