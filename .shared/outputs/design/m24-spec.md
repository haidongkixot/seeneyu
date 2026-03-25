# M24 — Access Control Spec
> Designer: M24 delivery
> Date: 2026-03-25
> Status: READY FOR IMPLEMENTATION

---

## Overview

Gate premium content behind authentication. Non-logged-in users can browse freely but see only the first 3 arcade challenges per type. Practice and Record flows require sign-in. Locked content shows a blurred overlay with lock icon and sign-in prompt.

**Goal**: Convert free browsers into registered users. Never block discovery — always let users see what's behind the gate (blurred).

---

## Design Vocabulary

| Token | Use |
|---|---|
| **AuthGate** | Wrapper component: if user not authenticated, renders LockedOverlay instead of children |
| **LockedContentCard** | Blurred content card with lock icon + CTA |
| **SignInPrompt** | Inline prompt with sign-in/sign-up buttons |
| **FreeTierBadge** | Small pill showing "Free" or "3 of 10 available" |

---

## Component 1: LockedContentCard

Overlays on top of any card (arcade challenge, practice button, record button) when user doesn't have access.

### Layout

```
┌────────────────────────────────────┐
│                                    │
│   [blurred content underneath]     │
│                                    │
│        ┌──────────────┐            │
│        │   🔒 Locked   │           │
│        └──────────────┘            │
│                                    │
│   Sign in to unlock this content   │
│                                    │
│       [  Sign In  ]                │
│                                    │
└────────────────────────────────────┘
```

### Spec

```tsx
function LockedContentCard({ children, message }: {
  children: React.ReactNode
  message?: string
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred content underneath */}
      <div className="blur-[6px] pointer-events-none select-none opacity-60">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3
                      bg-bg-base/40 backdrop-blur-sm">
        {/* Lock icon circle */}
        <div className="w-12 h-12 rounded-full bg-bg-surface border border-white/10
                        flex items-center justify-center shadow-md">
          <Lock size={20} className="text-text-tertiary" />
        </div>

        <p className="text-sm text-text-secondary text-center max-w-[200px]">
          {message || 'Sign in to unlock this content'}
        </p>

        <Link
          href="/auth/signin"
          className="px-5 py-2 rounded-pill bg-accent-400 text-text-inverse
                     font-semibold text-sm hover:bg-accent-500 shadow-glow-sm
                     transition-all duration-150">
          Sign In
        </Link>
      </div>
    </div>
  )
}
```

### States

| State | Behavior |
|---|---|
| Not authenticated | Blur + lock overlay shown |
| Authenticated, free tier, at limit | Blur + "Upgrade to unlock" overlay |
| Authenticated, has access | Normal content, no overlay |

---

## Component 2: AuthGate

Wrapper component used on pages/sections that require auth. Does not render locked UI itself — delegates to LockedContentCard or redirects.

```tsx
// Usage:
// <AuthGate fallback={<LockedContentCard>{preview}</LockedContentCard>}>
//   <PracticeFlow />
// </AuthGate>

function AuthGate({
  children,
  fallback,
  redirectToSignIn = false,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectToSignIn?: boolean
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <AuthGateSkeleton />
  }

  if (!session) {
    if (redirectToSignIn) {
      redirect('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return null
    }
    return fallback ?? <SignInPrompt />
  }

  return <>{children}</>
}
```

### AuthGateSkeleton

```tsx
<div className="flex flex-col items-center justify-center py-16 gap-4">
  <div className="w-10 h-10 rounded-full bg-bg-elevated animate-pulse" />
  <div className="w-32 h-4 rounded-md bg-bg-elevated animate-pulse" />
</div>
```

---

## Component 3: SignInPrompt

Inline prompt shown when auth is required. Used as a standalone block (not overlaid on content).

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              🔑                                               │
│              Sign in to continue                              │
│              Create a free account to access practice          │
│              sessions, arcade challenges, and AI feedback.     │
│                                                              │
│     [ Sign In ]     [ Create Account ]                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

```tsx
function SignInPrompt({ context }: { context?: string }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div className="w-14 h-14 rounded-2xl bg-accent-400/10 border border-accent-400/20
                      flex items-center justify-center mb-4">
        <KeyRound size={24} className="text-accent-400" />
      </div>

      <h3 className="text-xl font-bold text-text-primary mb-2">
        Sign in to continue
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        {context || 'Create a free account to access practice sessions, arcade challenges, and AI feedback.'}
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/auth/signin"
          className="px-6 py-2.5 rounded-pill bg-accent-400 text-text-inverse
                     font-semibold text-sm hover:bg-accent-500 shadow-glow-sm
                     transition-all duration-150">
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="px-6 py-2.5 rounded-pill border border-white/15
                     text-text-secondary font-semibold text-sm
                     hover:border-white/25 hover:text-text-primary
                     transition-all duration-150">
          Create Account
        </Link>
      </div>
    </div>
  )
}
```

---

## Component 4: FreeTierBadge

Small pill displayed on section headers to indicate free tier limits.

```tsx
function FreeTierBadge({ used, total }: { used: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill
                     text-xs font-semibold bg-info/10 text-info border border-info/20">
      <Sparkles size={12} />
      {used} of {total} free
    </span>
  )
}
```

---

## Arcade Gating Rules

### Challenge List (`/arcade/[bundleId]`)

- First 3 challenges of each type: **visible + playable** (even without auth)
- Challenges 4+: render with `<LockedContentCard>` overlay
- Show `FreeTierBadge` in bundle header: "3 of 10 available"

### Visual in challenge list

```tsx
// For locked challenges (index > 3 and not authenticated)
<div className="relative">
  <ChallengeListItem challenge={challenge} />
  {isLocked && (
    <div className="absolute inset-0 flex items-center justify-end pr-4
                    bg-bg-surface/60 backdrop-blur-[2px] rounded-xl">
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <Lock size={14} />
        <span>Sign in to unlock</span>
      </div>
    </div>
  )}
</div>
```

---

## Practice/Record Page Gating

### `/library/[clipId]/practice` and `/library/[clipId]/record`

Wrap entire page content in `<AuthGate>`:

```tsx
export default function PracticePage() {
  return (
    <AuthGate
      fallback={
        <SignInPrompt context="Sign in to practice this clip and get AI feedback on your performance." />
      }
    >
      <PracticeFlow clipId={clipId} />
    </AuthGate>
  )
}
```

The library browsing (`/library`, `/library/[clipId]`) stays fully open — no gating on watching or reading.

---

## Mobile Behavior

| Screen | Mobile behavior |
|---|---|
| LockedContentCard | Same blur + lock, slightly smaller lock icon (w-10 h-10) |
| SignInPrompt | Stack buttons vertically on `< md` |
| Arcade locked challenges | Lock overlay inline, compact text |

---

## Files to Create / Modify

| File | Change |
|---|---|
| `src/components/auth/AuthGate.tsx` | **NEW** |
| `src/components/auth/LockedContentCard.tsx` | **NEW** |
| `src/components/auth/SignInPrompt.tsx` | **NEW** |
| `src/components/auth/FreeTierBadge.tsx` | **NEW** |
| `src/lib/access-control.ts` | **NEW** — centralized access check logic |
| `src/app/arcade/[bundleId]/page.tsx` | **MODIFY** — wrap challenges 4+ with LockedContentCard |
| `src/app/library/[clipId]/practice/page.tsx` | **MODIFY** — wrap with AuthGate |
| `src/app/library/[clipId]/record/page.tsx` | **MODIFY** — wrap with AuthGate |

---

## Access Control Logic (`access-control.ts`)

```ts
// Centralized access checks
export function canAccessChallenge(
  user: User | null,
  challengeIndex: number,
  challengeType: string
): boolean {
  // Free tier: first 3 per type
  if (!user) return challengeIndex < 3
  // Authenticated free: same limit
  if (user.plan === 'basic') return challengeIndex < 3
  // Standard+: all challenges
  return true
}

export function canAccessPractice(user: User | null): boolean {
  return !!user
}

export function canAccessRecord(user: User | null): boolean {
  return !!user
}
```
