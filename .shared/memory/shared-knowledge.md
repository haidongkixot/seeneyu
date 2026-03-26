# Shared Knowledge — seeneyu
> Updated by: Reporter on 2026-03-26
> Read by: All roles at session start

## What is seeneyu?
A body language & communication coaching web + mobile app. Learners watch curated Hollywood movie clips, observe specific skills, record themselves mimicking the behavior, receive AI feedback (MediaPipe + optional GPT-4o), and repeat to improve. Gamified with XP, streaks, badges, leaderboards. Monetized via 3-tier subscription (Basic free / Standard / Advanced).

## Core User Flow
```
Browse Library → Select Clip → Watch + Observation Guide → Micro-Practice (steps)
                                                                    ↓
                                                         AI Feedback (MediaPipe)
                                                                    ↓
                                              Full Performance → Retry or Next Clip
```
Additional flows: Arcade Zone (10s challenges), Foundation Courses (theory + quiz), Mini-Games (data collection), Coach Ney AI assistant.

## Tech Stack
- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS (transitioning from dark to light mode per M38)
- **Database**: PostgreSQL (Neon) + Prisma (45+ models, 773-line schema)
- **Video**: YouTube IFrame API (no self-hosted video)
- **Recording**: MediaRecorder API (browser webcam)
- **AI Scoring**: Google MediaPipe (FaceLandmarker + PoseLandmarker) — client-side, zero API cost
- **AI Feedback**: GPT-4o TEXT (optional, for full performance rich feedback)
- **AI Assistant**: OpenAI GPT-4o (chat) + Whisper (STT) + TTS — Coach Ney persona
- **Content Discovery**: YouTube Data API v3 + GPT-4o relevance scoring
- **Transcripts**: youtube-transcript npm package
- **Storage**: Vercel Blob (recordings, images, uploads)
- **Auth**: NextAuth.js v4 (credentials, email/password, registration approval gate)
- **Payments**: PayPal + VNPay (sandbox mode)
- **Deploy**: Vercel (web), Expo SDK 52 (mobile, local dev)
- **Mobile**: React Native (Expo Router, file-based routing, 28 screens)
- **Gamification**: XP, streaks, hearts, quests, badges, leaderboards, leagues

## Current Status (2026-03-26)
- Phase: **36-cms-logging-rebrand** (M36-M45 planned)
- **M0–M8 COMPLETE** (tester-approved). App live at https://seeneyu.vercel.app
- **M10–M45 CODE COMPLETE** — awaiting tester sign-off (36 milestones!)
- **M9 (Marketing)**: in-progress — Marketer working on VC fundraising package
- **Mobile app**: Scaffolded 2026-03-26, Expo SDK 52, connected to real API data
- **Critical**: Massive tester backlog. No milestones tester-approved since M8.

## Open Bugs
- **BUG-005** (P1): FIXED — pricing page was using admin-only API, now uses `/api/public/plans`
- **BUG-006** (P1): Plan + ArcadeBundle tables not seeded in production DB. Need: `npx tsx scripts/seed-plans.ts` + `npm run db:seed`

## Skills Taxonomy
| Skill | Key Signal |
|---|---|
| eye-contact | Holding gaze 2–3s, breaking intentionally |
| open-posture | Uncrossed arms, feet apart, upright spine |
| active-listening | Nods, lean-in, mirror expression |
| vocal-pacing | Strategic pause, varied tempo |
| confident-disagreement | Hold position without aggression |

Plus 50 advanced communication tactics (Power Pause, Triangle Gaze, Pacing & Leading, etc.) — see `.shared/outputs/data/communication-tactics.json`

## Difficulty Scoring
Score each clip 1–3 on 4 dimensions. Sum = difficulty:
- Signal Clarity, Noise Level, Context Dependency, Replication Difficulty
- Sum 4–5 = Beginner | 6–8 = Intermediate | 9–12 = Advanced

## Team Roles & Ownership
- **PM**: project-state.json, milestones.json, decisions.json (ONLY PM edits state files)
- **Designer**: design-system.md, .shared/outputs/design/
- **Tester**: test-cases.json, bug reports, coverage.json
- **Data Engineer**: clip pipelines, .shared/outputs/data/
- **Reporter**: activity-log.md, shared-knowledge.md, onboarding.md
- **Builder**: Git, GitHub, Neon DB, Vercel Blob, Vercel deploy, mobile app
- **Backend Engineer**: APIs, services, Prisma schema, admin CMS
- **Marketer**: brand materials, pitch deck, VC outreach

## Feature Inventory (live)
1. **Clip Library** — 65+ clips, search, collapsible filters, 4-col grid, Film/Skill/Difficulty/Screenplay filters
2. **Observation Guide** — Pre-practice clip analysis with techniques + timestamps
3. **Micro-Practice** — Duolingo-style step-by-step practice with 30s recordings
4. **Full Performance** — Complete recording with AI feedback
5. **Foundation Courses** — 3 courses (Voice, Verbal, Body Language), 30 lessons, 120 quiz questions
6. **Arcade Zone** — 3 bundles, 30+ challenges, 10s timer, MediaPipe scoring
7. **Mini-Games** — 5 games (Guess Expression, Match Expression, Expression King, Emotion Timeline, Spot the Signal), embeddable iframe
8. **Coach Ney AI** — Voice + text assistant, context-aware, plan-limited
9. **Discussions** — Flat-threaded comments on lessons and arcade challenges
10. **Gamification** — XP (25-100/activity), streaks, hearts (5/day), daily quests (3/day), 30+ badges, levels 1-50, leaderboards, leagues
11. **Subscriptions** — 3 tiers (Basic/Standard/Advanced), PayPal + VNPay
12. **Access Control** — First 3 arcade challenges free, practice/record require auth
13. **Registration Approval** — Admin approval gate for new signups
14. **CMS** — Pages, blog, team members, site settings
15. **Error Logging** — Client + server error tracking, admin viewer
16. **Admin Dashboards** — Analytics (DAU/WAU/MAU), feature performance, user management
17. **Data Pipeline** — Expression data export, training labels, taxonomy
18. **Submission Review** — Gallery view with side-by-side clip comparison
19. **User Profile** — Bio, avatar, activity summary
20. **Mobile App** — React Native (Expo), 28 screens matching web features

## Prisma Models (45 total)
**Core**: Clip, Annotation, PracticeStep, UserSession, MicroSession
**Foundation**: FoundationCourse, FoundationLesson, LessonExample, QuizQuestion, FoundationProgress
**Auth**: User, Account, AuthSession, VerificationToken, SkillBaseline
**Arcade**: ArcadeBundle, ArcadeChallenge, ArcadeAttempt
**Content**: CrawlJob, CrawlResult, CmsPage, BlogPost, SiteSettings, TeamMember
**Analytics**: ActivityEvent, AnalysisMetric, ErrorLog
**Payment**: Plan, Subscription, Payment
**Social**: Comment, AssistantConversation, AssistantMessage, Leaderboard, UserFollow, PushSubscription
**Gamification**: UserGamification, XpTransaction, DailyQuest, Badge, UserBadge
**Toolkit**: ContentSource, ExpressionAsset, MiniGame, MiniGameRound, MiniGameSession, ExpressionSubmission
**Data**: GameDataExport, TrainingDataLabel

## Key API Routes (grouped)
- `/api/auth/*` — signup, signin, NextAuth handlers
- `/api/sessions`, `/api/micro-sessions` — recording + feedback
- `/api/foundation/progress/*` — course progress
- `/api/arcade/*` — bundles, challenges, attempts
- `/api/comments/*` — CRUD comments
- `/api/assistant/*` — Coach Ney chat + conversations
- `/api/gamification/*` — profile, badges, quests, leaderboard, follow, feed, tier
- `/api/public/*` — plans, games, certificates, leaderboards
- `/api/cms/*` — public CMS content
- `/api/payments/*` — PayPal, VNPay
- `/api/submissions` — user submissions
- `/api/logs` — public error logging
- `/api/admin/*` — all admin endpoints (clips, users, arcade, analytics, plans, crawl-jobs, cms, logs, toolkit, data)

## Key Technical Facts
- MediaPipe replaces GPT-4o Vision for all recording scoring (commit b56564b, 2026-03-25)
- GPT-4o Vision still available as fallback for full performance
- `maxDuration` set on all OpenAI API routes to handle Vercel 10s timeout
- Registration approval: new users start `status='pending'`, admin approves before login works
- `(prisma as any)` cast pattern used when prisma generate can't run locally
- Mobile app excluded from root tsconfig (has its own)
- Mobile login API is at separate path outside NextAuth to avoid conflict
- youtube-transcript npm package replaces custom transcript fetcher

## Critical Constraints
1. Never self-host video — YouTube IFrame only
2. Data pipelines MUST checkpoint — context resets expected
3. No milestone complete without Tester sign-off
4. Only PM edits state files — all other roles signal PM
5. Signal system uses file locking (O_EXCL + stale lock detection)

## Decisions Log (summary)
- DEC-001: Next.js App Router + TypeScript
- DEC-002: YouTube IFrame only (no self-hosted video)
- DEC-003: File-based shared state for multi-agent coordination
- DEC-004: GPT-4o Vision for feedback (now supplemented by MediaPipe)
- DEC-005: 5 skills x 3 difficulty = 15 clips MVP
- DEC-006: Accept 65 clips for M14 (YouTube quota hit)
- DEC-007: Learning Materials Builder with YouTube API + GPT-4o scoring
- DEC-008: M21-M25 platform expansion (analytics, subscriptions, PayPal+VNPay)
- DEC-009: File locking for signal system race conditions
- DEC-010: M26-M28 (registration approval, discussions, Coach Ney)
- DEC-011: M29-M35 (toolkit, gamification, UX overhaul)
- DEC-012: M36-M45 (error logging, CMS, light mode, data pipeline)

## Environment Variables Required
```
DATABASE_URL, DIRECT_URL (Neon PostgreSQL)
NEXTAUTH_SECRET, NEXTAUTH_URL
OPENAI_API_KEY
BLOB_READ_WRITE_TOKEN (Vercel Blob)
YOUTUBE_API_KEY (YouTube Data API v3)
PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE
VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL
```
