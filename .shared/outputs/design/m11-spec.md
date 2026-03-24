# M11 UI Specs — Observation Guide
> Owner: Designer
> Milestone: M11
> Delivered: 2026-03-23
> Status: READY FOR IMPLEMENTATION

---

## Overview

An "Observation Guide" tab added to the clip detail page. Before a learner clicks Record, they can switch to "How It Works" to see a coach-style breakdown of the technique moments in the clip — timestamps, what the character does, and why it works. Tone: film study with a sports coach. Educational, direct, confident.

---

## Component: ObservationTabBar

**Purpose**: Tab switcher on the clip detail page, positioned directly below the YouTube embed. Replaces (or wraps) the existing scene description area.

**Tabs**:
- `Watch` — current default tab (existing content: scene description + annotations)
- `How It Works` — new tab (ObservationGuide content)

**Props**:
```ts
interface ObservationTabBarProps {
  activeTab: 'watch' | 'how-it-works'
  onTabChange: (tab: 'watch' | 'how-it-works') => void
}
```

**Tailwind Classes**:
```
tab bar container: "flex items-center gap-1 border-b border-white/8 mb-5"
tab button base:   "px-4 py-2.5 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px"
tab inactive:      "border-transparent text-text-secondary hover:text-text-primary"
tab active:        "border-accent-400 text-accent-400"
```

**Responsive**: tabs full-width on mobile (each tab flex-1), auto-width on desktop.

**ASCII Mockup**:
```
┌─────────────────────────────────────────────────────────┐
│  Watch  │  How It Works ★                               │
│─────────────────────────────────────────────────────────│
│  [tab content below]                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Component: ObservationGuide

**Purpose**: The "How It Works" tab content. A vertical timeline of technique moments from the clip, AI-generated per clip and stored in the DB.

**Placement**: Replaces the scene description area when "How It Works" tab is active.

**Layout**: Vertical stack — headline → timeline items → CTA.

**Props**:
```ts
interface TechniqueEntry {
  atSecond: number        // e.g. 3  → displayed as "0:03"
  technique: string       // e.g. "Direct Eye Contact"
  what: string            // e.g. "Holds gaze for 4 seconds without breaking"
  why: string             // e.g. "Signals absolute confidence — the listener feels fully seen"
}

interface ObservationGuideProps {
  characterName: string
  techniqueEntries: TechniqueEntry[]
  clipId: string           // for the CTA link → /library/[clipId]/record
}
```

**States**:
- `default`: rendered with entries
- `loading`: skeleton (3 timeline row placeholders)
- `empty`: graceful null state — "Observation guide coming soon for this clip." with practice CTA still shown

**Layout**:
```
1. Headline section
2. Timeline (vertical list of entries)
3. Divider
4. "Ready to practise?" CTA
```

**Tailwind Classes**:
```
outer:          "flex flex-col gap-5"

headline:       "text-base font-semibold text-text-primary"
  e.g. "What Jordan Belfort does — and why it works"

timeline:       "relative flex flex-col gap-0"
  left guide line: "absolute left-[31px] top-4 bottom-4 w-px bg-white/8"

entry row:      "relative flex items-start gap-4"
timestamp badge:"flex-shrink-0 w-[63px] h-7 rounded-pill bg-bg-elevated border border-white/10
                 flex items-center justify-center text-xs font-mono text-text-secondary"
dot:            "absolute left-[27px] top-3.5 w-2 h-2 rounded-full bg-accent-400 ring-2
                 ring-bg-base flex-shrink-0 z-raised"
content block:  "flex-1 pb-5"
technique name: "text-sm font-semibold text-text-primary mb-0.5"
what text:      "text-sm text-text-secondary leading-relaxed"
why text:       "text-xs text-text-tertiary mt-1 leading-relaxed italic"

divider:        "border-t border-white/8"

CTA section:    "flex items-center justify-between"
cta label:      "text-sm text-text-secondary"  e.g. "Ready to practise this yourself?"
cta button:     "inline-flex items-center gap-2 bg-accent-400 text-text-inverse rounded-pill
                 px-5 py-2.5 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm
                 transition-all duration-150"
  cta text: "Start Recording"
  cta icon: <ChevronRight size={15} />
```

**Responsive**:
- Mobile: full-width stack, timestamp badge 56px wide
- Desktop: same layout, contained within clip detail max-width

**ASCII Mockup**:
```
What Jordan Belfort does — and why it works

  ──────────────────────────────────────────────────────
  [0:03]  ●  Direct Eye Contact
              Holds an unbroken gaze for 4 seconds
              Signals absolute confidence — the listener feels fully seen.

  [0:09]  ●  Forward Lean
              Tilts torso 10° forward while speaking
              Closes the physical gap — creates intimacy and urgency.

  [0:14]  ●  Controlled Hand Gesture
              One deliberate open-palm motion at the end of a sentence
              Reinforces the point without distracting from the words.

  ──────────────────────────────────────────────────────
  Ready to practise this yourself?         [Start Recording →]
```

**Motion**:
- Tab switch: content fade-in 200ms smooth
- Timeline entries: stagger fade-in-up on first render (50ms delay each), same pattern as ActionPlan
- CTA: no animation (static)

**Accessibility**:
- Tab buttons: `role="tab"`, `aria-selected`, `tabindex`
- Tab panels: `role="tabpanel"`, `aria-labelledby`
- Timeline: `role="list"` / `role="listitem"`, `aria-label="Technique timeline"`
- Timestamp badge: `aria-label="at 3 seconds"` (screen reader-friendly)

---

## Admin CMS: Observation Guide Editor

**Note for Backend Engineer**: The `TechniqueEntry` data comes from an AI-generation route (`POST /api/admin/clips/[id]/generate-guide`). The admin CMS clip edit page should show a "Generate Observation Guide" button that calls this route and populates the entries. The Designer does not spec the admin editor UI in detail — use the existing admin card/panel patterns.

---

## Null / Empty State

```
┌──────────────────────────────────────────────────────────┐
│  📋  Observation guide coming soon for this clip.         │
│                                                           │
│  In the meantime, watch the clip carefully and           │
│  focus on what the character does with their             │
│  eyes, posture, and voice.                               │
│                                                           │
│                          [Start Recording →]             │
└──────────────────────────────────────────────────────────┘
```

Tailwind: `bg-bg-elevated border border-white/8 rounded-2xl p-6 text-center flex flex-col items-center gap-3`

---

*End of M11 spec*
