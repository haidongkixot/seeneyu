# M21 — Arcade Content Management Spec
> Designer: M21 delivery
> Date: 2026-03-25
> Status: READY FOR IMPLEMENTATION

---

## Overview

Admin CRUD for ArcadeBundle and ArcadeChallenge at `/admin/arcade`. Create/edit/delete bundles and their challenges. Reference image capture from YouTube frame or web URL. Drag-to-reorder challenges within a bundle. Image upload to Vercel Blob.

**Visual language**: Consistent with existing admin CMS (M8). Table + modal pattern. Dark surface cards, standard form inputs, inline editing where practical.

---

## Screen 1: `/admin/arcade` — Bundle List

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚡ Arcade Content                              [ + New Bundle ]      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Title            Challenges  Difficulty  XP Total  Status  Act  ││
│  │  ─────────────────────────────────────────────────────────────   ││
│  │  Confidence &     10          ●●○ Int.    200       Active  [✎] ││
│  │  Authority                                                  [🗑] ││
│  │  ─────────────────────────────────────────────────────────────   ││
│  │  Empathy &        10          ●○○ Beg.    200       Active  [✎] ││
│  │  Warmth                                                     [🗑] ││
│  │  ─────────────────────────────────────────────────────────────   ││
│  │  Tension &        10          ●●● Adv.    200       Draft   [✎] ││
│  │  Conflict                                                   [🗑] ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Bundle Table

```tsx
<div className="rounded-2xl bg-bg-surface border border-white/8 shadow-card overflow-hidden">
  {/* Header */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
    <div className="flex items-center gap-2">
      <Zap size={18} className="text-accent-400" />
      <h1 className="text-lg font-bold text-text-primary">Arcade Content</h1>
    </div>
    <button
      onClick={openNewBundleModal}
      className="flex items-center gap-1.5 px-4 py-2 rounded-pill
                 bg-accent-400 text-text-inverse font-semibold text-sm
                 hover:bg-accent-500 shadow-glow-sm transition-all duration-150">
      <Plus size={14} />
      New Bundle
    </button>
  </div>

  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-white/8">
        <th className="text-left py-3 px-5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Title</th>
        <th className="text-center py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Challenges</th>
        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Difficulty</th>
        <th className="text-right py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">XP Total</th>
        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
        <th className="py-3 px-4 w-24"></th>
      </tr>
    </thead>
    <tbody>
      {bundles.map(bundle => (
        <tr key={bundle.id} className="border-b border-white/6 last:border-0
                                        hover:bg-bg-overlay/30 transition-colors cursor-pointer"
            onClick={() => navigateToBundle(bundle.id)}>
          <td className="py-3 px-5">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{bundle.themeEmoji}</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">{bundle.title}</p>
                <p className="text-xs text-text-tertiary truncate max-w-[200px]">{bundle.description}</p>
              </div>
            </div>
          </td>
          <td className="py-3 px-4 text-center text-sm text-text-primary tabular-nums">
            {bundle.challengeCount}
          </td>
          <td className="py-3 px-4">
            <DifficultyDots level={bundle.difficulty} />
          </td>
          <td className="py-3 px-4 text-right text-sm text-accent-400 font-semibold tabular-nums">
            {bundle.xpTotal} XP
          </td>
          <td className="py-3 px-4">
            <BundleStatusBadge status={bundle.status} />
          </td>
          <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEditBundleModal(bundle)}
                className="p-1.5 rounded-lg text-text-tertiary
                           hover:text-text-primary hover:bg-bg-overlay transition-colors">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => confirmDeleteBundle(bundle)}
                className="p-1.5 rounded-lg text-text-tertiary
                           hover:text-error hover:bg-error/10 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### BundleStatusBadge

```tsx
function BundleStatusBadge({ status }: { status: 'active' | 'draft' | 'archived' }) {
  const config = {
    active:   { label: 'Active', classes: 'bg-success/10 text-success border-success/20' },
    draft:    { label: 'Draft', classes: 'bg-white/5 text-text-tertiary border-white/10' },
    archived: { label: 'Archived', classes: 'bg-white/5 text-text-tertiary border-white/10' },
  }[status]

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill
                     text-xs font-semibold border ${config.classes}`}>
      {config.label}
    </span>
  )
}
```

---

## Screen 2: Bundle Detail / Challenge List — `/admin/arcade/[bundleId]`

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back to Arcade                                  [ Edit Bundle ]   │
│  🏆 Confidence & Authority                                          │
│  Master the body language of leaders and executives.                 │
│  Difficulty: ●●○ Intermediate   Status: Active   10 challenges      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Challenges                                       [ + Add Challenge ]│
│                                                                      │
│  ┌── ≡ ─────────────────────────────────────────────────────────────┐│
│  │  1  The Power Stance              Facial   ●○○   +20XP   [✎][🗑]││
│  ├── ≡ ─────────────────────────────────────────────────────────────┤│
│  │  2  Commanding Eye Contact        Facial   ●●○   +20XP   [✎][🗑]││
│  ├── ≡ ─────────────────────────────────────────────────────────────┤│
│  │  3  Deliberate Stillness          Gesture  ●●●   +20XP   [✎][🗑]││
│  └──────────────────────────────────────────────────────────────────┘│
│  (drag ≡ handles to reorder)                                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Bundle Header

```tsx
<div className="mb-8">
  <Link href="/admin/arcade"
        className="flex items-center gap-1 text-sm text-text-tertiary
                   hover:text-text-primary transition-colors mb-4">
    <ArrowLeft size={16} />
    Back to Arcade
  </Link>

  <div className="flex items-start justify-between">
    <div className="flex items-start gap-3">
      <span className="text-3xl">{bundle.themeEmoji}</span>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{bundle.title}</h1>
        <p className="text-sm text-text-secondary mt-1">{bundle.description}</p>
        <div className="flex items-center gap-4 mt-3">
          <DifficultyDots level={bundle.difficulty} />
          <BundleStatusBadge status={bundle.status} />
          <span className="text-xs text-text-tertiary">{bundle.challenges.length} challenges</span>
        </div>
      </div>
    </div>

    <button
      onClick={() => openEditBundleModal(bundle)}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl
                 border border-white/15 text-text-secondary text-sm font-medium
                 hover:border-white/25 hover:text-text-primary transition-all duration-150">
      <Pencil size={14} />
      Edit Bundle
    </button>
  </div>
</div>
```

### Challenge Reorderable List

Uses drag handles for reordering. Recommend `@dnd-kit/core` or `react-beautiful-dnd`.

```tsx
<div className="rounded-2xl bg-bg-surface border border-white/8 shadow-card overflow-hidden">
  <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
    <h2 className="text-sm font-semibold text-text-primary">Challenges</h2>
    <button
      onClick={openNewChallengeModal}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                 bg-accent-400/10 text-accent-400 text-xs font-semibold
                 border border-accent-400/20 hover:bg-accent-400/20
                 transition-all duration-150">
      <Plus size={12} />
      Add Challenge
    </button>
  </div>

  {/* Sortable list */}
  <DndContext onDragEnd={handleReorder}>
    <SortableContext items={challenges.map(c => c.id)}>
      {challenges.map((challenge, index) => (
        <SortableChallengeRow
          key={challenge.id}
          challenge={challenge}
          index={index}
          onEdit={() => openEditChallengeModal(challenge)}
          onDelete={() => confirmDeleteChallenge(challenge)}
        />
      ))}
    </SortableContext>
  </DndContext>
</div>
```

### SortableChallengeRow

```tsx
function SortableChallengeRow({
  challenge,
  index,
  onEdit,
  onDelete,
}: {
  challenge: ArcadeChallenge
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: challenge.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 px-5 py-3 border-b border-white/6 last:border-0
                 hover:bg-bg-overlay/20 transition-colors group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing
                   text-text-tertiary hover:text-text-secondary">
        <GripVertical size={16} />
      </button>

      {/* Order number */}
      <span className="w-6 text-center text-xs font-bold text-text-tertiary tabular-nums">
        {index + 1}
      </span>

      {/* Reference image thumbnail */}
      <div className="w-10 h-10 rounded-lg bg-bg-inset border border-white/8 overflow-hidden flex-shrink-0">
        {challenge.referenceImageUrl ? (
          <img src={challenge.referenceImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">
            {challenge.type === 'facial' ? '😐' : '🧍'}
          </div>
        )}
      </div>

      {/* Title + type */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{challenge.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
            challenge.type === 'facial'
              ? 'bg-violet-500/15 text-violet-300'
              : 'bg-cyan-500/15 text-cyan-300'
          }`}>
            {challenge.type === 'facial' ? 'Facial' : 'Gesture'}
          </span>
          <DifficultyDots level={challenge.difficulty} />
        </div>
      </div>

      {/* XP */}
      <span className="text-xs font-semibold text-accent-400 tabular-nums">
        +{challenge.xpReward} XP
      </span>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit}
                className="p-1.5 rounded-lg text-text-tertiary
                           hover:text-text-primary hover:bg-bg-overlay transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete}
                className="p-1.5 rounded-lg text-text-tertiary
                           hover:text-error hover:bg-error/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
```

---

## Modal: Bundle Create/Edit

Standard admin modal pattern.

```
┌──────────────────────────────────────────────────────────────┐
│  Create Bundle                                          [✕]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Title          [ Confidence & Authority              ]      │
│  Description    [ Master the body language of...       ]     │
│  Theme Emoji    [ 🏆 ]                                       │
│  Difficulty     [ ○ Beginner  ● Intermediate  ○ Advanced ]   │
│  XP per chall.  [ 20 ]                                       │
│  Status         [ ● Active   ○ Draft ]                       │
│                                                              │
│                       [ Cancel ]  [ Save Bundle ]            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Modal Component

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

  {/* Modal */}
  <div className="relative w-full max-w-lg rounded-2xl bg-bg-elevated border border-white/10
                  shadow-xl overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
      <h2 className="text-lg font-bold text-text-primary">
        {isEdit ? 'Edit Bundle' : 'Create Bundle'}
      </h2>
      <button onClick={onClose}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary
                         hover:bg-bg-overlay transition-colors">
        <X size={18} />
      </button>
    </div>

    {/* Body */}
    <div className="px-6 py-5 flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-bg-inset border border-white/10
                     text-sm text-text-primary placeholder:text-text-tertiary
                     focus:border-accent-400/60 focus:shadow-glow-sm outline-none
                     transition-all duration-150"
          placeholder="Bundle title..."
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-bg-inset border border-white/10
                     text-sm text-text-primary placeholder:text-text-tertiary resize-none
                     focus:border-accent-400/60 focus:shadow-glow-sm outline-none
                     transition-all duration-150"
          placeholder="Short description..."
        />
      </div>

      {/* Theme Emoji */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Theme Emoji</label>
        <input
          type="text"
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          className="w-20 px-4 py-3 rounded-lg bg-bg-inset border border-white/10
                     text-2xl text-center
                     focus:border-accent-400/60 focus:shadow-glow-sm outline-none
                     transition-all duration-150"
        />
      </div>

      {/* Difficulty radio */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-2">Difficulty</label>
        <div className="flex items-center gap-3">
          {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium
                         transition-all duration-150 ${
                difficulty === level
                  ? 'border-accent-400/40 bg-accent-400/10 text-text-primary'
                  : 'border-white/10 text-text-tertiary hover:border-white/20'
              }`}
            >
              <DifficultyDots level={level} />
            </button>
          ))}
        </div>
      </div>

      {/* XP per challenge */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">XP per Challenge</label>
        <input
          type="number"
          value={xpReward}
          onChange={e => setXpReward(Number(e.target.value))}
          min={5}
          max={100}
          step={5}
          className="w-24 px-4 py-3 rounded-lg bg-bg-inset border border-white/10
                     text-sm text-text-primary tabular-nums
                     focus:border-accent-400/60 focus:shadow-glow-sm outline-none
                     transition-all duration-150"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-2">Status</label>
        <div className="flex items-center gap-3">
          {(['active', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize
                         transition-all duration-150 ${
                status === s
                  ? 'border-accent-400/40 bg-accent-400/10 text-text-primary'
                  : 'border-white/10 text-text-tertiary hover:border-white/20'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8">
      <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-sm font-medium
                         text-text-secondary hover:text-text-primary hover:border-white/25
                         transition-all duration-150">
        Cancel
      </button>
      <button onClick={handleSave}
              className="px-5 py-2.5 rounded-pill bg-accent-400 text-text-inverse
                         font-semibold text-sm hover:bg-accent-500 shadow-glow-sm
                         transition-all duration-150">
        {isEdit ? 'Save Changes' : 'Create Bundle'}
      </button>
    </div>
  </div>
</div>
```

---

## Modal: Challenge Create/Edit

Same modal pattern, with additional fields for reference image.

### Fields

| Field | Type | Notes |
|---|---|---|
| Title | text | Challenge name |
| Description | textarea | Instructions for the user |
| Type | radio | `facial` or `gesture` |
| Difficulty | radio | beginner / intermediate / advanced |
| Context | textarea | Optional — film/character reference |
| XP Reward | number | Default from bundle |
| Reference Image | image upload | See ReferenceImagePicker below |

---

### ReferenceImagePicker

Three ways to add a reference image:

```
┌──────────────────────────────────────────────────────────────┐
│  Reference Image                                              │
│                                                              │
│  ┌─────────────┐                                             │
│  │             │  ← current image (or placeholder)           │
│  │   [image]   │                                             │
│  │             │                                             │
│  └─────────────┘                                             │
│                                                              │
│  [ 📁 Upload ]  [ 🔗 From URL ]  [ ▶️ YouTube Frame ]       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

```tsx
function ReferenceImagePicker({
  currentUrl,
  onChange,
}: {
  currentUrl?: string
  onChange: (url: string) => void
}) {
  const [mode, setMode] = useState<'upload' | 'url' | 'youtube' | null>(null)

  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-2">
        Reference Image
      </label>

      {/* Preview */}
      <div className="w-32 h-32 rounded-xl bg-bg-inset border border-white/10 overflow-hidden mb-3">
        {currentUrl ? (
          <img src={currentUrl} alt="Reference" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={24} className="text-text-tertiary" />
          </div>
        )}
      </div>

      {/* Source buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('upload')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10
                     text-xs font-medium text-text-secondary
                     hover:border-white/20 hover:text-text-primary transition-all duration-150">
          <Upload size={12} />
          Upload
        </button>
        <button
          onClick={() => setMode('url')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10
                     text-xs font-medium text-text-secondary
                     hover:border-white/20 hover:text-text-primary transition-all duration-150">
          <Link2 size={12} />
          From URL
        </button>
        <button
          onClick={() => setMode('youtube')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10
                     text-xs font-medium text-text-secondary
                     hover:border-white/20 hover:text-text-primary transition-all duration-150">
          <Play size={12} />
          YouTube Frame
        </button>
      </div>

      {/* Mode-specific UI */}
      {mode === 'upload' && (
        <div className="mt-3 p-4 rounded-lg border border-dashed border-white/15 bg-bg-inset
                        text-center">
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" ref={fileRef} />
          <button onClick={() => fileRef.current?.click()}
                  className="text-sm text-accent-400 hover:underline">
            Choose file
          </button>
          <p className="text-xs text-text-tertiary mt-1">PNG, JPG up to 2MB</p>
        </div>
      )}

      {mode === 'url' && (
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-bg-inset border border-white/10
                       text-sm text-text-primary placeholder:text-text-tertiary
                       focus:border-accent-400/60 outline-none transition-all duration-150"
          />
          <button onClick={handleUrlSubmit}
                  className="px-3 py-2 rounded-lg bg-accent-400/10 text-accent-400
                             text-xs font-semibold border border-accent-400/20
                             hover:bg-accent-400/20 transition-all duration-150">
            Load
          </button>
        </div>
      )}

      {mode === 'youtube' && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="text"
            placeholder="YouTube Video ID (e.g., dQw4w9WgXcQ)"
            value={ytVideoId}
            onChange={e => setYtVideoId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-bg-inset border border-white/10
                       text-sm text-text-primary placeholder:text-text-tertiary
                       focus:border-accent-400/60 outline-none transition-all duration-150"
          />
          <input
            type="number"
            placeholder="Timestamp (seconds)"
            value={ytTimestamp}
            onChange={e => setYtTimestamp(Number(e.target.value))}
            className="w-40 px-3 py-2 rounded-lg bg-bg-inset border border-white/10
                       text-sm text-text-primary placeholder:text-text-tertiary
                       focus:border-accent-400/60 outline-none transition-all duration-150"
          />
          <button onClick={handleYouTubeCapture}
                  className="self-start px-3 py-2 rounded-lg bg-accent-400/10 text-accent-400
                             text-xs font-semibold border border-accent-400/20
                             hover:bg-accent-400/20 transition-all duration-150">
            Capture Frame
          </button>
          <p className="text-xs text-text-tertiary">
            Uses YouTube thumbnail API: img.youtube.com/vi/{'{id}'}/maxresdefault.jpg
          </p>
        </div>
      )}
    </div>
  )
}
```

---

## Delete Confirmation Dialog

Standard destructive confirmation:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
  <div className="relative w-full max-w-sm rounded-2xl bg-bg-elevated border border-white/10
                  shadow-xl p-6 text-center">
    <div className="w-12 h-12 rounded-full bg-error/10 border border-error/20
                    flex items-center justify-center mx-auto mb-4">
      <AlertTriangle size={20} className="text-error" />
    </div>
    <h3 className="text-lg font-bold text-text-primary mb-2">
      Delete {itemType}?
    </h3>
    <p className="text-sm text-text-secondary mb-6">
      This will permanently delete "{itemName}". This action cannot be undone.
    </p>
    <div className="flex items-center justify-center gap-3">
      <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-sm font-medium
                         text-text-secondary hover:text-text-primary transition-all duration-150">
        Cancel
      </button>
      <button onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl bg-error text-white font-semibold text-sm
                         hover:bg-error/80 transition-all duration-150">
        Delete
      </button>
    </div>
  </div>
</div>
```

---

## Mobile Behavior

| Screen | Mobile |
|---|---|
| Bundle list table | Card-style layout instead of table. Each bundle as a card. |
| Bundle detail | Challenge list remains vertical, drag handle still works |
| Modals | Full-width, rounded at top only (sheet pattern) on `< md` |
| ReferenceImagePicker | Source buttons wrap to 2 rows |

---

## Files to Create / Modify

| File | Change |
|---|---|
| `src/app/admin/arcade/page.tsx` | **NEW** — bundle list |
| `src/app/admin/arcade/[bundleId]/page.tsx` | **NEW** — bundle detail + challenge list |
| `src/components/admin/arcade/BundleModal.tsx` | **NEW** — create/edit bundle modal |
| `src/components/admin/arcade/ChallengeModal.tsx` | **NEW** — create/edit challenge modal |
| `src/components/admin/arcade/SortableChallengeRow.tsx` | **NEW** — drag-reorder row |
| `src/components/admin/arcade/ReferenceImagePicker.tsx` | **NEW** — image source picker |
| `src/components/admin/arcade/DeleteConfirmDialog.tsx` | **NEW** |
| `src/components/admin/arcade/BundleStatusBadge.tsx` | **NEW** |
| `src/app/api/admin/arcade/bundles/route.ts` | **NEW** — CRUD API |
| `src/app/api/admin/arcade/bundles/[id]/route.ts` | **NEW** — single bundle CRUD |
| `src/app/api/admin/arcade/challenges/route.ts` | **NEW** — challenge CRUD |
| `src/app/api/admin/arcade/challenges/[id]/route.ts` | **NEW** — single challenge CRUD |
| `src/app/api/admin/arcade/challenges/reorder/route.ts` | **NEW** — reorder endpoint |
| `src/app/api/admin/arcade/upload/route.ts` | **NEW** — image upload to Vercel Blob |
| `src/app/admin/layout.tsx` or sidebar | **MODIFY** — add Arcade Management nav link |

---

## Dependencies

- `@dnd-kit/core` + `@dnd-kit/sortable` for drag-to-reorder (or simpler: up/down buttons as fallback)
- Vercel Blob already configured (BLOB_READ_WRITE_TOKEN exists from M4)
