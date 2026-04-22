# M46 — Mirror Mode (Live Body-Language Coaching Extension)

> Status: in-progress (backend + extension scaffolding landed on `develop`). Pending: PM milestones entry, Designer side-panel polish, Builder Chrome Web Store prep, Tester sign-off.

## Summary

Seeneyu's core loop is reactive today: **watch → record → wait for async feedback**. Mirror Mode is a browser extension that runs MediaPipe + WebAudio **locally** during live Zoom / Meet / Teams calls and shows a private HUD with three real-time signals — **eye contact, posture, vocal pace**. Raw media never leaves the device. End-of-call aggregates (averages, duration, sample count) sync to the backend **only** if the user opts in.

This converts seeneyu from "a tool I use when practicing" into "a coach present at the moments that matter" (interviews, pitches, dates, board meetings) — the retention and pricing unlock the roadmap needed.

## Threat model

| # | Threat | Mitigation |
|---|--------|------------|
| T1 | Extension leaks frames / audio | Media is confined to the offscreen document; scored numbers (not frames) cross the messaging boundary. Manifest CSP restricts `connect-src` to `https://*.seeneyu.com` and `media-src` to `self` / `blob:`. No content scripts, no DOM injection into meeting tabs. |
| T2 | Backend leaks aggregate data across users | Prisma row-level scope via `userId`; `ExtensionSession` has no free-text fields; zod-strict validation rejects unknown keys; 1 KB hard payload cap. |
| T3 | Compromised access token | 15-minute access tokens, rotated refresh tokens (30-day), SHA-256 hash-at-rest, revoke endpoint. If a refresh-token reuse is detected at rotation time, **all** tokens for that user are revoked defensively. |
| T4 | Malicious tab reads HUD | Extension uses the Chrome `sidePanel` API; the HUD runs in isolated extension context with no DOM injection into meeting apps. |
| T5 | Forged requests from rogue extension | `X-Extension-Id` header required; validated against `EXTENSION_IDS` env allowlist; CORS restricted to `chrome-extension://<id>` of allowlisted IDs only. |

## Architecture

```
[Meeting tab — untouched, no content script injected]

[Side Panel (React HUD)] ⇄ [Service Worker]
         ▲                      │
         │ scored samples       │ HTTPS + Bearer + X-Extension-Id
         ▼                      ▼
[Offscreen Document]       [Backend /api/extension/*]
 • getUserMedia                • pair (web-only)
 • MediaPipe (planned)         • token issue / refresh / revoke
 • WebAudio pace               • metrics (opt-in only)
 • @seeneyu/scoring            • preferences

─── raw frames & audio stay inside the offscreen doc ───
```

## What shipped in this PR

### Backend

- `prisma/schema.prisma` — new models:
  - `ExtensionToken` (SHA-256 hashed access + refresh, mandatory `expiresAt`, ext-id pinned, revocable).
  - `ExtensionSession` (aggregate row per call — **no** transcript, **no** frames, **no** meeting URL).
  - `LearnerProfile.extensionMetricsOptIn` (+ timestamp) — default `false`, explicit opt-in.
- `src/lib/extension-auth.ts` — token issue / rotate / revoke, pairing codes, reuse detection.
- `src/lib/extension-id-allowlist.ts` — env-driven `EXTENSION_IDS` + `EXTENSION_ENABLED` flag.
- `src/lib/extension-cors.ts` — CORS helper restricted to `chrome-extension://<id>` in the allowlist.
- `src/app/api/extension/pair/route.ts` — web-only, logged-in users issue a 6-digit pairing code.
- `src/app/api/extension/token/{issue,refresh,revoke}/route.ts` — full auth lifecycle.
- `src/app/api/extension/metrics/route.ts` — zod-strict, 1 KB cap, opt-in gated.
- `src/app/api/extension/preferences/route.ts` — get/put opt-in.
- `src/lib/rate-limit-user.ts` — new limits: `EXT_TOKEN_ISSUE_LIMIT` (5/15min), `EXT_TOKEN_REFRESH_LIMIT` (30/h), `EXT_TOKEN_REVOKE_LIMIT` (10/h), `EXT_METRICS_LIMIT` (60/h), `EXT_PREFERENCES_LIMIT` (30/h).

### Shared package

- `packages/scoring/` — new workspace package `@seeneyu/scoring`.
- `packages/scoring/src/mirror-metrics.ts` — `scoreEyeContact`, `scorePosture`, `estimateVocalPaceWpm`, `aggregateSamples`. Deterministic, domain-neutral inputs.

### Extension

- `extension/manifest.json` — MV3, strict CSP, `sidePanel` + `offscreen` + `storage` + `alarms`; no content scripts.
- `extension/src/background/service-worker.ts` — auth alarm, aggregation buffer lifecycle, opt-in-gated submit.
- `extension/src/offscreen/offscreen.ts` — getUserMedia + WebAudio pace; MediaPipe seam ready (scaffold emits null samples at 2 Hz).
- `extension/src/sidepanel/*` — React HUD, 6-digit pairing screen, opt-in toggle.
- `extension/src/lib/auth-client.ts` — Bearer + refresh rotation, `chrome.storage.session` (clears on browser close).

## Environment

New Vercel env vars:

- `EXTENSION_ENABLED` — `true` to enable `/api/extension/*`. Anything else → 503.
- `EXTENSION_IDS` — comma-separated list of allowed `chrome.runtime.id` values.

Kill switch: set `EXTENSION_ENABLED=false` → all endpoints 503; extension degrades to fully-local HUD with a "sync paused" banner.

## Non-goals (for M46)

- No video, frames, or audio ever uploaded.
- No transcript, no cloud STT, no Whisper.
- No third-party LLM called during a meeting.
- No screen capture, no tab capture, no meeting-app DOM injection.
- No Zoom/Meet/Teams SDK integration.
- No mobile extension (Safari/Firefox deferred).
- No on-disk recording; no real-time sync during a meeting.

## Acceptance criteria (tester-executable)

1. Install unpacked extension, log in on web, pair with 6-digit code — side panel shows "Connected".
2. Open Google Meet, grant camera+mic, click **Start Mirror** — HUD updates at ~2 Hz within 3 s.
3. DevTools Network (meeting tab + extension): zero `multipart/form-data`, zero `video/*` or `audio/*` Content-Types, zero non-seeneyu hosts.
4. Default opt-in `false` → ending a session sends **no** request to `/api/extension/metrics`.
5. Toggle opt-in **on**, run 60 s, end → exactly one POST to `/api/extension/metrics`, payload ≤ 1 KB, schema keys only.
6. Wait 16 min idle, trigger any call → 401 from server, extension auto-refreshes, retry succeeds. Tamper `X-Extension-Id` → 401.
7. `EXTENSION_ENABLED=false` → all extension endpoints 503; local HUD continues. Revoke from web → next call 401 and side panel returns to pairing.

## Rollout

| Phase | Duration | Gate |
|---|---|---|
| 1. Internal dogfood | 1–2 weeks | Team-only dev IDs; side-loaded; `EXTENSION_ENABLED=true` in preview |
| 2. Invite-only beta | 2 weeks | 50 learners; per-user allowlist flag on `/token/issue` |
| 3. Unlisted Chrome Web Store | 1 week | Store privacy one-pager |
| 4. Public listed | after 2 wks zero security reports + <0.5% crash | Tester sign-off per CLAUDE.md |

Abuse signals monitored: 429 spikes, `/metrics` schema violations, refresh-token reuse detections. Any one → flip `EXTENSION_ENABLED=false`, investigate.

## Reused vs new

| Purpose | Reused from | New |
|---|---|---|
| Token hash-at-rest pattern | `src/lib/mobile-auth.ts` | `src/lib/extension-auth.ts` (adds mandatory expiry, rotation, reuse detection) |
| Rate limiting | `src/lib/rate-limit-user.ts` | 5 new limit constants |
| CORS helper | `src/lib/cors.ts` | `src/lib/extension-cors.ts` (chrome-extension:// only) |
| Consent pattern | `src/services/consent-manager.ts` | `extensionMetricsOptIn` field + preferences endpoint |
| Scoring | `src/services/holistic-scorer.ts`, `src/services/temporal-analyzer.ts` | `@seeneyu/scoring` shared package (relocation planned post-MVP) |
