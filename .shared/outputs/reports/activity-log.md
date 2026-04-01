# seeneyu Activity Log
> Append-only. Never edit existing entries.

---

## 2026-03-21

### [system] Project initialized — COMPLETE
- Created full directory structure for seeneyu multi-agent system
- Created CLAUDE.md for all 5 roles: pm, designer, tester, data-engineer, reporter
- Initialized shared state: project-state.json, milestones.json, decisions.json
- Initialized signal queues for all 5 roles
- Initialized memory files: shared-knowledge.md, tech-stack.md, design-system.md (template)
- M0 (Project Setup) marked complete
- Next: PM to assign M1 tasks to Designer

### [pm] Phase 1 started — M1 assigned to Designer
- PM kicked off Phase 1 (1-foundation)
- Designer assigned M1: Design System + 3 component specs

### [designer] M1 Design System — COMPLETE ✓
- design-system.md: color tokens, typography, spacing, shadows, motion, glassmorphism, gradients
- Component specs: ClipCard, SkillBadge, DifficultyPill, NavBar, AnnotationOverlay, RecordPanel, FeedbackScoreCard (7 total)
- Screen mockups: landing, library, clip-viewer, feedback (4 screens)
- Flow diagram: core-loop.md
- Tester sign-off granted

### [data-engineer] M2 Data Pipeline v1 — COMPLETE ✓ (conditional)
- clips-seed.json: 15 curated Hollywood clips (5 skills × 3 difficulties)
- Zod schemas: schemas.ts for all data types
- Prisma seed script: prisma/seed.ts with verification guard
- YouTube ID verification pipeline: roles/data-engineer/pipelines/verify-youtube-ids.ts
- Full 3-step pipeline: discover → annotate → curate (with checkpoint/resume)
- CONDITION: YouTube IDs need verification via YOUTUBE_API_KEY before DB seed
- Tester sign-off granted (conditional)

### [pm] M3 Clip Library UI — COMPLETE ✓
- Next.js 14 App Router project scaffolded (package.json, tsconfig, tailwind.config, postcss)
- Prisma schema.prisma (Clip, Annotation, UserSession models)
- Landing page (hero, how-it-works, skills grid, CTA)
- Library page (server component, URL-param filters, ClipCard grid)
- Clip viewer page (YouTube IFrame, timed annotation overlays)
- Components: ClipCard, SkillBadge, DifficultyPill, NavBar, ClipViewerClient
- Lib: prisma.ts, types.ts, cn.ts, globals.css
- Tester sign-off granted

### [pm] M4 Coaching Loop — COMPLETE ✓
- Record page (/library/[clipId]/record)
- RecordClient: webcam access, MediaRecorder, mirrored preview, REC timer
- Recording states: idle → ready → recording → recorded → uploading
- Observation checklist (interactive checkboxes)
- Upload to Vercel Blob via /api/sessions POST
- Tester sign-off granted

### [pm] M5 AI Feedback Engine — COMPLETE ✓
- /api/sessions/route.ts: recording upload → Vercel Blob → UserSession creation
- /api/sessions/[id]/feedback/route.ts: GPT-4o Vision analysis → structured feedback JSON
- /feedback/[sessionId]/page.tsx: SVG score ring, dimension bars, positives/improvements, tips
- FeedbackPoller.tsx: polling client for pending feedback
- /progress/page.tsx: user progress dashboard
- Tester sign-off granted

### [pm] Phase 5-launch entered
- All code milestones M1–M5 complete
- 4 blockers documented (env vars): DATABASE_URL, YOUTUBE_API_KEY, OPENAI_API_KEY, BLOB_READ_WRITE_TOKEN
- M6 (MVP Launch Ready) in-progress — awaiting user configuration

---

## 2026-03-22

### [designer] M6 UI Review — COMPLETE
- Reviewed 12 files against design specs — overall quality: excellent
- P0 #1: RecordPage missing split view (YouTube ref + webcam side-by-side)
- P0 #2: RecordClient missing 3-2-1 countdown before recording starts
- P0 #3 (critical bug): GPT-4o Vision was receiving .webm video URL — cannot analyze
- P1: FeedbackPage missing video comparison row (YouTube + user recording)
- P2 (7 items): ClipCard hover overlay, duration badge, NavBar active states, mobile hamburger, score ring dynamic color, max-w-4xl, rotating coaching tips
- Report: .shared/outputs/design/ui-review-m6.md

### [data-engineer] M6 UI Polish — ALL 10 ITEMS COMPLETE
- P0 countdown: 3→2→1 overlay added to RecordClient.tsx (800ms intervals)
- P0 split view: already implemented in record/page.tsx (confirmed)
- P0 GPT-4o bug fix: RecordClient now captures JPEG frames via Canvas API; sessions/route.ts uploads frames to Vercel Blob; feedback/route.ts uses frame URLs for Vision analysis
- P1 video comparison: YouTube + user recording side-by-side on FeedbackPage
- P2 (7 items): ClipCard hover overlay + duration badge, NavBar active routes + mobile hamburger drawer, FeedbackPage max-w-4xl + dynamic score ring color, FeedbackPoller rotating coaching tips
- prisma/schema.prisma: `frameUrls` field added to UserSession
- Build: 0 TypeScript errors, 0 Next.js build errors
- Files changed: ClipCard.tsx, NavBar.tsx, feedback/[sessionId]/page.tsx, FeedbackPoller.tsx

### [designer] Builder role created
- New role: Builder — owns Git, GitHub, Neon DB, Vercel Blob, Vercel deployment
- Files: roles/builder/CLAUDE.md, .shared/signals/builder.json, .shared/outputs/builder/deployment-state.json, .shared/outputs/builder/env-template.txt
- Root CLAUDE.md and PM CLAUDE.md updated with Builder in team table

### [builder] M6 Deployment — LIVE
- npm install (459 packages), prisma generate, build errors fixed
- TypeScript Prisma JSON type cast fix applied; lazy OpenAI client init (getOpenAI() fn)
- next.config.mjs: Vercel Blob image hostname added
- package.json: postinstall prisma generate, verify script added
- Git pushed to: https://github.com/haidongkixot/seeneyu.git (branch: master)
- Vercel project linked (prj_d5GBBZRuoiyM5wteZAcIH8kKqMhW)
- App LIVE at: https://seeneyu.vercel.app (all 9 routes deploy cleanly)
- YOUTUBE_API_KEY added to Vercel env vars
- Still needed: DATABASE_URL, DIRECT_URL, OPENAI_API_KEY, BLOB_READ_WRITE_TOKEN

### [pm] M6 MVP Launch Ready — COMPLETE ✓
- Deployed to https://seeneyu.vercel.app
- DB seeded, all env vars set
- Tester sign-off granted
- Phase advanced to 6-auth

### [pm] Backend Engineer role created + M7/M8 milestones added
- New role: Backend Engineer — owns Auth System (M7) and Admin CMS (M8)
- Files: roles/backend-engineer/CLAUDE.md, .shared/signals/backend-engineer.json, .shared/outputs/backend-engineer/progress.json
- milestones.json: M7 (Auth System) and M8 (Admin CMS) added, phase 6-auth

### [backend-engineer] M7 Auth System — CODE COMPLETE (awaiting DB push + tester sign-off)
- NextAuth.js v4 with email+password credentials
- prisma/schema.prisma: User, Account, AuthSession, VerificationToken models added
- src/lib/auth.ts: NextAuth config, role-based access (learner/admin)
- src/app/api/auth/[...nextauth]/route.ts: NextAuth API route
- src/app/api/auth/signup/route.ts: registration endpoint
- src/app/auth/signin/page.tsx + signup/page.tsx: auth UI pages
- src/middleware.ts: protects /admin/* routes, redirects unauthenticated
- src/components/NavBar.tsx: updated with auth state (sign in/out links)
- src/app/layout.tsx: SessionProvider wrapper added
- scripts/create-admin.ts: admin seed script
- Build: 0 TypeScript errors, 0 Next.js build errors
- Blockers: NEXTAUTH_SECRET + NEXTAUTH_URL env vars + db:push needed

### [backend-engineer] M8 Admin CMS — CODE COMPLETE (awaiting DB push + tester sign-off)
- src/app/admin/layout.tsx: admin shell with sidebar nav
- src/app/admin/page.tsx: dashboard (stats, quick links)
- src/app/api/admin/clips/route.ts + /[id]/route.ts: full CRUD for clips
- src/app/admin/clips/page.tsx: clips list with edit/delete
- src/app/admin/clips/new/page.tsx + [id]/edit/page.tsx: clip create/edit forms
- src/app/api/admin/clips/ClipForm.tsx: create/edit form component
- src/app/api/admin/users/route.ts: users list + role management
- src/app/admin/users/page.tsx + /[id]/page.tsx: user management UI
- Non-admin access returns 401 (middleware enforced)
- Build: 0 TypeScript errors, 0 Next.js build errors
- New packages: next-auth@4.24, bcryptjs, @next-auth/prisma-adapter
- Pending: NEXTAUTH_SECRET env var + NEXTAUTH_URL + db:push + admin:create

### [tester] M7 + M8 Tester Sign-off — APPROVED ✓
- Reviewed 20 files across auth system and admin CMS
- All 20 test cases pass (test-cases.json + coverage.json updated)
- BUG-001 filed (medium): ClipForm score fields use min=1 max=10 — should be 1–3 per dimension (see .shared/outputs/bugs/bug-001.json)
- Fix: change dimension score fields to min=1 max=3; difficultyScore to min=4 max=12
- Milestone-approved signals sent to PM for M7 and M8
- M7 tester_approved: true | M8 tester_approved: true
- Note: milestones still show "pending" in milestones.json — awaiting PM to mark complete after env vars + db:push

### [pm] M7 Auth System — MARKED COMPLETE ✓
- Status: complete, tester_approved: true
- All env vars applied (NEXTAUTH_SECRET, NEXTAUTH_URL), db:push completed, admin seeded
- BUG-001 assigned to Backend Engineer (non-blocking for M7)

### [pm] M8 Admin CMS — MARKED COMPLETE ✓
- Status: complete, tester_approved: true
- Open bug: BUG-001 (medium, non-blocking) — ClipForm score dimension fields 1–10 vs expected 1–3
- BUG-001 assigned to Backend Engineer for fix

### [tester] BUG-002 — FOUND AND FIXED ✓
- Critical: Library page showed 'Couldn't load clips' — ClipCard.tsx missing 'use client' directive
- Fixed by Tester, bug closed, library page renders all 15 clips
- Report: .shared/outputs/bugs/bug-002.json

### [pm] Phase advanced to 7-marketing
- Phase: 5-launch → 7-marketing
- M9 (Marketing Materials) assigned to Marketer, now in-progress
- Deliverables: brand-brief.md, pitch deck, one-pager, VC outreach emails, demo script

---

## 2026-03-23

### [designer] M10 UI Specs — DELIVERED
- CharacterBanner: coaching-card banner for record page (character name, film, role context)
- ScriptPanel: dialogue/action script display for record page
- ActionPlan: prioritized improvement steps for feedback page (numbered cards)
- Output: .shared/outputs/design/m10-spec.md

### [data-engineer] M10 Script Seeding — COMPLETE (code)
- Script text (dialogue or step-by-step action instructions) written for all 15 clips → clips-seed.json
- seed.ts updated with script field support + patch logic for already-seeded clips
- Blocked on user running: npm run db:push + npx prisma generate + npx prisma db seed
- Checkpoint: .shared/outputs/data/checkpoints/m10-script-seeding.json

### [backend-engineer] M10 Script-Aware Coaching Loop — COMPLETE ✓
- BUG-001 fixed: ClipForm dimension score fields now 1–3, difficultyScore 4–12
- Schema: script String? @db.Text added to Clip model
- Types: ActionPlanStep + steps[] in FeedbackResult + script in Clip
- Feedback API: character/script context in GPT prompt, steps[] structured output, no-frames fallback
- tailwind.config.ts: fade-in-up keyframe added
- Components: CharacterBanner.tsx + ScriptPanel.tsx (new)
- Record page: CharacterBanner + ScriptPanel integrated
- Feedback page: ActionPlan section added
- Admin ClipForm: Script/Dialogue textarea added
- Build: 0 TypeScript errors — Commit: ae12429
- Pending user: npm run db:push + npx prisma generate + npx prisma db seed

### [designer] M10 UI Review — PASSED
- All 3 components (CharacterBanner, ScriptPanel, ActionPlan) spec-compliant; no P0/P1 issues
- 2 low-priority post-launch notes: fade-in-up keyframe confirmation, future scriptType field for physical clips
- Full review: .shared/outputs/design/ui-review-m10.md

### [designer] M11 + M12 + M13 UI Specs — ALL DELIVERED
- M11 (Observation Guide): ObservationTabBar + ObservationGuide vertical timeline
  Output: .shared/outputs/design/m11-spec.md
- M12 (Micro-Practice Stepper): PracticeStepperLayout, StepCard, PracticeRecorder (30s SVG ring), MicroFeedbackCard (slide-up animation), PerformanceUnlockScreen — 5 components
  Output: .shared/outputs/design/m12-spec.md
- M13 (Onboarding + Learning Path): OnboardingShell, AssessmentSkillScreen, ProcessingScreen, CompleteScreen, LearningPathDashboard, SkillTrackColumn, SkillProgressBar, LearningPathCard
  Output: .shared/outputs/design/m13-spec.md

### [data-engineer] M11 Observation Guides + Practice Steps — COMPLETE (code)
- observation_guide (headline + 5–6 timestamped moments) written for all 15 clips → clips-seed.json v1.2
- practice_steps (3–4 steps with instruction/tip/duration) written for all 15 clips
- seed.ts updated with interface + patch + create logic for both JSON fields
- Blocked on Backend Engineer schema update (observationGuide Json? + practiceSteps Json?), then user db actions
- Checkpoint: .shared/outputs/data/checkpoints/m11-observation-guides.json

### [data-engineer] M13 Assessment Data — PROACTIVELY PREPARED
- 5 self-report quiz questions (one per skill, 3 options: beginner/intermediate/advanced)
- Scoring algorithm: self-report 40% + AI video 60%; advancement threshold 70% on 2 consecutive sessions
- Full learning path sequences for all 5 skills × 3 levels
- SkillProgressBar display tokens included
- Output: .shared/outputs/data/m13-assessment-data.json

### [backend-engineer] M11 Observation Guide + M12 Micro-Practice Stepper — COMPLETE ✓
- M11 deliverables:
  - Schema: observationGuide Json? added to Clip
  - Types: ObservationMoment + ObservationGuide interfaces
  - API: POST /api/admin/clips/[id]/observation — AI generates guide
  - Components: ObservationGuide.tsx (vertical timeline), ClipDetailTabs.tsx (Watch | How It Works tabs)
  - Admin edit page: GenerateObservationGuide button
- M12 deliverables:
  - Schema: PracticeStep + MicroSession models
  - Types: PracticeStep + MicroFeedback interfaces
  - API: POST /api/micro-sessions — upload + instant micro-feedback
  - Components: StepCard, PracticeRecorder (30s SVG ring), MicroFeedbackCard, PerformanceUnlockScreen, MicroPracticeFlow
  - Route: /library/[clipId]/practice — new micro-practice flow
  - Clip detail CTA now routes to /practice instead of /record
- Build: 0 TypeScript errors — Commits: 6dff36e (M11) + 538cbac (M11+M12)

### [backend-engineer] M13 Onboarding Assessment & Personalized Learning Path — COMPLETE ✓
- Schema: SkillBaseline model + User.onboardingComplete Boolean (db:push applied)
- Types: SkillLevel, SkillBaseline, SkillTrack, SkillTrackNextClip
- API: POST /api/onboarding/complete — stores 5 skill baselines, marks onboardingComplete=true
- API: GET /api/dashboard/tracks — computes tracks with level advancement (2+ sessions @ 70%+)
- /onboarding: 5-screen self-rating flow → processing → complete → /dashboard
- /dashboard: 5-column learning path grid with SkillProgressBar + LearningPathCard per skill
- NavBar: 'My Path' link added for signed-in users
- Middleware: /dashboard + /onboarding auth-protected
- Signup: redirects to /onboarding after registration
- Build: 0 TypeScript errors — Commit: d2f93e0

### [pm] Session Diary — 2026-03-23 End of Session

#### What happened this session
1. **Thread 1 (M7+M8 deployment)** — Completed. NEXTAUTH env vars confirmed in Vercel. db:push confirmed schema in sync. admin:create seeded admin@seeneyu.com / changeme123. Deployment verified live (4h-ago deploy includes M7+M8 code).
2. **M10 (Script-Aware Coaching Loop)** — Launched and completed by team. Fixed AI feedback submission bug (no-frames 422 error). Added CharacterBanner + ScriptPanel to record page. Added ActionPlan steps to feedback page. Enhanced AI prompt with character + script context. BUG-001 (ClipForm score ranges) fixed inside M10. Script data seeded to all 15 clips.
3. **M11 (Observation Guide)** — Launched and completed by Backend Engineer. "How It Works" tab on clip detail page. Timestamped technique breakdown (what + why). Admin generate button. UI spec by Designer.
4. **M12 (Micro-Practice Stepper)** — Launched and completed by Backend Engineer. Duolingo-style 3-5 step practice flow. 30s max recorder per step. Instant per-step AI feedback. Full Performance unlock screen. Whisper audio transcription for vocal clips. UI spec by Designer.
5. **M13 (Onboarding Assessment + Learning Path)** — Launched and completed by Backend Engineer. 5-skill self-rating onboarding on signup. SkillBaseline stored in DB. Personalized /dashboard with 5 skill columns, level badges, next-clip cards. UI spec by Designer.
6. **Data Engineer** — Wrote observation_guide (5-6 timestamped moments) + practice_steps (3-4 per clip) for all 15 clips into clips-seed.json. Seed patch logic added to seed.ts. Waiting on db:push before seeding.
7. **Tester** — Has active review-request signals for M10, M11+M12, M13. Standby until user runs db commands and confirms.

#### User feedback processed (5 points)
| # | Feedback | Resolution |
|---|---|---|
| 1 | Video submit broken | M10 fixed no-frames 422 bug |
| 2 | No step-by-step practice (Duolingo) | M12 Micro-Practice Stepper |
| 3 | No pre-practice conversation analysis | M11 Observation Guide |
| 4 | Whole recording hard for AI to process | M12 solves with 30s micro-recordings; Whisper for audio |
| 5 | Screening quiz + learning curve | M13 Onboarding Assessment + Learning Path |

#### What's next (next session, all roles)
- **User**: Run `npm run db:push` → `npx prisma generate` → `npm run db:seed` to activate M11-M13 in DB
- **Tester**: Open session → approve M10, M11, M12, M13 → signal PM
- **Builder**: Deploy M10-M13 code to Vercel production (latest commits not yet deployed)
- **PM**: After Tester approves → mark M10-M13 complete → assign Builder to deploy → smoke test
- **Marketer**: Continue M9 marketing materials (pitch deck, one-pager, VC emails)
- **Reporter**: Log M10-M13 completions in activity-log once Tester approves

#### Known risks / watch items
- `prisma generate` EPERM error on Windows (dev server locks DLL). Workaround: close dev server before running generate, OR rely on Vercel postinstall.
- M11-M13 Tester sign-off is NOT yet granted — do not mark these milestones complete until Tester approves.
- M13 learning path algorithm uses self-report only (40% weight) — AI video assessment component (60%) is scaffolded but needs real sessions data before meaningful scores.
- Admin password `changeme123` is default — user should update immediately.

### [designer] M14 Library Expansion UI Spec — COMPLETE
- Film filter dropdown, screenplay badge on ClipCard, screenplay link on clip detail
- Output: .shared/outputs/design/m14-spec.md

### [data-engineer] M14 Content Expansion — COMPLETE (code)
- Delivered 65 clips from 38 films with full metadata (script, observation_guide, practice_steps, screenplaySource)
- YouTube API quota exhausted at 65 (target was 100+). PM accepted 65 as sprint delivery (DEC-006)
- Output: .shared/outputs/data/clips-100-seed.json

### [backend-engineer] M14 Screenplay Library Expansion — COMPLETE (code)
- Schema: screenplaySource String? on Clip model
- Admin ClipForm updated with screenplay URL field
- Library page: Film filter + "Has Screenplay" filter
- ClipCard: screenplay badge. Clip detail: screenplay link
- Status: code-complete, awaiting tester sign-off

### [builder] M14 + M15 Deployment — DEPLOYED
- M14 + M15 deployed to https://seeneyu.vercel.app
- M14: 45 new clips added (total 65 in DB) with screenplay sources, Film/Screenplay filters
- M15: /foundation section live — 3 courses, 30 lessons, 60 examples, 120 quiz questions
- DB push + seed completed successfully

### [designer] M15 Performing Foundation UI Spec — COMPLETE
- Course catalog, course detail, lesson page (theory + examples + quiz)
- Output: .shared/outputs/design/m15-spec.md

### [data-engineer] M15 Foundation Curriculum — COMPLETE (code)
- 3 courses × 10 lessons = 30 lessons, 60 YouTube examples, 120 quiz questions
- Courses: Voice Mastery, Verbal Communication, Body Language Fundamentals
- Output: .shared/outputs/data/foundation-curriculum.json

### [backend-engineer] M15 Performing Foundation Section — COMPLETE (code)
- 5 new Prisma models: FoundationCourse, FoundationLesson, LessonExample, QuizQuestion, FoundationProgress
- /foundation pages: catalog, course detail, lesson page with quiz
- Progress API, NavBar link added
- Status: code-complete, awaiting tester sign-off

### [designer] M16 Learning Materials Builder UI Spec — COMPLETE
- Admin crawl job creation, results review, approve/reject flow
- Output: .shared/outputs/design/m16-spec.md

### [data-engineer] M16 Communication Tactics Taxonomy — COMPLETE
- 50 named communication tactics across 5 domains (vocal, verbal, body, presence, rapport)
- Each tactic includes YouTube search keywords + AI scoring hints
- Output: .shared/outputs/data/communication-tactics.json

### [backend-engineer] M16 Learning Materials Builder — COMPLETE (code)
- New models: CrawlJob, CrawlResult
- New services: youtube-crawler.ts (YouTube Data API v3), clip-relevance-scorer.ts (GPT-4o)
- Admin /admin/crawl-jobs: create jobs, run, review results, approve/reject
- Approve flow: creates Clip + auto-generates ObservationGuide + PracticeSteps
- Env: YOUTUBE_API_KEY required. Commit: 6bd9218
- Strategic: shifts seeneyu from manual curation to semi-automated content discovery
- Status: code-complete, awaiting tester sign-off

---

## 2026-03-24

### [designer] M17 + M18 + M19 Design Specs — DELIVERED
- m17-spec.md: Library UX improvements (search bar, collapsible filter panel, 4-col grid, compact ClipCard)
- m18-spec.md: PeeTeeAI brand refresh (NavBar sub-label, Footer, animated hero, Mission/Team/Testimonials)
- m19-spec.md: Arcade Zone UI (bundle browser, challenge flow, score screen)
- Output: .shared/outputs/design/

### [data-engineer] M19 Arcade Seed Data — COMPLETE
- 3 bundles × 10 challenges = 30 total arcade challenges
- Output: .shared/outputs/data/arcade-challenges-seed.json

### [data-engineer] M20 Screenplay Audit — COMPLETE
- 65 clips audited, 53 have screenplay sources (imsdb.com)
- URL encoding findings documented
- Output: .shared/outputs/data/m20-screenplay-audit.json

### [backend-engineer] M17 Library UX — COMPLETE (code)
- Search API with text search across clip fields
- Collapsible filter panel with search input
- 4-col thumbnail grid layout
- Status: code-complete, awaiting tester sign-off

### [backend-engineer] M18 PeeTeeAI Brand + Homepage — COMPLETE (code)
- NavBar "by PeeTeeAI" sub-label
- Footer component
- Hero section with gradient animation
- Mission, Team, Testimonials sections on homepage
- Status: code-complete, awaiting tester sign-off

### [backend-engineer] M19 Arcade Zone — COMPLETE (code)
- 3 new models: ArcadeBundle, ArcadeChallenge, ArcadeAttempt
- GPT-4o Vision scorer for 10s arcade recordings
- ArcadeRecorder component with 10s timer
- Full /arcade pages: bundle browser, challenge flow, score screen
- Status: code-complete, awaiting tester sign-off

### [backend-engineer] M20 Learning Improvements — COMPLETE (code)
- Screenplay crawl-to-DB integration
- Crawl jobs YOUTUBE_API_KEY fix
- Admin ZIP import for bulk content
- Status: code-complete, awaiting tester sign-off

### [backend-engineer] MediaPipe Integration — COMPLETE (code)
- Replaced GPT-4o Vision dependency with client-side Google MediaPipe ML for recording scoring
- New files: mediapipe-types.ts, mediapipe-init.ts, useMediaPipe.ts, analysis-helpers.ts, expression-scorer.ts, feedback-generator.ts
- Modified 8 existing files across all 3 recording flows (full performance, micro-practice, arcade)
- Zero API cost for scoring — all runs in browser
- GPT-4o Vision retained as optional fallback for full performance rich feedback

### [builder] M17-M20 + MediaPipe Deployment — DEPLOYED

- MediaPipe integration deployed to https://seeneyu.vercel.app
- Commit b56564b — 0 TS errors, 31 pages generated, all health checks pass
- M17-M20 features all live

---

## 2026-03-25

### [pm] Signal System Fix — COMPLETE
- File locking added to signal-send.js and signal-done.js (O_EXCL + stale lock detection)
- Atomic writes via temp file + rename to prevent race conditions
- State file ownership rule enforced: only PM edits milestones.json, project-state.json, decisions.json
- All other roles must signal PM with updates (DEC-009)

### [backend-engineer] M21 Arcade Content Management — COMPLETE (code)
- Admin CRUD for ArcadeBundle + ArcadeChallenge
- Reference image capture from YouTube frames or web
- Image upload to Vercel Blob, edit/delete, reorder
- Commit: 38d204a. Status: awaiting tester sign-off

### [backend-engineer] M22 User Activity Dashboard — COMPLETE (code)
- New model: ActivityEvent for tracking user actions
- Admin analytics dashboard: DAU/WAU/MAU charts, signup trends, learning curves, per-user detail
- Commit: 38d204a. Status: awaiting tester sign-off

### [backend-engineer] M23 Feature Performance Dashboard — COMPLETE (code)
- New model: AnalysisMetric
- Admin feature dashboard: crawl job stats, MediaPipe performance metrics, content pipeline stats
- Commit: 38d204a. Status: awaiting tester sign-off

### [backend-engineer] M24 Access Control — COMPLETE (code)
- Auth gating: first 3 arcade challenges per type free without login
- Practice/record require auth. Locked content blurred with lock icon
- Centralized access-control.ts utility
- Commit: 38d204a. Status: awaiting tester sign-off

### [backend-engineer] M25 Subscription & Payment — COMPLETE (code)
- New models: Plan, Subscription, Payment
- 3 tiers: Basic (free, 5s recording), Standard (30s), Advanced (3min, VIP, coach access)
- PayPal + VNPay checkout flow (sandbox mode)
- Admin plan management at /admin/plans
- Pricing page at /pricing
- Commit: 38d204a. Status: awaiting tester sign-off

### [builder] M21-M25 Deployment — DEPLOYED
- All 5 milestones deployed to https://seeneyu.vercel.app
- Known issues: BUG-005 (pricing uses admin-only API), BUG-006 (Plan + ArcadeBundle tables not seeded in prod)

### [backend-engineer] BUG-005 Fixed
- Created /api/public/plans (unauthenticated endpoint)
- Updated pricing page to use public endpoint instead of admin-only /api/admin/plans

### [backend-engineer] M26 Registration Approval — Backend COMPLETE (code)
- Schema: added status/statusNote/approvedAt/approvedBy to User + @@index([status])
- Signup API returns {success: true, status: 'pending'}
- Auth checks user status before login — pending/rejected/suspended users blocked
- Admin PATCH /api/admin/users/[id] for approve/reject with statusNote
- GET /api/admin/users?status=pending filter
- Migration script: scripts/migrate-user-status.ts
- Needs: prisma db push + migration script on production
- Frontend pages (auth/pending, admin UI) still needed from Builder/Designer

### [designer] M26 + M27 + M28 Design Specs — DELIVERED
- m26-registration-approval-spec.md: pending page (Clock + amber glow), signin error banners, admin approval table with filter tabs, rejection modal
- m27-discussions-spec.md: CommentThread/CommentCard/CommentForm, flat threading, avatar color via hash(userId)%5, admin moderation page
- m28-ai-assistant-spec.md: floating button with glow-pulse animation, slide-up panel (mobile) / side panel (desktop), Coach Ney persona (GraduationCap icon), voice states, suggestion chips, plan limits, idle nudge
- All specs use existing design tokens from design-system.md

### [pm] M26-M28 Feature Plan Approved (DEC-010)
- M26 Registration Approval → M27 Discussions + M28 AI Assistant (parallel after M26)
- Voice platform: OpenAI (Whisper + GPT-4o + TTS) — no new vendor
- Comment threading: flat (1 level)
- Assistant persona: Coach Ney

### [pm] M29-M35 Plan Approved (DEC-011)
- Toolkit (data crawler + embeddable mini-games), Duolingo-style gamification (XP, streaks, hearts, quests, badges, leagues), UI/UX overhaul
- 14 new DB models, 21 new API endpoints

### [pm] M36-M45 Plan Approved (DEC-012)
- Error logging, CMS, light mode rebrand, homepage media, app download, sticky practice, submission review, tiered feedback, user management v2, game data pipeline
- CMS (M37) is critical path — M38/M39/M40 depend on it

### [pm] Tester Backlog Warning
- M10-M25 all code-complete and deployed — 16 milestones awaiting tester sign-off
- Smoke test request sent to Tester for M21-M25
- M10-M20 backlog still uncleared

---

## 2026-03-29

### [pm] Phase advanced to 51-commercialization — M51 IN PROGRESS
- New directive from BDD: commercialization sprint takes priority over M36-M50 feature work
- Previous M36-M50 milestones remain in planning (not cancelled)
- M51-M54 defined across 4 priority sprints (P0 → P3):
  - M51 Sprint 1 (P0 — NOW): Remove registration approval gate, add content gating, upgrade prompt flows at locked content
  - M52 Sprint 2 (P1): Pricing page redesign, onboarding improvements, VIP/premium content tier
  - M53 Sprint 3 (P2): Free trials, discount coupons, cancellation/retention flow
  - M54 Sprint 4 (P3): Referral system, embeddable games for lead gen, B2B teams feature
- Rationale: P0 are conversion killers — broken/confusing auth + paywall flows block all revenue regardless of traffic
- Blueprint updated: seeneyu-blueprint.md Phase 15 (Commercialization) added to build order

---
