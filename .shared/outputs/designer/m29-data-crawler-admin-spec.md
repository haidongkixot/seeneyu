# M29 — Data Crawler & Content Admin Toolkit: Design Spec
> Owner: Designer | Status: SPEC COMPLETE | Date: 2026-03-25

---

## 1. Overview

Admin-facing toolkit for managing expression content: crawling external sources, curating raw content through a review pipeline, managing an expression asset gallery, and triggering AI enrichment. Accessible from the admin panel at `/admin/content-toolkit`.

---

## 2. Toolkit Dashboard (`/admin/content-toolkit/page.tsx`)

### Layout — Card Grid

Top-level landing page shows 4 tool cards in a responsive grid.

```
┌──────────────────────────────────────────────────────┐
│  Content Toolkit                                      │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐                    │
│  │  ☁ Sources  │  │  📋 Review  │                    │
│  │  12 active  │  │  34 pending │                    │
│  └─────────────┘  └─────────────┘                    │
│  ┌─────────────┐  ┌─────────────┐                    │
│  │  🖼 Gallery │  │  🤖 AI Enrich│                   │
│  │  248 assets │  │  Run batch  │                    │
│  └─────────────┘  └─────────────┘                    │
└──────────────────────────────────────────────────────┘
```

### Page Container

```
bg-bg-base min-h-screen
px-4 py-8 md:px-8 lg:px-12
max-w-6xl mx-auto
```

### Page Header

```
<div class="mb-8">
  <h1 class="text-3xl font-bold text-text-primary">Content Toolkit</h1>
  <p class="mt-2 text-base text-text-secondary">
    Manage expression sources, review content, and enrich assets with AI.
  </p>
</div>
```

### Tool Card Grid

```
Grid: grid grid-cols-1 md:grid-cols-2 gap-4
```

### Tool Card Component (`ToolCard`)

```
<Link href="/admin/content-toolkit/[section]">
  <div class="
    bg-bg-surface border border-white/8 rounded-2xl shadow-card
    p-6
    hover:shadow-card-hover hover:-translate-y-0.5 hover:border-accent-400/20
    transition-all duration-200
    cursor-pointer group
  ">
    <!-- Icon row -->
    <div class="
      w-10 h-10 rounded-xl
      bg-bg-elevated
      flex items-center justify-center
      mb-4
      group-hover:bg-accent-400/10
      transition-colors duration-200
    ">
      <Lucide icon size={20} class="text-text-secondary group-hover:text-accent-400" />
    </div>

    <!-- Title -->
    <h3 class="text-lg font-semibold text-text-primary mb-1">{title}</h3>

    <!-- Subtitle / metric -->
    <p class="text-sm text-text-secondary">{subtitle}</p>

    <!-- Stat pill (bottom-right) -->
    <div class="mt-4 flex items-center gap-2">
      <span class="
        inline-flex items-center
        px-2.5 py-0.5 rounded-pill
        text-xs font-medium
        bg-accent-400/10 text-accent-400
      ">
        {count} {label}
      </span>
    </div>
  </div>
</Link>
```

**Icons per card**:
| Card | Lucide Icon | Subtitle |
|---|---|---|
| Sources | `Globe` | "Content source feeds" |
| Review | `ClipboardCheck` | "Pending curation" |
| Gallery | `Image` | "Expression assets" |
| AI Enrich | `Sparkles` | "Batch enrichment" |

---

## 3. Content Sources Table (`/admin/content-toolkit/sources/page.tsx`)

### Page Header Row

```
<div class="flex items-center justify-between mb-6">
  <div>
    <h2 class="text-2xl font-bold text-text-primary">Content Sources</h2>
    <p class="text-sm text-text-secondary mt-1">Manage crawl sources and schedules</p>
  </div>
  <button class="
    bg-accent-400 text-text-inverse rounded-pill
    px-5 py-2.5 font-semibold text-sm
    hover:bg-accent-500 hover:shadow-glow-sm
    active:bg-accent-600 active:scale-[0.98]
    transition-all duration-150
  ">
    <Plus size={16} class="inline mr-1.5" />
    Add Source
  </button>
</div>
```

### Filter Bar

```
<div class="flex items-center gap-3 mb-4 flex-wrap">

  <!-- Search input -->
  <div class="relative flex-1 min-w-[200px] max-w-sm">
    <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
    <input
      class="
        w-full bg-bg-inset border border-white/10 rounded-lg
        pl-9 pr-4 py-2.5 text-sm text-text-primary
        placeholder:text-text-tertiary
        focus:border-accent-400/60 focus:shadow-glow-sm focus:outline-none
        transition-all duration-150
      "
      placeholder="Search sources..."
    />
  </div>

  <!-- Status filter -->
  <select class="
    bg-bg-inset border border-white/10 rounded-lg
    px-3 py-2.5 text-sm text-text-primary
    focus:border-accent-400/60 focus:outline-none
    appearance-none cursor-pointer
  ">
    <option>All statuses</option>
    <option>Active</option>
    <option>Paused</option>
    <option>Error</option>
  </select>

  <!-- Type filter -->
  <select class="same styles as above">
    <option>All types</option>
    <option>Web scraper</option>
    <option>API feed</option>
    <option>Manual upload</option>
  </select>
</div>
```

### Table Design

```
<div class="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden shadow-card">
  <table class="w-full">
    <thead>
      <tr class="border-b border-white/6">
        <th class="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Source
        </th>
        <th>Type</th>
        <th>Status</th>
        <th>Last Crawl</th>
        <th>Items</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-white/6">
      ...
    </tbody>
  </table>
</div>
```

**Columns**:

| Column | Width | Content |
|---|---|---|
| Source | flex-1, min-w-[200px] | Name + URL preview (truncated, text-xs text-text-tertiary) |
| Type | w-28 | Pill: `Web` / `API` / `Manual` |
| Status | w-28 | Status pill (see below) |
| Last Crawl | w-36 | Relative time, e.g. "2h ago", mono font text-xs |
| Items | w-20 | Count number, text-sm font-mono |
| Actions | w-24 | Icon buttons row |

### Status Pills

```
Active:  bg-success/10 text-success border border-success/20 rounded-pill px-2.5 py-0.5 text-xs font-medium
Paused:  bg-warning/10 text-warning border border-warning/20 rounded-pill px-2.5 py-0.5 text-xs font-medium
Error:   bg-error/10   text-error   border border-error/20   rounded-pill px-2.5 py-0.5 text-xs font-medium
```

Each pill includes a small dot indicator before text:
```
<span class="w-1.5 h-1.5 rounded-full bg-success mr-1.5 inline-block" />
```

### Type Pills

```
Web:    bg-info/10    text-info    border border-info/20    rounded-pill px-2.5 py-0.5 text-xs font-medium
API:    bg-accent-400/10 text-accent-400 border border-accent-400/20 rounded-pill ...
Manual: bg-white/5    text-text-secondary border border-white/10 rounded-pill ...
```

### Action Buttons (per row)

```
<div class="flex items-center gap-1">
  <!-- Run now -->
  <button class="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors duration-150"
    title="Run crawl now">
    <Play size={16} />
  </button>

  <!-- Edit -->
  <button class="same hover pattern" title="Edit source">
    <Pencil size={16} />
  </button>

  <!-- Delete -->
  <button class="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors duration-150"
    title="Delete source">
    <Trash2 size={16} />
  </button>
</div>
```

### Table Row Hover

```
<tr class="hover:bg-bg-overlay/50 transition-colors duration-100">
```

### Empty State

```
<div class="py-16 text-center">
  <Globe size={40} class="mx-auto text-text-tertiary mb-4" />
  <p class="text-text-secondary text-base mb-2">No sources configured</p>
  <p class="text-text-tertiary text-sm mb-6">Add a content source to start crawling expression data.</p>
  <button class="bg-accent-400 text-text-inverse rounded-pill px-5 py-2.5 font-semibold text-sm ...">
    Add First Source
  </button>
</div>
```

---

## 4. Curation Workflow (`/admin/content-toolkit/review/page.tsx`)

### Pipeline: Raw -> Review -> Approve/Reject

Three-column Kanban-style layout on desktop, stacked tabs on mobile.

```
Desktop (lg+):
┌────────────────────────────────────────────────────────┐
│  Raw (45)          │  In Review (12)  │  Decided (230) │
│ ┌──────────────┐   │ ┌────────────┐   │ ┌────────────┐ │
│ │ content card  │   │ │ review card│   │ │ done card  │ │
│ └──────────────┘   │ └────────────┘   │ └────────────┘ │
│ ┌──────────────┐   │                  │                │
│ │ content card  │   │                  │                │
│ └──────────────┘   │                  │                │
└────────────────────────────────────────────────────────┘

Mobile (< lg):
Tab bar: [Raw (45)] [Review (12)] [Done (230)]
Single column of cards below
```

### Column Container (desktop)

```
<div class="hidden lg:grid lg:grid-cols-3 lg:gap-4">
  {columns.map(col => (
    <div class="flex flex-col">
      <!-- Column header -->
      <div class="flex items-center gap-2 mb-4 px-1">
        <h3 class="text-sm font-semibold text-text-primary">{col.title}</h3>
        <span class="
          bg-bg-elevated rounded-pill px-2 py-0.5
          text-xs font-medium text-text-secondary
        ">
          {col.count}
        </span>
      </div>

      <!-- Scrollable card list -->
      <div class="
        flex-1 overflow-y-auto
        space-y-3
        max-h-[calc(100vh-220px)]
        pr-1
        scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent
      ">
        {col.items.map(item => <CurationCard />)}
      </div>
    </div>
  ))}
</div>
```

### Mobile Tab Bar

```
<div class="lg:hidden flex border-b border-white/8 mb-4">
  {tabs.map(tab => (
    <button class="
      flex-1 py-3 text-sm font-medium text-center
      transition-colors duration-150
      ${active
        ? 'text-accent-400 border-b-2 border-accent-400'
        : 'text-text-secondary hover:text-text-primary'
      }
    ">
      {tab.label} ({tab.count})
    </button>
  ))}
</div>
```

### Curation Card (`CurationCard`)

```
<div class="
  bg-bg-surface border border-white/8 rounded-2xl
  p-4
  hover:border-white/12
  transition-all duration-150
">
  <!-- Thumbnail (if image) -->
  <div class="
    w-full aspect-video rounded-xl overflow-hidden
    bg-bg-inset mb-3
  ">
    <img class="w-full h-full object-cover" />
  </div>

  <!-- Title -->
  <h4 class="text-sm font-semibold text-text-primary line-clamp-2 mb-1">{title}</h4>

  <!-- Source + date -->
  <p class="text-xs text-text-tertiary mb-3">
    {source} &middot; {relativeTime}
  </p>

  <!-- Expression tags (if any) -->
  <div class="flex flex-wrap gap-1.5 mb-3">
    <span class="px-2 py-0.5 rounded-pill text-xs font-medium bg-accent-400/10 text-accent-400">
      surprise
    </span>
    <span class="px-2 py-0.5 rounded-pill text-xs font-medium bg-white/5 text-text-secondary">
      joy
    </span>
  </div>

  <!-- Action buttons (for Raw and Review columns) -->
  <div class="flex items-center gap-2">
    <!-- Approve -->
    <button class="
      flex-1 py-2 rounded-xl text-sm font-medium
      bg-success/10 text-success border border-success/20
      hover:bg-success/20
      transition-colors duration-150
    ">
      <Check size={14} class="inline mr-1" /> Approve
    </button>

    <!-- Reject -->
    <button class="
      flex-1 py-2 rounded-xl text-sm font-medium
      bg-error/10 text-error border border-error/20
      hover:bg-error/20
      transition-colors duration-150
    ">
      <X size={14} class="inline mr-1" /> Reject
    </button>

    <!-- Move to Review (Raw column only) -->
    <button class="
      p-2 rounded-xl text-text-secondary
      hover:text-text-primary hover:bg-bg-overlay
      transition-colors duration-150
    " title="Move to review">
      <ArrowRight size={16} />
    </button>
  </div>
</div>
```

### Decided Column Cards

Cards in the "Decided" column show a status badge instead of action buttons:

```
<!-- Approved -->
<div class="flex items-center gap-1.5 mt-3">
  <span class="w-1.5 h-1.5 rounded-full bg-success" />
  <span class="text-xs font-medium text-success">Approved</span>
  <span class="text-xs text-text-tertiary ml-auto">by Admin, 2h ago</span>
</div>

<!-- Rejected -->
<div class="flex items-center gap-1.5 mt-3">
  <span class="w-1.5 h-1.5 rounded-full bg-error" />
  <span class="text-xs font-medium text-error">Rejected</span>
  <span class="text-xs text-text-tertiary ml-auto">by Admin, 1d ago</span>
</div>
```

---

## 5. Expression Asset Gallery (`/admin/content-toolkit/gallery/page.tsx`)

### Layout

Responsive image grid with label overlays and status pills.

```
┌──────────────────────────────────────────────────────┐
│  Expression Gallery                    [+ Upload]    │
│                                                       │
│  Filter: [All ▾] [Search...        ] [Sort: Recent ▾]│
│                                                       │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐    │
│  │ 😊 │  │ 😢 │  │ 😡 │  │ 😲 │  │ 😨 │  │ 🤔 │    │
│  │joy │  │sad │  │angr│  │surp│  │fear│  │think│   │
│  │ ✓  │  │ ✓  │  │ ⏳ │  │ ✓  │  │ ✗  │  │ ⏳ │    │
│  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘    │
│  ┌────┐  ┌────┐  ┌────┐  ...                        │
│  └────┘  └────┘  └────┘                              │
└──────────────────────────────────────────────────────┘
```

### Grid Container

```
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3
```

### Gallery Asset Card

```
<div class="
  group relative
  bg-bg-surface border border-white/8 rounded-2xl
  overflow-hidden
  hover:shadow-card-hover hover:border-accent-400/20
  transition-all duration-200
  cursor-pointer
">
  <!-- Image -->
  <div class="aspect-square bg-bg-inset">
    <img class="w-full h-full object-cover" src={asset.thumbnailUrl} alt={asset.label} />
  </div>

  <!-- Overlay on hover (selection checkbox) -->
  <div class="
    absolute top-2 right-2
    opacity-0 group-hover:opacity-100
    transition-opacity duration-150
  ">
    <div class="
      w-6 h-6 rounded-md
      bg-bg-elevated/80 backdrop-blur-sm border border-white/20
      flex items-center justify-center
      cursor-pointer
      hover:border-accent-400/40
    ">
      <Check size={14} class="text-accent-400 hidden" /> <!-- shown when selected -->
    </div>
  </div>

  <!-- Bottom info bar -->
  <div class="px-3 py-2.5">
    <!-- Expression label -->
    <p class="text-sm font-medium text-text-primary truncate">{asset.label}</p>

    <!-- Row: source + status pill -->
    <div class="flex items-center justify-between mt-1.5">
      <span class="text-xs text-text-tertiary truncate max-w-[60%]">{asset.source}</span>

      <!-- Status pill -->
      {status === 'approved' && (
        <span class="px-2 py-0.5 rounded-pill text-xs font-medium bg-success/10 text-success">
          Approved
        </span>
      )}
      {status === 'pending' && (
        <span class="px-2 py-0.5 rounded-pill text-xs font-medium bg-warning/10 text-warning">
          Pending
        </span>
      )}
      {status === 'rejected' && (
        <span class="px-2 py-0.5 rounded-pill text-xs font-medium bg-error/10 text-error">
          Rejected
        </span>
      )}
    </div>
  </div>
</div>
```

### Selected State

When an asset card is selected (checkbox checked):

```
border-accent-400/40 shadow-glow-sm
Checkbox: bg-accent-400, check icon visible in white
```

### Bulk Action Bar (appears when 1+ selected)

```
<div class="
  fixed bottom-6 left-1/2 -translate-x-1/2
  z-toast
  bg-bg-elevated border border-white/10 rounded-2xl
  shadow-xl
  px-6 py-3
  flex items-center gap-4
  animate-slide-up
">
  <span class="text-sm text-text-secondary">{count} selected</span>

  <button class="px-4 py-2 rounded-xl text-sm font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors duration-150">
    Approve All
  </button>
  <button class="px-4 py-2 rounded-xl text-sm font-medium bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors duration-150">
    Reject All
  </button>
  <button class="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10 transition-colors duration-150">
    Add Tags
  </button>

  <button class="ml-2 p-2 rounded-lg text-text-tertiary hover:text-text-primary" title="Clear selection">
    <X size={16} />
  </button>
</div>
```

---

## 6. AI Enrichment Panel (`/admin/content-toolkit/enrich/page.tsx`)

### Layout

Single-page panel for triggering batch AI enrichment on approved assets.

```
┌──────────────────────────────────────────────────────┐
│  AI Enrichment                                        │
│                                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │  Batch Enrich                                     ││
│  │  Run GPT-4o Vision on approved assets without     ││
│  │  AI labels to auto-tag expressions.               ││
│  │                                                    ││
│  │  Assets ready: 34                                  ││
│  │  [▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░] 12/34 processed         ││
│  │                                                    ││
│  │  [Run Enrichment]                                  ││
│  └──────────────────────────────────────────────────┘│
│                                                       │
│  Recent runs:                                         │
│  ┌──────────────────────────────────────────────────┐│
│  │  Mar 25, 14:30  │  34 assets  │  ✓ Complete      ││
│  │  Mar 24, 09:15  │  12 assets  │  ✓ Complete      ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

### Enrichment Card

```
<div class="bg-bg-surface border border-white/8 rounded-2xl p-6 shadow-card">
  <div class="flex items-start gap-4 mb-6">
    <div class="w-10 h-10 rounded-xl bg-accent-400/10 flex items-center justify-center flex-shrink-0">
      <Sparkles size={20} class="text-accent-400" />
    </div>
    <div>
      <h3 class="text-lg font-semibold text-text-primary">Batch Enrich</h3>
      <p class="text-sm text-text-secondary mt-1">
        Run GPT-4o Vision on approved assets to auto-detect and tag expressions.
      </p>
    </div>
  </div>

  <!-- Stats row -->
  <div class="flex items-center gap-6 mb-6">
    <div>
      <span class="text-2xl font-bold text-text-primary font-mono">{readyCount}</span>
      <span class="text-xs text-text-tertiary ml-1.5">assets ready</span>
    </div>
    <div>
      <span class="text-2xl font-bold text-accent-400 font-mono">{enrichedCount}</span>
      <span class="text-xs text-text-tertiary ml-1.5">already enriched</span>
    </div>
  </div>

  <!-- CTA -->
  <button class="
    bg-accent-400 text-text-inverse rounded-pill
    px-6 py-3 font-semibold text-base
    hover:bg-accent-500 hover:shadow-glow-sm
    active:bg-accent-600 active:scale-[0.98]
    disabled:opacity-40 disabled:cursor-not-allowed
    transition-all duration-150
  ">
    <Sparkles size={16} class="inline mr-2" />
    Run Enrichment
  </button>
</div>
```

### Loading / Progress State

When enrichment is running:

```
<div class="mt-6">
  <!-- Progress bar container -->
  <div class="flex items-center justify-between mb-2">
    <span class="text-sm text-text-secondary">Processing...</span>
    <span class="text-sm font-mono text-text-primary">{processed}/{total}</span>
  </div>

  <!-- Progress bar -->
  <div class="w-full h-2 bg-bg-inset rounded-pill overflow-hidden">
    <div
      class="h-full bg-accent-400 rounded-pill transition-all duration-500 ease-smooth"
      style="width: {percent}%"
    />
  </div>

  <!-- Current item -->
  <div class="mt-3 flex items-center gap-2">
    <div class="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
    <span class="text-xs text-text-tertiary truncate">
      Analyzing: expression_surprise_042.jpg
    </span>
  </div>
</div>
```

**Button state while running**:
```
bg-bg-elevated text-text-secondary border border-white/10 rounded-pill
cursor-not-allowed
Inner: spinner + "Processing..."
```

### Run History Table

```
<div class="mt-8">
  <h4 class="text-sm font-semibold text-text-primary mb-3">Recent Runs</h4>
  <div class="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="border-b border-white/6">
          <th class="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Date</th>
          <th>Assets</th>
          <th>Duration</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/6">
        <tr class="hover:bg-bg-overlay/50 transition-colors duration-100">
          <td class="px-4 py-3 text-sm text-text-primary font-mono">{date}</td>
          <td class="px-4 py-3 text-sm text-text-secondary font-mono">{count}</td>
          <td class="px-4 py-3 text-sm text-text-tertiary">{duration}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded-pill text-xs font-medium bg-success/10 text-success">
              Complete
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 7. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| < md (mobile) | Toolkit: 1-col card grid. Sources table: horizontal scroll. Review: tabs. Gallery: 2-col grid. |
| md (tablet) | Toolkit: 2-col. Sources: full table. Review: tabs. Gallery: 3-col. |
| lg (desktop) | Toolkit: 2-col. Sources: full table. Review: 3-col kanban. Gallery: 4-col. |
| xl (wide) | Same as lg, gallery expands to 5-col. |

---

## 8. Accessibility

- All interactive elements: visible focus ring (`focus:border-accent-400/60 focus:shadow-glow-sm focus:outline-none`)
- Table rows: not focusable; action buttons within are
- Status pills: include screen-reader text (e.g., `<span class="sr-only">Status:</span>`)
- Gallery cards: `role="checkbox"` + `aria-checked` for multi-select mode
- Bulk action bar: `role="toolbar"` + `aria-label="Bulk actions for selected assets"`
- Color is never the sole indicator (pills include text labels alongside colored dots)
