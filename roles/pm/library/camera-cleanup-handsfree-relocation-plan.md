# Hot-Fix Plan: Camera Cleanup + Hands-Free Mode Relocation

> **Status**: In progress. Owner: PM. Created: 2026-04-08.
> Priority: P0 — privacy bug (camera leak) + UX bug (Hands-Free button in wrong place).

## Issues

### Issue 1 — Hands-Free button in wrong place
"Start Hands-Free Mode" currently appears on the **bundle list** screen at `/arcade/[bundleId]`. It should live on the **challenge detail** screen (the screen the user enters when they tap a single challenge), so the user explicitly opts into hands-free mode for that challenge, not the whole bundle.

### Issue 2 — Camera leaks across the app (P0 privacy)
Audit found **2 critical** + **1 major** + **4 incomplete** camera-cleanup bugs. The camera stays on when users navigate away, which is a privacy violation and a system-resource leak.

---

## Camera Audit Summary

| File | Severity | What's wrong |
|------|----------|--------------|
| `src/app/library/[clipId]/record/RecordClient.tsx` | **CRITICAL** | NO unmount cleanup at all — stream acquired and never stopped |
| `src/components/AiImagePractice.tsx` | **CRITICAL** | NO unmount cleanup — only stops on capture |
| `src/app/arcade/[bundleId]/page.tsx` | **MAJOR** | `stopCamera()` only called on explicit exit/next, no useEffect cleanup |
| `src/components/HandsFreePracticeFlow.tsx` | INCOMPLETE | Has unmount cleanup but missing `srcObject = null` |
| `src/components/ArcadeHandsFreeFlow.tsx` | INCOMPLETE | Same — missing `srcObject = null` |
| `src/components/PracticeRecorder.tsx` | INCOMPLETE | Same |
| `src/toolkit/mini-games/components/ExpressionKingGame.tsx` | INCOMPLETE | Same |

---

## Fix Plan

### Phase 1 — Shared `useCameraStream` hook (PREVENTION)

Build a single hook at `src/hooks/useCameraStream.ts` that **enforces** correct cleanup on every consumer. All future camera uses will go through it. Existing files will be migrated incrementally — but the unmount-cleanup bugs get fixed inline first to stop the bleeding.

```typescript
// src/hooks/useCameraStream.ts
export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async (constraints) => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
    return stream
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    streamRef.current = null
  }, [])

  // Auto-stop on unmount
  useEffect(() => () => stopCamera(), [stopCamera])

  // Auto-stop on tab close / hidden
  useEffect(() => {
    const onHidden = () => { if (document.visibilityState === 'hidden') stopCamera() }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('beforeunload', stopCamera)
    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('beforeunload', stopCamera)
    }
  }, [stopCamera])

  return { videoRef, streamRef, startCamera, stopCamera }
}
```

### Phase 2 — Fix the critical files inline (FAST PATH)

For each leaking file, add a minimal `useEffect` cleanup that stops tracks AND clears `srcObject` AND nulls the ref. This is the immediate stop-the-bleeding fix.

**Files to patch:**
1. `src/app/library/[clipId]/record/RecordClient.tsx` — add cleanup useEffect
2. `src/components/AiImagePractice.tsx` — add cleanup useEffect
3. `src/app/arcade/[bundleId]/page.tsx` — add cleanup useEffect + update `stopCamera()` to clear srcObject
4. `src/components/HandsFreePracticeFlow.tsx` — update `stopCamera()` to clear srcObject
5. `src/components/ArcadeHandsFreeFlow.tsx` — update `stopCamera()` to clear srcObject
6. `src/components/PracticeRecorder.tsx` — update unmount cleanup to clear srcObject
7. `src/toolkit/mini-games/components/ExpressionKingGame.tsx` — same

### Phase 3 — Move Hands-Free button

In `src/app/arcade/[bundleId]/page.tsx`:
- **Remove** the "Start Hands-Free Mode" button from the bundle list (above challenge cards)
- **Add** it to the **Challenge Active Screen** (`screen === 'challenge'`) so it appears next to the recording controls — when the user taps it, the existing `setHandsFreeActive(true)` flow runs but starts from the **currently selected challenge** (`startIdx={activeIdx}`) instead of from `0`

This way:
- Bundle list: clean — no big amber button
- Tap a challenge → enter challenge detail → see "Hands-Free this challenge" option next to the manual Record button
- Or stay manual and click the existing record button

### Phase 4 — Verification

Tester runs:
1. Open `/library/[clipId]/record`, allow camera, then click back. Verify camera LED turns off.
2. Open `/arcade/[bundleId]`, tap a challenge, allow camera, then click Exit/Back. Verify camera LED turns off.
3. Open arcade challenge, allow camera, switch browser tab. Verify camera LED turns off (visibilitychange listener).
4. Run AiImagePractice, allow camera, navigate away without capturing. Verify camera LED turns off.
5. Open hands-free arcade flow, allow camera, click Exit. Verify camera LED turns off.
6. Verify "Start Hands-Free Mode" button is GONE from `/arcade/[bundleId]` bundle list.
7. Verify "Hands-Free" button appears on the challenge detail screen and starts the flow at the current challenge.

---

## Owners

| Phase | Task | Owner | Effort |
|---|---|---|---|
| 1 | Build `useCameraStream` hook | Backend Engineer | 1h |
| 2 | Patch 7 files with inline cleanup | Backend Engineer | 2h |
| 3 | Move Hands-Free button + restart from current challenge | Builder | 1h |
| 4 | Manual verification of all 7 scenarios | Tester | 1h |
| **Total** | | | **~5h** |

This is a **same-session hot fix**. Ship before the next mobile sprint.
