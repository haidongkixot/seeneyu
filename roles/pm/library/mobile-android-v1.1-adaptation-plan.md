# Mobile (Android) — v1.1.x Adaptation Plan

> **Status**: Planning. Owner: PM. Target: bring the React Native (Expo) Android app at `seeneyu/mobile/` to feature parity with web v1.1.1.
> **Created**: 2026-04-08

## Context

The web platform shipped v1.1.0 (Learning System Upgrade) and v1.1.1 (Hands-Free Arcade + mobile nav parity). The mobile Android app is currently at **v1.0 MVP** state — it has the core Practice → Record → Submit → Score loop but is missing every feature shipped in v1.1.x. This plan adapts the entire v1.1.x feature set to Android in 4 sprints.

## Mobile Stack (already in place)

- React Native (Expo SDK 52) + Expo Router v4 (file-based)
- TypeScript, raw `StyleSheet` (no NativeWind)
- Auth: bearer token via `expo-secure-store` → `/api/mobile/login`
- API: same Next.js backend at `seeneyu.vercel.app` (no separate mobile API)
- Camera: `expo-camera` v16, `expo-av` v15 (records MP4, ships raw video to backend — no local MediaPipe)
- State: React Context (`AuthProvider`) + local `useState` (no Redux/Zustand)
- Tabs: Home, Learn, Practice, Games, Arcade, Profile
- Build: EAS — dev/preview = APK, production = App Bundle (project ID `98a41dbd-…`)

## Feature Gap Matrix (Web v1.1.x → Mobile)

| Feature | Web | Mobile | Notes |
|---|---|---|---|
| **I1** Session delta + sparklines | ✅ | ❌ | Need to surface previous-session score on feedback screen + per-clip sparkline on Profile/Progress |
| **I2** Best-moment highlight | ✅ | ❌ | Backend already persists `snapshotScores` + `recordingDurationSec` — mobile must read it |
| **I3** Spaced review scheduling | ✅ | ❌ | Backend already writes `nextReviewAt` — mobile needs "Ready to Review" surface on Home |
| **I4** Ungated dimension bars | ✅ | N/A | Mobile must just *render* the dimensions array from feedback API (already gated correctly server-side) |
| **LC** Personalized Learning Curve | ✅ | ❌ | Onboarding preferences screen + Settings/Preferences screen + apply to Practice/Arcade/Foundation/Games |
| **AI auto-tagged clips** | ✅ | ❌ | Mobile shouldn't need tagging — it consumes `/api/clips?forYou=true` |
| **+50 Hollywood clips** | ✅ | ✅ | Already live (mobile uses same clip API) |
| **Hands-Free Arcade** | ✅ | ❌ | Use `expo-speech` for TTS instead of browser SpeechSynthesis |
| **Hands-Free Library practice** | ✅ | ❌ | Same — uses `expo-speech` |
| **Onboarding tour** | ✅ | ❌ | New users skip straight to Home — needs guided intro |
| **Real-time GamificationBar updates** | ✅ | ❌ | Mobile is pull-to-refresh — needs an event bus or context refresh on action completion |
| **Recommended badges (Arcade/Foundation/Games)** | ✅ | ❌ | Mobile must consume the matched-content data and badge UI |
| **MediaPipe feedback referencing observation guide** | ✅ | ✅ | Backend fix — works automatically once mobile shows feedback fields |

---

## Sprint Plan (4 sprints, ~3 weeks)

### Sprint M1 — Foundation: API contracts + shared types + auth refresh (Day 1-2)

**Goal**: Make sure the existing mobile API client can read all the new data fields the web added in v1.1.x. Zero new screens — just plumbing.

**Tasks (Backend Engineer)**:
- Verify `/api/sessions/[id]/feedback` GET response includes: `snapshotScores`, `recordingDurationSec`, `nextReviewAt`, `reviewCount`, the new `dimensions` array, and the rich `observationGuide`. If any field is missing from the GET serializer, add it.
- Verify `/api/preferences` GET works with bearer token (was tested with cookies for web — need to confirm mobile token auth works on this route)
- Verify `/api/clips?forYou=true` works with bearer token

**Tasks (Data Engineer / Mobile)**:
- Add TypeScript types in `mobile/src/lib/types.ts` mirroring the new fields:
  ```ts
  interface UserSessionFull {
    snapshotScores: Array<{ sec: number; score: number }> | null
    recordingDurationSec: number | null
    nextReviewAt: string | null
    reviewCount: number
    dimensions: Array<{ label: string; score: number }>
    // ...existing
  }
  interface UserPreferences {
    goal: string | null
    genres: string[]
    purposes: string[]
    traits: string[]
    gender: string | null
  }
  ```
- Add API helper methods in `mobile/src/lib/api.ts`:
  - `getPreferences()`, `updatePreferences(prefs)`
  - `getMatchedClips(userId)` (calls `/api/clips?forYou=true`)
  - `getReadyForReview()` (filters sessions by `nextReviewAt <= now` — could be a new mobile-specific endpoint or client-side filter)

**Deliverable**: Mobile can READ all new fields. No UI yet.

---

### Sprint M2 — Personalized Learning Curve (LC) — Day 2-5

**Goal**: Match the web LC experience: preferences capture + filtered content surfaces.

**Tasks (Builder + Designer)**:

1. **New screen `mobile/app/(auth)/preferences.tsx`** — runs after signup, before Home
   - Reuses `mobile/src/lib/preference-constants.ts` (port from `src/lib/preference-constants.ts`)
   - 4 sub-screens (genres → purpose → traits → gender) with native pill/card selectors
   - Submit → `PATCH /api/preferences` → navigate to Home

2. **New screen `mobile/app/settings/preferences.tsx`** — accessible from Profile
   - Same 4 sections, edit + save
   - Toast on success

3. **Modify `mobile/app/(tabs)/practice.tsx`** (Library):
   - Add "For You" / "All" toggle at top
   - When `forYou` active, call `/api/clips?forYou=true`
   - Show "X clips match your preferences" badge

4. **Modify `mobile/app/(tabs)/arcade.tsx`**:
   - Fetch user preferences
   - Add "Recommended" badge to bundle cards matching user traits/purposes (port keyword-match logic from `src/app/arcade/page.tsx`)
   - Sort recommended first

5. **Modify `mobile/app/(tabs)/learn.tsx`** (Foundation):
   - Same recommendation badging on courses

6. **Modify `mobile/app/(tabs)/games.tsx`**:
   - Same recommendation badging on game cards

7. **Modify `mobile/app/(tabs)/index.tsx`** (Home):
   - "Personalize your learning curve" banner if preferences not set → links to settings
   - Learning Curve summary card showing active preference chips (if set)

**Deliverable**: New users go through LC flow on signup. Existing users see personalize banner. All 4 content tabs show Recommended badges.

---

### Sprint M3 — Feedback enhancements (I1 + I2 + I4) + Spaced Review (I3) (Day 5-9)

**Goal**: Match the web feedback experience and surface review-due clips.

**Tasks**:

1. **Update `mobile/app/clip/[clipId]/record.tsx`**:
   - When submitting, send `recordingDurationSec` field in the form data (so I2 backend math works)

2. **New screen `mobile/app/feedback/[sessionId].tsx`**:
   - This may already exist as a result-screen — check and extend
   - **Score ring** (animated): SVG `react-native-svg` (already in deps if not, add)
   - **DeltaCard** (I1): query previous session, render per-dimension deltas with up/down arrows. Use the existing `/api/sessions/[id]/feedback` route — it should return `previousScores` already for the web; if not, add it server-side
   - **BestMomentCard** (I2): read `snapshotScores`, find peak 3-second window client-side, render "Your Best Moment: 0:04–0:07 · Score: 89" with a "Replay this part" button that uses `expo-av` to seek the saved recording
   - **DimensionBars** (I4): always render `dimensions` array (server gates correctly — mobile just shows whatever it gets)
   - **Coaching tips** section reading the rich GPT feedback
   - **Action buttons**: Try Again / Next Clip

3. **Update `mobile/app/(tabs)/index.tsx`** (Home) — add I3 "Ready to Review" section:
   - Fetch user sessions where `nextReviewAt <= now`
   - Show 3 review-due clip cards with last score + days ago
   - Tap → goes to `/clip/[clipId]/record`

**Deliverable**: Feedback screen has full v1.1.x parity. Home surfaces review-due clips.

---

### Sprint M4 — Hands-Free Mode (Arcade + Library) + Onboarding Tour + Real-time XP (Day 9-13)

**Goal**: The remaining engagement features.

**Tasks**:

1. **Hands-Free Arcade — `mobile/src/components/ArcadeHandsFreeFlow.tsx`**:
   - Port the web `ArcadeHandsFreeFlow.tsx` state machine
   - Use `expo-speech.speak()` instead of browser `SpeechSynthesisUtterance`
   - Use `expo-camera` recording instead of `MediaRecorder`
   - Phase machine: preparing → reading → countdown → recording → processing → result → next/exit
   - Add "Start Hands-Free Mode" button on `mobile/app/arcade/[bundleId].tsx`

2. **Hands-Free Library practice — `mobile/src/components/HandsFreeRecordFlow.tsx`**:
   - Same pattern. Triggered from a new toggle on `mobile/app/clip/[clipId]/record.tsx`

3. **Onboarding tour — `mobile/src/components/OnboardingTour.tsx`**:
   - Native React Native equivalent — use `react-native-reanimated` for the animated highlight
   - Glow border around target via `measure()` — same approach as the fixed web version (no overlay blocking interaction)
   - Driven by the same `SiteSettings.onboarding_tour` config the web reads
   - Steps reference native targets via `tour-id` props (analog to web's `data-tour` attributes)
   - Show on first launch after signup, completable from anywhere

4. **Real-time gamification — `mobile/src/lib/gamification-context.tsx`**:
   - Wrap the existing GamificationHeader in a context that exposes `refresh()` and an event subscription
   - After every action that awards XP (recording submit, arcade attempt submit, foundation lesson complete), call `refresh()` from the calling screen
   - Optional: react to `AppState` foreground events to refetch stale data

**Deliverable**: Mobile has hands-free mode in Arcade + Library, an onboarding tour, and live-updating XP/level/streak.

---

## Verification Checklist

For each sprint, the Tester runs:

- **M1**: Mobile API client returns all new fields without crashing on missing data
- **M2**: New user signup → preferences screen → submit → Home shows curve card. Existing user sees personalize banner. Recommended badges appear in Practice/Arcade/Foundation/Games.
- **M3**: Record a clip twice → 2nd attempt shows DeltaCard. After 1+ day, Home shows Ready to Review. Feedback screen shows BestMomentCard with replay-from-peak button.
- **M4**: Hands-free Arcade runs an entire bundle with voice. Library hands-free works. Onboarding tour highlights tabs without blocking taps. XP bumps in header after a recording submission without manual refresh.

## Build/Deploy Strategy

- Each sprint = 1 EAS preview build (APK) for tester
- Final sprint M4 = EAS production build (App Bundle)
- Submit to internal Play Store track first, then promote to production
- Version bump: mobile `app.json` → `1.1.0` (mobile semver mirrors web blueprint version)

## Open Questions for User

1. Is there an existing Play Store listing or do we need to create one?
2. Should mobile users sign up via mobile or be required to sign up on web first?
3. Do we want push notifications for spaced review reminders (would need Expo push notifications setup)?

## Owner Assignments

| Sprint | Owner | Days |
|---|---|---|
| M1 | Backend Engineer + Data Engineer | 2 |
| M2 | Builder + Designer | 4 |
| M3 | Backend Engineer + Builder | 5 |
| M4 | Builder + Designer | 5 |
| **Total** | | **~16 days (3 weeks with overlap)** |

---

**Source files referenced**:
- `mobile/app/(tabs)/*.tsx` — main screens
- `mobile/app/clip/[clipId]/record.tsx` — recording flow
- `mobile/src/lib/api.ts` — API client
- `mobile/src/lib/auth-context.tsx` — auth
- `mobile/src/components/GamificationHeader.tsx` — XP display
- Web reference: `src/components/ArcadeHandsFreeFlow.tsx`, `src/app/feedback/[sessionId]/page.tsx`, `src/app/settings/preferences/page.tsx`
