# seeneyu — Investor One-Pager
> PeeTeeAI JSC | Seed Round | March 2026

---

## The Problem

55% of communication impact comes from body language (Mehrabian, 1967). Yet no platform exists to practice it systematically. The $370B corporate training market relies on passive video courses that teach theory without practice. 89% of hiring failures trace to poor soft skills, not technical ability. Professionals know body language matters — they just have no way to train it.

## The Solution

**seeneyu** is the world's first AI-powered body language coaching platform. Learners watch curated Hollywood performances, observe specific techniques, record themselves mimicking the behavior, and receive instant AI feedback from MediaPipe and GPT-4o.

**Core Loop:** Watch --> Observe --> Mimic --> AI Feedback --> Repeat

This is the Duolingo model applied to body language — gamified, measurable, and repeatable.

## What We Have Built (Live at seeneyu.vercel.app)

| Category | Specifics |
|---|---|
| **Learning** | 65+ curated clips, 3 foundation courses (30 lessons, 120 quizzes), micro-practice with step-by-step coaching |
| **Games** | 5 mini-games (Guess Expression, Match Expression, Expression King, Emotion Timeline, Spot the Signal), embeddable iframe for viral distribution |
| **AI** | Coach Ney voice assistant (GPT-4o + Whisper + TTS), AI content generator (multi-provider), observation guides, MediaPipe client-side scoring (zero API cost) |
| **Gamification** | XP (25-100/activity), streaks, hearts, 30+ badges, levels 1-50, leaderboards, 5-tier leagues, daily quests, combo multipliers |
| **Mobile** | React Native (Expo SDK 52) app, 28 screens, connected to live API |
| **Platform** | CMS, admin panel, user management, error logging, analytics dashboards, data pipeline, PayPal + VNPay payments |
| **Engine** | Learning Assistant Engine — SaaS-ready with 4 notification channels (in-app, push, email, WhatsApp) |

**50 milestones scoped (M0-M50). 45+ Prisma database models. 773-line schema.**

## Tech Stack

Next.js 14 + TypeScript | React Native (Expo) | PostgreSQL (Neon) + Prisma | OpenAI GPT-4o + Whisper + TTS | Google MediaPipe (client-side ML, zero cost) | NextAuth.js | Vercel Blob | YouTube IFrame API | PayPal + VNPay

## Unique Differentiators

1. **Only product combining body language practice + AI visual feedback** — competitors (Yoodli, Poised, Orai) are speech-only
2. **MediaPipe client-side scoring** — facial landmark + pose analysis runs in-browser, zero per-user API cost
3. **Coach Ney AI assistant** — context-aware voice coach that knows the learner's progress, current lesson, and skill gaps
4. **Learning Assistant Engine** — abstracted, SaaS-ready engine with pluggable analyzers, planners, and notification channels — licensable to other edtech platforms
5. **AI-powered multi-agent development** — 8-role team (PM, Designer, Builder, Tester, Data Engineer, Backend Engineer, Reporter, Marketer) operating via file-based signal protocol

## Business Model

| Tier | Price | Features |
|---|---|---|
| **Basic** | Free | 5 clips, 5s recordings, text feedback, 5 Coach Ney messages/day |
| **Standard** | $12/month | Full library, 30s recordings, full AI feedback, 50 Coach Ney messages + voice |
| **Advanced** | $24/month | Everything + 3min recordings, VIP lessons, monthly coach summary, unlimited AI |

**B2B licensing**: Learning Assistant Engine as SaaS for corporate L&D teams and edtech platforms.

## Market Opportunity

| | |
|---|---|
| **TAM** | $30B — global online professional development (12.3% CAGR through 2030) |
| **SAM** | $8B — online professional skills (US + Western Europe) |
| **SOM (3-year)** | $12M ARR — 100K paid users at $120 avg annual revenue |

## Comparable Companies

- **Yoodli** (AI speech coaching): $10M Series A, ~$50M valuation — speech-only, no body language
- **Poised** (real-time call coaching): $10.7M Series A, ~$55M valuation — speech-only, no practice mode
- **Duolingo** (gamified learning): Seed $3.3M at ~$15M — same practice-loop model, now $8B+ market cap

## The Ask

**Seed round: $1.5M**

| Use of Funds | Allocation |
|---|---|
| Engineering (hire 3) | 45% — $675K |
| Content & AI training data | 20% — $300K |
| Marketing & user acquisition | 20% — $300K |
| Operations & infrastructure | 15% — $225K |

**Milestones with funding:** 10K paid users in 12 months. First 3 enterprise pilots. App Store + Play Store launch. Break-even at Month 18.

## Team

**PeeTeeAI JSC** — AI-powered multi-agent development methodology. 8 specialized roles (PM, Designer, Builder, Backend Engineer, Tester, Data Engineer, Reporter, Marketer) coordinating via file-based signal protocol. 50 milestones delivered from M0 to M50 in under 2 weeks of development time.

---

**Contact:** PeeTeeAI JSC | seeneyu.vercel.app | Tagline: "Watch great performers. Become one."
