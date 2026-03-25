# M26 — Registration Approval: Design Spec
> Owner: Designer | Status: SPEC COMPLETE | Date: 2026-03-25

---

## 1. User Flow

```
[Sign Up Page] → POST /api/auth/signup → status='pending'
       ↓
[Redirect to /auth/pending]  ← "Account under review"
       ↓
[Admin /admin/users] → Approve / Reject (with optional note)
       ↓
[User signs in] → status='approved' → normal access
                → status='rejected' → error banner with reason
                → status='suspended' → error banner
                → status='pending' → error banner + link to /auth/pending
```

---

## 2. Sign-Up Page Modifications (`src/app/auth/signup/page.tsx`)

### Post-Submit Behavior Change
- Remove auto sign-in after signup.
- On success (201), redirect to `/auth/pending` instead of `/onboarding`.
- Show a brief success toast before redirect (optional, 1s delay):

```
Toast: "Account created! Redirecting..."
Classes: bg-success/10 border border-success/30 rounded-xl px-3 py-2 text-sm text-success
Animation: animate-fade-in → 1s delay → router.push('/auth/pending')
```

No visual layout changes to the signup form itself.

---

## 3. Pending Approval Page (`/auth/pending`)

### Layout
- Full-screen centered layout, same as signin/signup pattern.
- Container: `min-h-screen bg-bg-base flex items-center justify-center px-4`
- Inner: `w-full max-w-md text-center`

### Content Structure

```
┌─────────────────────────────────────────────┐
│                                             │
│              seeneyu (logo link)            │
│                                             │
│     ┌─────────────────────────────────┐     │
│     │                                 │     │
│     │         (Clock icon)            │     │
│     │           48x48                 │     │
│     │     amber glow circle bg        │     │
│     │                                 │     │
│     │   Account Under Review          │     │
│     │                                 │     │
│     │   Your account has been         │     │
│     │   submitted for review.         │     │
│     │   An administrator will         │     │
│     │   verify your details           │     │
│     │   shortly.                      │     │
│     │                                 │     │
│     │   ┌───────────────────────┐     │     │
│     │   │ What happens next?    │     │     │
│     │   │                       │     │     │
│     │   │ 1. Admin reviews      │     │     │
│     │   │ 2. You get approved   │     │     │
│     │   │ 3. Sign in & learn    │     │     │
│     │   └───────────────────────┘     │     │
│     │                                 │     │
│     │   [Back to Sign In] (link)      │     │
│     │                                 │     │
│     └─────────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

### Tailwind Classes

**Logo header** (same as signup):
```
text-2xl font-black tracking-tight text-text-primary hover:text-accent-400 transition-colors
```

**Card container**:
```
bg-bg-surface border border-white/8 rounded-2xl p-8 mt-8
```

**Icon circle** (Lucide `Clock` icon):
```
<div class="mx-auto w-16 h-16 rounded-full bg-accent-400/10 border border-accent-400/20 flex items-center justify-center mb-6">
  <Clock size={28} class="text-accent-400" />
</div>
```

**Heading**:
```
text-xl font-bold text-text-primary mb-3
Content: "Account Under Review"
```

**Description paragraph**:
```
text-sm text-text-secondary leading-relaxed mb-6
Content: "Your account has been submitted for review. An administrator will verify your details shortly. You'll be able to sign in once approved."
```

**"What happens next?" info box**:
```
bg-bg-inset border border-white/6 rounded-xl p-4 text-left mb-6
```

- Section title: `text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3`
- Steps list: `space-y-2`
- Each step: `flex items-start gap-3 text-sm text-text-secondary`
  - Number circle: `flex-shrink-0 w-5 h-5 rounded-full bg-accent-400/15 text-accent-400 text-xs font-bold flex items-center justify-center mt-0.5`
  - Step text: `text-text-secondary text-sm`

Steps content:
1. "An admin reviews your registration"
2. "Your account gets approved"
3. "Sign in and start learning"

**Back link**:
```
text-sm text-accent-400 hover:text-accent-300 transition-colors font-medium
Content: "Back to Sign In" → href="/auth/signin"
```

---

## 4. Sign-In Error States (`src/app/auth/signin/SignInForm.tsx`)

The authorize() callback should return error codes for non-approved users. SignInForm displays contextual error banners.

### Error Banner Variants

All error banners use the existing pattern:
```
<div class="bg-error/10 border border-error/30 rounded-xl px-3 py-2 text-sm text-red-400">
```

But with different content based on error type:

**Invalid credentials** (existing):
```
"Invalid email or password."
```

**Pending approval** (new — use warning style instead of error):
```
Container: bg-warning/10 border border-warning/30 rounded-xl px-3 py-2
Icon: Clock size={14} inline before text
Text: text-sm text-amber-400
Content: "Your account is still under review. You'll be able to sign in once an admin approves it."
Link: "Check status →" → href="/auth/pending" (text-accent-400)
```

**Rejected** (new):
```
Container: bg-error/10 border border-error/30 rounded-xl px-4 py-3
Icon: XCircle size={14} inline
Text: text-sm text-red-400
Content: "Your registration was not approved."
If statusNote present: show reason in a sub-line
  Reason line: text-xs text-text-tertiary mt-1 italic
  "Reason: {statusNote}"
Link: "Contact support" or "Try signing up again →" → href="/auth/signup"
```

**Suspended** (new):
```
Container: bg-error/10 border border-error/30 rounded-xl px-4 py-3
Icon: Ban size={14} inline
Text: text-sm text-red-400
Content: "Your account has been suspended."
If statusNote present: "Reason: {statusNote}" (same sub-line style as rejected)
```

### Error Code Mapping

The NextAuth authorize() should encode error type in the error string:
- `"PENDING"` → show pending banner
- `"REJECTED:reason text"` → show rejected banner, parse reason after colon
- `"SUSPENDED:reason text"` → show suspended banner
- default / `"CredentialsSignin"` → existing invalid credentials message

---

## 5. Admin Users Page — Approval Management (`/admin/users`)

### Filter Tabs

Add horizontal tab bar above the table. Place between the heading and the table.

```
┌──────────────────────────────────────────────────────────────┐
│  Users                                                       │
│  12 registered learners                                      │
│                                                              │
│  [All (12)] [Pending (3)] [Approved (8)] [Rejected (1)]     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Name  │ Email  │ Status │ Role │ Joined │ Actions      │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ ...   │ ...    │ ●pend  │ ...  │ ...    │ [✓] [✗]     │  │
│  │ ...   │ ...    │ ●appr  │ ...  │ ...    │ [Promote]   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Tab bar container**:
```
flex items-center gap-1 mb-4 bg-bg-inset rounded-xl p-1 w-fit
```

**Individual tab** (pill toggle):
```
Default:  px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer
Active:   bg-bg-surface text-text-primary font-medium shadow-sm
```

**Tab with count badge**:
```
Tab label + <span class="ml-1.5 text-xs bg-bg-overlay rounded-full px-1.5 py-0.5 text-text-tertiary">3</span>
Pending tab special: count badge uses bg-warning/20 text-warning for visibility
```

Tabs filter the table by `?status=` query param. "All" shows all users.

### Status Column (new, replaces nothing — add between Role and Joined)

**Status pill variants**:

| Status | Classes |
|--------|---------|
| `pending` | `bg-warning/15 text-warning border border-warning/20 text-xs font-medium px-2 py-0.5 rounded-full` |
| `approved` | `bg-success/15 text-success border border-success/20 text-xs font-medium px-2 py-0.5 rounded-full` |
| `rejected` | `bg-error/15 text-error border border-error/20 text-xs font-medium px-2 py-0.5 rounded-full` |
| `suspended` | `bg-bg-overlay text-text-tertiary border border-white/10 text-xs font-medium px-2 py-0.5 rounded-full` |

Each pill includes a small dot indicator before text:
```
<span class="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
```

### Action Buttons (context-dependent)

**For pending users** — show Approve + Reject side by side:
```
┌─────────────────────────────────────┐
│  [✓ Approve]          [✗ Reject]    │
└─────────────────────────────────────┘
```

**Approve button**:
```
flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/10 rounded-lg transition-colors
Icon: Check size={12}
```

**Reject button**:
```
flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-error hover:bg-error/10 rounded-lg transition-colors
Icon: X size={12}
```

**For approved users** — keep existing Promote/Demote buttons + add Suspend:
```
Suspend button:
flex items-center gap-1 px-2.5 py-1 text-xs text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors
Icon: Ban size={12}
```

**For rejected/suspended users** — show Re-approve:
```
flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors
Icon: RotateCcw size={12}
Label: "Re-approve"
```

### Rejection Reason Modal

Triggered when clicking "Reject" on a pending user.

**Backdrop**:
```
fixed inset-0 z-modal bg-black/60 backdrop-blur-sm flex items-center justify-center px-4
Animation: fade-in 200ms
```

**Modal card**:
```
bg-bg-elevated border border-white/8 rounded-2xl p-6 w-full max-w-sm shadow-xl
Animation: animate-slide-up
```

**Modal content**:
```
┌─────────────────────────────────────┐
│  Reject Registration                │
│                                     │
│  Are you sure you want to reject    │
│  {user.name}'s registration?        │
│                                     │
│  Reason (optional):                 │
│  ┌───────────────────────────────┐  │
│  │ Enter reason...               │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Cancel]              [Reject]     │
└─────────────────────────────────────┘
```

**Modal heading**: `text-lg font-bold text-text-primary mb-2`

**Description**: `text-sm text-text-secondary mb-4`

**Textarea**:
```
w-full bg-bg-inset border border-white/10 rounded-xl px-3 py-2 text-text-primary text-sm
placeholder:text-text-tertiary resize-none h-20
focus:outline-none focus:border-accent-400/50 transition-colors
```

**Cancel button** (ghost):
```
px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-xl transition-colors
```

**Reject button** (danger):
```
bg-error/10 text-error border border-error/30 rounded-xl px-4 py-2 text-sm font-medium
hover:bg-error/20 hover:border-error/50 transition-all
```

**Button row**: `flex items-center justify-end gap-3 mt-6`

---

## 6. Responsive Notes

- **Pending page**: Works as-is on all breakpoints (max-w-md centered).
- **Admin users table**: On mobile (`< md`), table scrolls horizontally with `overflow-x-auto`. Status column and Actions column remain visible. Consider hiding "Sessions" and "Joined" columns on mobile with `hidden md:table-cell`.
- **Rejection modal**: `max-w-sm` ensures it fits mobile screens. No breakpoint changes needed.
- **Filter tabs**: On mobile, tabs may overflow. Wrap in `overflow-x-auto` with `scrollbar-hide` (webkit-scrollbar display:none). Or stack vertically on very small screens — but pill toggle at `w-fit` should be fine for 4 tabs.

---

## 7. Lucide Icons Used

| Icon | Import | Usage |
|------|--------|-------|
| `Clock` | `lucide-react` | Pending page icon, pending error banner |
| `XCircle` | `lucide-react` | Rejected error banner |
| `Ban` | `lucide-react` | Suspended error banner, suspend action |
| `Check` | `lucide-react` | Approve action button |
| `X` | `lucide-react` | Reject action button |
| `RotateCcw` | `lucide-react` | Re-approve action button |
| `ShieldCheck` | `lucide-react` | Existing promote button (keep) |
| `UserMinus` | `lucide-react` | Existing demote button (keep) |
