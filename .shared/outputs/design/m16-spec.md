# M16 — Learning Materials Builder: Admin UI Spec
> Designer: seeneyu Designer
> Date: 2026-03-23
> Milestone: M16 — Admin crawl-job system for semi-automated YouTube clip discovery

---

## Overview

The Learning Materials Builder is an admin-only tool at `/admin/crawl-jobs`. Admins define search criteria (skill category, tactic, keywords, difficulty), trigger a YouTube search + AI relevance scoring pass, then review candidate clips and approve or reject each one. Approved clips are instantly added to the library with an auto-generated ObservationGuide.

Four views:
1. **Job List** — `/admin/crawl-jobs`
2. **Create Job Form** — `/admin/crawl-jobs/new`
3. **Job Detail + Results Browser** — `/admin/crawl-jobs/[id]`
4. **Approve Modal** — overlay on results page

Design tone: efficient, data-dense, pro admin tool. Consistent with seeneyu dark UI.

---

## Design Tokens (reference)

```
bg-base:     #0d0d14
bg-surface:  #13131f
bg-elevated: #1a1a2e
bg-inset:    #0a0a12
accent-400:  #fbbf24  (amber)
text-primary:   rgba(255,255,255,0.92)
text-secondary: rgba(255,255,255,0.60)
text-tertiary:  rgba(255,255,255,0.38)
border-subtle: rgba(255,255,255,0.08)
success: #22c55e
warning: #f59e0b
error:   #ef4444
```

---

## Page 1: Job List — `/admin/crawl-jobs`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [← Admin]   Learning Materials Builder                  │
│                                            [+ New Job]   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Power Pause — Advanced Vocal        [● COMPLETE]   │ │
│  │  Eye Contact (confident-disagreement) · 3 approved  │ │
│  │  18 results · Mar 23, 2026        [View Results →]  │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Triangle Gaze — Body Language        [○ PENDING]   │ │
│  │  Special technique · 0 results                      │ │
│  │  Created Mar 23, 2026              [▶ Run Job]      │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Vocal Pacing Examples              [⟳ RUNNING...]  │ │
│  │  vocal-pacing · Searching YouTube...                 │ │
│  │  Started 2m ago                                      │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Mirror Neurons Clips                [✗ FAILED]     │ │
│  │  API quota exceeded                                  │ │
│  │  Mar 22, 2026                      [Retry]          │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Component: JobListRow

**Container**: `bg-bg-surface border border-white/8 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-white/15 transition-colors`

**Left column** `flex flex-col gap-1`:
- Job name: `text-sm font-semibold text-text-primary`
- Meta line: `text-xs text-text-secondary` — technique label + result count
- Date: `text-xs text-text-tertiary`

**Right column** `flex flex-col items-end gap-2`:
- Status chip (see below)
- Action button

**Status chips**:
```
pending:  bg-white/5    text-text-secondary  border border-white/10  "○ PENDING"
running:  bg-amber-500/10 text-amber-400  border border-amber-400/20  "⟳ RUNNING..."
          + animate-pulse on the ⟳ icon
complete: bg-emerald-500/10 text-emerald-400 border border-emerald-400/20  "● COMPLETE"
failed:   bg-red-500/10  text-red-400   border border-red-400/20    "✗ FAILED"
```
All chips: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium`

**Action buttons**:
- Run Job: `bg-accent-400 text-bg-base text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors`
- View Results: `border border-white/15 text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:border-white/30 hover:text-text-primary transition-colors`
- Retry: same style as View Results

**Result count badge** (shown on complete rows):
`text-xs text-text-tertiary` — `"18 results · 3 approved · 2 rejected"`

**Page header**:
```
h1: text-xl font-bold text-text-primary
subtitle: text-sm text-text-secondary "Discover and curate new clips using AI-assisted YouTube search."
New Job button: bg-accent-400 text-bg-base font-semibold px-4 py-2 rounded-pill hover:bg-amber-300
```

**Empty state**:
```
┌──────────────────────────────┐
│     🔍                        │
│  No crawl jobs yet            │
│  Create your first job to     │
│  start discovering clips.     │
│  [+ Create Job]               │
└──────────────────────────────┘
```
Container: `flex flex-col items-center gap-3 py-20 text-center`

---

## Page 2: Create Job Form — `/admin/crawl-jobs/new`

### Layout

```
┌──────────────────────────────────────────────────┐
│  [← Jobs]   Create Crawl Job                      │
├──────────────────────────────────────────────────┤
│                                                    │
│  Job Name                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ Power Pause examples — advanced vocal        │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Skill Category                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Eye Contact                               ▼  │ │
│  └──────────────────────────────────────────────┘ │
│  Options: Eye Contact | Open Posture |             │
│           Active Listening | Vocal Pacing |        │
│           Confident Disagreement | Special Technique│
│                                                    │
│  ── Shown only when "Special Technique" selected ──│
│  Technique / Tactic Name                           │
│  ┌──────────────────────────────────────────────┐ │
│  │ e.g. Triangle Gaze, Power Pause              │ │
│  └──────────────────────────────────────────────┘ │
│  Tip: "These are sourced from the tactics taxonomy"│
│                                                    │
│  Search Keywords   (press Enter to add)            │
│  ┌──────────────────────────────────────────────┐ │
│  │ [power pause speaker ×] [deliberate silence ×]│
│  │ [add keyword...]                              │ │
│  └──────────────────────────────────────────────┘ │
│  Up to 5 keywords. Each runs a separate search.   │
│                                                    │
│  Difficulty                                        │
│  ┌──────────┐ ┌─────────────┐ ┌──────────┐ ┌───┐ │
│  │ Beginner │ │ Intermediate│ │ Advanced │ │All│ │
│  └──────────┘ └─────────────┘ └──────────┘ └───┘ │
│  (pill toggle group)                               │
│                                                    │
│  Max Results   ┌─────┐                             │
│                │  20  │  (slider or number input)  │
│                └─────┘                             │
│  Max: 50. More results = more API cost.            │
│                                                    │
│  [Create Job]          [Create & Run →]            │
└──────────────────────────────────────────────────┘
```

### Component Specs

**Form container**: `max-w-2xl mx-auto flex flex-col gap-6 py-8`

**Section label**: `text-sm font-semibold text-text-primary mb-1.5`

**Text input / Textarea**:
```
bg-bg-inset border border-white/10 rounded-xl px-4 py-3
text-sm text-text-primary placeholder:text-text-tertiary
focus:outline-none focus:border-accent-400/60 focus:ring-1 focus:ring-accent-400/20
transition-colors
```

**Skill dropdown**:
- Same input style with chevron icon
- Options list: `bg-bg-elevated border border-white/10 rounded-xl shadow-lg mt-1 overflow-hidden`
- Option row: `px-4 py-2.5 text-sm text-text-primary hover:bg-white/5 cursor-pointer`
- Special Technique option: has `text-accent-400` tint + spark icon

**Technique name field** (conditional):
- Appears with `animate-fade-in` when Special Technique selected
- Helper text: `text-xs text-text-tertiary mt-1.5` — "Browse available tactics in the taxonomy"

**Keywords tag input**:
- Container: `bg-bg-inset border border-white/10 rounded-xl px-3 py-2 flex flex-wrap gap-1.5 min-h-[52px] focus-within:border-accent-400/60 transition-colors`
- Tag chip: `inline-flex items-center gap-1 bg-accent-400/10 border border-accent-400/20 text-accent-400 text-xs px-2.5 py-1 rounded-full`
- Remove × : `hover:text-white transition-colors cursor-pointer`
- Text input inside: `bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none min-w-[120px]`
- Helper: `text-xs text-text-tertiary mt-1.5` — "Add 3–5 search terms. Press Enter after each."

**Difficulty pill group**:
- Row: `flex gap-2`
- Pill: `px-4 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer`
- Unselected: `border-white/10 text-text-secondary hover:border-white/20`
- Selected: `border-accent-400/60 bg-accent-400/10 text-accent-400`

**Max results**:
- Number input: `w-20 bg-bg-inset border border-white/10 rounded-lg px-3 py-2 text-sm text-center text-text-primary focus:border-accent-400/60 outline-none`
- Range: `text-xs text-text-tertiary mt-1`

**Submit buttons** (bottom row `flex gap-3 justify-end`):
- Create Job: `border border-white/15 text-text-primary px-5 py-2.5 rounded-pill text-sm font-medium hover:border-white/30 transition-colors`
- Create & Run: `bg-accent-400 text-bg-base px-5 py-2.5 rounded-pill text-sm font-semibold hover:bg-amber-300 transition-colors flex items-center gap-2`

---

## Page 3: Job Detail + Results Browser — `/admin/crawl-jobs/[id]`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [← All Jobs]                                            │
│                                                          │
│  Power Pause Examples — Advanced Vocal    [● COMPLETE]  │
│  Skill: Vocal Pacing  ·  Technique: Power Pause          │
│  Keywords: power pause speaker, deliberate silence       │
│  Difficulty: Advanced  ·  Max: 20  ·  Mar 23, 2026       │
│                                                          │
│  18 results   3 approved   2 rejected   13 pending       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Sort: [Relevance ▼]  [View Count]  [Date]               │
│  Filter: [All 18] [Pending 13] [Approved 3] [Rejected 2] │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │ [thumbnail]    │  │ [thumbnail]    │  │ [thumbnail]│ │
│  │ ●9.2           │  │ ●7.4           │  │ ◐4.1       │ │
│  │ The Power of   │  │ How to pause   │  │ Public     │ │
│  │ Silence — TED  │  │ for impact     │  │ Speaking   │ │
│  │ TED Talks      │  │ Mindful Life   │  │ Tips       │ │
│  │ 8:24 · 4.2M    │  │ 5:11 · 120K    │  │ 3:00 · 8K │ │
│  │ "Exceptionally │  │ "Clear demo    │  │ "Weak —    │ │
│  │ clear pauses   │  │ of deliberate  │  │ no named   │ │
│  │ with intent"   │  │ pause + effect"│  │ technique" │ │
│  │ [✓ Approve]    │  │ [✓ Approve]    │  │ [✓] [✗]   │ │
│  │ [✗ Reject]     │  │ [✗ Reject]     │  │            │ │
│  └────────────────┘  └────────────────┘  └────────────┘ │
│                                                          │
│  ... (more cards)                                        │
└─────────────────────────────────────────────────────────┘
```

### Running State (replaces results section while job runs)

```
┌────────────────────────────────────────┐
│  ⟳  Running job...                      │
│                                         │
│  ●──●──○──○  Step 2 of 4               │
│  Scoring results with AI...             │
│                                         │
│  4 / 18 results scored                  │
└────────────────────────────────────────┘
```

- Container: `bg-bg-elevated border border-white/8 rounded-2xl p-8 flex flex-col items-center gap-4 text-center`
- Steps: 4-dot progress (Queued → Searching YouTube → Scoring → Complete)
- Dot: `w-3 h-3 rounded-full` — completed: `bg-accent-400`, active: `bg-accent-400 animate-pulse`, pending: `bg-white/15`
- Connecting line: `flex-1 h-px bg-white/10`
- Status text: `text-sm text-text-secondary`
- Count: `text-xs text-text-tertiary`

### Job Header

Container: `bg-bg-surface border border-white/8 rounded-2xl p-5 flex flex-col gap-3`

- Title row: `flex items-start justify-between gap-4`
  - Title: `text-lg font-bold text-text-primary`
  - Status chip (same as Job List)
- Meta tags row: `flex flex-wrap gap-x-4 gap-y-1`
  - Each: `text-xs text-text-secondary` — "Skill: Vocal Pacing"
- Stats row: `flex gap-6`
  - `text-sm font-semibold text-text-primary` + `text-xs text-text-tertiary` below
  - e.g. "18" / "results", "3" / "approved", "2" / "rejected"

### Filter + Sort bar

`flex items-center justify-between gap-4 flex-wrap`

Filter tabs: `flex gap-1 bg-bg-inset rounded-xl p-1`
- Tab: `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer`
- Active: `bg-bg-elevated text-text-primary shadow-sm`
- Inactive: `text-text-tertiary hover:text-text-secondary`
- Each tab shows count badge: `text-xs text-text-tertiary ml-1`

Sort: `flex items-center gap-2`
- Label: `text-xs text-text-tertiary`
- Buttons: `text-xs px-2.5 py-1 rounded-lg border transition-colors`
  - Active: `border-white/20 text-text-primary bg-white/5`
  - Inactive: `border-transparent text-text-tertiary hover:text-text-secondary`

### ResultCard

**Container**: `bg-bg-surface border border-white/8 rounded-xl overflow-hidden flex flex-col transition-all duration-200`
- Approved state: `border-emerald-400/25 bg-emerald-500/3`
- Rejected state: `border-white/5 opacity-50`

**Thumbnail section** `relative aspect-video bg-bg-inset cursor-pointer group`:
- `next/image` with `fill objectFit="cover"`
- Hover overlay: `absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`
- Play icon: `w-10 h-10 text-white/80`
- Relevance score badge (absolute top-right):
  ```
  Score ≥ 7: bg-emerald-500/90   text-white    "●  9.2"
  Score 4–6: bg-amber-500/90    text-white    "◐  5.8"
  Score  <4: bg-red-500/80      text-white    "○  2.1"
  ```
  Classes: `absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm`

**Content section** `p-3 flex flex-col gap-2 flex-1`:
- Title: `text-xs font-semibold text-text-primary line-clamp-2 leading-snug`
- Channel + duration row: `flex items-center gap-2 text-xs text-text-tertiary`
  - Channel name · duration · view count (e.g. "4.2M views")
- AI analysis: `text-xs text-text-secondary italic line-clamp-2 leading-relaxed`
  - Prefixed with a Quote icon `w-3 h-3 text-text-tertiary`

**Action row** `flex gap-2 mt-auto pt-1`:
- Approve: `flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors`
- Reject: `flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border border-white/8 text-text-tertiary hover:border-red-400/20 hover:text-red-400 transition-colors`

**Post-action states** (optimistic UI):
- Approved: Replace buttons with `inline-flex items-center gap-1 text-xs text-emerald-400 font-medium py-2` + CheckCircle icon + "Approved · Undo"
- Rejected: Same with `text-text-tertiary` + XCircle icon + "Rejected · Undo"
- Undo link: `underline cursor-pointer hover:text-text-primary ml-2`

**Results grid layout**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

---

## Page 4: Approve Modal (overlay)

Triggered by clicking "Approve" on a ResultCard.

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│                           [×]                                 │
│  Approve Clip                                                  │
│  Fill in clip metadata before adding to library               │
├────────────────────────────┬─────────────────────────────────┤
│                            │  Movie / Show Title              │
│  [YouTube embed preview]   │  ┌───────────────────────────┐  │
│   autoplay, muted          │  │ The Art of Power           │  │
│                            │  └───────────────────────────┘  │
│  "The Power of Silence"    │                                  │
│  TED Talks · 8:24          │  Year  Character Name            │
│                            │  ┌────┐  ┌──────────────────┐  │
│  AI Analysis:              │  │2020│  │ Amy Cuddy         │  │
│  "Exceptionally clear use  │  └────┘  └──────────────────┘  │
│   of deliberate pauses..."  │                                  │
│                            │  Actor Name                      │
│                            │  ┌───────────────────────────┐  │
│                            │  │ Amy Cuddy                  │  │
│                            │  └───────────────────────────┘  │
│                            │                                  │
│                            │  Start Second   End Second       │
│                            │  ┌──────────┐   ┌────────────┐  │
│                            │  │  0       │   │  60        │  │
│                            │  └──────────┘   └────────────┘  │
│                            │  ⏱ Current time: 0:00           │
│                            │                                  │
│                            │  Scene Description               │
│                            │  ┌───────────────────────────┐  │
│                            │  │ Amy Cuddy demonstrates... │  │
│                            │  │                            │  │
│                            │  └───────────────────────────┘  │
│                            │                                  │
│                            │  Skill Category    Difficulty    │
│                            │  ┌──────────────┐  ┌──────────┐ │
│                            │  │ Vocal Pacing ▼│  │Advanced ▼│ │
│                            │  └──────────────┘  └──────────┘ │
│                            │                                  │
│                            │  [Create Clip & Generate Guide →]│
└────────────────────────────┴─────────────────────────────────┘
```

### Component Specs

**Modal backdrop**: `fixed inset-0 bg-black/60 backdrop-blur-sm z-modal flex items-center justify-center p-4`

**Modal container**: `bg-bg-surface border border-white/10 rounded-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] overflow-y-auto`

**Modal header** `px-6 py-4 border-b border-white/8 flex items-start justify-between`:
- Title: `text-base font-semibold text-text-primary`
- Subtitle: `text-sm text-text-secondary mt-0.5`
- Close button: `w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors`

**Two-panel body** `grid grid-cols-1 md:grid-cols-2` (stacks on mobile):

Left panel `p-5 flex flex-col gap-3`:
- Embed container: `aspect-video bg-bg-inset rounded-xl overflow-hidden`
- YouTube iframe: `w-full h-full border-0`
- Video title: `text-sm font-medium text-text-primary`
- Channel: `text-xs text-text-secondary`
- AI analysis: `bg-bg-inset rounded-xl p-3 text-xs text-text-secondary italic leading-relaxed`

Right panel `p-5 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/8`:
- Same input styling as Create Job form
- Two-col rows: `grid grid-cols-2 gap-3` for Year/Character, Start/End seconds
- Timestamp helper: `text-xs text-text-tertiary flex items-center gap-1` + Clock icon — "⏱ Current time: 0:34" (updates as embed plays — future enhancement, static ok for now)
- Textarea (scene description): `min-h-[72px] resize-none`

**Submit button** (full width at bottom of right panel):
`w-full bg-accent-400 text-bg-base font-semibold py-3 rounded-xl text-sm hover:bg-amber-300 transition-colors flex items-center justify-center gap-2`

**Loading state** (after submit):
- Button becomes: spinner + "Creating clip..." text, disabled
- On success: green checkmark + "Clip created! Generating guide..." toast slides in from bottom

**Success toast** (bottom of screen):
```
bg-emerald-500/15 border border-emerald-400/20 rounded-xl px-4 py-3
flex items-center gap-3
CheckCircle (text-emerald-400) + "Clip added to library. Observation guide generating..." + [View Clip →]
animate-slide-up, auto-dismiss after 5s
```

---

## Accessibility

| Element | Requirement |
|---|---|
| Modal | `role="dialog"` `aria-modal="true"` `aria-labelledby` focus trap |
| Close button | `aria-label="Close modal"` |
| Status chips | `aria-label="Status: complete"` |
| Result grid | `role="list"` on grid, `role="listitem"` per card |
| Approve/Reject | `aria-label="Approve: [video title]"` |
| Score badge | `aria-label="Relevance score: 9.2 out of 10"` |
| Tag input | `aria-label="Search keywords"` `aria-describedby` pointing to helper |
| Form submit | `aria-busy="true"` when loading |

---

## Component Breakdown

| Component | File suggestion |
|---|---|
| JobList page | `src/app/admin/crawl-jobs/page.tsx` |
| JobListRow | `src/components/admin/JobListRow.tsx` |
| CreateJob page | `src/app/admin/crawl-jobs/new/page.tsx` |
| KeywordsTagInput | `src/components/admin/KeywordsTagInput.tsx` |
| JobDetail page | `src/app/admin/crawl-jobs/[id]/page.tsx` |
| ResultCard | `src/components/admin/ResultCard.tsx` |
| ResultsGrid | `src/components/admin/ResultsGrid.tsx` |
| JobRunProgress | `src/components/admin/JobRunProgress.tsx` |
| ApproveModal | `src/components/admin/ApproveModal.tsx` |

---

## Responsive Behavior

| View | Mobile (375px) | Tablet (768px) | Desktop (1024px) |
|---|---|---|---|
| Job List | Single-column cards, full-width | Same | Max-w-4xl centered |
| Create Form | Full-width, stacked | max-w-2xl | max-w-2xl |
| Results Grid | 1 col | 2 cols | 3 cols |
| Approve Modal | Full-screen sheet | 2-panel side-by-side (80vw) | Max-w-4xl |

---

## States Summary

| Component | States |
|---|---|
| JobListRow | default, hover, running (animated), failed |
| CreateJob form | idle, submitting (buttons disabled + spinner), error (field-level) |
| ResultCard | default, approved (green tint), rejected (faded), thumbnail-hover (play overlay) |
| ApproveModal | idle, submitting, success |
| ResultsGrid | loading skeleton, empty (no results), populated |

**Loading skeleton** (ResultCard):
`animate-pulse` on `rounded-xl bg-white/5` placeholder blocks matching card layout.
