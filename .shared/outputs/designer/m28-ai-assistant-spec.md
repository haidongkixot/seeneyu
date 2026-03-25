# M28 — Learning & Practicing AI Assistant (Coach Ney): Design Spec
> Owner: Designer | Status: SPEC COMPLETE | Date: 2026-03-25

---

## 1. Overview

"Coach Ney" is a voice-enabled AI coaching assistant that appears as a floating button on lesson and arcade pages. It opens a chat panel where learners can ask questions about the current lesson/challenge, get coaching tips, or request voice-based interaction. The assistant is context-aware and knows what the learner is currently viewing.

---

## 2. Floating AssistantButton (`src/components/AssistantButton.tsx`)

### Position & Size

```
Fixed position: bottom-right corner
Classes: fixed bottom-6 right-6 z-toast
         md:bottom-8 md:right-8
Button size: w-14 h-14 (56px)
Shape: rounded-full
```

### Visual Design

**Default (idle) state**:
```
w-14 h-14 rounded-full
bg-accent-400 text-text-inverse
shadow-glow
flex items-center justify-center
hover:bg-accent-500 hover:shadow-[0_0_30px_rgba(251,191,36,0.35),0_0_80px_rgba(251,191,36,0.15)]
hover:scale-105
active:scale-95
transition-all duration-200
```

**Icon**: Lucide `MessageCircle` size={24} (chat icon in idle), switches to `X` size={24} when panel is open.

**Ambient glow ring** (always visible, subtle):
```
Pseudo-element or wrapper div:
absolute inset-0 rounded-full
bg-accent-400/15
animate-pulse (slow, 3s duration)
Scale slightly larger: scale-110
z-behind the button (-z-10 or separate layer)
```

Custom keyframe for slow pulse:
```js
// tailwind.config.ts addition
keyframes: {
  'glow-pulse': {
    '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
    '50%': { opacity: '0.15', transform: 'scale(1.15)' },
  },
},
animation: {
  'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
}
```

**Panel-open state** — button changes to close:
```
bg-bg-elevated border border-white/10 text-text-secondary
shadow-lg
No glow
Icon: X size={24}
```

### Accessibility

```
aria-label="Open Coach Ney assistant" (or "Close assistant" when open)
role="button"
tabIndex={0}
```

---

## 3. AssistantPanel (`src/components/AssistantPanel.tsx`)

### Mobile Layout (< lg): Slide-up Sheet

```
┌──────────────────────────────┐
│  ░░░░░░ (drag handle) ░░░░░ │
│                              │
│  🎓 Coach Ney               │
│  Your personal coach         │
│                              │
│  ┌──────────────────────┐   │
│  │ Chat messages scroll  │   │
│  │                       │   │
│  │ [Assistant bubble]    │   │
│  │         [User bubble] │   │
│  │ [Assistant bubble]    │   │
│  │                       │   │
│  │ [Suggestion chips]    │   │
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ 🎤 │ Type message... │[→]│
│  └──────────────────────┘   │
└──────────────────────────────┘
```

**Container**:
```
fixed inset-x-0 bottom-0 z-modal
h-[75vh] max-h-[600px]
bg-bg-surface border-t border-white/8 rounded-t-3xl
shadow-xl
flex flex-col
```

**Enter animation**: slide up from bottom
```
Keyframe: translate-y-full → translate-y-0, opacity 0 → 1
Duration: 300ms, easing: spring
Class: animate-slide-up (custom variant for panel height)
```

**Exit animation**: slide down
```
Duration: 200ms, easing: retract
translate-y-0 → translate-y-full
```

**Drag handle** (mobile):
```
w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2
```

### Desktop Layout (>= lg): Side Panel

```
┌──────────────────────┐
│  Coach Ney       [X] │
│  ─────────────────── │
│                      │
│  [Chat messages]     │
│                      │
│  [Suggestion chips]  │
│                      │
│  ┌──────────────┐    │
│  │🎤│ Message │[→]│   │
│  └──────────────┘    │
└──────────────────────┘
```

**Container**:
```
fixed right-6 bottom-24 z-modal
w-[380px] h-[560px]
bg-bg-surface border border-white/8 rounded-2xl
shadow-xl
flex flex-col
overflow-hidden
```

**Enter animation**: scale + fade from bottom-right
```
Keyframe: scale(0.9) opacity(0) translate-y-4 → scale(1) opacity(1) translate-y-0
Duration: 250ms, easing: spring
Transform-origin: bottom right
```

### Panel Header

```
flex items-center gap-3 px-4 py-3 border-b border-white/6
```

**Coach avatar**:
```
w-9 h-9 rounded-full bg-accent-400/20 border border-accent-400/30
flex items-center justify-center
```
Inner icon: Custom "N" letter or Lucide `GraduationCap` size={18} class="text-accent-400"

**Coach info** (flex-1):
```
Name: text-sm font-semibold text-text-primary → "Coach Ney"
Subtitle: text-xs text-text-tertiary → "Your personal communication coach"
```

**Close button** (desktop only, mobile uses drag-down):
```
p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors
Icon: X size={16}
```

### Chat Messages Area

```
flex-1 overflow-y-auto px-4 py-4 space-y-4
Scroll behavior: scroll-smooth
Scroll to bottom on new messages
```

**Assistant message bubble**:
```
┌─ Coach Ney ─────────────────────┐
│  Hi! I see you're working on    │
│  the "Eye Contact" lesson.      │
│  What would you like to         │
│  practice?                      │
└─────────────────────────────────┘
```

```
Container: flex gap-2.5 items-start
Avatar: w-7 h-7 rounded-full bg-accent-400/15 flex items-center justify-center flex-shrink-0
  Inner: GraduationCap size={14} class="text-accent-400"
Bubble: bg-bg-elevated border border-white/6 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]
  Text: text-sm text-text-primary leading-relaxed
  Name label above bubble: text-[10px] text-text-tertiary font-medium mb-1 → "Coach Ney"
```

**User message bubble**:
```
Container: flex justify-end
Bubble: bg-accent-400/15 border border-accent-400/20 rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]
  Text: text-sm text-text-primary leading-relaxed
```

**Timestamp** (shown every 5+ minutes gap or on hover):
```
text-center text-[10px] text-text-tertiary py-2
Content: "2:34 PM" or "Today at 2:34 PM"
```

### Welcome Message (first open, no history)

```
Assistant bubble with content:
"Hi there! I'm Coach Ney, your personal communication coach. 👋

I can see you're on the {lesson/challenge name}. Want me to:
• Explain the key techniques in this lesson
• Give you tips before you practice
• Review your recent performance

Just ask or tap a suggestion below!"
```

---

## 4. Quick-Reply Suggestion Chips

Appear below the latest assistant message.

### Layout

```
Container: flex flex-wrap gap-2 mt-3 ml-9 (aligned with bubble, past avatar)
```

### Chip Design

```
px-3 py-1.5 text-xs font-medium
bg-bg-inset border border-white/8 rounded-pill
text-text-secondary
hover:text-accent-400 hover:border-accent-400/30 hover:bg-accent-400/5
active:scale-95
transition-all duration-150
cursor-pointer
```

### Contextual Suggestions

On lesson pages:
- "Explain this technique"
- "Tips for practice"
- "Review my last attempt"
- "What should I focus on?"

On arcade pages:
- "How do I do this expression?"
- "Tips for this challenge"
- "What am I doing wrong?"

After feedback:
- "How can I improve?"
- "Show me an example"
- "Try another challenge"

---

## 5. Input Bar

### Layout

```
┌─────────────────────────────────────────┐
│  [🎤]  Type a message...          [→]   │
└─────────────────────────────────────────┘
```

```
Container: px-4 py-3 border-t border-white/6 bg-bg-surface
Inner: flex items-end gap-2
```

**Voice button** (left):
```
flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
transition-all duration-200

Idle: bg-bg-overlay text-text-secondary hover:text-text-primary hover:bg-bg-elevated
Recording: bg-error/20 text-error border border-error/30 animate-pulse
```
Icon: `Mic` size={16} (idle) or `MicOff` size={16} (recording, though keep Mic with red dot)

**Text input**:
```
flex-1 bg-bg-inset border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary
placeholder:text-text-tertiary
focus:outline-none focus:border-accent-400/40 transition-colors
min-h-[36px] max-h-[120px] resize-none
```
- Auto-grows as user types (textarea with auto-resize).
- Placeholder: "Type a message..."

**Send button** (right):
```
flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
transition-all duration-200

Empty input: bg-bg-overlay text-text-tertiary cursor-not-allowed
Has content: bg-accent-400 text-text-inverse hover:bg-accent-500 shadow-glow-sm
```
Icon: `Send` size={16}

---

## 6. Voice Recording States

### State Machine

```
[Idle] → tap mic → [Recording] → tap mic/auto-stop → [Processing] → response → [Playing] → done → [Idle]
```

### Recording State

When recording is active, the input bar transforms:

```
┌─────────────────────────────────────────┐
│  [●] ■■■■■■░░░░░░░░  0:05 / 0:30 [□]  │
└─────────────────────────────────────────┘
```

**Red recording dot**:
```
w-3 h-3 rounded-full bg-error animate-pulse
```

**Waveform visualization** (simplified bars):
```
flex items-center gap-0.5 flex-1 h-8 px-2
Each bar: w-1 rounded-full bg-accent-400
Heights animate randomly between h-1 and h-8 (CSS animation or JS)
~20 bars visible
```

Custom keyframe for waveform bars:
```js
keyframes: {
  'waveform': {
    '0%, 100%': { height: '4px' },
    '50%': { height: '24px' },
  },
}
```
Each bar gets a random animation-delay for natural effect.

**Timer**:
```
text-xs font-mono text-text-secondary tabular-nums
Format: "0:05 / 0:30" (current / max)
When < 5s remaining: text-warning
```

**Stop button** (replaces send):
```
w-9 h-9 rounded-full bg-error/20 text-error flex items-center justify-center
hover:bg-error/30
Icon: Square size={14} (stop icon)
```

**Cancel recording**: tap the red dot / mic button again to cancel without sending.

### Processing State

Input bar shows processing indicator:

```
┌─────────────────────────────────────────┐
│  Processing your message...    (···)    │
└─────────────────────────────────────────┘
```

```
Container: flex items-center justify-center gap-2 px-4 py-3
Text: text-sm text-text-secondary
Spinner: Loader2 size={16} class="animate-spin text-accent-400"
```

### Playing State (TTS Playback)

When assistant is speaking via TTS, show in the message bubble:

```
┌─ Coach Ney ─────────────────────┐
│  [▶ ■■■■░░░░░░░░ 0:03]         │
│                                  │
│  Great job on maintaining eye    │
│  contact! Here's what I noticed: │
│  ...                             │
└──────────────────────────────────┘
```

**Audio player bar** (inline, above text):
```
flex items-center gap-2 mb-2 p-2 bg-bg-inset rounded-lg
```

**Play/pause button**:
```
w-7 h-7 rounded-full bg-accent-400/20 text-accent-400 flex items-center justify-center
hover:bg-accent-400/30
Icon: Play size={12} or Pause size={12}
```

**Progress bar**:
```
flex-1 h-1 bg-white/10 rounded-full overflow-hidden
Inner (progress): h-full bg-accent-400 rounded-full transition-all
```

**Duration**:
```
text-[10px] font-mono text-text-tertiary tabular-nums
```

---

## 7. Coach Ney Persona Visual Identity

### Avatar

Used in: panel header, chat bubbles, idle nudge toast.

**Large (panel header)**:
```
w-9 h-9 rounded-full
bg-gradient-to-br from-accent-400/30 to-accent-600/20
border border-accent-400/30
flex items-center justify-center
```
Inner: `GraduationCap` size={18} class="text-accent-400"

**Small (chat bubbles)**:
```
w-7 h-7 rounded-full
bg-accent-400/15
flex items-center justify-center
```
Inner: `GraduationCap` size={14} class="text-accent-400"

### Name Badge

In chat messages, above assistant bubbles:
```
text-[10px] font-semibold text-accent-400/70 uppercase tracking-wider mb-1
Content: "COACH NEY"
```

Only shown on the first message in a consecutive assistant sequence (not repeated for every bubble).

---

## 8. Idle Nudge Toast

Appears after 60s of inactivity on a lesson/arcade page, and again at 120s with different text.

### Layout

```
┌────────────────────────────────────────┐
│  🎓  Need help with this lesson?  [×]  │
│      Tap to ask Coach Ney              │
└────────────────────────────────────────┘
```

### Position & Animation

```
Position: fixed bottom-24 right-6 z-toast (above the floating button)
         md:bottom-28 md:right-8
Width: w-72 md:w-80
```

**Enter animation**: slide-up + fade (from below the assistant button area)
```
animate-slide-up (existing token: 250ms spring)
```

**Auto-dismiss**: fades out after 8 seconds if not interacted with.
```
Exit: opacity transition from 1 → 0 over 500ms, then remove from DOM
```

### Design

```
Container:
  bg-bg-elevated/95 backdrop-blur-sm
  border border-accent-400/20
  rounded-2xl
  px-4 py-3
  shadow-glow-sm
  cursor-pointer
  hover:border-accent-400/40 hover:shadow-glow
  transition-all duration-200
```

**Inner layout**: `flex items-start gap-3`

**Coach mini-avatar**:
```
flex-shrink-0 w-8 h-8 rounded-full bg-accent-400/20 flex items-center justify-center
GraduationCap size={16} class="text-accent-400"
```

**Text area** (flex-1):
```
Title: text-sm font-medium text-text-primary
  60s nudge: "Need help with this lesson?"
  120s nudge: "I noticed you've been here a while. Want some tips?"
Subtitle: text-xs text-text-tertiary mt-0.5
  "Tap to ask Coach Ney"
```

**Dismiss button** (top-right):
```
absolute top-2 right-2
p-1 text-text-tertiary hover:text-text-secondary rounded transition-colors
Icon: X size={12}
```

Clicking anywhere on the toast (except dismiss) opens the AssistantPanel.

---

## 9. Plan-Based Limitations

### Message Limit Banner

When user is near their daily limit, show a subtle banner at the top of the chat area:

**Warning (approaching limit)**:
```
mx-4 mt-2 px-3 py-2 bg-warning/10 border border-warning/20 rounded-xl text-xs text-warning text-center
Content: "4 of 5 messages used today" (Basic plan)
```

**Limit reached**:
```
mx-4 mt-2 px-3 py-2 bg-error/10 border border-error/20 rounded-xl text-xs text-error text-center
Content: "Daily message limit reached. Upgrade for more."
Link: "Upgrade →" text-accent-400 hover:text-accent-300 font-medium
  href="/pricing"
```

### Voice-Only Lock (Basic plan)

Basic plan is text-only. Voice button shows lock state:

```
Mic button: opacity-40 cursor-not-allowed
Tooltip on hover: "Voice chat available on Standard plan and above"
```

Tooltip:
```
absolute bottom-full left-1/2 -translate-x-1/2 mb-2
bg-bg-elevated border border-white/8 rounded-lg px-3 py-1.5 text-xs text-text-secondary
shadow-md whitespace-nowrap
```

---

## 10. Streaming Response Indicator

While the assistant is generating a streaming response, show a typing indicator in the chat:

```
┌─ Coach Ney ─────────┐
│  ● ● ●               │
└──────────────────────┘
```

**Typing dots**:
```
flex items-center gap-1.5 px-4 py-3
Each dot: w-2 h-2 rounded-full bg-text-tertiary
Animation: sequential bounce with staggered delays
```

Custom keyframe:
```js
keyframes: {
  'bounce-dot': {
    '0%, 80%, 100%': { transform: 'translateY(0)' },
    '40%': { transform: 'translateY(-6px)' },
  },
}
```
- Dot 1: delay 0ms
- Dot 2: delay 150ms
- Dot 3: delay 300ms
- Animation duration: 1.4s infinite

Once text starts streaming, replace dots with actual text appearing character by character (or chunk by chunk as tokens arrive).

---

## 11. Responsive Breakpoints Summary

| Element | Mobile (< lg) | Desktop (>= lg) |
|---------|---------------|-----------------|
| AssistantButton | bottom-6 right-6, w-14 h-14 | bottom-8 right-8, same size |
| AssistantPanel | Full-width sheet, h-[75vh], rounded-t-3xl | Fixed side panel, w-[380px] h-[560px], rounded-2xl |
| Panel open | Slide up from bottom | Scale + fade from bottom-right |
| Drag handle | Visible | Hidden |
| Close button | Drag down or swipe (handle hint) | X button in header |
| Idle nudge toast | bottom-24 right-6, w-72 | bottom-28 right-8, w-80 |

---

## 12. Z-Index Layering

```
AssistantButton:   z-toast (80) — sits above page content, below modals
AssistantPanel:    z-modal (50) — panel itself
Panel backdrop:    z-[49] (mobile only) — semi-transparent overlay behind sheet
Idle nudge toast:  z-toast (80) — same level as button
```

Mobile backdrop (behind sheet, above page):
```
fixed inset-0 bg-black/40 z-[49]
Tap to close panel
```

---

## 13. Lucide Icons Used

| Icon | Import | Usage |
|------|--------|-------|
| `MessageCircle` | `lucide-react` | Floating button (idle) |
| `X` | `lucide-react` | Close button, dismiss nudge, floating button (open state) |
| `GraduationCap` | `lucide-react` | Coach Ney avatar |
| `Mic` | `lucide-react` | Voice recording button |
| `Send` | `lucide-react` | Send message button |
| `Square` | `lucide-react` | Stop recording button |
| `Play` | `lucide-react` | TTS play button |
| `Pause` | `lucide-react` | TTS pause button |
| `Loader2` | `lucide-react` | Processing spinner |
| `Lock` | `lucide-react` | Voice lock (basic plan) |

---

## 14. New Tailwind Config Additions

Add to `tailwind.config.ts` `keyframes` and `animation`:

```js
keyframes: {
  // ... existing keyframes
  'glow-pulse': {
    '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
    '50%': { opacity: '0.15', transform: 'scale(1.15)' },
  },
  'bounce-dot': {
    '0%, 80%, 100%': { transform: 'translateY(0)' },
    '40%': { transform: 'translateY(-6px)' },
  },
  'waveform-bar': {
    '0%, 100%': { height: '4px' },
    '50%': { height: '20px' },
  },
  'panel-up': {
    '0%': { transform: 'translateY(100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  'panel-scale': {
    '0%': { transform: 'scale(0.9) translateY(16px)', opacity: '0' },
    '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
  },
},
animation: {
  // ... existing animations
  'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
  'bounce-dot': 'bounce-dot 1.4s ease-in-out infinite',
  'waveform-bar': 'waveform-bar 0.8s ease-in-out infinite',
  'panel-up': 'panel-up 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  'panel-scale': 'panel-scale 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
},
```
