# M30 — Mini Games (Expression Games): Design Spec
> Owner: Designer | Status: SPEC COMPLETE | Date: 2026-03-25

---

## 1. Overview

Three embeddable expression mini-games: **Guess Expression**, **Match Expression**, and **Expression King**. All share a common `GameShell` wrapper component. Games are designed to work within a 400x600 iframe embed and in fullscreen mode. Supports dark (default) and light themes via `?theme=light` query param.

---

## 2. GameShell Wrapper (`src/components/games/GameShell.tsx`)

Wraps all game screens with consistent header, timer, score, and progress.

```
┌─────────────────────────────────────┐
│  🎮 Guess Expression    Round 3/10  │  ← Header
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░  ⏱ 0:12    │  ← Timer bar
│                                     │
│         [Game content area]         │
│                                     │
│  Score: 240    ● ● ● ○ ○ ○ ○ ○ ○ ○ │  ← Score + progress dots
└─────────────────────────────────────┘
```

### Shell Container

```
<div class="
  w-full h-full min-h-[600px]
  bg-bg-base
  flex flex-col
  overflow-hidden
  font-sans
  ${theme === 'light' ? 'game-theme-light' : ''}
">
```

### Header

```
<div class="
  flex items-center justify-between
  px-4 py-3
  border-b border-white/6
  bg-bg-surface
  flex-shrink-0
">
  <!-- Left: game icon + title -->
  <div class="flex items-center gap-2">
    <div class="w-7 h-7 rounded-lg bg-accent-400/10 flex items-center justify-center">
      <Gamepad2 size={16} class="text-accent-400" />
    </div>
    <h1 class="text-sm font-semibold text-text-primary">{gameTitle}</h1>
  </div>

  <!-- Right: round counter -->
  <span class="text-xs font-mono text-text-secondary">
    Round {current}/{total}
  </span>
</div>
```

### Timer Bar

```
<div class="flex-shrink-0 px-4 py-2 bg-bg-surface border-b border-white/6">
  <div class="flex items-center gap-3">
    <!-- Timer bar -->
    <div class="flex-1 h-2 bg-bg-inset rounded-pill overflow-hidden">
      <div
        class="
          h-full rounded-pill
          transition-all duration-100 ease-linear
          ${timePercent > 30 ? 'bg-accent-400' : timePercent > 10 ? 'bg-warning' : 'bg-error'}
        "
        style="width: {timePercent}%"
      />
    </div>

    <!-- Time label -->
    <span class="
      text-xs font-mono w-10 text-right flex-shrink-0
      ${timePercent > 30 ? 'text-text-secondary' : timePercent > 10 ? 'text-warning' : 'text-error'}
    ">
      {formatTime(secondsLeft)}
    </span>
  </div>
</div>
```

Timer bar drains from right to left. Color transitions:
- `> 30%` remaining: `bg-accent-400` (amber)
- `10-30%` remaining: `bg-warning` (#f59e0b, pulses gently)
- `< 10%` remaining: `bg-error` (#ef4444, faster pulse)

Low-time pulse animation (added to timer bar when < 30%):
```css
@keyframes timer-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
/* class: animate-[timer-pulse_1s_ease-in-out_infinite] */
/* At < 10%: animate-[timer-pulse_0.5s_ease-in-out_infinite] */
```

### Score Display

```
<div class="
  flex items-center justify-between
  px-4 py-2.5
  bg-bg-surface border-t border-white/6
  flex-shrink-0
">
  <!-- Score -->
  <div class="flex items-center gap-2">
    <span class="text-xs text-text-tertiary">Score</span>
    <span class="text-lg font-bold text-accent-400 font-mono">{score}</span>
  </div>

  <!-- Progress dots -->
  <div class="flex items-center gap-1.5">
    {rounds.map((round, i) => (
      <div class="
        w-2.5 h-2.5 rounded-full
        transition-all duration-200
        ${round === 'correct'  ? 'bg-success scale-100' : ''}
        ${round === 'wrong'    ? 'bg-error scale-100' : ''}
        ${round === 'current'  ? 'bg-accent-400 scale-110 shadow-glow-sm' : ''}
        ${round === 'upcoming' ? 'bg-white/10' : ''}
      " />
    ))}
  </div>
</div>
```

---

## 3. Guess Expression Game (`src/components/games/GuessExpression.tsx`)

Player sees a large expression image and picks the correct emotion from 6 options.

### Layout

```
┌─────────────────────────────────────┐
│  [GameShell header + timer]         │
│                                     │
│       ┌──────────────────┐          │
│       │                  │          │
│       │   Expression     │          │
│       │   Image (large)  │          │
│       │                  │          │
│       └──────────────────┘          │
│                                     │
│   ┌──────┐  ┌──────┐  ┌──────┐     │
│   │ Joy  │  │ Sad  │  │Anger │     │
│   └──────┘  └──────┘  └──────┘     │
│   ┌──────┐  ┌──────┐  ┌──────┐     │
│   │Surprise│ │Fear │  │Disgust│    │
│   └──────┘  └──────┘  └──────┘     │
│                                     │
│  [Score + progress dots]            │
└─────────────────────────────────────┘
```

### Expression Image Container

```
<div class="
  flex-1 flex items-center justify-center
  px-4 py-4
">
  <div class="
    w-full max-w-[280px] aspect-square
    rounded-2xl overflow-hidden
    bg-bg-surface border border-white/8
    shadow-card
  ">
    <img
      class="w-full h-full object-cover"
      src={expressionImageUrl}
      alt="What expression is this?"
    />
  </div>
</div>
```

### Emotion Button Grid

```
<div class="px-4 pb-4">
  <div class="grid grid-cols-3 gap-2">
    {emotions.map(emotion => (
      <button class="
        py-3 px-2 rounded-xl
        text-sm font-semibold text-center
        bg-bg-surface border border-white/8
        text-text-primary
        hover:bg-bg-overlay hover:border-white/15
        active:scale-[0.96]
        transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed

        ${selected === emotion.id ? 'border-accent-400/40 bg-accent-400/10 text-accent-400' : ''}
      ">
        {emotion.label}
      </button>
    ))}
  </div>
</div>
```

### Feedback Animation — Correct

```
<div class="
  absolute inset-0 z-overlay
  flex items-center justify-center
  pointer-events-none
  animate-fade-in
">
  <div class="
    w-20 h-20 rounded-full
    bg-success/20 border-2 border-success
    flex items-center justify-center
    animate-[bounce-in_400ms_cubic-bezier(0.34,1.56,0.64,1)]
  ">
    <Check size={40} class="text-success" />
  </div>
</div>

<!-- Selected button turns green -->
button class adds: "border-success bg-success/10 text-success"

<!-- Score float -->
<span class="
  absolute top-1/2 left-1/2 -translate-x-1/2
  text-lg font-bold text-success
  animate-[xp-float_800ms_ease-out_forwards]
  pointer-events-none
">
  +{points}
</span>
```

### Feedback Animation — Wrong

```
<div class="same as correct but error colors">
  <div class="
    w-20 h-20 rounded-full
    bg-error/20 border-2 border-error
    flex items-center justify-center
    animate-[bounce-in_400ms_cubic-bezier(0.34,1.56,0.64,1)]
  ">
    <X size={40} class="text-error" />
  </div>
</div>

<!-- Selected button turns red, correct answer highlights green -->
wrong button:   "border-error bg-error/10 text-error"
correct button: "border-success bg-success/10 text-success" (reveal)
```

Both feedback states auto-advance to next round after 1200ms.

---

## 4. Match Expression Game (`src/components/games/MatchExpression.tsx`)

Player reads a description and picks the matching image from 4 options.

### Layout

```
┌─────────────────────────────────────┐
│  [GameShell header + timer]         │
│                                     │
│  "A person showing genuine          │
│   surprise with raised eyebrows     │
│   and an open mouth"                │
│                                     │
│   ┌────────┐    ┌────────┐          │
│   │  img1  │    │  img2  │          │
│   └────────┘    └────────┘          │
│   ┌────────┐    ┌────────┐          │
│   │  img3  │    │  img4  │          │
│   └────────┘    └────────┘          │
│                                     │
│  [Score + progress dots]            │
└─────────────────────────────────────┘
```

### Description Text

```
<div class="px-4 pt-4 pb-2">
  <p class="
    text-base font-medium text-text-primary text-center
    leading-relaxed
  ">
    "{description}"
  </p>
</div>
```

### Image Option Grid

```
<div class="flex-1 px-4 py-3">
  <div class="grid grid-cols-2 gap-3 max-w-[360px] mx-auto">
    {options.map(option => (
      <button class="
        relative
        aspect-square rounded-2xl overflow-hidden
        bg-bg-surface border-2
        transition-all duration-200

        ${!selected
          ? 'border-white/8 hover:border-white/20 hover:shadow-card-hover'
          : ''
        }
        ${selected === option.id && option.correct
          ? 'border-success shadow-glow-green'
          : ''
        }
        ${selected === option.id && !option.correct
          ? 'border-error shadow-glow-red'
          : ''
        }
        ${selected && option.correct && selected !== option.id
          ? 'border-success/50'
          : ''
        }
        ${selected && !option.correct && selected !== option.id
          ? 'opacity-40'
          : ''
        }

        active:scale-[0.96]
      ">
        <img class="w-full h-full object-cover" src={option.imageUrl} />

        <!-- Selection indicator overlay -->
        ${selected === option.id && (
          <div class="absolute inset-0 flex items-center justify-center bg-black/30">
            {option.correct
              ? <Check size={32} class="text-success" />
              : <X size={32} class="text-error" />
            }
          </div>
        )}
      </button>
    ))}
  </div>
</div>
```

### Selection Highlight (before confirmation)

When hovering / tapping before answer lock:
```
border-accent-400/40 shadow-glow-sm
```

---

## 5. Expression King Game (`src/components/games/ExpressionKing.tsx`)

Player reads a prompt, performs the expression on camera, AI scores their performance.

### Layout — Prompt Phase

```
┌─────────────────────────────────────┐
│  [GameShell header + timer]         │
│                                     │
│  Challenge:                         │
│  "Show genuine surprise —           │
│   raised eyebrows, open mouth,      │
│   wide eyes"                        │
│                                     │
│       ┌──────────────────┐          │
│       │                  │          │
│       │  Camera Preview  │          │
│       │  (viewfinder)    │          │
│       │                  │          │
│       └──────────────────┘          │
│                                     │
│          ( ● Capture )              │
│                                     │
│  [Score + progress dots]            │
└─────────────────────────────────────┘
```

### Description Prompt

```
<div class="px-4 pt-4 pb-2">
  <p class="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">Challenge</p>
  <p class="text-base font-medium text-text-primary text-center leading-relaxed">
    "{prompt}"
  </p>
</div>
```

### Camera Viewfinder

```
<div class="flex-1 flex items-center justify-center px-4 py-3">
  <div class="
    relative
    w-full max-w-[300px] aspect-[3/4]
    rounded-2xl overflow-hidden
    bg-bg-inset
    border-2 border-white/10
    shadow-card
  ">
    <!-- Live camera feed -->
    <video
      class="w-full h-full object-cover mirror"
      autoPlay muted playsInline
    />

    <!-- Corner guides (decorative viewfinder marks) -->
    <!-- Top-left -->
    <div class="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent-400/60 rounded-tl-md" />
    <!-- Top-right -->
    <div class="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent-400/60 rounded-tr-md" />
    <!-- Bottom-left -->
    <div class="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent-400/60 rounded-bl-md" />
    <!-- Bottom-right -->
    <div class="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent-400/60 rounded-br-md" />

    <!-- "Recording" indicator when capturing -->
    ${capturing && (
      <div class="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-error/80 rounded-pill px-2.5 py-1">
        <div class="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span class="text-xs font-medium text-white">REC</span>
      </div>
    )}
  </div>
</div>
```

### Capture Button

```
<div class="flex justify-center pb-4">
  <button class="
    relative
    w-16 h-16 rounded-full
    bg-error border-4 border-white/30
    hover:bg-error/80 hover:scale-105
    active:scale-95
    transition-all duration-150
    flex items-center justify-center

    ${capturing ? 'bg-error animate-pulse' : ''}
  ">
    <!-- Inner circle -->
    <div class="w-12 h-12 rounded-full bg-error/80 border-2 border-white/20" />
  </button>
</div>
```

### AI Scoring Result

After capture, camera freezes and AI scoring overlay appears.

```
<!-- Loading state (while AI processes) -->
<div class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-2xl">
  <div class="w-12 h-12 border-3 border-accent-400 border-t-transparent rounded-full animate-spin mb-4" />
  <p class="text-sm text-text-secondary">Analyzing your expression...</p>
</div>
```

### Score Ring (0-100)

```
<div class="flex flex-col items-center gap-4 py-6">
  <!-- SVG ring -->
  <div class="relative w-28 h-28">
    <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
      <!-- Background ring -->
      <circle
        cx="60" cy="60" r="52"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        stroke-width="8"
      />
      <!-- Score ring (animated) -->
      <circle
        cx="60" cy="60" r="52"
        fill="none"
        stroke={score >= 70 ? '#22c55e' : score >= 40 ? '#fbbf24' : '#ef4444'}
        stroke-width="8"
        stroke-linecap="round"
        stroke-dasharray={2 * Math.PI * 52}
        stroke-dashoffset={2 * Math.PI * 52 * (1 - score / 100)}
        class="transition-all duration-700 ease-smooth"
      />
    </svg>
    <!-- Score number (centered) -->
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="text-3xl font-bold text-text-primary font-mono">{score}</span>
    </div>
  </div>

  <!-- Label -->
  <p class="text-sm font-medium text-text-secondary">{scoreLabel}</p>
  <!-- e.g., "Perfect!", "Great!", "Good try", "Keep practicing" -->
</div>
```

Score color mapping:
- 70-100: `text-success` / `stroke: #22c55e`
- 40-69: `text-accent-400` / `stroke: #fbbf24`
- 0-39: `text-error` / `stroke: #ef4444`

---

## 6. Certificate Design

Awarded after completing Expression King game. Dark card with amber accents.

### Certificate Card (`CertificateCard`)

```
<div class="
  w-full max-w-[380px] mx-auto
  bg-bg-surface
  border-2 border-accent-400/30
  rounded-3xl
  p-6
  shadow-glow
  relative overflow-hidden
">
  <!-- Subtle radial glow background -->
  <div class="
    absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
    w-64 h-64 rounded-full
    bg-accent-400/5 blur-3xl
    pointer-events-none
  " />

  <!-- Crown/trophy icon -->
  <div class="flex justify-center mb-4">
    <div class="
      w-16 h-16 rounded-full
      bg-accent-400/10 border border-accent-400/30
      flex items-center justify-center
    ">
      <Crown size={32} class="text-accent-400" />
    </div>
  </div>

  <!-- Title -->
  <h2 class="
    text-2xl font-bold text-text-primary text-center
    tracking-tight mb-1
  ">
    King of Expression
  </h2>

  <!-- Decorative divider -->
  <div class="flex items-center gap-3 my-4">
    <div class="flex-1 h-px bg-accent-400/20" />
    <div class="w-2 h-2 rounded-full bg-accent-400/40" />
    <div class="flex-1 h-px bg-accent-400/20" />
  </div>

  <!-- Player name -->
  <p class="text-lg font-semibold text-accent-400 text-center mb-1">{playerName}</p>

  <!-- Date -->
  <p class="text-xs text-text-tertiary text-center mb-6">{formattedDate}</p>

  <!-- Stats row -->
  <div class="grid grid-cols-3 gap-3 mb-6">
    <div class="text-center">
      <span class="text-xl font-bold text-text-primary font-mono">{challengeCount}</span>
      <p class="text-xs text-text-tertiary mt-0.5">Challenges</p>
    </div>
    <div class="text-center">
      <span class="text-xl font-bold text-accent-400 font-mono">{avgScore}</span>
      <p class="text-xs text-text-tertiary mt-0.5">Avg Score</p>
    </div>
    <div class="text-center">
      <span class="text-xl font-bold text-success font-mono">{bestScore}</span>
      <p class="text-xs text-text-tertiary mt-0.5">Best Score</p>
    </div>
  </div>

  <!-- QR code placeholder -->
  <div class="flex justify-center mb-4">
    <div class="
      w-20 h-20 rounded-xl
      bg-white
      p-2
      flex items-center justify-center
    ">
      <!-- QR code image or placeholder -->
      <div class="w-full h-full bg-bg-inset rounded-md flex items-center justify-center">
        <QrCode size={24} class="text-text-tertiary" />
      </div>
    </div>
  </div>

  <!-- Share button -->
  <button class="
    w-full py-3 rounded-pill
    bg-accent-400 text-text-inverse font-semibold text-sm
    hover:bg-accent-500 hover:shadow-glow-sm
    active:bg-accent-600 active:scale-[0.98]
    transition-all duration-150
  ">
    <Share2 size={16} class="inline mr-2" />
    Share Certificate
  </button>
</div>
```

---

## 7. Theme Variants

### Dark Theme (default)

Uses all standard design system tokens. No changes needed.

### Light Theme (`?theme=light`)

Apply a CSS class `game-theme-light` on the GameShell root that overrides CSS custom properties:

```css
.game-theme-light {
  --bg-base: #f8f8fc;
  --bg-surface: #ffffff;
  --bg-elevated: #f0f0f5;
  --bg-overlay: #e8e8f0;
  --bg-inset: #f0f0f5;
  --text-primary: #1a1a2e;
  --text-secondary: #6b6b80;
  --text-tertiary: #9898a8;
  --text-inverse: #ffffff;
  --border-subtle: rgba(0,0,0,0.06);
  --border-default: rgba(0,0,0,0.10);
  --border-strong: rgba(0,0,0,0.20);
}
```

Accent colors (amber) remain unchanged in light theme for brand consistency.

Tailwind approach: use CSS variables in `tailwind.config.ts` colors, or apply light overrides via `[.game-theme-light_&]:bg-white` pattern.

---

## 8. Responsive / Embed Behavior

### Iframe Embed (400x600)

```
Min dimensions: 360x540
Max content width: 400px (auto-centered)
All padding scales down: px-3 py-2 instead of px-4 py-3
Font sizes remain the same (already mobile-first)
Image containers: max-w-[240px] in constrained mode
Button grid gap: gap-1.5 instead of gap-2
```

### Fullscreen Mode

```
Content area: max-w-lg mx-auto (512px centered)
Expression image: max-w-[320px]
Camera viewfinder: max-w-[360px]
More generous padding: px-6 py-4
```

### Detection

```tsx
// Detect iframe embed
const isEmbed = window !== window.parent
// Detect theme
const params = new URLSearchParams(window.location.search)
const theme = params.get('theme') === 'light' ? 'light' : 'dark'
```

---

## 9. PostMessage Integration Points

Games communicate with parent frame via `window.postMessage`:

```typescript
// Messages sent FROM game TO parent:
interface GameMessage {
  type: 'game:ready'                              // Game loaded and ready
  | 'game:started'                                // Player started game
  | 'game:round-complete'                         // Single round finished
  | 'game:complete'                               // All rounds finished
  | 'game:score-update'                           // Score changed
  | 'game:certificate-earned'                     // Certificate generated
  | 'game:share-certificate'                      // User clicked share
  | 'game:error'                                  // Error occurred
  payload: Record<string, unknown>
}

// Messages received FROM parent TO game:
interface ParentMessage {
  type: 'config:theme'                            // Change theme
  | 'config:rounds'                               // Set round count
  | 'game:pause'                                  // Pause timer
  | 'game:resume'                                 // Resume timer
}
```

No UI needed for PostMessage; it is invisible plumbing. Document here for builder reference.

---

## 10. Game Over / Results Screen

Shared across all three games. Replaces the game content area after the final round.

```
<div class="flex-1 flex flex-col items-center justify-center px-4 py-6">
  <!-- Trophy / result icon -->
  <div class="
    w-20 h-20 rounded-full
    bg-accent-400/10 border border-accent-400/30
    flex items-center justify-center
    mb-4
    animate-[bounce-in_500ms_cubic-bezier(0.34,1.56,0.64,1)]
  ">
    <Trophy size={36} class="text-accent-400" />
  </div>

  <!-- Title -->
  <h2 class="text-2xl font-bold text-text-primary mb-1">Game Over!</h2>
  <p class="text-sm text-text-secondary mb-6">Great effort!</p>

  <!-- Final score -->
  <div class="
    bg-bg-surface border border-white/8 rounded-2xl
    px-8 py-5
    shadow-card
    mb-6
    text-center
  ">
    <span class="text-4xl font-bold text-accent-400 font-mono">{finalScore}</span>
    <p class="text-xs text-text-tertiary mt-1">Total Score</p>
  </div>

  <!-- Stats row -->
  <div class="flex items-center gap-6 mb-8">
    <div class="text-center">
      <span class="text-lg font-bold text-success font-mono">{correctCount}</span>
      <p class="text-xs text-text-tertiary">Correct</p>
    </div>
    <div class="w-px h-8 bg-white/8" />
    <div class="text-center">
      <span class="text-lg font-bold text-error font-mono">{wrongCount}</span>
      <p class="text-xs text-text-tertiary">Wrong</p>
    </div>
    <div class="w-px h-8 bg-white/8" />
    <div class="text-center">
      <span class="text-lg font-bold text-text-primary font-mono">{accuracy}%</span>
      <p class="text-xs text-text-tertiary">Accuracy</p>
    </div>
  </div>

  <!-- Action buttons -->
  <div class="flex flex-col gap-3 w-full max-w-[280px]">
    <button class="
      w-full py-3 rounded-pill
      bg-accent-400 text-text-inverse font-semibold text-sm
      hover:bg-accent-500 hover:shadow-glow-sm
      active:bg-accent-600 active:scale-[0.98]
      transition-all duration-150
    ">
      Play Again
    </button>
    <button class="
      w-full py-3 rounded-pill
      bg-transparent border border-white/10 text-text-primary font-semibold text-sm
      hover:border-white/20 hover:bg-bg-overlay
      transition-all duration-150
    ">
      Back to Games
    </button>
  </div>
</div>
```

---

## 11. Accessibility

- All game buttons: `role="button"`, keyboard-navigable, visible focus rings
- Expression images: descriptive `alt` text (hidden from player during gameplay, shown to screen readers: `alt="Expression image - select the matching emotion"`)
- Timer: `aria-live="polite"` for time announcements at 10s, 5s, 1s
- Camera: `aria-label="Camera viewfinder - show your expression"`
- Progress dots: `role="progressbar"` with `aria-valuenow` / `aria-valuemax`
- Certificate: all text is real text (not baked into image), so screen readers can access it
- Color feedback (green/red) always paired with icon (check/X) for color-blind users
