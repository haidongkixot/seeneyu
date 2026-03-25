# M27 — Discussions (Comments & Replies): Design Spec
> Owner: Designer | Status: SPEC COMPLETE | Date: 2026-03-25

---

## 1. Overview

Text comment/reply threads on foundation lessons and arcade challenge pages. Flat threading (1 level deep: top-level comments + indented replies). Users can post, edit (within 15 min), delete own comments. Admin can hide/unhide.

---

## 2. Placement & Layout

### On Foundation Lesson Pages (`/foundation/[courseSlug]/[lessonSlug]/page.tsx`)

Comments section sits below the lesson content (theory + examples + quiz), separated by a divider.

```
┌─────────────────────────────────────────────┐
│  [Lesson content: theory, examples, quiz]   │
│                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                             │
│  Discussion (5 comments)                    │
│                                             │
│  [CommentForm — "Share your thoughts..."]   │
│                                             │
│  [CommentThread]                            │
│    [CommentCard — top level]                │
│      [CommentCard — reply, indented]        │
│      [CommentCard — reply, indented]        │
│    [CommentCard — top level]                │
│    [CommentCard — top level]                │
│      [CommentCard — reply, indented]        │
│                                             │
└─────────────────────────────────────────────┘
```

### On Arcade Bundle Pages (`/arcade/[bundleId]/page.tsx`)

Comments section sits below the challenge list / scoring area, same pattern.

### Section Container

```
Container: mt-12 pt-8 border-t border-white/6
Max width matches parent content: max-w-3xl (or inherits from page layout)
```

### Section Header

```
<div class="flex items-center justify-between mb-6">
  <div class="flex items-center gap-2">
    <MessageSquare size={20} class="text-text-secondary" />
    <h2 class="text-xl font-bold text-text-primary">Discussion</h2>
    <span class="text-sm text-text-tertiary">(5 comments)</span>
  </div>
</div>
```

---

## 3. CommentForm Component

### Layout

```
┌─────────────────────────────────────────────────┐
│  ┌──┐  ┌──────────────────────────────────────┐ │
│  │HH│  │ Share your thoughts on this lesson...│ │
│  │  │  │                                      │ │
│  └──┘  └──────────────────────────────────────┘ │
│              128/500                    [Post]   │
└─────────────────────────────────────────────────┘
```

### Structure

**Outer container** (flex row):
```
flex gap-3 items-start
```

**Avatar circle** (current user):
```
flex-shrink-0 w-8 h-8 rounded-full bg-accent-400/20 text-accent-400 text-xs font-bold flex items-center justify-center
Content: user initials (same pattern as NavBar avatar)
```

**Form area** (flex-1):
```
flex-1
```

**Textarea**:
```
w-full bg-bg-inset border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary
placeholder:text-text-tertiary resize-none min-h-[80px] max-h-[200px]
focus:outline-none focus:border-accent-400/40 focus:shadow-glow-sm transition-all
```
- Placeholder text: "Share your thoughts on this lesson..." (lesson page) or "Share your thoughts on this challenge..." (arcade page)
- Max length: 500 characters

**Footer row** (below textarea):
```
flex items-center justify-between mt-2
```

**Character count**:
```
text-xs text-text-tertiary
When > 450: text-warning
When = 500: text-error
Format: "128/500"
```

**Post button**:
```
bg-accent-400 text-text-inverse rounded-xl px-4 py-1.5 text-sm font-semibold
hover:bg-accent-500 transition-all duration-150
disabled:opacity-40 disabled:cursor-not-allowed
```
- Disabled when textarea is empty or only whitespace.
- Shows `<Loader2 size={14} class="animate-spin" />` when submitting.

### Reply Form Variant

When replying to a comment, the CommentForm appears inline below the parent comment, slightly indented.

```
Container: ml-11 mt-3 (aligns with reply indentation)
Textarea placeholder: "Reply to {commenter name}..."
Textarea min-h: 60px (smaller than top-level form)
Show [Cancel] ghost button next to [Reply] button
```

**Cancel button**:
```
px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-xl transition-colors
```

### Unauthenticated State

If user is not signed in, replace the form with a prompt:

```
┌─────────────────────────────────────────────────┐
│  Sign in to join the discussion                 │
│  [Sign In] (link → /auth/signin)                │
└─────────────────────────────────────────────────┘
```

```
Container: bg-bg-inset border border-white/6 rounded-xl p-4 text-center
Text: text-sm text-text-secondary mb-2
Link: text-accent-400 hover:text-accent-300 font-medium text-sm
```

---

## 4. CommentCard Component

### Top-Level Comment Layout

```
┌─────────────────────────────────────────────────┐
│  ┌──┐  Jane Doe · 2 hours ago          [···]   │
│  │JD│                                           │
│  └──┘  This lesson really helped me             │
│        understand the importance of              │
│        maintaining eye contact during            │
│        conversations.                            │
│                                                  │
│        [↩ Reply]                                 │
│                                                  │
│        ┌─────────────────────────────────────┐   │
│        │ (indented replies here)              │   │
│        └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Tailwind Classes

**Card container** (top-level):
```
flex gap-3 items-start py-4
Not the first child: border-t border-white/5
```

**Avatar circle** (initials):
```
flex-shrink-0 w-8 h-8 rounded-full bg-bg-overlay text-text-secondary text-xs font-bold flex items-center justify-center
```

Color variants for visual variety (hash user ID to pick one):
```
Variant A: bg-violet-500/20 text-violet-400
Variant B: bg-cyan-500/20 text-cyan-400
Variant C: bg-emerald-500/20 text-emerald-400
Variant D: bg-amber-500/20 text-amber-400
Variant E: bg-rose-500/20 text-rose-400
```

Formula: `variants[hashCode(userId) % 5]`

**Content area** (flex-1):
```
flex-1 min-w-0
```

**Header row**:
```
flex items-center gap-2 mb-1
```

- Name: `text-sm font-medium text-text-primary`
- Separator dot: `text-text-tertiary text-xs` content "·"
- Timestamp: `text-xs text-text-tertiary` — relative format ("2 hours ago", "Just now", "Yesterday")
- "(edited)" indicator if comment was edited: `text-xs text-text-tertiary italic`

**Comment body**:
```
text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words
```

**Action row** (below body):
```
flex items-center gap-3 mt-2
```

**Reply button**:
```
flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors
Icon: Reply size={12}
Label: "Reply"
```

**Overflow menu button** (three dots, visible on hover or for own comments):
```
ml-auto p-1 text-text-tertiary hover:text-text-secondary rounded transition-colors
Icon: MoreHorizontal size={14}
```

**Overflow dropdown** (appears on click):
```
absolute right-0 top-6 w-36 bg-bg-elevated border border-white/8 rounded-xl shadow-lg py-1 z-30
```

Dropdown items:
```
px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors w-full text-left flex items-center gap-2
```

- Own comment (< 15 min): "Edit" (Pencil icon) + "Delete" (Trash2 icon, text-error on hover)
- Own comment (>= 15 min): "Delete" only
- Admin on any comment: "Hide" (EyeOff icon) or "Unhide" (Eye icon)

### Reply Comment Layout (indented)

```
Container: ml-11 (matches avatar width + gap)
Avatar: w-6 h-6 (smaller), text-[10px]
Name: text-xs
Body: text-xs text-text-secondary
No nested reply button (flat threading — replies cannot have replies)
```

### Hidden Comment (admin-hidden)

Visible only to admins. Collapsed with indicator:
```
Container: opacity-50
Body replaced with: "This comment has been hidden by an admin."
  Classes: text-xs text-text-tertiary italic
Admin sees: [Unhide] action in overflow menu
```

### Editing State

When user clicks "Edit":
- Comment body is replaced with a textarea (same style as CommentForm textarea).
- Pre-filled with existing content.
- Below textarea: [Cancel] [Save] buttons.
- Save button: `bg-accent-400 text-text-inverse rounded-xl px-3 py-1 text-xs font-semibold`
- Cancel button: `text-xs text-text-secondary hover:text-text-primary`

### Delete Confirmation

Inline confirmation replaces the comment body momentarily:
```
"Delete this comment?" [Cancel] [Delete]
Delete button: text-xs text-error hover:bg-error/10 rounded-lg px-2 py-1 font-medium
```

---

## 5. CommentThread Component

### Structure

```tsx
<div className="space-y-0">
  {/* Sorted by createdAt ascending (oldest first) */}
  {topLevelComments.map(comment => (
    <div key={comment.id}>
      <CommentCard comment={comment} />
      {comment.replies.length > 0 && (
        <div className="ml-11 space-y-0">
          {comment.replies.map(reply => (
            <CommentCard key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  ))}
</div>
```

### Loading State

Show 3 skeleton comment cards:
```
Each skeleton:
  flex gap-3 py-4 animate-pulse
  Avatar: w-8 h-8 rounded-full bg-bg-overlay
  Content:
    Name line: h-3 w-24 rounded bg-bg-overlay mb-2
    Body line 1: h-3 w-full rounded bg-bg-overlay mb-1.5
    Body line 2: h-3 w-3/4 rounded bg-bg-overlay
```

### Empty State

When no comments exist:

```
┌─────────────────────────────────────────────────┐
│                                                  │
│       (MessageSquare icon, 32px, tertiary)       │
│                                                  │
│       No comments yet                            │
│       Be the first to share your thoughts.       │
│                                                  │
└─────────────────────────────────────────────────┘
```

```
Container: text-center py-12
Icon: MessageSquare size={32} class="mx-auto text-text-tertiary mb-3"
Heading: text-sm font-medium text-text-secondary mb-1 → "No comments yet"
Subtext: text-xs text-text-tertiary → "Be the first to share your thoughts."
```

### Pagination

If > 20 comments, show "Load more comments" button at bottom:
```
w-full py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-xl transition-colors text-center
Content: "Load more comments (showing 20 of 47)"
```

---

## 6. Admin Moderation Page (`/admin/comments`)

### Layout

Standard admin page layout (same as `/admin/users`):

```
┌──────────────────────────────────────────────────────────────┐
│  Comment Moderation                                          │
│  Manage user comments across all content                     │
│                                                              │
│  [All] [Reported] [Hidden]                                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ User    │ Comment (truncated)  │ On      │ Date │ Act  │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Jane D  │ "This was really..." │ Lesson  │ 2h   │ [H]  │  │
│  │ Bob S   │ "Great challenge..." │ Arcade  │ 1d   │ [H]  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Width | Content |
|--------|-------|---------|
| User | auto | Name + avatar initials |
| Comment | flex-1 | Truncated to 80 chars with ellipsis `truncate max-w-xs` |
| Context | auto | "Lesson: {name}" or "Arcade: {name}" — link to source page |
| Posted | auto | Relative time, `text-xs text-text-tertiary` |
| Actions | auto | Hide/Unhide toggle + Delete button |

### Action Buttons

**Hide button**:
```
flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary hover:text-warning hover:bg-warning/10 rounded-lg transition-colors
Icon: EyeOff size={12}
```

**Unhide button**:
```
flex items-center gap-1 px-2 py-1 text-xs text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors
Icon: Eye size={12}
```

**Delete button** (destructive, with confirmation):
```
flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors
Icon: Trash2 size={12}
```

---

## 7. Rate Limit Feedback

When user hits 5 comments/min rate limit, show inline error below the form:

```
Container: bg-warning/10 border border-warning/30 rounded-xl px-3 py-2 mt-2
Text: text-xs text-warning
Content: "You're posting too quickly. Please wait a moment before trying again."
Animation: animate-fade-in
```

---

## 8. Responsive Notes

- **Mobile (< md)**: CommentForm and CommentCard take full width. Avatar sizes remain the same. Reply indentation `ml-11` reduces to `ml-8` on mobile via `ml-8 md:ml-11`.
- **Admin moderation table**: Horizontal scroll on mobile. Hide "Context" column on small screens: `hidden md:table-cell`.
- **Overflow menu**: Position with `right-0` to avoid going off-screen on mobile.

---

## 9. Lucide Icons Used

| Icon | Import | Usage |
|------|--------|-------|
| `MessageSquare` | `lucide-react` | Section header, empty state |
| `Reply` | `lucide-react` | Reply button on comment |
| `MoreHorizontal` | `lucide-react` | Overflow menu trigger |
| `Pencil` | `lucide-react` | Edit action in dropdown |
| `Trash2` | `lucide-react` | Delete action |
| `EyeOff` | `lucide-react` | Hide comment (admin) |
| `Eye` | `lucide-react` | Unhide comment (admin) |
| `Loader2` | `lucide-react` | Submit loading spinner |

---

## 10. XSS & Sanitization Notes (for developer)

- All comment body text renders as plain text (`whitespace-pre-wrap`), never `dangerouslySetInnerHTML`.
- User names displayed via `textContent` equivalent (React default escaping is sufficient).
- Server-side: sanitize input with a library like `sanitize-html` or simple regex to strip HTML tags before storing.
