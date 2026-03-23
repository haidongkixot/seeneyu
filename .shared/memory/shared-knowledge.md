# Shared Knowledge — seeneyu
> Updated by: Reporter after each milestone
> Read by: All roles at session start

## What is seeneyu?
A body language & communication coaching web app. Learners watch curated Hollywood movie clips, observe a specific skill demonstrated by the character, record themselves mimicking it, receive AI feedback, and repeat to improve.

## Core User Flow
```
Browse Library → Select Clip → Watch + Annotations → Record Yourself
                                                            ↓
                                              AI Feedback (score + tips)
                                                            ↓
                                              Retry or Move to Next Clip
```

## Skills Taxonomy (MVP)
| Skill | Key Signal | Why Important |
|---|---|---|
| eye-contact | Holding gaze 2–3 seconds, breaking intentionally | Foundation of confidence and trust |
| open-posture | Uncrossed arms, feet apart, upright spine | Signals openness and authority |
| active-listening | Nods, lean-in, mirror expression, minimal interruption | Builds rapport, makes others feel heard |
| vocal-pacing | Strategic pause, varied tempo, silence comfort | Controls the room, signals confidence |
| confident-disagreement | Hold position without aggression, body stays open | Most valued in professional settings |

## Difficulty Scoring System
Score each clip 1–3 on 4 dimensions. Sum = difficulty:
- Signal Clarity (1=obvious, 3=subtle)
- Noise Level (1=clean, 3=chaotic)
- Context Dependency (1=universal, 3=needs backstory)
- Replication Difficulty (1=easy, 3=hard)

Sum 4–5 = Beginner | 6–8 = Intermediate | 9–12 = Advanced

## Team Roles & What They Own
- **PM**: project-state.json, milestones.json, decisions.json
- **Designer**: design-system.md, .shared/outputs/design/
- **Tester**: test-cases.json, bug reports, coverage.json
- **Data Engineer**: clip pipelines, .shared/outputs/data/
- **Reporter**: activity-log.md, shared-knowledge.md (this file), onboarding.md
- **Builder**: Git, GitHub, Neon DB, Vercel Blob, Vercel deployment — roles/builder/
- **Backend Engineer**: auth system, admin CMS — roles/backend-engineer/

## Critical Constraints
1. Never self-host video — YouTube IFrame only (store video_id + timestamps)
2. Data pipelines MUST checkpoint — context resets are expected, pipelines must resume
3. No milestone is complete without Tester sign-off
4. All decisions go to decisions.json (PM writes, Reporter summarizes)
5. Tester sign-off required on Tester-approved field in milestones.json before PM marks complete

## Current Status (2026-03-23)
- Phase: **10-personalization**
- M0–M8, M10–M13 COMPLETE. App live at https://seeneyu.vercel.app
- M9 (Marketing Materials): in-progress — Marketer working on VC fundraising package
- M11/M12/M13: code complete, tester sign-off pending
- BUG-001: FIXED in M10 — ClipForm score ranges now 1–3 per dimension

## Milestones Complete (as of 2026-03-23)
M0 (Setup), M1 (Design System), M2 (Data Pipeline), M3 (Clip Library UI), M4 (Coaching Loop), M5 (AI Feedback), M6 (MVP Launch), M7 (Auth System), M8 (Admin CMS), M10 (Script-Aware Coaching), M11 (Observation Guide), M12 (Micro-Practice Stepper), M13 (Onboarding Assessment + Learning Path)

## Key Technical Facts (added 2026-03-22, updated 2026-03-23)
- GPT-4o Vision receives JPEG frames (not video): RecordClient captures frames via Canvas API during recording
- UserSession.frameUrls field holds Vercel Blob URLs for frame images
- NextAuth.js v4, credentials provider (email+password), roles: learner | admin
- /admin/* routes protected by src/middleware.ts (redirects to /auth/signin)
- Run `npm run admin:create` to seed first admin account after db:push
- BUG-001 FIXED (M10): ClipForm dimension score fields are now min=1 max=3; difficultyScore min=4 max=12

## M10+ Architecture (added 2026-03-23)
- Clip model: script String? @db.Text — shown in ScriptPanel on record page
- Feedback API: GPT prompt now includes character name + script context; returns structured steps[] (ActionPlanStep)
- Clip model: observationGuide Json? — AI-generated breakdown (headline + timestamped moments)
- Clip model: practiceSteps Json? — 3–4 micro-steps per clip (instruction, tip, duration)
- PracticeStep model: belongs to Clip — step details (title, focus, description, targetDuration)
- MicroSession model: per-step practice session with 30s max recording and instant AI feedback
- SkillBaseline model: stores 5 skill levels per user from onboarding assessment
- User.onboardingComplete Boolean: set true after /onboarding flow completes
- New routes: /library/[clipId]/practice, /onboarding, /dashboard
- Clip detail page now uses tabs: Watch | How It Works (ObservationGuide)
- Signup redirects → /onboarding; /dashboard shows personalized 5-column skill path
- Prisma cast pattern: `(prisma as any)` used when generate can't run locally — Vercel postinstall handles regen
