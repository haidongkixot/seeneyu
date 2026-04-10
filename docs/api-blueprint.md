# seeneyu API Blueprint

> **Version**: 1.1.2 | **Base URL**: `https://seeneyu.vercel.app/api` | **Updated**: 2026-04-08
>
> **177 routes** across 6 auth layers. This document is the single source of truth for the API surface.

---

## Table of Contents

1. [Authentication Patterns](#1-authentication-patterns)
2. [Public — No Auth (18 routes)](#2-public--no-auth-18-routes)
3. [User — NextAuth Session (41 routes)](#3-user--nextauth-session-41-routes)
4. [Mobile — Bearer Token (11 routes)](#4-mobile--bearer-token-11-routes)
5. [Admin — Role Check (101 routes)](#5-admin--role-check-101-routes)
6. [Cron — CRON_SECRET (9 routes)](#6-cron--cron_secret-9-routes)
7. [Webhooks — Signature Verified (2 routes)](#7-webhooks--signature-verified-2-routes)
8. [Key Integration Points](#8-key-integration-points)
9. [Rate Limits & Constraints](#9-rate-limits--constraints)
10. [Changelog](#10-changelog)

---

## 1. Authentication Patterns

| Pattern | Header / Mechanism | Used By | How It Works |
|---------|-------------------|---------|--------------|
| **NextAuth** | Cookie (auto, HttpOnly) | Web user + admin routes | `getServerSession(authOptions)` returns `{ user: { id, email, name, role, plan } }` |
| **Bearer Token** | `Authorization: Bearer <token>` | Mobile app, cron jobs | Token generated via `/api/mobile/login`, stored as SHA256 hash in Account table (provider: `mobile-token`), validated via `getUserFromRequest()` |
| **Webhook Signature** | `stripe-signature` header | Payment webhooks | Verified against `STRIPE_WEBHOOK_SECRET` env var |
| **CRON_SECRET** | `Authorization: Bearer <CRON_SECRET>` | Scheduled tasks | Matches against `process.env.CRON_SECRET` |
| **Public** | None | Games, blog, catalog, plans | No auth check — open access, CORS enabled where noted |

### Dual Auth (Web + Mobile)

Many user routes support both patterns. The route first tries `getServerSession()` (cookie), then falls back to `getUserFromRequest()` (bearer token). This means the same endpoint works for both web and mobile without duplication.

---

## 2. Public — No Auth (18 routes)

### Content Catalog

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/clips` | List active clips (public catalog) | `{ clips: [{ id, movieTitle, skillCategory, difficulty, ... }] }` |
| GET | `/cms/blog` | Blog posts | `{ posts: [{ id, slug, title, excerpt, ... }] }` |
| GET | `/cms/blog/[slug]` | Single blog post | `{ post: { title, content, author, ... } }` |
| GET | `/cms/pages/[slug]` | CMS page | `{ page: { title, content, sections } }` |
| GET | `/cms/settings/[key]` | Settings (privacy, terms, etc.) | `{ value: any }` |
| GET | `/onboarding-tour/config` | Tour UI config | `{ enabled, slides, steps, rewards }` |

### Mini-Games (CORS enabled for embeds)

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/public/games` | List mini-games | `[{ type, title, description, config }]` |
| GET | `/public/games/[type]` | Game config + random rounds | `{ game, rounds: [{ prompt, options, correctAnswer }] }` |
| POST | `/public/games/[type]/submit` | Submit round answer | `{ correct, correctAnswer, explanation }` |
| POST | `/public/games/[type]/complete` | Submit game completion | `{ score, totalRounds, certificate? }` |
| POST | `/public/games/[type]/capture` | Upload photo for game | `{ imageUrl }` |
| GET | `/public/games/leaderboard/[type]` | Top 20 leaderboard | `[{ playerName, score, completedAt }]` |
| GET | `/public/certificate/[sessionId]` | Certificate PDF | Binary PDF response |

### Monetization & Integrations

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/public/plans` | Pricing plans | `[{ id, name, price, features }]` |
| POST | `/coupons/validate` | Check coupon validity | `{ valid, discount, expiresAt }` |
| GET | `/referral/leaderboard` | Public referral scores | `[{ userName, conversions }]` |
| GET | `/push/vapid-key` | Web push VAPID key | `{ publicKey }` |
| POST | `/logs` | Client error logging | `{ ok: true }` |

---

## 3. User — NextAuth Session (41 routes)

### Learning & Practice

| Method | Endpoint | Description | Input | Response |
|--------|----------|-------------|-------|----------|
| GET | `/clips/[id]` | Clip detail (difficulty gated by plan) | — | Full clip object + practiceSteps + annotations |
| POST | `/sessions` | Upload practice recording | FormData: `recording` (video), `clipId` | `{ id, status: 'recording' }` |
| POST | `/sessions/[id]/feedback` | AI feedback (MediaPipe + GPT) | `{ analysisData: { snapshots, skillCategory }, recordingDurationSec }` | Full FeedbackResult (score, dimensions, positives, improvements, steps, tips, snapshotScores, nextReviewAt) |
| POST | `/micro-sessions` | Micro practice with instant feedback | FormData: `recording`, `clipId`, `stepNumber`, `skillFocus`, `instruction`, `analysisData` | `{ verdict, headline, detail, score }` |
| POST | `/arcade/attempts` | Submit arcade challenge | `{ challengeId, snapshots, peakSnapshot }` | `{ score, breakdown, feedbackLine, xpEarned, leveledUp }` |
| POST | `/voice-analysis` | Voice emotion analysis | `{ recordingUrl }` | `{ voiceScore, pitchVariation, speakingRate, volumeDynamics }` |

### Foundation Courses

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/foundation` | List courses with progress | `[{ slug, title, lessons, completedCount }]` |
| GET | `/foundation/[courseSlug]` | Course detail + lessons | `{ course, lessons, progress }` |
| GET | `/foundation/[courseSlug]/[lessonSlug]` | Single lesson with theory + quiz | `{ lesson, examples, questions }` |
| POST | `/foundation/progress` | Record lesson completion + award XP | `{ progress, xpEarned, leveledUp }` |

### Arcade

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/arcade/bundles` | List playable bundles | `[{ id, title, challengeCount, completedCount, totalXP }]` |
| GET | `/arcade/bundles/[id]/challenges` | Bundle challenges | `{ id, title, challenges: [{ id, title, type, isComplete, bestScore, guidanceSteps }] }` |

### Dashboard & Progress

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/progress` | Learning progress (per-clip sparklines) | `{ skills: { [skill]: { avgScore, trend } }, clips: { [id]: { scores[], dates[] } } }` |
| GET | `/learning-plan` | Daily plan (auto-generates if missing) | `{ activities: [{ type, title, reason, deepLink }], completedCount }` |
| GET | `/proactive-suggestion` | AI suggestion for dashboard | `{ suggestion, type, deepLink }` |

### Preferences & Personalization (LC)

| Method | Endpoint | Description | Input | Response |
|--------|----------|-------------|-------|----------|
| GET | `/preferences` | Get learning curve preferences | — | `{ goal, genres, purposes, traits, gender }` |
| PATCH | `/preferences` | Update preferences | `{ genres?, purposes?, traits?, gender? }` | Updated preferences |
| GET | `/preferences/consent` | GDPR consent state | — | `{ storageAgreed, version }` |
| PUT | `/preferences/consent` | Update consent | `{ storageAgreed }` | Updated consent |
| GET | `/preferences/notifications` | Notification settings | — | `{ channels, frequency, timezone }` |
| PATCH | `/preferences/notifications` | Update notification settings | `{ channels?, frequency?, timezone? }` | Updated settings |

### Gamification

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/gamification/profile` | XP, level, streak, hearts, tier | `{ level, currentXp, xpForNextLevel, streak, hearts, unlimited, totalXp }` |
| GET | `/gamification/badges` | Earned badges | `[{ id, name, description, earnedAt }]` |
| GET | `/gamification/quests` | Daily quests | `[{ questType, description, progress, target, completed }]` |
| GET | `/gamification/leaderboard` | Rankings | `[{ userId, name, totalXp, level }]` |
| GET | `/gamification/tier` | User tier/level | `{ tier, level, totalXp }` |
| GET | `/gamification/feed` | Activity feed | `[{ type, message, timestamp }]` |
| POST | `/gamification/activity` | Log activity for XP | `{ type, metadata }` |
| GET/POST | `/gamification/follow` | Follow/unfollow users | `{ following: boolean }` |

### Onboarding

| Method | Endpoint | Description | Input |
|--------|----------|-------------|-------|
| POST | `/onboarding/complete` | Save skill baselines + preferences | `{ ratings: [{ skillCategory, level }], goal?, genres?, purposes?, traits?, gender? }` |
| GET | `/onboarding-tour/status` | Tour completion state | — |
| POST | `/onboarding-tour/complete` | Mark tour done + award 150 XP | — |

### Payments & Subscriptions

| Method | Endpoint | Description | Input |
|--------|----------|-------------|-------|
| POST | `/payments/stripe` | Initiate Stripe checkout | `{ planId, coupon? }` |
| POST | `/payments/stripe/portal` | Open Stripe billing portal | — |
| POST | `/payments/paypal` | Initiate PayPal checkout | `{ planId }` |
| POST | `/payments/vnpay` | Initiate VNPay checkout | `{ planId, amount }` |
| GET | `/subscriptions` | Subscription status | — |
| PATCH | `/subscriptions` | Update subscription | `{ planId }` |
| POST | `/subscriptions/cancel` | Cancel subscription | `{ reason? }` |
| POST | `/trial` | Activate 7-day trial | — |
| POST | `/coupons` | Apply coupon code | `{ code }` |
| POST | `/coupons/redeem` | Redeem coupon | `{ code }` |

### Community & AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/comments` | List comments (lessonId or challengeId thread) |
| POST | `/comments/[id]` | Create comment or reply |
| POST | `/assistant/chat` | AI coach chat (text, voice, audio) |
| GET/POST | `/teams` | Team management |
| POST | `/push/subscribe` | Subscribe to push notifications |
| DELETE | `/push/unsubscribe` | Unsubscribe from push |
| POST | `/activity/track` | Track user events (optional auth) |

---

## 4. Mobile — Bearer Token (11 routes)

All use `Authorization: Bearer <token>` via `getUserFromRequest()`.

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| POST | `/mobile/login` | Generate bearer token | `{ token, user: { id, email, name, role, plan } }` |
| GET | `/user/me` | Validate token + get user | `{ user }` |
| GET | `/user/profile` | User profile | `{ user }` |
| PATCH | `/user/profile` | Update profile | `{ user }` |
| GET | `/notifications` | Notification history | `[{ id, type, title, body, read, createdAt }]` |
| POST | `/notifications/mark-read` | Mark notifications read | `{ ok: true }` |

Mobile also uses many User routes above (dual auth fallback).

---

## 5. Admin — Role Check (101 routes)

All require `(session.user as any).role === 'admin'`.

### Clips & Practice Steps (15 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/admin/clips` | List/create clips |
| GET/PUT/DELETE | `/admin/clips/[id]` | Get/update/delete clip |
| GET/PUT | `/admin/clips/[id]/steps` | Manage practice steps |
| POST | `/admin/clips/[id]/steps/auto-generate` | AI-generate steps (GPT-4o-mini) |
| POST | `/admin/clips/[id]/steps/[stepId]/demo-image` | Generate DALL-E demo image |
| POST | `/admin/clips/[id]/steps/[stepId]/voice` | Generate ElevenLabs voice |
| GET/PUT/DELETE | `/admin/clips/[id]/tags` | Manage clip tags (genre/purpose/trait) |
| POST | `/admin/clips/[id]/transcript` | Fetch YouTube transcript |
| POST | `/admin/clips/[id]/screenplay` | Crawl screenplay from web |
| POST | `/admin/clips/[id]/observation` | AI-generate observation guide |

### Arcade (10 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/admin/arcade/bundles` | List/create bundles |
| GET/PUT/DELETE | `/admin/arcade/bundles/[id]` | Get/update/delete bundle |
| GET/POST | `/admin/arcade/challenges` | List/create challenges |
| GET/PUT/DELETE | `/admin/arcade/challenges/[id]` | Get/update/delete challenge |
| POST | `/admin/arcade/challenges/[id]/guidance` | AI-generate guidance steps |
| POST | `/admin/arcade/upload-image` | Upload bundle/challenge images |

### CMS (10 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/admin/cms/blog` | Blog CRUD |
| GET/PUT/DELETE | `/admin/cms/blog/[id]` | Single blog post |
| GET/POST | `/admin/cms/pages` | Pages CRUD |
| GET/POST | `/admin/cms/sections` | Section management |
| GET/POST | `/admin/cms/team` | Team members CRUD |
| GET/PUT | `/admin/cms/settings/[key]` | Settings management |
| POST | `/admin/cms/upload` | Media uploads (Vercel Blob) |

### Users (6 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users (search, filter, paginate) |
| GET | `/admin/users/[id]` | User details |
| PATCH | `/admin/users/[id]` | Update user (role, status, plan) |
| GET | `/admin/users/[id]/profile` | User profile |
| GET | `/admin/users/[id]/subscription` | Subscription info |
| GET | `/admin/users/[id]/history` | Activity history |

### AI Toolkit (15 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/admin/toolkit/ai-generator/requests` | Generation requests |
| POST | `/admin/toolkit/ai-generator/requests/[id]/generate` | Execute generation |
| POST | `/admin/toolkit/ai-generator/requests/[id]/publish` | Publish result |
| GET | `/admin/toolkit/ai-generator/agent/*` | Agent cycles, jobs, settings, storage, stats |
| GET | `/admin/toolkit/ai-generator/providers` | List LLM/image providers |

### Mini-Games (12 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PATCH | `/admin/toolkit/mini-games/[id]` | Game config |
| CRUD | `/admin/toolkit/mini-games/[id]/rounds` | Round management |
| GET | `/admin/toolkit/mini-games/sessions` | Game sessions |
| CRUD | `/admin/toolkit/mini-games/submissions` | Submission review |
| GET | `/admin/toolkit/mini-games/analytics` | Game analytics |

### Crawler (8 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/admin/toolkit/crawler/jobs` | Crawler jobs |
| CRUD | `/admin/toolkit/crawler/expressions` | Extraction expressions |
| POST | `/admin/toolkit/crawler/enrich` | Data enrichment |
| CRUD | `/admin/crawl-jobs` | Legacy crawl jobs |

### Data & Analytics (12 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/admin/data/exports` | Data export jobs |
| GET | `/admin/data/labels` | Annotation labels |
| GET | `/admin/data/stats` | Data statistics |
| GET | `/admin/analytics` | System analytics |
| GET | `/admin/analytics/features` | Feature usage stats |
| GET | `/admin/analytics/users/[id]` | Per-user analytics |

### Email, Engine, Other (13 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/admin/email/templates` | Email templates |
| GET | `/admin/engine/stats` | Learning engine stats |
| GET | `/admin/engine/logs` | Engine logs |
| CRUD | `/admin/engine/templates` | Notification templates |
| CRUD | `/admin/comments` | Comment moderation |
| CRUD | `/admin/logs` | System logs |
| GET | `/admin/plans` | Subscription plans |
| POST | `/admin/import-zip` | Content archive import |
| GET/POST | `/admin/teams` | Admin team management |

---

## 6. Cron — CRON_SECRET (9 routes)

All secured with `Authorization: Bearer ${CRON_SECRET}`.

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/cron/morning` | Daily per timezone | Analyze progress + generate daily plans + schedule notifications |
| `/cron/weekly-report` | Monday | Generate HTML email summaries |
| `/cron/engagement-check` | Daily | Calculate engagement scores |
| `/cron/subscription-lifecycle` | Daily | Trial expiry, plan downgrades |
| `/cron/consent-cleanup` | Daily | Remove expired consent records |
| `/cron/video-poll` | Every 2 min | Poll async video generation (Sora, Kling, Runway, Luma) |
| `/cron/process-queue` | Every 5 min | Process async job queue |
| `/cron/content-agent-analyze` | Daily | Content analysis agent |
| `/cron/content-agent-process` | Daily | Content processing pipeline |

---

## 7. Webhooks — Signature Verified (2 routes)

| Endpoint | Provider | Events |
|----------|----------|--------|
| `/payments/stripe/webhook` | Stripe | `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` |
| `/payments/vnpay/callback` | VNPay | Payment result callback (GET with query params) |

---

## 8. Key Integration Points

### AI Feedback Pipeline

```
Client records video
  → MediaPipe analyzes locally (500ms intervals) → AnalysisSnapshot[]
  → POST /api/sessions/[id]/feedback
    → scoreFullPerformanceFromAnalysis (face + pose + hands)
    → computeHolisticScore (visual + temporal + voice blend)
    → scoreSnapshot per frame → snapshotScores (I2: feedforward)
    → generateTextFeedback (GPT-4o with clip context + observation guide + practice steps)
    → compute nextReviewAt (I3: spaced review)
    → awardXp (gamification)
  → Returns: FeedbackResult JSON
```

### Content Generation Pipeline (Admin/Script)

```
YouTube URL → Clip record
  → /admin/clips/[id]/transcript (fetch YouTube captions)
  → /admin/clips/[id]/observation (GPT-4o-mini → observation guide JSON)
  → /admin/clips/[id]/steps/auto-generate (GPT-4o-mini → 4-5 practice steps)
  → /admin/clips/[id]/steps/[stepId]/demo-image (Pollinations/DALL-E → Vercel Blob)
  → /admin/clips/[id]/steps/[stepId]/voice (ElevenLabs TTS → Vercel Blob)
  → auto-tag (GPT-4o-mini → ClipTag records: genre/purpose/trait)
```

### Payment Flow

```
User selects plan → POST /api/payments/stripe → Stripe Checkout URL
  → User pays on Stripe → webhook fires → /api/payments/stripe/webhook
    → Update user.plan (basic → standard/advanced)
    → Create Subscription record
  → Cron: /api/cron/subscription-lifecycle checks expiry daily
```

### Image/Video Generation Providers

| Provider | Type | Cost | Endpoint |
|----------|------|------|----------|
| Pollinations | Image | Free | `image.pollinations.ai` |
| DALL-E 2 | Image | $0.018/img | OpenAI API |
| DALL-E 3 | Image | $0.040/img | OpenAI API |
| Stability AI | Image | Credits | `api.stability.ai` |
| HuggingFace | Image | Free tier | Inference API |
| Kling AI | Image/Video | Credits | `api.klingai.com` |
| Gemini Imagen | Image | Credits | Google AI |
| Together AI | Image | Credits | `api.together.xyz` |
| OpenAI Sora | Video | Credits | OpenAI API |

---

## 9. Rate Limits & Constraints

| Endpoint | Limit | Mechanism |
|----------|-------|-----------|
| `/auth/signup` | 5 per hour per IP | IP-based rate limiting |
| `/sessions/[id]/feedback` | 60s max duration | `maxDuration = 60` export |
| `/assistant/chat` | 3 messages/day (free), 20 (standard), unlimited (advanced) | Plan-based in `getAssistantLimits()` |
| Practice recording | 15s (free), 60s (standard), 180s (advanced) | `getVideoLimitSec()` |
| Arcade challenges | 1 per type (free), unlimited (standard+) | `getArcadeChallengesPerType()` |
| Foundation lessons | 2 per course (free), unlimited (standard+) | `getFoundationLessonLimit()` |
| Mini-games | 2 games (free), 5 (standard+) | `getAllowedGames()` |
| Clips difficulty | Beginner only (free), +intermediate (standard), +advanced (advanced) | `getAllowedDifficulties()` |

---

## 10. Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | 2026-03-15 | Initial API with clips, sessions, feedback, gamification, auth, CMS |
| v1.1.0 | 2026-04-08 | Added: `/preferences` (LC), snapshotScores + nextReviewAt on feedback, `/progress` API, `/admin/clips/[id]/tags`, awardXp calls in feedback/arcade/foundation routes, `xp:awarded` event dispatch |
| v1.1.1 | 2026-04-08 | Added: `credentials: 'include'` for preferences fetch, arcade camera `max-h-[45vh]` |
| v1.1.2 | 2026-04-08 | Camera cleanup: unmount + visibilitychange + beforeunload on all camera routes. Hands-Free relocated to challenge detail screen. Added `useCameraStream` hook. |