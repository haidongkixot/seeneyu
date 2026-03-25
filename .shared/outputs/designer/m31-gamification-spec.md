# M31 — Gamification System: Design Spec
> Owner: Designer | Status: SPEC COMPLETE | Date: 2026-03-25

---

## 1. Overview

Full gamification layer: XP progression, streaks, hearts (lives), levels, daily quests, badges, celebration animations, combo counter, and Coach Ney mascot placements. All elements integrate into the existing dark UI with amber accent.

---

## 2. XP Bar (`XPBar`)

Thin amber progress bar pinned directly below the NavBar. Visible on all authenticated pages.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  NavBar                                             │
├─────────────────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░  +25 XP ↑     │  ← XP bar (3px tall)
├─────────────────────────────────────────────────────┤
│  Page content                                       │
```

### Implementation

```
<div class="
  w-full h-[3px]
  bg-bg-inset
  sticky top-[var(--nav-height)] z-raised
">
  <div
    class="
      h-full
      bg-gradient-to-r from-accent-400 to-accent-500
      transition-all duration-500 ease-smooth
    "
    style="width: {xpPercent}%"
  />
</div>
```

`--nav-height`: 56px mobile, 64px desktop (from NavBar).

### "+XP" Float Text

When XP is gained, a floating text animates up and fades out from the right end of the bar.

```
<span class="
  absolute right-4 bottom-2
  text-xs font-bold text-accent-400
  animate-[xp-float_1200ms_ease-out_forwards]
  pointer-events-none
  whitespace-nowrap
">
  +{amount} XP
</span>
```

Keyframe `xp-float`:
```
0%:   opacity: 1, translateY(0)
60%:  opacity: 1, translateY(-20px)
100%: opacity: 0, translateY(-32px)
```

---

## 3. Streak Flame (`StreakFlame`)

Flame icon in the NavBar that grows and animates based on streak length.

### NavBar Placement

```
NavBar right section:  [...other icons] [StreakFlame] [HeartCounter] [UserAvatar+LevelBadge]
```

### Size Tiers

| Streak | Tier | Icon Size | Color | Animation |
|---|---|---|---|---|
| 1-6 days | Small | 18px | `text-accent-400/70` | None (static) |
| 7-13 days | Medium | 22px | `text-accent-400` | Gentle flicker (`animate-[flame-flicker_2s_ease-in-out_infinite]`) |
| 14-29 days | Large | 26px | `text-accent-300` | Active flicker + glow (`shadow-glow-sm`) |
| 30+ days | Blazing | 28px | `text-accent-200` | Fast flicker + particle burst + stronger glow |

### Component

```
<div class="relative flex items-center gap-1 cursor-default" title="{streak}-day streak">
  <!-- Flame icon -->
  <Flame
    size={flameSize}
    class="
      ${tier === 'small'   ? 'text-accent-400/70' : ''}
      ${tier === 'medium'  ? 'text-accent-400 animate-[flame-flicker_2s_ease-in-out_infinite]' : ''}
      ${tier === 'large'   ? 'text-accent-300 animate-[flame-flicker_1.5s_ease-in-out_infinite] drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]' : ''}
      ${tier === 'blazing' ? 'text-accent-200 animate-[flame-flicker_0.8s_ease-in-out_infinite] drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]' : ''}
    "
  />

  <!-- Streak count -->
  <span class="text-xs font-bold text-accent-400 font-mono">{streak}</span>

  <!-- Blazing particles (30+ only) -->
  ${tier === 'blazing' && (
    <div class="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none">
      {[0,1,2].map(i => (
        <div
          class="
            absolute w-1 h-1 rounded-full bg-accent-300
            animate-[confetti-fall_1.5s_ease-in_infinite]
          "
          style="animation-delay: {i * 0.5}s; left: {(i - 1) * 6}px"
        />
      ))}
    </div>
  )}
</div>
```

### Zero Streak State

```
<Flame size={18} class="text-text-tertiary" />
<span class="text-xs text-text-tertiary font-mono">0</span>
```

---

## 4. Heart Counter (`HeartCounter`)

Row of heart icons in the NavBar representing remaining lives.

### Layout

```
<div class="flex items-center gap-0.5">
  {hearts.map((heart, i) => (
    <Heart
      size={16}
      class="
        transition-all duration-200
        ${heart === 'full'
          ? 'text-error fill-error'
          : 'text-text-tertiary fill-none'
        }
        ${heart === 'losing'
          ? 'animate-[heart-pulse_400ms_ease-out] text-error fill-error'
          : ''
        }
      "
    />
  ))}
</div>
```

### States

| State | Appearance |
|---|---|
| Full heart | `text-error fill-error` (red, filled) |
| Empty heart | `text-text-tertiary fill-none` (gray outline) |
| Losing animation | Heart briefly scales up + turns red, then transitions to empty |
| All empty | All gray outlines + subtle pulse on container to warn |

### Heart Losing Animation

When a heart is lost, it plays `heart-pulse` then transitions to empty:

```
heart-pulse keyframe:
  0%:   scale(1), opacity(1)
  30%:  scale(1.4), opacity(1)
  60%:  scale(0.8), opacity(0.5)
  100%: scale(1), opacity(0.3)
```

After animation completes (400ms), heart state changes to `empty`.

### Tooltip

```
On hover: tooltip shows "{remaining}/{max} lives remaining"
Tooltip classes: bg-bg-elevated border border-white/10 rounded-md px-3 py-1.5 text-xs text-text-secondary shadow-lg z-tooltip
```

---

## 5. Level Badge (`LevelBadge`)

Circular badge overlaid on the user avatar in the NavBar.

### Layout

```
<div class="relative">
  <!-- User avatar -->
  <div class="w-8 h-8 rounded-full overflow-hidden bg-bg-elevated">
    <img class="w-full h-full object-cover" src={avatarUrl} />
  </div>

  <!-- Level badge (bottom-right overlap) -->
  <div class="
    absolute -bottom-1 -right-1
    w-5 h-5 rounded-full
    bg-bg-surface border-2 border-accent-400
    flex items-center justify-center
    z-raised
  ">
    <span class="text-[10px] font-bold text-accent-400 leading-none">{level}</span>
  </div>

  <!-- Progress ring (SVG, behind badge) -->
  <svg class="absolute inset-0 w-8 h-8 -rotate-90" viewBox="0 0 36 36">
    <circle
      cx="18" cy="18" r="16"
      fill="none"
      stroke="rgba(255,255,255,0.06)"
      stroke-width="2"
    />
    <circle
      cx="18" cy="18" r="16"
      fill="none"
      stroke="#fbbf24"
      stroke-width="2"
      stroke-linecap="round"
      stroke-dasharray={2 * Math.PI * 16}
      stroke-dashoffset={2 * Math.PI * 16 * (1 - xpProgress)}
      class="transition-all duration-500 ease-smooth"
    />
  </svg>
</div>
```

---

## 6. Daily Quest Cards (`DailyQuestCard`)

Displayed on the dashboard or a dedicated `/quests` page.

### Quest List Container

```
<div class="space-y-3">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-bold text-text-primary">Daily Quests</h2>
    <span class="text-xs text-text-tertiary">Resets in {timeUntilReset}</span>
  </div>
  {quests.map(quest => <DailyQuestCard quest={quest} />)}
</div>
```

### Quest Card

```
<div class="
  bg-bg-surface border border-white/8 rounded-2xl
  p-4
  ${quest.complete ? 'border-success/20' : ''}
  transition-all duration-200
">
  <div class="flex items-start gap-3">
    <!-- Quest icon -->
    <div class="
      w-10 h-10 rounded-xl flex-shrink-0
      flex items-center justify-center
      ${quest.complete
        ? 'bg-success/10'
        : 'bg-bg-elevated'
      }
    ">
      ${quest.complete
        ? <Check size={20} class="text-success" />
        : <quest.icon size={20} class="text-text-secondary" />
      }
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <!-- Title + XP reward -->
      <div class="flex items-center justify-between mb-1">
        <h4 class="
          text-sm font-semibold
          ${quest.complete ? 'text-text-secondary line-through' : 'text-text-primary'}
        ">
          {quest.title}
        </h4>

        <!-- XP chip -->
        <span class="
          px-2 py-0.5 rounded-pill text-xs font-bold
          ${quest.complete
            ? 'bg-success/10 text-success'
            : 'bg-accent-400/10 text-accent-400'
          }
        ">
          +{quest.xpReward} XP
        </span>
      </div>

      <!-- Description -->
      <p class="text-xs text-text-tertiary mb-2">{quest.description}</p>

      <!-- Progress bar -->
      <div class="flex items-center gap-2">
        <div class="flex-1 h-1.5 bg-bg-inset rounded-pill overflow-hidden">
          <div
            class="
              h-full rounded-pill
              ${quest.complete ? 'bg-success' : 'bg-accent-400'}
              transition-all duration-300
            "
            style="width: {quest.progressPercent}%"
          />
        </div>
        <span class="text-xs font-mono text-text-tertiary flex-shrink-0">
          {quest.current}/{quest.target}
        </span>
      </div>
    </div>
  </div>
</div>
```

---

## 7. Badge Designs

Emoji-based badge system with category colors. Each badge shows an emoji, name, and description.

### Category Colors

| Category | Accent Color | BG | Text | Border | Glow Shadow |
|---|---|---|---|---|---|
| Consistency | Amber | `bg-accent-400/10` | `text-accent-400` | `border-accent-400/30` | `shadow-glow-sm` |
| Mastery | Purple | `bg-[#7c3aed]/10` | `text-[#c4b5fd]` | `border-[#7c3aed]/30` | `shadow-glow-violet` |
| Social | Cyan | `bg-[#0891b2]/10` | `text-[#67e8f9]` | `border-[#0891b2]/30` | `shadow-glow-cyan` |
| Volume | Emerald | `bg-[#059669]/10` | `text-[#6ee7b7]` | `border-[#059669]/30` | `shadow-glow-green` |
| Special | Rose | `bg-[#e11d48]/10` | `text-[#fda4af]` | `border-[#e11d48]/30` | `shadow-glow-red` |

### Badge Card — Earned State

```
<div class="
  bg-bg-surface border rounded-2xl p-4
  text-center
  ${categoryBorder}
  ${categoryGlow}
  transition-all duration-200
  hover:scale-[1.02]
">
  <!-- Emoji -->
  <div class="text-4xl mb-2">{badge.emoji}</div>

  <!-- Name -->
  <h4 class="text-sm font-semibold text-text-primary mb-1">{badge.name}</h4>

  <!-- Description -->
  <p class="text-xs text-text-tertiary leading-relaxed">{badge.description}</p>

  <!-- Earned date -->
  <p class="text-xs ${categoryText} mt-2 font-medium">Earned {formattedDate}</p>
</div>
```

### Badge Card — Locked State

```
<div class="
  bg-bg-surface border border-white/6 rounded-2xl p-4
  text-center
  opacity-50
  grayscale
  relative
">
  <!-- Emoji (grayscale via parent) -->
  <div class="text-4xl mb-2">{badge.emoji}</div>

  <!-- Name -->
  <h4 class="text-sm font-semibold text-text-tertiary mb-1">{badge.name}</h4>

  <!-- Description (hidden or teaser) -->
  <p class="text-xs text-text-tertiary leading-relaxed">{badge.hint || '???'}</p>

  <!-- Lock icon overlay -->
  <div class="absolute top-3 right-3">
    <Lock size={14} class="text-text-tertiary" />
  </div>
</div>
```

### Badge Grid

```
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3
```

---

## 8. Celebration Animations

### 8a. Level Up — Full-Screen Modal

```
<div class="
  fixed inset-0 z-modal
  bg-black/70 backdrop-blur-sm
  flex items-center justify-center
  animate-fade-in
">
  <div class="
    bg-bg-elevated border border-accent-400/20 rounded-3xl
    p-8 max-w-sm mx-4
    text-center
    shadow-glow
    animate-[bounce-in_500ms_cubic-bezier(0.34,1.56,0.64,1)]
  ">
    <!-- Confetti particles (absolute, overflow hidden on parent) -->
    <div class="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
      {confettiParticles.map((p, i) => (
        <div
          class="
            absolute w-2 h-2 rounded-sm
            animate-[confetti-fall_2s_ease-in_forwards]
          "
          style="
            left: {p.x}%;
            background: {p.color};
            animation-delay: {p.delay}s;
            transform: rotate({p.rotation}deg);
          "
        />
      ))}
    </div>

    <!-- Level number -->
    <div class="
      w-24 h-24 rounded-full mx-auto mb-4
      bg-accent-400/10 border-2 border-accent-400
      flex items-center justify-center
      shadow-glow
    ">
      <span class="text-4xl font-bold text-accent-400 font-mono">{newLevel}</span>
    </div>

    <!-- Text -->
    <h2 class="text-2xl font-bold text-text-primary mb-1 animate-[bounce-in_600ms_cubic-bezier(0.34,1.56,0.64,1)_200ms_both]">
      LEVEL UP!
    </h2>
    <p class="text-sm text-text-secondary mb-6">
      You've reached Level {newLevel}
    </p>

    <!-- Dismiss -->
    <button class="
      bg-accent-400 text-text-inverse rounded-pill
      px-6 py-3 font-semibold text-sm
      hover:bg-accent-500 hover:shadow-glow-sm
      transition-all duration-150
    ">
      Continue
    </button>
  </div>
</div>
```

Confetti colors: `['#fbbf24', '#f59e0b', '#fcd34d', '#c4b5fd', '#67e8f9', '#6ee7b7', '#fca5a5']`

### 8b. Badge Earned — Slide-In Card

```
<div class="
  fixed bottom-6 left-1/2 -translate-x-1/2
  z-toast
  animate-[badge-reveal_500ms_cubic-bezier(0.34,1.56,0.64,1)]
">
  <div class="
    bg-bg-elevated border ${categoryBorder} rounded-2xl
    px-5 py-4
    shadow-xl ${categoryGlow}
    flex items-center gap-4
    max-w-sm
  ">
    <!-- Badge emoji -->
    <div class="text-3xl flex-shrink-0">{badge.emoji}</div>

    <!-- Text -->
    <div>
      <p class="text-xs font-medium ${categoryText} mb-0.5">Badge Earned!</p>
      <h4 class="text-sm font-semibold text-text-primary">{badge.name}</h4>
      <p class="text-xs text-text-tertiary">{badge.description}</p>
    </div>

    <!-- Dismiss -->
    <button class="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary flex-shrink-0">
      <X size={14} />
    </button>
  </div>
</div>
```

Auto-dismisses after 4 seconds with fade-out.

### 8c. Streak Milestone — Toast

```
<div class="
  fixed top-20 left-1/2 -translate-x-1/2
  z-toast
  bg-bg-elevated border border-accent-400/20 rounded-2xl
  px-5 py-3
  shadow-glow
  flex items-center gap-3
  animate-[bounce-in_400ms_cubic-bezier(0.34,1.56,0.64,1)]
">
  <Flame size={24} class="text-accent-400 animate-[flame-flicker_0.8s_ease-in-out_infinite]" />
  <div>
    <p class="text-sm font-bold text-accent-400">{streak}-day streak!</p>
    <p class="text-xs text-text-secondary">Keep the fire burning!</p>
  </div>
</div>
```

Accompanied by amber particle burst around the streak flame icon in the NavBar (uses `star-burst` keyframe with amber particles).

### 8d. Perfect Score — Star Burst

```
<div class="
  fixed inset-0 z-overlay
  pointer-events-none
  flex items-center justify-center
">
  <!-- Central burst -->
  {[...Array(12)].map((_, i) => (
    <div
      class="
        absolute w-3 h-3
        bg-accent-300 rounded-full
        animate-[star-burst_800ms_ease-out_forwards]
      "
      style="
        transform: rotate(${i * 30}deg);
        animation-delay: ${i * 30}ms;
      "
    />
  ))}

  <!-- Gold particles (smaller, more) -->
  {[...Array(20)].map((_, i) => (
    <div
      class="
        absolute w-1.5 h-1.5
        bg-accent-400 rounded-full
        animate-[star-burst_1000ms_ease-out_forwards]
        opacity-80
      "
      style="
        transform: rotate(${i * 18}deg);
        animation-delay: ${50 + i * 25}ms;
      "
    />
  ))}
</div>
```

### 8e. Quest Complete — Check + XP Float

```
<!-- Inline on quest card -->
<div class="relative">
  <!-- Checkmark animation -->
  <div class="
    animate-[bounce-in_400ms_cubic-bezier(0.34,1.56,0.64,1)]
  ">
    <Check size={20} class="text-success" />
  </div>

  <!-- XP float -->
  <span class="
    absolute -top-2 -right-4
    text-xs font-bold text-accent-400
    animate-[xp-float_1200ms_ease-out_forwards]
    pointer-events-none
  ">
    +{xpReward} XP
  </span>
</div>
```

---

## 9. Combo Counter (`ComboCounter`)

Floating counter in the top-right during gameplay. Shows current combo multiplier.

### Layout

```
<div class="
  fixed top-20 right-4
  z-overlay
  pointer-events-none
  transition-all duration-200
">
  <div class="
    relative
    px-3 py-1.5 rounded-xl
    bg-bg-elevated/90 backdrop-blur-sm
    border
    text-center
    ${comboTier === 'normal'  ? 'border-accent-400/30'     : ''}
    ${comboTier === 'hot'     ? 'border-accent-300/50 shadow-glow-sm' : ''}
    ${comboTier === 'blazing' ? 'border-accent-200/60 shadow-glow animate-[combo-glow_1s_ease-in-out_infinite]' : ''}
  ">
    <span class="
      text-2xl font-bold font-mono
      ${comboTier === 'normal'  ? 'text-accent-400'  : ''}
      ${comboTier === 'hot'     ? 'text-accent-300'  : ''}
      ${comboTier === 'blazing' ? 'text-accent-100'  : ''}
    ">
      {combo}x
    </span>
    <p class="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Combo</p>
  </div>
</div>
```

### Combo Tiers

| Combo | Tier | Text Color | Border | Effect |
|---|---|---|---|---|
| 2-4x | Normal | `text-accent-400` (#fbbf24) | `border-accent-400/30` | None |
| 5-9x | Hot | `text-accent-300` (#fcd34d) | `border-accent-300/50` | `shadow-glow-sm` |
| 10x+ | Blazing | `text-accent-100` (#fef3c7) | `border-accent-200/60` | `shadow-glow` + `combo-glow` animation |

### Combo Break

When combo resets to 0, the counter plays a shake + fade-out:
```
animate-[shake_300ms_ease-out] then opacity-0 after 500ms
```

---

## 10. Coach Ney Mascot Placements

Coach Ney (the AI assistant from M28) appears as a small avatar in specific contexts.

### Avatar Component (`CoachNeyAvatar`)

```
<div class="
  w-8 h-8 md:w-10 md:h-10
  rounded-full
  bg-accent-400/10 border border-accent-400/30
  flex items-center justify-center
  flex-shrink-0
">
  <Bot size={18} class="text-accent-400" />
  <!-- Or use a custom mascot image when available -->
</div>
```

### Placement: Empty States

When a page has no content (e.g., empty quiz history, no badges earned):

```
<div class="py-12 text-center">
  <CoachNeyAvatar class="mx-auto mb-4 w-12 h-12" />
  <div class="
    bg-bg-surface border border-white/8 rounded-2xl
    px-5 py-4 max-w-sm mx-auto
    relative
  ">
    <!-- Speech bubble tail -->
    <div class="
      absolute -top-2 left-1/2 -translate-x-1/2
      w-4 h-4 bg-bg-surface border-t border-l border-white/8
      transform rotate-45
    " />
    <p class="text-sm text-text-secondary">{encouragementMessage}</p>
  </div>
</div>
```

### Placement: Quiz Encouragements

Small inline avatar with speech bubble during quiz flow:

```
<div class="flex items-start gap-3 mt-4">
  <CoachNeyAvatar />
  <div class="
    bg-bg-surface border border-white/8 rounded-2xl rounded-tl-md
    px-4 py-3
    max-w-[280px]
  ">
    <p class="text-sm text-text-secondary">{message}</p>
  </div>
</div>
```

Messages rotate contextually:
- After wrong answer: "Don't worry, that's a tricky one! Try the next one."
- After correct streak: "You're on fire! Keep going!"
- Low hearts: "Careful, you're running low on lives!"

### Placement: Error Pages

```
<div class="flex flex-col items-center justify-center min-h-[400px] px-4">
  <CoachNeyAvatar class="w-16 h-16 mb-4" />
  <h2 class="text-xl font-bold text-text-primary mb-2">Oops!</h2>
  <p class="text-sm text-text-secondary text-center max-w-sm mb-6">{errorMessage}</p>
  <button class="bg-accent-400 text-text-inverse rounded-pill px-5 py-2.5 font-semibold text-sm ...">
    Go Back
  </button>
</div>
```

### Placement: Celebration Modals

In level-up and badge-earned celebrations, small Coach Ney avatar appears beside the congratulatory text:

```
<div class="flex items-center gap-2 justify-center mt-2">
  <CoachNeyAvatar class="w-6 h-6" />
  <p class="text-xs text-text-secondary italic">"Amazing progress!"</p>
</div>
```

---

## 11. New Tailwind Keyframes Spec

All new keyframes to add to `tailwind.config.ts` under `theme.extend.keyframes`:

```js
keyframes: {
  // ── Existing (keep all current keyframes) ──────────────────────────

  // ── NEW: M31 Gamification ──────────────────────────────────────────

  // Confetti particles falling from top
  'confetti-fall': {
    '0%':   { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
    '100%': { transform: 'translateY(300px) rotate(720deg)', opacity: '0' },
  },

  // Star/particle burst outward from center
  'star-burst': {
    '0%':   { transform: 'translateX(0) scale(1)', opacity: '1' },
    '100%': { transform: 'translateX(80px) scale(0)', opacity: '0' },
  },

  // Bouncy scale-in for modals, icons, badges
  'bounce-in': {
    '0%':   { transform: 'scale(0)', opacity: '0' },
    '50%':  { transform: 'scale(1.15)' },
    '70%':  { transform: 'scale(0.95)' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },

  // Flame icon subtle flicker
  'flame-flicker': {
    '0%, 100%': { transform: 'scaleY(1) scaleX(1)', opacity: '1' },
    '25%':      { transform: 'scaleY(1.08) scaleX(0.96)', opacity: '0.9' },
    '50%':      { transform: 'scaleY(0.95) scaleX(1.04)', opacity: '1' },
    '75%':      { transform: 'scaleY(1.05) scaleX(0.98)', opacity: '0.85' },
  },

  // XP gain float upward and fade
  'xp-float': {
    '0%':   { transform: 'translateY(0)', opacity: '1' },
    '60%':  { transform: 'translateY(-20px)', opacity: '1' },
    '100%': { transform: 'translateY(-32px)', opacity: '0' },
  },

  // Heart losing pulse
  'heart-pulse': {
    '0%':   { transform: 'scale(1)', opacity: '1' },
    '30%':  { transform: 'scale(1.4)', opacity: '1' },
    '60%':  { transform: 'scale(0.8)', opacity: '0.5' },
    '100%': { transform: 'scale(1)', opacity: '0.3' },
  },

  // Combo counter glow pulse (blazing tier)
  'combo-glow': {
    '0%, 100%': { boxShadow: '0 0 20px rgba(251,191,36,0.25), 0 0 60px rgba(251,191,36,0.10)' },
    '50%':      { boxShadow: '0 0 30px rgba(251,191,36,0.40), 0 0 80px rgba(251,191,36,0.20)' },
  },

  // Badge card slide up from bottom with bounce
  'badge-reveal': {
    '0%':   { transform: 'translateX(-50%) translateY(100%)', opacity: '0' },
    '60%':  { transform: 'translateX(-50%) translateY(-8px)', opacity: '1' },
    '100%': { transform: 'translateX(-50%) translateY(0)', opacity: '1' },
  },
},
```

### Corresponding Animation Utilities

Add to `theme.extend.animation`:

```js
animation: {
  // ── Existing (keep all current) ──────────────────────────────────

  // ── NEW: M31 ─────────────────────────────────────────────────────
  'confetti-fall':  'confetti-fall 2s ease-in forwards',
  'star-burst':     'star-burst 800ms ease-out forwards',
  'bounce-in':      'bounce-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  'flame-flicker':  'flame-flicker 2s ease-in-out infinite',
  'xp-float':       'xp-float 1200ms ease-out forwards',
  'heart-pulse':    'heart-pulse 400ms ease-out',
  'combo-glow':     'combo-glow 1s ease-in-out infinite',
  'badge-reveal':   'badge-reveal 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
},
```

---

## 12. Responsive Behavior

| Element | Mobile (< md) | Tablet (md) | Desktop (lg+) |
|---|---|---|---|
| XP Bar | h-[2px], no text | h-[3px] | h-[3px] |
| Streak Flame | size -2px per tier | Standard sizes | Standard sizes |
| Heart Counter | 3 hearts max visible, "+N" overflow | Full row | Full row |
| Level Badge | w-4 h-4 badge | w-5 h-5 badge | w-5 h-5 badge |
| Daily Quests | Full-width cards | 2-col grid | 2-col grid, max-w-3xl |
| Badge Grid | 2-col | 3-col | 4-col |
| Combo Counter | top-16 right-3, text-xl | Standard | Standard |
| Celebration Modals | Nearly full-width (mx-4) | max-w-sm centered | max-w-sm centered |

---

## 13. Accessibility

- XP bar: `role="progressbar"` + `aria-valuenow` + `aria-valuemax` + `aria-label="Experience points progress"`
- Streak flame: `aria-label="{N}-day streak"` on container
- Heart counter: `aria-label="{N} of {max} lives remaining"` on container
- Level badge: `aria-label="Level {N}, {percent}% to next level"`
- Daily quests: Each quest card has `role="article"`, progress bar has `role="progressbar"`
- Badges: Locked badges have `aria-label="{name} badge - locked"`
- Celebration modals: `role="dialog"` + `aria-modal="true"` + focus trap, dismiss with Escape
- All animations respect `prefers-reduced-motion`: wrap in `motion-safe:animate-*` or check media query and disable animations
- Combo counter: `aria-live="polite"` for screen reader updates on combo changes
