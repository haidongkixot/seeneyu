# Security Audit Report -- seeneyu

**Date:** 2026-04-15
**Auditor:** Architecture Agent (Claude Opus 4.6)
**Codebase:** d:/Claude Projects/seeneyu/
**Framework:** Next.js 14 (App Router), Prisma, NextAuth, Vercel

---

## Executive Summary

The seeneyu codebase has **2 critical**, **5 high**, **6 medium**, and **4 low** severity findings. The most urgent issues are: (1) production secrets committed in plaintext to `.env.vercel.prod` including OpenAI API key, database credentials, Stripe keys, and NEXTAUTH_SECRET; and (2) the `/api/micro-sessions` route accepts unauthenticated file uploads to Vercel Blob and triggers OpenAI API calls without any auth check. The application demonstrates generally good security practices -- most routes are auth-gated, Prisma parameterized queries prevent SQL injection, Stripe webhooks verify signatures, and password hashing uses bcrypt with cost 12. However, several API routes lack auth, file uploads have no type/size validation, CORS is overly permissive on multiple endpoints, cron secrets are conditionally enforced, and mobile bearer tokens never expire.

---

## Critical Findings (must fix immediately)

### CRIT-001: Production Secrets Committed in Plaintext

- **Risk**: Full compromise of all third-party services, database, and authentication. Anyone with repo access can extract OpenAI API key, database passwords, NEXTAUTH_SECRET, ElevenLabs key, Kling keys, Google AI key, and Vercel Blob token.
- **Location**: `d:/Claude Projects/seeneyu/.env.vercel.prod`
- **Evidence**:
  ```
  OPENAI_API_KEY="sk-proj-cxGxrHJEaA5jE5y0d85P..."
  DATABASE_URL="postgresql://neondb_owner:npg_niU2kjHeq8Td@..."
  NEXTAUTH_SECRET="5Z8FDTlt8Dtsd8DiEWAXYXxwq5mRArRK0L5ZExb0d/I="
  ELEVENLABS_API_KEY="7c320b430282411fb3ecb1f1dda60d80..."
  BLOB_READ_WRITE_TOKEN="vercel_blob_rw_AhdK4DiuvDjxd1HU..."
  KLING_ACCESS_KEY="AB3btPmDnTH8By4Hf8Hd4FNy8AGPmD4p"
  ```
  Also, `d:/Claude Projects/seeneyu/.env` contains database credentials:
  ```
  DATABASE_URL=postgresql://neondb_owner:npg_niU2kjHeq8Td@...
  ```
  `.env` is gitignored but `.env.vercel.prod` is NOT in `.gitignore`.
- **Fix**:
  1. Add `.env.vercel.prod` and `.env` to `.gitignore` immediately
  2. Remove `.env.vercel.prod` from git history using `git filter-branch` or BFG Repo Cleaner
  3. **Rotate ALL compromised secrets**: OpenAI API key, database password, NEXTAUTH_SECRET, ElevenLabs key, Kling keys, Google AI key, Blob token
  4. Use Vercel's environment variable dashboard exclusively; never commit env files

### CRIT-002: Unauthenticated File Upload and OpenAI API Abuse on /api/micro-sessions

- **Risk**: Any anonymous user can upload unlimited files to Vercel Blob (incurring storage costs) and trigger OpenAI GPT-4o Vision API calls (incurring significant AI costs). No rate limiting, no file size validation.
- **Location**: `src/app/api/micro-sessions/route.ts:69-87`
- **Evidence**:
  ```typescript
  export async function POST(req: NextRequest) {
    try {
      const formData = await req.formData()
      const recording = formData.get('recording') as File | null
      // ... NO auth check before upload ...
      const blob = await put(`micro/${clipId}/step${stepNumber}/${ts}.webm`, recording, {
        access: 'public',
        contentType: 'video/webm',
      })
      // ... Later calls getServerSession only for plan checking (line 125), not as a gate
  ```
  Auth is only checked optionally at line 125 for plan-gating, but the upload and OpenAI call happen regardless.
- **Fix**: Add `getServerSession` or `getUserFromRequest` check at the top of the POST handler, before any file processing. Return 401 if not authenticated.

---

## High Findings (fix before next release)

### HIGH-001: Mobile Bearer Tokens Never Expire

- **Risk**: If a mobile token is stolen (e.g., from a compromised device, network sniffing), it grants perpetual access to the user's account. There is no expiry, no refresh mechanism, and no way for users to revoke tokens.
- **Location**: `src/app/api/mobile/login/route.ts:44-65`, `src/lib/mobile-auth.ts:30-44`
- **Evidence**: Token is stored as a hash in the Account table with no `expiresAt` field. The `getUserFromRequest` function validates by hash lookup with no time check.
- **Fix**:
  1. Add a `tokenExpiresAt` column or store expiry alongside the token hash
  2. Check expiry in `getUserFromRequest`
  3. Implement token refresh endpoint
  4. Allow users to revoke tokens (logout endpoint)

### HIGH-002: No Rate Limiting on Mobile Login Endpoint

- **Risk**: Brute-force password guessing attacks. Unlike `/api/auth/signup` which has IP-based rate limiting, the mobile login endpoint has no rate limiting at all.
- **Location**: `src/app/api/mobile/login/route.ts:14`
- **Evidence**: The POST handler immediately processes credentials with no rate limit check.
- **Fix**: Add IP-based rate limiting similar to the signup route (e.g., max 10 attempts per IP per 15 minutes). Also consider account lockout after N failed attempts.

### HIGH-003: Cron Secret Validation is Conditional -- Crons Accessible Without Secret

- **Risk**: If `CRON_SECRET` environment variable is not set (e.g., in development that gets deployed, or misconfiguration), ALL cron endpoints become publicly accessible. This includes subscription lifecycle management, consent cleanup, engagement checks, and weekly reports.
- **Location**: Multiple cron routes use this pattern:
  ```typescript
  // src/app/api/cron/consent-cleanup/route.ts:13-15
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  ```
  The `if (secret && ...)` pattern means: if no secret is configured, skip auth entirely.
- **Files affected**:
  - `src/app/api/cron/consent-cleanup/route.ts`
  - `src/app/api/cron/subscription-lifecycle/route.ts`
  - `src/app/api/cron/video-poll/route.ts`
  - `src/app/api/cron/morning/route.ts`
  - `src/app/api/cron/engagement-check/route.ts`
  - `src/app/api/cron/process-queue/route.ts`
  - `src/app/api/cron/weekly-report/route.ts`
- **Fix**: Change to `if (!secret || authHeader !== ...)` so that missing secret = deny by default. Or throw an error at startup if CRON_SECRET is not set.

### HIGH-004: No File Type or Size Validation on Recording Uploads

- **Risk**: Attackers can upload arbitrary file types (executables, HTML files for stored XSS, etc.) or extremely large files to exhaust Vercel Blob storage quotas and incur costs.
- **Location**: Multiple upload routes accept any file without validation:
  - `src/app/api/sessions/route.ts:17-36` -- trusts `contentType: 'video/webm'` but doesn't validate actual content
  - `src/app/api/micro-sessions/route.ts:87-90` -- same issue
  - `src/app/api/admin/cms/upload/route.ts:18-24` -- no file type check at all
  - `src/app/api/admin/arcade/upload-image/route.ts:18-24` -- no file type check at all
- **Evidence** (admin upload):
  ```typescript
  const file = formData.get('file') as File | null
  if (!file) { ... }
  const blob = await put(`cms/${Date.now()}-${file.name}`, file, {
    access: 'public',
  })
  ```
  No MIME type check, no file extension whitelist, no size limit.
- **Fix**:
  1. Validate file MIME type against allowlist (video/webm, image/jpeg, image/png, etc.)
  2. Enforce file size limits (e.g., 50MB for recordings, 5MB for images)
  3. Sanitize file names to prevent path traversal

### HIGH-005: Debug Endpoint Exposes Stack Traces in Production

- **Risk**: Stack traces reveal internal file paths, framework versions, and database structure to attackers.
- **Location**: `src/app/api/debug/library-test/route.ts:31-33`
- **Evidence**:
  ```typescript
  return NextResponse.json({
    success: false,
    error: err.message,
    stack: err.stack?.split('\n').slice(0, 5),
  }, { status: 500 })
  ```
  This unauthenticated debug endpoint returns error stack traces.
- **Fix**: Remove this debug endpoint entirely, or gate it behind admin auth and disable in production.

---

## Medium Findings (fix in next sprint)

### MED-001: Wildcard CORS on Authenticated Data Endpoints

- **Risk**: Any website can make cross-origin requests to these endpoints, potentially accessing user data or submitting data on behalf of users (if combined with cookie-based auth).
- **Location**: Multiple routes set `Access-Control-Allow-Origin: '*'`:
  - `src/app/api/arcade/route.ts:5` -- returns arcade data with auth context
  - `src/app/api/foundation/route.ts:5` -- course data
  - `src/app/api/foundation/[courseSlug]/route.ts:5`
  - `src/app/api/foundation/[courseSlug]/[lessonSlug]/route.ts:8`
  - All `/api/public/games/*` routes (these are intentionally public, acceptable)
- **Evidence**:
  ```typescript
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  ```
- **Fix**: For public/embed endpoints (games, certificates), wildcard CORS is acceptable. For foundation and arcade routes that may serve user-specific data, restrict to specific origins (e.g., `seeneyu.vercel.app` and the mobile app origin).

### MED-002: Stored XSS Risk via dangerouslySetInnerHTML with Admin-Authored Content

- **Risk**: If an admin account is compromised, malicious HTML/JS can be injected into blog posts, lesson content, and CMS pages. Blog body is stored without HTML sanitization and rendered with `dangerouslySetInnerHTML`.
- **Location**:
  - `src/app/blog/[slug]/page.tsx:83` -- `dangerouslySetInnerHTML={{ __html: post.body }}`
  - `src/app/foundation/[courseSlug]/[lessonSlug]/LessonClient.tsx:79` -- lesson HTML
  - `src/app/roadmap/page.tsx:39`, `src/app/about/page.tsx:39` -- CMS pages
  - `src/app/policies/terms/page.tsx:47`, `src/app/policies/privacy/page.tsx:47`
  - `src/app/knowledge/[slug]/page.tsx:82`
  - `src/app/admin/email/[id]/edit/page.tsx:203`
- **Evidence**: Blog creation in `src/app/api/admin/cms/blog/route.ts:58` stores `postBody` directly without sanitization:
  ```typescript
  body: postBody,
  ```
  And the blog page renders it raw:
  ```tsx
  dangerouslySetInnerHTML={{ __html: post.body }}
  ```
- **Fix**: Sanitize HTML on output using a library like DOMPurify (server-side) or sanitize-html before rendering. Even though only admins can author, defense-in-depth requires sanitization.

### MED-003: Activity Tracking Endpoint Accepts Unauthenticated Requests

- **Risk**: Anyone can flood the activity tracking table with arbitrary data, polluting analytics and potentially causing database storage issues.
- **Location**: `src/app/api/activity/track/route.ts:6-26`
- **Evidence**:
  ```typescript
  export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    // userId can be undefined -- still creates the record
    await (prisma as any).activityEvent.create({
      data: {
        userId: userId || null,
        type,
        metadata: metadata || null,
      },
    })
  ```
  No auth required, no rate limiting. The `type` and `metadata` fields are accepted from untrusted input without validation.
- **Fix**: Either require authentication, add rate limiting, or at minimum validate the `type` field against an allowlist and limit `metadata` size.

### MED-004: Trial Endpoint Allows Repeated Trial Activation

- **Risk**: A user could potentially re-activate trials by manipulating the existing subscription check. The code checks for `status: { not: 'cancelled' }` but a user whose trial expired gets status 'cancelled', allowing them to create a new trial.
- **Location**: `src/app/api/trial/route.ts:20-44`
- **Evidence**:
  ```typescript
  const existing = await prisma.subscription.findFirst({
    where: { userId, status: { not: 'cancelled' } }
  })
  if (existing) {
    // Updates existing to trialing
  } else {
    // Creates new trial -- this path can be hit after a cancelled trial
  }
  ```
- **Fix**: Add a check for any previous trial (regardless of status): `WHERE userId = X AND trialStartedAt IS NOT NULL`. Deny if a trial was ever started.

### MED-005: Logging Endpoint Has No Authentication

- **Risk**: Unauthenticated error log ingestion. While IP-rate-limited (10/min), an attacker can still inject misleading error logs from any origin, potentially hiding real errors or filling storage.
- **Location**: `src/app/api/logs/route.ts:21-53`
- **Evidence**: No auth check; accepts any POST with a message field. The `metadata` JSON object is stored directly in the database.
- **Fix**: Require authentication for error logging, or at minimum restrict to same-origin requests and validate metadata schema.

### MED-006: Embed Routes Disable X-Frame-Options Security Header

- **Risk**: The `/embed/*` routes explicitly allow framing from any origin (`frame-ancestors *`), which is intentional for embeds but could be exploited for clickjacking if sensitive actions are accessible in embed context.
- **Location**: `next.config.mjs:17-31`
- **Evidence**:
  ```javascript
  {
    source: '/embed/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'ALLOWALL' },
      { key: 'Content-Security-Policy', value: "frame-ancestors *" },
    ],
  }
  ```
- **Fix**: Ensure embed pages contain no sensitive actions (login forms, payment, settings). Consider restricting `frame-ancestors` to known partner domains rather than `*`.

---

## Low / Informational

### LOW-001: No JWT maxAge Configured -- Sessions Use Default Expiry

- **Risk**: NextAuth JWT sessions use the default 30-day expiry. For an app handling user recordings and payment data, consider shorter session lifetimes.
- **Location**: `src/lib/auth.ts:9` -- `session: { strategy: 'jwt' }` with no `maxAge` setting.
- **Fix**: Add `maxAge: 7 * 24 * 60 * 60` (7 days) or similar appropriate value.

### LOW-002: In-Memory Rate Limiters Reset on Serverless Cold Start

- **Risk**: Rate limiters in `src/lib/rate-limit.ts`, `src/app/api/auth/signup/route.ts`, and `src/app/api/logs/route.ts` use in-memory Maps. On Vercel serverless, each function invocation may have its own memory space, and cold starts reset the counters. This makes rate limiting largely ineffective under distributed load.
- **Fix**: Use a persistent store (Redis/Upstash) for rate limiting, or use Vercel's built-in rate limiting.

### LOW-003: PayPal Payment Capture Relies on Client-Provided planSlug

- **Risk**: After PayPal redirect, the `planSlug` comes from the query parameter (client-controlled), not from the PayPal order metadata. A user could potentially change the planSlug parameter to get a different plan than what they paid for.
- **Location**: `src/app/api/payments/paypal/route.ts:41`
- **Evidence**:
  ```typescript
  const planSlug = searchParams.get('planSlug')
  // ... amount is recalculated from this client-provided slug
  await activateSubscription({ userId, planSlug, ... })
  ```
- **Fix**: Store planSlug in PayPal order metadata during creation and retrieve it from the captured order, not from client URL params.

### LOW-004: All Vercel Blob Uploads Use Public Access

- **Risk**: All uploaded recordings, images, and audio files have permanently public URLs. While URLs are not easily guessable (UUID-based paths), anyone with a URL has permanent access to user recordings.
- **Location**: All `put()` calls use `{ access: 'public' }`:
  - `src/app/api/sessions/route.ts:33`
  - `src/app/api/micro-sessions/route.ts:87`
  - `src/app/api/assistant/chat/route.ts:133`
  - `src/app/api/admin/cms/upload/route.ts:22`
  - `src/app/api/admin/arcade/upload-image/route.ts:22`
- **Fix**: For user recordings and private audio, consider using signed URLs or Vercel Blob's private access mode. Public access is acceptable for CMS/blog images.

---

## Positive Findings (things done well)

- **Password hashing**: Uses bcrypt with cost factor 12 (`bcrypt.hash(password, 12)`) -- industry standard
- **Parameterized queries**: All database queries use Prisma's built-in parameterization; the single `$queryRaw` usage in analytics uses tagged template literals (safe from injection)
- **Mobile token storage**: Tokens are SHA-256 hashed before storage; raw tokens are never stored
- **Stripe webhook verification**: Properly verifies webhook signatures using `constructWebhookEvent`
- **Admin route protection**: All `/api/admin/*` routes consistently use `requireAdmin()` checks; middleware also gates `/admin/*` page routes
- **Input validation**: Signup, onboarding, and comments use Zod schemas for input validation
- **Comment sanitization**: `sanitizeCommentBody()` strips HTML tags and enforces max length
- **User data scoping**: Prisma queries use `select` to return only needed fields; passwords/hashes are never returned in API responses
- **Consent management**: User recording cleanup respects opt-out preferences with both immediate and batch cleanup
- **Middleware protection**: NextAuth middleware on sensitive page routes (`/admin/*`, `/dashboard/*`, `/onboarding/*`) with role-based checks
- **No hardcoded secrets in source**: API keys are always read from `process.env`; no `sk-*` or similar patterns found in TypeScript source files
- **No command injection**: All `exec` calls are regex-based string processing, not shell command execution
- **Account status enforcement**: Both web and mobile auth check `user.status === 'approved'` before granting access
- **XP farming prevention**: Foundation progress checks `wasAlreadyCompleted` before awarding XP

---

## Remediation Priority

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| P0 (now) | CRIT-001: Rotate all secrets, remove .env.vercel.prod from git | 2h | Prevents full compromise |
| P0 (now) | CRIT-002: Add auth to /api/micro-sessions | 15min | Prevents cost abuse |
| P1 (this week) | HIGH-001: Add token expiry to mobile auth | 2h | Prevents persistent access |
| P1 (this week) | HIGH-002: Rate limit mobile login | 30min | Prevents brute force |
| P1 (this week) | HIGH-003: Make cron secret mandatory | 30min | Prevents unauthorized cron execution |
| P1 (this week) | HIGH-004: Add file validation to uploads | 1h | Prevents storage abuse |
| P1 (this week) | HIGH-005: Remove debug endpoint | 5min | Prevents info disclosure |
| P2 (next sprint) | MED-001 through MED-006 | 4-6h total | Defense in depth |
| P3 (backlog) | LOW-001 through LOW-004 | 3-4h total | Hardening |

---

*End of Security Audit Report*
