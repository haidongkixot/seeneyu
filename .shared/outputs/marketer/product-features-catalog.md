# seeneyu — Product Features Catalog
> Version 2.0 | Updated: 2026-03-29

---

## 1. Learning

### 1.1 Foundation Courses
- **Description:** 3 structured courses (Voice Mastery, Verbal Communication, Body Language) with 30 lessons total. Each lesson includes theory text, 2+ YouTube examples, and a 3-5 question quiz. Progress tracked per user.
- **Status:** Code complete (M15)
- **Tech:** Prisma (FoundationCourse, FoundationLesson, LessonExample, QuizQuestion, FoundationProgress), YouTube IFrame API, Next.js App Router

### 1.2 Clip Library
- **Description:** 65+ curated clips from Hollywood films, searchable and filterable by skill (eye-contact, posture, active-listening, vocal-pacing, confident-disagreement), difficulty (Beginner/Intermediate/Advanced), film title, and screenplay availability. Collapsible filter panel, 4-column grid, debounced search.
- **Status:** Complete and tester-approved (M3, M14, M17)
- **Tech:** Prisma Clip model, YouTube IFrame API, server-side filtering, Tailwind CSS responsive grid

### 1.3 Observation Guide
- **Description:** Pre-practice analysis of each clip. Shows specific techniques used, timestamps where they occur, and why each technique works. Displayed on clip detail page before recording.
- **Status:** Code complete (M11)
- **Tech:** GPT-4o AI-generated guides stored as JSON on Clip model, custom ObservationGuide component

### 1.4 Micro-Practice (Duolingo-Style Steps)
- **Description:** Practice split into 3-5 micro-steps per clip. Each step focuses on one skill element with a 30-second max recording and instant AI feedback. Completing all steps unlocks the Full Performance challenge.
- **Status:** Code complete (M12)
- **Tech:** PracticeStep + MicroSession Prisma models, MediaRecorder API, MediaPipe scoring, stepper UI

### 1.5 Full Performance Recording
- **Description:** Complete recording session where user mimics the entire clip. Receives comprehensive AI feedback with action steps. Side-by-side comparison available in submission review.
- **Status:** Complete and tester-approved (M4, M5)
- **Tech:** MediaRecorder API, Vercel Blob storage, GPT-4o Vision (fallback), MediaPipe (primary scorer)

### 1.6 Script-Aware Coaching
- **Description:** Clips include screenplay excerpts. AI feedback references character context and specific dialogue moments. Character banner and script panel shown during recording.
- **Status:** Code complete (M10)
- **Tech:** Screenplay text stored in DB, screenplay crawler service, GPT-4o prompt engineering with character context

### 1.7 Onboarding Assessment
- **Description:** New users complete a 5-skill screening quiz. AI scores baseline. System generates a personalized learning path (ordered clip sequence by skill level). Progress tracked level by level.
- **Status:** Code complete (M13)
- **Tech:** SkillBaseline + LearningPath Prisma models, multi-step onboarding flow, GPT-4o baseline scoring

---

## 2. Games

### 2.1 Arcade Zone
- **Description:** 3 bundles with 30+ challenges. Each challenge is a 10-second timed activity where users replicate facial expressions or body gestures from reference images. MediaPipe scores accuracy 0-100.
- **Status:** Code complete (M19, M21)
- **Tech:** ArcadeBundle + ArcadeChallenge + ArcadeAttempt Prisma models, MediaPipe FaceLandmarker + PoseLandmarker, CountdownTimer, camera activation

### 2.2 Mini-Game: Guess the Expression
- **Description:** Players identify the correct emotion from an image. Multiple-choice format. Trains expression recognition vocabulary.
- **Status:** Code complete (M30)
- **Tech:** MiniGame + MiniGameRound + MiniGameSession Prisma models, embeddable iframe

### 2.3 Mini-Game: Match the Expression
- **Description:** Players match pairs of identical expressions from a grid. Memory-game format. Builds speed of recognition.
- **Status:** Code complete (M30)
- **Tech:** Same MiniGame infrastructure, card-flip animation

### 2.4 Mini-Game: Expression King Challenge
- **Description:** Players replicate shown expressions using their webcam. MediaPipe scores accuracy in real-time. Competitive leaderboard.
- **Status:** Code complete (M30)
- **Tech:** MediaPipe expression-scorer, ExpressionSubmission model, webcam MediaRecorder

### 2.5 Mini-Game: Emotion Timeline
- **Description:** Players arrange emotions in chronological order as they appear in a scene. Tests understanding of emotional progression.
- **Status:** Code complete (M30)
- **Tech:** Drag-and-drop timeline UI, MiniGameRound scoring

### 2.6 Mini-Game: Spot the Signal
- **Description:** Players identify specific body language signals in video frames within a time limit. Tests observation speed and accuracy.
- **Status:** Code complete (M30)
- **Tech:** Clickable hotspot detection, timed rounds

### 2.7 Embeddable iframe System
- **Description:** All 5 mini-games embeddable on external websites via iframe. Minimal layout (no NavBar). PostMessage bridge for communication with host page. Anonymous play supported with optional signup linking. Certificate generated on completion.
- **Status:** Code complete (M30)
- **Tech:** Next.js route group `(embed)`, CORS configuration, PostMessage API, certificate generator

---

## 3. AI

### 3.1 Coach Ney AI Assistant
- **Description:** Voice + text AI coach persona. Context-aware: knows current lesson/arcade content, learner progress, skill gaps. Supports streaming responses. Idle nudge at 60s/120s of inactivity. Plan-limited (Basic: 5 msg/day text-only, Standard: 50 + voice, Advanced: unlimited).
- **Status:** Code complete (M28)
- **Tech:** OpenAI GPT-4o (chat), Whisper (STT), TTS, AssistantConversation + AssistantMessage models, dynamic system prompt builder, floating amber button UI

### 3.2 AI Content Generator
- **Description:** 3-step toolkit: (1) GPT-4o-mini generates scene descriptions + image prompts, (2) Free AI models (Pollinations.ai primary, HuggingFace secondary, DALL-E fallback) generate images, (3) Convert to Clip-compatible practice content. Admin review before publishing.
- **Status:** Code complete (M46)
- **Tech:** Multi-provider registry with fallback chain, AiContentRequest + AiGeneratedAsset models, Vercel Blob storage

### 3.3 MediaPipe Client-Side Scoring
- **Description:** Google MediaPipe FaceLandmarker + PoseLandmarker runs entirely in the browser. Analyzes facial expressions, head pose, eye gaze, and body posture from webcam frames. Zero API cost per analysis.
- **Status:** Active in production
- **Tech:** @mediapipe/tasks-vision, WebGL, client-side inference

### 3.4 AI Observation Guide Generator
- **Description:** Admin tool that generates structured observation guides for any clip using GPT-4o. Identifies techniques, timestamps, and effectiveness explanations.
- **Status:** Code complete (M11)
- **Tech:** GPT-4o, admin API endpoint, JSON storage on Clip model

### 3.5 Content Relevance Scorer
- **Description:** During content crawling, GPT-4o scores YouTube video candidates for relevance to specific body language skills and communication tactics.
- **Status:** Code complete (M16)
- **Tech:** GPT-4o, YouTube Data API v3, CrawlJob + CrawlResult models

---

## 4. Gamification

### 4.1 XP System
- **Description:** 25-100 XP awarded per activity (practice, quiz, arcade, mini-game). XP drives level progression from Level 1 to Level 50.
- **Status:** Code complete (M31)
- **Tech:** UserGamification + XpTransaction Prisma models, xp-engine service

### 4.2 Streaks
- **Description:** Daily login/practice streak counter with flame icon. Streak-based badges unlock at 3, 7, 14, 30, 60, 90 day milestones.
- **Status:** Code complete (M31)
- **Tech:** streak-tracker service, StreakFlame NavBar widget, StreakToast celebration

### 4.3 Hearts / Energy
- **Description:** 5 hearts per day (Basic tier). Hearts deduct on incorrect quiz/arcade answers. Refill daily. Paid tiers get unlimited hearts.
- **Status:** Code complete (M31)
- **Tech:** hearts-manager service, HeartCounter NavBar widget

### 4.4 Daily Quests
- **Description:** 3 daily quests generated each day (e.g., "Complete 2 micro-practices," "Score 80+ on an arcade challenge") plus a bonus quest. XP rewards on completion.
- **Status:** Code complete (M31)
- **Tech:** DailyQuest Prisma model, quest-generator service

### 4.5 Badges
- **Description:** 30+ achievement badges across categories: streak milestones, skill mastery, arcade performance, social engagement, learning completions. Badge reveal animation on unlock.
- **Status:** Code complete (M31)
- **Tech:** Badge + UserBadge Prisma models, badge-evaluator service, BadgeReveal animation component

### 4.6 Leaderboards
- **Description:** Weekly XP leaderboard, per-skill leaderboard, mini-game leaderboard. Public leaderboard API for embed access.
- **Status:** Code complete (M32)
- **Tech:** Leaderboard Prisma model, leaderboard-service, LeaderboardTable component

### 4.7 Leagues (5-Tier)
- **Description:** Bronze, Silver, Gold, Platinum, Diamond leagues. Weekly promotion/demotion based on XP ranking within league. Visual league card with tier icon.
- **Status:** Code complete (M32)
- **Tech:** league-manager service, LeagueCard component, weekly cron job

### 4.8 Combo Multiplier
- **Description:** Consecutive correct answers build a combo (2x-5x XP multiplier). Visual counter with animation. Resets on incorrect answer or session end.
- **Status:** Code complete (M32)
- **Tech:** combo-tracker service, ComboCounter component

### 4.9 Celebration Animations
- **Description:** Confetti overlay, star burst, badge reveal modal, level-up modal, streak toast, XP float text. All respect prefers-reduced-motion.
- **Status:** Code complete (M33, M35)
- **Tech:** CSS animations, React portals, ARIA live regions for accessibility

---

## 5. Social

### 5.1 Discussions
- **Description:** Flat-threaded comments (1 level deep) on foundation lessons and arcade challenges. Users can post, reply, edit (within 15 min), and delete own comments. Admin moderation (hide/unhide). Rate-limited at 5/min with XSS sanitization.
- **Status:** Code complete (M27)
- **Tech:** Comment Prisma model (polymorphic target: lessonId or challengeId), CommentThread + CommentCard + CommentForm components

### 5.2 Follow System
- **Description:** Users can follow other users. Activity feed shows recent actions from followed users.
- **Status:** Code complete (M32)
- **Tech:** UserFollow Prisma model, FollowButton component, ActivityFeed component

### 5.3 Activity Feed
- **Description:** Chronological feed of actions from followed users (practice completions, badge unlocks, leaderboard rankings).
- **Status:** Code complete (M32)
- **Tech:** ActivityEvent model aggregation, ActivityFeed component

---

## 6. Platform

### 6.1 CMS (Content Management System)
- **Description:** Full CMS for managing frontend content: CMS pages (slug-based), blog posts (TipTap rich text editor, cover images), team members (name, role, bio, photo), site settings (name, tagline, logo, social links). Image upload to Vercel Blob. Public read API for frontend consumption.
- **Status:** Code complete (M37)
- **Tech:** CmsPage + BlogPost + SiteSettings + TeamMember Prisma models, TipTap editor, Vercel Blob, admin CRUD pages

### 6.2 Admin Panel
- **Description:** Comprehensive admin interface covering: clip management, user management (with bulk actions and CSV export), arcade management, crawl jobs, CMS, plans, analytics, toolkit, data export, error logs, submission review.
- **Status:** Code complete (M8, M21-M23, M44)
- **Tech:** Next.js App Router /admin/ routes, role-based access control, tabbed interfaces

### 6.3 Analytics Dashboards
- **Description:** DAU/WAU/MAU metrics, signup charts, per-user activity view with login timestamps, learning curves per user, feature performance (crawl jobs, MediaPipe metrics, content pipeline stats).
- **Status:** Code complete (M22, M23)
- **Tech:** ActivityEvent + AnalysisMetric Prisma models, Chart.js / Recharts, admin analytics pages

### 6.4 Error Logging
- **Description:** Client + server error tracking. React ErrorBoundary captures client crashes. Public POST endpoint (rate-limited) for client errors. Admin log viewer with severity/source/date filters. Mark as resolved or delete.
- **Status:** Code complete (M36)
- **Tech:** ErrorLog Prisma model, logger.ts (server), client-logger.ts (client), ErrorBoundary component

### 6.5 User Management
- **Description:** Registration approval gate (new users start pending, admin approves). User profiles (displayName, avatar, bio). Admin user detail with tabs (Profile, Activity, Submissions, Subscription, Logs). Bulk approve/suspend. Search and advanced filters. CSV export.
- **Status:** Code complete (M26, M44)
- **Tech:** User model with status field, admin approval workflow, tabbed detail pages

### 6.6 Subscription & Payments
- **Description:** 3-tier plans (Basic free, Standard $12/mo, Advanced $24/mo). Admin-configurable pricing. PayPal + VNPay sandbox integration. Plan enforcement across all features (recording length, feedback detail, Coach Ney limits, hearts).
- **Status:** Code complete (M24, M25)
- **Tech:** Plan + Subscription + Payment Prisma models, PayPal SDK, VNPay integration, subscription-manager service

### 6.7 Data Pipeline
- **Description:** Export expression data from mini-games and arcade as CSV/JSON. Training data label taxonomy. Data standardizer normalizes raw submissions into labeled training data. Filtered by date range and expression type.
- **Status:** Code complete (M45)
- **Tech:** GameDataExport + TrainingDataLabel models, data-standardizer service, expression-taxonomy definitions

---

## 7. Mobile

### 7.1 React Native App (Expo)
- **Description:** 28 screens matching web features. File-based routing via Expo Router. Connected to real production API. Screens include: onboarding, auth, library, clip detail, practice, arcade, foundation courses, coach Ney, gamification dashboard, profile, settings.
- **Status:** Scaffolded and connected (2026-03-26)
- **Tech:** React Native, Expo SDK 52, Expo Router (file-based routing), shared API backend

---

## 8. Learning Assistant Engine

### 8.1 Core Engine
- **Description:** Abstract, SaaS-ready engine with ILearner, IContentProvider, and INotificationChannel interfaces. Pluggable architecture allows third-party platforms to integrate. 3 analyzers (progress, engagement, skill-gap), 3 planners (activity, reminder, motivation). Proactive suggestion banner on dashboard.
- **Status:** Code complete (M47)
- **Tech:** TypeScript interfaces, Prisma (6 models), cron scheduler, processActivity() hook

### 8.2 In-App Notification Channel
- **Description:** In-app notifications delivered within the seeneyu interface. Template-based rendering with dynamic content.
- **Status:** Code complete (M47)
- **Tech:** Template system, in-app channel implementation

### 8.3 Push Notification Channel
- **Description:** Web Push via service worker. Permission prompt, subscription management, click tracking, deep links. VAPID key authentication.
- **Status:** Code complete (M48)
- **Tech:** web-push npm, Service Worker, PushSubscription model, VAPID keys

### 8.4 Email Channel
- **Description:** Email notifications via Resend (free tier 3000/month). React Email templates for weekly reports, streak celebrations, comeback nudges, level-up announcements. User email preferences with opt-in/out per type.
- **Status:** Code complete (M49)
- **Tech:** Resend API, React Email, weekly report cron job

### 8.5 WhatsApp Channel
- **Description:** WhatsApp Business API integration for engagement messages. Opt-in required. Streak reminders, weekly summaries, achievement celebrations.
- **Status:** Code complete (M50)
- **Tech:** WhatsApp Business API, template messages, opt-in management

---

## Summary Statistics

| Metric | Count |
|---|---|
| Total milestones | 50 (M0-M50) |
| Tester-approved milestones | 9 (M0-M8) |
| Code-complete milestones | 41 (M10-M50) |
| Prisma database models | 45+ |
| Schema lines | 773 |
| API route groups | 15+ |
| Curated clips | 65+ |
| Foundation lessons | 30 |
| Quiz questions | 120 |
| Arcade challenges | 30+ |
| Mini-games | 5 |
| Mobile screens | 28 |
| Communication tactics | 50+ |
| Achievement badges | 30+ |
