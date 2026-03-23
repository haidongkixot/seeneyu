# Milestone M7 — Auth System
**Status**: COMPLETE ✓
**Tester approved**: Yes
**Completed**: 2026-03-22
**Owner**: Backend Engineer

---

## What was built
Full authentication system using NextAuth.js v4 with email+password credentials and role-based access.

**Deliverables:**
- `prisma/schema.prisma` — User, Account, AuthSession, VerificationToken models
- `src/lib/auth.ts` — NextAuth config, role-based session (learner | admin)
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route
- `src/app/api/auth/signup/route.ts` — User registration endpoint
- `src/app/auth/signin/page.tsx` + `signup/page.tsx` — Auth UI pages
- `src/middleware.ts` — Protects /admin/* routes, redirects unauthenticated users to /auth/signin
- `src/components/NavBar.tsx` — Updated with auth state (Sign In / Sign Out)
- `src/app/layout.tsx` — SessionProvider wrapper added
- `scripts/create-admin.ts` — Admin seed script (`npm run admin:create`)

## Key decisions
- NextAuth.js v4 chosen for production-ready auth with Prisma adapter
- Credentials provider (email+password) — no OAuth for MVP simplicity
- Two roles: `learner` (default) and `admin` (seeded manually)
- Middleware enforces route protection at the edge — no client-side guards needed

## Tests passed (Tester sign-off)
- Sign up → new user created with hashed password → session active
- Sign in → valid credentials → session token set
- Sign out → session cleared → redirected to home
- /admin → unauthenticated → 401 redirect
- All 10 M7 test cases: PASS

## Bugs found + resolved
- None at completion (BUG-001 filed against M8, not M7)

## What's unlocked next
- M8 (Admin CMS) — auth system is prerequisite for all admin routes
