# Seeneyu Architecture Overview

> Prepared for: Investor Tech Audit Workshop
> Date: 2026-03-29 | Version: 1.0

---

## 1. Executive Summary

Seeneyu is a body language and communication coaching platform built on a modern serverless stack. Users watch curated Hollywood movie clips, observe professional communication techniques, practice through guided recording exercises, and receive real-time AI feedback -- all gamified with XP, streaks, badges, and leaderboards.

The architecture prioritizes low operational cost, horizontal scalability, and rapid feature iteration.

---

## 2. System Architecture Diagram

```
                         +-------------------------+
                         |       CLIENTS            |
                         |                         |
          +--------------+   +-----------+   +-----+---------+
          |  Web App      |   | Mobile App|   | Embedded      |
          |  (Next.js 14) |   | (Expo 52) |   | Mini-Games    |
          |  SSR + CSR    |   | React     |   | (iframe/      |
          |               |   | Native    |   |  PostMessage)  |
          +-------+-------+   +----+------+   +------+--------+
                  |                |                  |
                  v                v                  v
         +--------+----------------+-----------------+--------+
         |              Vercel Edge Network (CDN)              |
         +--------+-------------------------------------------+
                  |
                  v
         +--------+-------------------------------------------+
         |          Next.js App Router (Vercel Serverless)      |
         |                                                      |
         |  +-------------+  +-----------+  +----------------+ |
         |  | Public APIs  |  | Auth APIs  |  | Admin APIs      | |
         |  | /api/public  |  | /api/auth  |  | /api/admin      | |
         |  | /api/cms     |  | /api/gamif |  | /api/admin/cms  | |
         |  | /api/logs    |  | /api/arcade|  | /api/admin/data | |
         |  +------+------+  +-----+-----+  +-------+--------+ |
         |         |                |                |          |
         |         v                v                v          |
         |  +------+----------------+----------------+-------+ |
         |  |           Services Layer                        | |
         |  |  gamification/    learning-assistant/            | |
         |  |  assistant-svc    expression-scorer              | |
         |  |  payment-gateway  access-control                 | |
         |  |  youtube-crawler  feedback-generator             | |
         |  |  ai-content-gen   activity-tracker               | |
         |  +------+------------------------------------------+ |
         |         |                                            |
         |  +------+---+  +-----+-----+  +-----+----------+   |
         |  | Learning   |  | Gamific.  |  | AI Content    |   |
         |  | Assistant  |  | Engine    |  | Generator     |   |
         |  | Engine     |  | (XP,      |  | (15 providers)|   |
         |  | (M47-M50)  |  |  streaks) |  | image + video |   |
         |  +------+---+  +-----+-----+  +-----+----------+   |
         +--------+----------------+----------------+----------+
                  |                |                |
    +-------------+---+    +------+------+   +-----+----------+
    |                 |    |             |   |                |
    v                 v    v             v   v                v
+---+------+   +------+---+--+   +------+------+   +--------+--+
| Neon     |   | Vercel Blob  |   | OpenAI API   |   | YouTube   |
| Postgres |   | (Storage)    |   | GPT-4o       |   | IFrame +  |
| Prisma   |   | Recordings   |   | Whisper STT  |   | Data API  |
| 45 models|   | Images       |   | TTS          |   | v3        |
+----------+   +--------------+   | GPT-4o-mini  |   +-----------+
                                  +--------------+
                                        |
               +------------------------+------------------------+
               |                        |                        |
        +------+------+         +-------+-----+          +------+------+
        | Resend       |         | Twilio       |          | Kling AI    |
        | (Email)      |         | (WhatsApp)   |          | Replicate   |
        | Coach Ney    |         | Coaching     |          | Runway      |
        | branded      |         | tips via     |          | Luma        |
        | templates    |         | message      |          | Pollinations|
        +--------------+         +--------------+          +-------------+
```

---

## 3. Component Inventory

| Component | Technology | Purpose | Status |
|-----------|-----------|---------|--------|
| **Web Application** | Next.js 14 (App Router) | SSR + CSR web app, 60+ pages | Production |
| **Mobile Application** | React Native (Expo SDK 52) | iOS + Android native app, 28 screens | Development |
| **API Layer** | Next.js Route Handlers | 132 API endpoints, REST | Production |
| **Database** | Neon PostgreSQL + Prisma 6 | 45 models, 915-line schema | Production |
| **Learning Assistant Engine** | Custom TypeScript engine | Adaptive coaching, 4 notification channels | Production |
| **Gamification Engine** | Custom TypeScript modules | XP, streaks, hearts, quests, badges, leaderboards | Production |
| **AI Content Generator** | Multi-provider toolkit | 15 AI providers for image/video generation | Production |
| **Client-side ML** | Google MediaPipe | Face + Pose detection, zero API cost | Production |
| **AI Coaching** | OpenAI GPT-4o + Whisper + TTS | Voice/text AI assistant (Coach Ney) | Production |
| **Blob Storage** | Vercel Blob | Recordings, images, uploads | Production |
| **Payments** | PayPal + VNPay | Subscription billing (sandbox) | Sandbox |

---

## 4. External Service Integrations

| Service | Integration Point | Purpose | Cost Model |
|---------|------------------|---------|------------|
| **OpenAI** | GPT-4o, GPT-4o-mini, Whisper, TTS | AI feedback, coaching, content scoring, motivation messages | Per-token |
| **YouTube** | IFrame API + Data API v3 | Video playback (free), content discovery (quota-limited) | Free / Quota |
| **Google MediaPipe** | Client-side CDN | Expression + pose scoring | Free (client-side) |
| **Kling AI** | REST API | AI image + video generation (12 models) | Per-generation |
| **Replicate** | REST API | Video generation (5 models) | Per-second |
| **Runway** | REST API | Video generation (Gen3a, Gen4) | Per-second |
| **Luma** | REST API | Video generation (Ray2) | Per-second |
| **Pollinations** | Open REST API | Free image + video generation | Free |
| **Hugging Face** | Inference API | Image + video generation | Free tier / Per-request |
| **Stability AI** | REST API | Image generation (SD3) | Per-generation |
| **Together AI** | REST API | Image generation (FLUX) | Per-generation |
| **Vercel Blob** | SDK | File storage for recordings, images | Per-GB |
| **Resend** | SDK | Transactional email (weekly reports, coaching) | Per-email |
| **Twilio** | SDK | WhatsApp messaging channel | Per-message |
| **Neon** | PostgreSQL wire protocol | Serverless database with connection pooling | Per-compute |
| **PayPal** | REST API | Payment processing | Per-transaction |
| **VNPay** | Redirect flow | Vietnam-market payment processing | Per-transaction |

---

## 5. Data Flow Diagrams

### 5.1 User Practice Session Flow

```
User                    Browser               Next.js API           Database        Blob Storage
  |                       |                       |                    |                |
  |-- Select clip ------->|                       |                    |                |
  |                       |-- GET /api/clips/[id] -->|                 |                |
  |                       |                       |-- Query Clip ----->|                |
  |                       |<--- Clip data --------|<--- Clip ---------|                |
  |                       |                       |                    |                |
  |-- Start recording --->|                       |                    |                |
  |                       |-- MediaPipe init ---->|                    |                |
  |                       |   (client-side ML)    |                    |                |
  |                       |                       |                    |                |
  |-- Perform (webcam) -->|                       |                    |                |
  |                       |-- MediaPipe scoring ->|                    |                |
  |                       |   (face + pose)       |                    |                |
  |                       |                       |                    |                |
  |-- Stop recording ---->|                       |                    |                |
  |                       |-- Upload recording ------>|                |                |
  |                       |                       |-- Store blob ----->|--------------->|
  |                       |                       |-- POST /sessions ->|                |
  |                       |                       |-- Save session --->|                |
  |                       |                       |                    |                |
  |                       |-- POST /sessions/[id]/feedback ---------->|                |
  |                       |                       |-- GPT-4o feedback--|                |
  |                       |                       |   (optional)      |                |
  |                       |<--- AI feedback ------|                    |                |
  |                       |                       |                    |                |
  |                       |-- POST /gamification/activity ----------->|                |
  |                       |                       |-- processActivity--|                |
  |                       |                       |   XP + streak +   |                |
  |                       |                       |   quests + badges  |                |
  |<--- Results + XP -----|<--- Activity result --|                    |                |
```

### 5.2 AI Content Generation Flow

```
Admin                   Next.js Admin UI         AI Provider           Database        Blob Storage
  |                       |                       |                    |                |
  |-- Configure request ->|                       |                    |                |
  |   (expression type,   |                       |                    |                |
  |    body language,     |                       |                    |                |
  |    scene prompt)      |                       |                    |                |
  |                       |-- POST /admin/toolkit/content ----------->|                |
  |                       |                       |-- Save request --->|                |
  |                       |                       |                    |                |
  |-- Generate image ---->|                       |                    |                |
  |                       |-- GPT-4o description ->|                   |                |
  |                       |<--- scene + prompt ---|                    |                |
  |                       |                       |                    |                |
  |                       |-- Provider API call -->|                   |                |
  |                       |   (Kling/DALL-E/      |                    |                |
  |                       |    Pollinations/etc)   |                   |                |
  |                       |<--- Image URL --------|                    |                |
  |                       |                       |                    |                |
  |                       |-- Upload to Blob ---->|                    |--------------->|
  |                       |-- Save asset -------->|-- AiGeneratedAsset>|                |
  |                       |                       |                    |                |
  |-- Publish to clip --->|                       |                    |                |
  |                       |-- Create/update Clip ->|                   |                |
  |                       |                       |-- Clip record ---->|                |
  |<--- Published --------|                       |                    |                |
```

### 5.3 Notification Delivery Flow (Learning Assistant Engine)

```
Vercel Cron             Engine                  Channels             External Services
  |                       |                       |                    |
  |-- 08:00 UTC --------->|                       |                    |
  |   /api/cron/morning   |                       |                    |
  |                       |-- getTimezonesBracket |                    |
  |                       |   (find users where   |                    |
  |                       |    local time = 8 AM) |                    |
  |                       |                       |                    |
  |                       |-- For each user:      |                    |
  |                       |   1. analyzeProgress  |                    |
  |                       |   2. analyzeEngagement|                    |
  |                       |   3. analyzeSkillGaps |                    |
  |                       |   4. generateDailyPlan|                    |
  |                       |   5. scheduleReminders|                    |
  |                       |                       |                    |
  |                       |-- Write to            |                    |
  |                       |   ScheduledNotification|                   |
  |                       |   (DB queue)          |                    |
  |                       |                       |                    |
  |-- processQueue ------>|                       |                    |
  |   (batch of 50)       |                       |                    |
  |                       |-- For each pending:   |                    |
  |                       |   resolve template -> |                    |
  |                       |   select channel ---->|                    |
  |                       |                       |-- in_app: DB write |
  |                       |                       |-- push: Web Push ->| VAPID endpoint
  |                       |                       |-- email: Resend -->| SMTP
  |                       |                       |-- whatsapp: ------>| Twilio API
  |                       |                       |                    |
  |                       |-- Log to              |                    |
  |                       |   NotificationLog     |                    |
```

---

## 6. Deployment Architecture

```
+------------------------------------------------------------------+
|                      Vercel Platform                               |
|                                                                    |
|  +-------------------+  +------------------+  +----------------+  |
|  | Edge Network (CDN) |  | Serverless       |  | Blob Storage   |  |
|  | Static assets     |  | Functions        |  | Recordings     |  |
|  | Next.js pages     |  | 132 API routes   |  | Images         |  |
|  | Global PoPs       |  | Auto-scaling     |  | Uploads        |  |
|  +-------------------+  +------------------+  +----------------+  |
|                                                                    |
|  +-------------------+                                            |
|  | Cron Jobs          |                                            |
|  | 08:00 - Morning    |                                            |
|  | 22:00 - Evening    |                                            |
|  +-------------------+                                            |
+------------------------------------------------------------------+
         |
         v
+------------------------------------------------------------------+
|                      Neon PostgreSQL                               |
|  +-------------------+  +------------------+                      |
|  | Primary (write)    |  | Read replicas     |                     |
|  | Connection pooling |  | (auto-scaled)    |                      |
|  | 45 Prisma models   |  |                  |                      |
|  +-------------------+  +------------------+                      |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                      Mobile (Planned)                              |
|  +-------------------+  +------------------+                      |
|  | Expo EAS Build     |  | App Store        |                     |
|  | OTA Updates        |  | Google Play      |                     |
|  | SDK 52            |  |                  |                      |
|  +-------------------+  +------------------+                      |
+------------------------------------------------------------------+
```

### Deployment Pipeline

| Stage | Trigger | Target | URL |
|-------|---------|--------|-----|
| **Development** | `git push master` | Vercel Preview | Auto-generated |
| **Production** | Vercel auto-deploy on push | Vercel Production | seeneyu.vercel.app |
| **Database** | `prisma db push` | Neon PostgreSQL | Neon dashboard |
| **Mobile** | `eas build` (future) | EAS + App Stores | N/A |

### Cron Schedule (Vercel)

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/morning` | `0 8 * * *` (08:00 UTC daily) | Morning cycle: analyze, plan, schedule notifications |
| `/api/cron/engagement-check` | `0 22 * * *` (22:00 UTC daily) | Evening cycle: streak warnings, queue processing |

---

## 7. Key Architectural Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **YouTube IFrame only** | Zero video hosting cost, massive content library | Dependent on YouTube availability |
| **Client-side ML (MediaPipe)** | Zero API cost for scoring, real-time feedback | Limited to browser capabilities |
| **Serverless (Vercel)** | Auto-scaling, zero DevOps, global CDN | 10s function timeout (mitigated with maxDuration) |
| **PostgreSQL (Neon)** | Serverless-native, connection pooling, scale-to-zero | Cold start latency (~200ms) |
| **Multi-provider AI** | Resilience, cost optimization, best-of-breed | Complexity in abstraction layer |
| **DB-based notification queue** | No external queue service needed, Prisma integration | Less throughput than Redis/SQS |
| **JWT sessions** | Stateless auth, mobile-compatible | No server-side session revocation |
| **Flat comment threading** | Simple UX, fast queries | Limited discussion depth |

---

## 8. Technology Maturity Assessment

| Layer | Maturity | Evidence |
|-------|----------|---------|
| **Core Web App** | Production | Live at seeneyu.vercel.app, 60+ pages |
| **API Layer** | Production | 132 endpoints, all functional |
| **Database** | Production | 45 models, indexed, seed scripts |
| **Gamification** | Production | Full system: XP, streaks, hearts, quests, badges, leaderboards |
| **Learning Engine** | Production | 4 channels, 3 analyzers, 3 planners, scheduler |
| **AI Content Gen** | Production | 15 providers, image + video |
| **Mobile App** | Alpha | 28 screens scaffolded, connected to API |
| **Payments** | Sandbox | PayPal + VNPay integrated, not live |

---

*Document prepared by Data Engineer role for investor tech audit. All code references verified against the live codebase as of 2026-03-29.*
