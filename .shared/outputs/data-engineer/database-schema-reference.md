# Seeneyu Database Schema Reference

> Prepared for: Investor Tech Audit Workshop
> Date: 2026-03-29 | Version: 1.0
> Database: PostgreSQL (Neon) | ORM: Prisma 6 | Schema: 915 lines

---

## 1. Schema Summary

| Metric | Value |
|--------|-------|
| **Total Models** | 45 |
| **Schema Lines** | 915 |
| **Total Indexes** | 62 |
| **Unique Constraints** | 14 |
| **Relations** | 38 |
| **Domain Groups** | 8 |

---

## 2. Models by Domain

### 2.1 Auth & Users (5 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **User** | User account with role and approval status | 19 | `email` (unique), `role`, `status`, `plan`, `passwordHash`, `onboardingComplete` | `status` |
| **Account** | OAuth provider accounts (NextAuth) | 12 | `userId`, `provider`, `providerAccountId` | `[provider, providerAccountId]` (unique) |
| **AuthSession** | Active login sessions | 4 | `sessionToken` (unique), `userId`, `expires` | - |
| **VerificationToken** | Email verification tokens | 3 | `identifier`, `token` (unique) | `[identifier, token]` (unique) |
| **SkillBaseline** | Onboarding skill self-assessment | 6 | `userId`, `skillCategory`, `level`, `selfRating` | `userId`, `[userId, skillCategory]` (unique) |

**Relationships:**
- User has many: Account, AuthSession, UserSession, SkillBaseline, FoundationProgress, ArcadeAttempt, ActivityEvent, Subscription, Comment, AssistantConversation
- User has one: UserGamification, LearnerProfile

---

### 2.2 Core Learning Content (5 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **Clip** | Learning content unit (movie clip) | 22 | `youtubeVideoId`, `skillCategory`, `difficulty`, `difficultyScore`, `script`, `observationGuide` (JSON), `mediaType`, `mediaUrl` | `skillCategory`, `difficulty`, `[skillCategory, difficulty]` |
| **Annotation** | Timed clip annotations | 5 | `clipId`, `atSecond`, `note`, `type` | `clipId`, `[clipId, atSecond]` |
| **PracticeStep** | Micro-practice step definitions | 7 | `clipId`, `stepNumber`, `skillFocus`, `instruction`, `targetDurationSec` | `clipId` |
| **UserSession** | Full performance recording session | 12 | `clipId`, `userId`, `recordingUrl`, `frameUrls`, `feedback` (JSON), `scores` (JSON) | `clipId`, `status`, `createdAt` |
| **MicroSession** | Micro-practice recording session | 10 | `clipId`, `stepNumber`, `recordingUrl`, `audioUrl`, `transcript`, `feedback` (JSON) | `clipId` |

**Relationships:**
- Clip has many: Annotation, UserSession, PracticeStep
- UserSession belongs to: Clip, User

---

### 2.3 Foundation Education (5 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **FoundationCourse** | Course catalog (3 courses) | 7 | `slug` (unique), `title`, `icon`, `color`, `order` | - |
| **FoundationLesson** | Lesson content | 6 | `courseId`, `slug`, `title`, `theoryHtml` (Text), `order` | `courseId`, `[courseId, slug]` (unique) |
| **LessonExample** | YouTube examples per lesson | 7 | `lessonId`, `youtubeId`, `title`, `mediaUrl`, `mediaType` | `lessonId` |
| **QuizQuestion** | Quiz questions with MCQ | 7 | `lessonId`, `question`, `options` (JSON), `correctIndex`, `explanation` | `lessonId` |
| **FoundationProgress** | Per-user lesson completion | 8 | `userId`, `lessonId`, `quizScore`, `quizPassed`, `completedAt` | `userId`, `[userId, lessonId]` (unique) |

**Relationships:**
- FoundationCourse has many: FoundationLesson
- FoundationLesson has many: LessonExample, QuizQuestion, FoundationProgress, Comment

---

### 2.4 Arcade (3 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **ArcadeBundle** | Challenge collection (theme) | 7 | `title`, `theme`, `difficulty`, `xpReward` | - |
| **ArcadeChallenge** | Individual 10s challenge | 12 | `bundleId`, `type` (facial/gesture), `referenceImageUrl`, `mediaUrl`, `mediaType`, `orderIndex` | `bundleId` |
| **ArcadeAttempt** | User attempt record | 8 | `userId`, `challengeId`, `score`, `breakdown` (JSON), `feedbackLine` | `userId`, `challengeId`, `[userId, challengeId]` |

**Relationships:**
- ArcadeBundle has many: ArcadeChallenge
- ArcadeChallenge has many: ArcadeAttempt, Comment
- ArcadeAttempt belongs to: User, ArcadeChallenge

---

### 2.5 Gamification (5 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **UserGamification** | Per-user gamification stats | 10 | `userId` (unique), `totalXp`, `level`, `currentStreak`, `longestStreak`, `hearts`, `heartsRefillAt`, `streakFreezes` | `totalXp`, `currentStreak` |
| **XpTransaction** | XP award history | 6 | `userId`, `amount`, `source`, `sourceId`, `metadata` (JSON) | `[userId, createdAt]` |
| **DailyQuest** | Daily challenge goals | 9 | `userId`, `date`, `questType`, `target`, `progress`, `xpReward`, `completed` | `[userId, date]`, `[userId, date, questType]` (unique) |
| **Badge** | Achievement definitions | 7 | `slug` (unique), `name`, `category`, `criteria` (JSON), `iconEmoji` | - |
| **UserBadge** | Earned badge records | 4 | `userId`, `badgeId`, `earnedAt` | `userId`, `[userId, badgeId]` (unique) |

**Relationships:**
- UserGamification belongs to: User (1:1)
- Badge has many: UserBadge

---

### 2.6 Social & Communication (6 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **Comment** | User comments (1-level threading) | 13 | `userId`, `lessonId`, `challengeId`, `parentId`, `body` (Text), `isHidden` | `[lessonId, createdAt]`, `[challengeId, createdAt]`, `parentId`, `userId` |
| **AssistantConversation** | Coach Ney AI chat session | 5 | `userId`, `context` | `userId`, `[userId, context]` |
| **AssistantMessage** | Chat messages (user + assistant) | 5 | `conversationId`, `role`, `content` (Text), `audioUrl` | `[conversationId, createdAt]` |
| **Leaderboard** | Cached leaderboard snapshots | 5 | `type`, `period`, `entries` (JSON) | `[type, period]` (unique) |
| **UserFollow** | Social follow relationships | 4 | `followerId`, `followingId` | `followerId`, `followingId`, `[followerId, followingId]` (unique) |
| **PushSubscription** | Web push subscription endpoints | 4 | `userId`, `endpoint` (Text), `keys` (JSON) | `userId` |

---

### 2.7 Content Management & Admin (9 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **CrawlJob** | YouTube content discovery job | 10 | `skillCategory`, `keywords` (JSON), `status`, `createdBy` | `status`, `createdBy` |
| **CrawlResult** | Crawl candidate videos | 12 | `jobId`, `youtubeId`, `relevanceScore`, `aiAnalysis`, `status` | `jobId`, `[jobId, status]` |
| **CmsPage** | CMS-managed pages | 8 | `slug` (unique), `title`, `content` (JSON), `status` | `[slug, status]` |
| **BlogPost** | Blog posts | 10 | `slug` (unique), `title`, `body` (Text), `coverImage`, `status` | `[status, publishedAt]` |
| **SiteSettings** | Key-value site settings | 3 | `key` (unique), `value` (JSON) | - |
| **TeamMember** | Team page members | 7 | `name`, `title`, `bio`, `avatarUrl`, `order` | `[isActive, order]` |
| **ContentSource** | Data crawler raw content | 9 | `type`, `url`, `rawContent` (Text), `status` | `[type, status]`, `createdAt` |
| **ExpressionAsset** | Expression reference images | 8 | `imageUrl`, `label`, `tags` (JSON), `confidence`, `status` | `label`, `status` |
| **ErrorLog** | Application error tracking | 11 | `level`, `source`, `message` (Text), `stack`, `resolved` | `level`, `source`, `resolved`, `createdAt` |

---

### 2.8 Subscription & Payments (3 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **Plan** | Subscription tier definitions | 9 | `slug` (unique), `name`, `monthlyPrice`, `annualPrice`, `features` (JSON), `videoLimitSec` | - |
| **Subscription** | Active user subscriptions | 10 | `userId`, `planId`, `status`, `period`, `startDate`, `endDate` | `userId`, `status` |
| **Payment** | Payment transaction records | 9 | `subscriptionId`, `gateway`, `gatewayOrderId`, `amount`, `currency`, `status` | `subscriptionId`, `[gateway, gatewayOrderId]` |

---

### 2.9 Analytics & Data Pipeline (4 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **ActivityEvent** | User activity tracking | 5 | `userId`, `type`, `metadata` (JSON) | `userId`, `type`, `createdAt`, `[userId, type]` |
| **AnalysisMetric** | MediaPipe performance metrics | 7 | `sessionType`, `durationMs`, `faceDetected`, `poseDetected`, `score` | `sessionType`, `createdAt` |
| **GameDataExport** | Data export jobs | 8 | `name`, `format`, `filters` (JSON), `fileUrl`, `status` | `status` |
| **TrainingDataLabel** | ML training data labels | 6 | `submissionId`, `expressionLabel`, `confidence`, `validatedBy` | `expressionLabel`, `submissionId` |

---

### 2.10 Mini-Games & Data Collection (4 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **MiniGame** | Game type definitions (5 games) | 6 | `type` (unique), `title`, `config` (JSON), `isActive` | - |
| **MiniGameRound** | Game round content | 6 | `gameId`, `orderIndex`, `prompt`, `imageUrl`, `correctAnswer`, `options` (JSON) | `gameId` |
| **MiniGameSession** | Play session records | 8 | `gameId`, `playerId`, `score`, `totalRounds`, `responses` (JSON) | `[gameId, score]`, `playerId` |
| **ExpressionSubmission** | Camera expression captures | 7 | `challengeLabel`, `imageUrl`, `aiScore`, `aiAnalysis`, `status` | `challengeLabel`, `status` |

---

### 2.11 Learning Assistant Engine (5 models)

| Model | Purpose | Fields | Key Fields | Indexes |
|-------|---------|--------|------------|---------|
| **LearnerProfile** | Learner preferences and analytics | 16 | `userId` (unique), `timezone`, `preferredChannels` (JSON), `engagementScore`, `weakSkills` (JSON), `strongSkills` (JSON), `whatsappPhone` | `engagementScore` |
| **LearningPlan** | Daily/weekly activity plans | 8 | `userId`, `type`, `date`, `activities` (JSON), `status` | `[userId, type, date]` (unique), `[userId, status]` |
| **ScheduledNotification** | Notification delivery queue | 11 | `userId`, `triggerType`, `channel`, `scheduledFor`, `payload` (JSON), `priority`, `status`, `attempts` | `[status, scheduledFor]`, `[userId, triggerType]` |
| **NotificationLog** | Delivery audit trail | 12 | `userId`, `notificationId`, `triggerType`, `channel`, `title`, `deliveryStatus`, `deliveredAt`, `openedAt` | `[userId, createdAt]`, `triggerType` |
| **NotificationTemplate** | Message templates with variables | 10 | `slug` (unique), `triggerType`, `channel`, `title`, `body` (Text), `variables` (JSON), `locale` | `[triggerType, channel, locale]` (unique) |

---

## 3. Data Volume Estimates

### 3.1 Per-User Data Generation

| Data Type | Records per Active User per Day | Size per Record |
|-----------|-------------------------------|-----------------|
| ActivityEvent | 5-15 | ~200 bytes |
| XpTransaction | 3-8 | ~150 bytes |
| DailyQuest | 3 | ~200 bytes |
| FoundationProgress | 0-2 | ~150 bytes |
| ArcadeAttempt | 0-5 | ~300 bytes |
| MicroSession | 0-3 | ~500 bytes |
| UserSession | 0-1 | ~500 bytes |
| Comment | 0-2 | ~300 bytes |
| ScheduledNotification | 2-4 | ~400 bytes |
| NotificationLog | 2-4 | ~300 bytes |
| AssistantMessage | 0-10 | ~500 bytes |

### 3.2 Projected Table Sizes

| Scale | Users | DAU (30%) | Monthly Records | DB Size (est.) |
|-------|-------|-----------|-----------------|----------------|
| **1K users** | 1,000 | 300 | ~400K | ~200 MB |
| **10K users** | 10,000 | 3,000 | ~4M | ~2 GB |
| **100K users** | 100,000 | 30,000 | ~40M | ~20 GB |

### 3.3 Storage Volume (Vercel Blob)

| Scale | Recording Uploads/Day | Storage/Month |
|-------|----------------------|---------------|
| **1K users** | ~150 recordings | ~15 GB |
| **10K users** | ~1,500 recordings | ~150 GB |
| **100K users** | ~15,000 recordings | ~1.5 TB |

### 3.4 Growth-Critical Tables (Require Partition/Archive Strategy at 100K+)

| Table | Growth Rate | Mitigation |
|-------|------------|------------|
| **ActivityEvent** | ~15 per user/day | Archive after 90 days |
| **XpTransaction** | ~8 per user/day | Archive after 1 year |
| **NotificationLog** | ~4 per user/day | Archive after 30 days |
| **ScheduledNotification** | ~4 per user/day (cleared after send) | Auto-cleanup sent records |
| **AssistantMessage** | ~10 per active chat session | Summarize + archive old conversations |
| **MiniGameSession** | Variable (public, no auth required) | TTL-based cleanup |

---

## 4. Index Strategy

### Composite Indexes for Common Queries

```
-- User dashboard (recent activity)
@@index([userId, type])          -- ActivityEvent
@@index([userId, createdAt])     -- XpTransaction, NotificationLog

-- Admin analytics
@@index([createdAt])             -- ActivityEvent, AnalysisMetric
@@index([status])                -- CrawlJob, ErrorLog, Subscription

-- Learning engine queries
@@index([status, scheduledFor])  -- ScheduledNotification (queue processing)
@@index([userId, status])        -- LearningPlan (active plans)
@@index([engagementScore])       -- LearnerProfile (batch processing)

-- Content discovery
@@index([skillCategory, difficulty]) -- Clip (library filtering)
@@index([jobId, status])            -- CrawlResult (job review)
```

### Missing Indexes (Technical Debt)

The current schema is well-indexed for known access patterns. Potential additions at scale:
- `ActivityEvent` partitioning by `createdAt` (time-series optimization)
- `UserSession.userId` index for per-user session history
- `MiniGameSession.createdAt` for time-based cleanup queries

---

## 5. Entity-Relationship Summary

```
User ----1:N---- UserSession ----N:1---- Clip
  |                                        |
  +----1:N---- ArcadeAttempt --N:1-- ArcadeChallenge --N:1-- ArcadeBundle
  |
  +----1:N---- FoundationProgress --N:1-- FoundationLesson --N:1-- FoundationCourse
  |
  +----1:1---- UserGamification
  +----1:1---- LearnerProfile
  +----1:N---- Subscription ----N:1---- Plan
  |                |
  |                +----1:N---- Payment
  |
  +----1:N---- Comment
  +----1:N---- AssistantConversation ----1:N---- AssistantMessage
  +----1:N---- ActivityEvent
  +----1:N---- XpTransaction
  +----1:N---- DailyQuest
  +----1:N---- UserBadge ----N:1---- Badge
  +----1:N---- SkillBaseline
  +----1:N---- Account
```

---

*Document prepared by Data Engineer role. Schema verified against `prisma/schema.prisma` (915 lines, 45 models) as of 2026-03-29.*
