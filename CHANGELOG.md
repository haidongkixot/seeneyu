# Changelog — seeneyu

## [Unreleased]

### Added (M7 — Auth System, code complete, pending deploy)
- NextAuth.js v4 with email+password credentials
- `User`, `Account`, `AuthSession`, `VerificationToken` models in Prisma schema
- `src/lib/auth.ts` — NextAuth config with role-based access (learner | admin)
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route
- `src/app/api/auth/signup/route.ts` — user registration endpoint
- `src/app/auth/signin/page.tsx` + `src/app/auth/signup/page.tsx` — auth UI
- `src/middleware.ts` — protects `/admin/*` routes, redirects unauthenticated
- `src/components/Providers.tsx` — SessionProvider wrapper
- `scripts/create-admin.ts` — admin account seed script

### Added (M8 — Admin CMS, code complete, pending deploy)
- `src/app/admin/layout.tsx` + `page.tsx` — admin shell + dashboard
- `src/app/api/admin/clips/route.ts` + `/[id]/route.ts` — full CRUD for clips
- `src/app/admin/clips/` — clip list, new, and edit pages
- `src/app/api/admin/users/route.ts` — user list + role management API
- `src/app/admin/users/` — user management pages
- Non-admin access to `/admin/*` returns 401 (middleware enforced)

---

## [1.0.0] — 2026-03-22 — MVP Launch

### Live
- https://seeneyu.vercel.app (all 9 routes deploy cleanly)

### Added (M6 — UI Polish + Critical Bug Fixes)
- ClipCard: play button hover overlay; duration badge on thumbnail
- NavBar: mobile hamburger drawer at 768px breakpoint
- FeedbackPage: max-w-4xl; dynamic score ring color; video comparison row
- FeedbackPoller: 8 rotating coaching tips during AI processing
- RecordClient: 3-2-1 countdown overlay before recording starts
- GPT-4o Vision fix: JPEG frame capture via Canvas API — frame URLs sent to Vision (not .webm)
- `UserSession.frameUrls` field added to Prisma schema

### Infrastructure (M6)
- App deployed to Vercel, GitHub repo: https://github.com/haidongkixot/seeneyu.git
- `package.json`: postinstall `prisma generate` for Vercel builds
- `next.config.mjs`: Vercel Blob image hostname
- Prisma JSON type cast fix; lazy OpenAI client init (`getOpenAI()`)

---

## [0.5.0] — 2026-03-21 — AI Feedback Engine (M5)

### Added
- `/api/sessions` — recording upload to Vercel Blob + UserSession creation
- `/api/sessions/[id]/feedback` — GPT-4o Vision analysis → structured feedback JSON
- `/feedback/[sessionId]` — SVG score ring, dimension bars, positives/improvements grid, tips carousel
- `FeedbackPoller.tsx` — polling client for async feedback
- `/progress` — user progress dashboard

---

## [0.4.0] — 2026-03-21 — Coaching Loop (M4)

### Added
- `/library/[clipId]/record` — record page with split view (YouTube reference + webcam)
- `RecordClient.tsx` — webcam, MediaRecorder, mirrored preview, REC timer, observation checklist, Vercel Blob upload

---

## [0.3.0] — 2026-03-21 — Clip Library UI (M3)

### Added
- Full Next.js 14 App Router scaffold (package.json, tsconfig, tailwind, postcss)
- Landing page, library page (filters, ClipCard grid), clip viewer (YouTube IFrame + annotation overlays)
- Components: ClipCard, SkillBadge, DifficultyPill, NavBar, ClipViewerClient
- Prisma schema: Clip, Annotation, UserSession models
- `src/lib/prisma.ts`, `types.ts`, `cn.ts`

---

## [0.2.0] — 2026-03-21 — Data Pipeline v1 (M2)

### Added
- 15 curated Hollywood clips: 5 skills × 3 difficulty levels (`clips-seed.json`)
- Zod schemas for all data types
- 3-step pipeline: discover → annotate → curate (checkpoint/resume)
- `prisma/seed.ts` with verification guard
- YouTube IDs verified via Data API v3

---

## [0.1.0] — 2026-03-21 — Design System (M1)

### Added
- Design tokens: colors, typography, spacing, radius, shadows, motion, glassmorphism, gradients
- 7 component specs: ClipCard, SkillBadge, DifficultyPill, NavBar, AnnotationOverlay, RecordPanel, FeedbackScoreCard
- 4 screen mockups: landing, library, clip-viewer, feedback
- Core loop flow diagram

---

## [0.0.1] — 2026-03-21 — Project Setup (M0)

### Added
- Multi-agent project structure (7 roles, `.shared/` data pool, signal protocol)
- Role CLAUDE.md files for all roles
- Initial project state, milestones, decisions, shared-knowledge files
