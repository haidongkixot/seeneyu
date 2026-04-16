# Cybersecurity Review — seeneyu Platform

**Date:** 2026-04-15
**Reviewer:** Cybersecurity Specialist (Architecture Agent)
**Scope:** Infrastructure + Third-Party Integrations (Vercel, Neon, Stripe, PayPal, VNPay, OpenAI, Vercel Blob)

---

## Executive Summary

20 findings across infrastructure and third-party integration security. The platform has solid authentication patterns and parameterized queries, but has critical issues with public blob storage of user recordings (PII exposure), payment callback vulnerabilities, and insufficient rate limiting on expensive AI endpoints. The previous security audit (same date) addressed code-level issues; this review focuses on infrastructure, deployment, and third-party integration risks.

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 7 |
| Medium | 5 |
| Low | 5 |
| Info (positive) | 3 |

---

## Critical Findings

### CRIT-001: User Recordings Stored Publicly on Vercel Blob

- **Threat**: User video recordings (faces, voices, body language) are stored with `access: 'public'`, making them accessible to anyone who can guess or enumerate the URL pattern. This is a GDPR/privacy violation.
- **Current State**: All `put()` calls use `access: 'public'`:
  - `src/app/api/sessions/route.ts` — practice recordings
  - `src/app/api/micro-sessions/route.ts` — micro-practice recordings
  - `src/app/api/cron/video-poll/route.ts` — AI-generated videos
  - URL pattern: `recordings/{clipId}/{timestamp}.webm` — enumerable
- **Risk Level**: **CRITICAL**
- **Recommendation**:
  1. Change user recording uploads to `access: 'private'`
  2. Generate signed/temporary URLs for legitimate access (Vercel Blob supports this)
  3. AI-generated content can remain public (no PII)
  4. Add data retention policy to auto-delete recordings after consent period
  5. Review GDPR compliance for existing public recordings

### CRIT-002: API Keys Must Be Rotated

- **Threat**: All production API keys were previously exposed in `.env.vercel.prod` (fixed in v1.2.1 by gitignoring). However, keys have NOT been rotated yet — anyone who accessed the repo before the fix has all keys.
- **Current State**: `.env.vercel.prod` is now gitignored but keys are the same values.
- **Risk Level**: **CRITICAL**
- **Recommendation**: Rotate ALL keys immediately on provider dashboards:
  - OpenAI API key → platform.openai.com
  - Neon DB password → console.neon.tech
  - NEXTAUTH_SECRET → `openssl rand -base64 32`
  - BLOB_READ_WRITE_TOKEN → Vercel dashboard
  - ElevenLabs, Kling, Google AI, YouTube API keys
  - Stripe keys (if exposed)
  - Update all in Vercel Environment Variables after rotation

---

## High Findings

### HIGH-001: VNPay Payment Callback — Weak User Identification

- **Threat**: VNPay callback identifies users by matching order ID suffix against user ID with `endsWith`, which could match multiple users if suffixes collide.
- **Current State**: `src/app/api/payments/vnpay/callback/route.ts` line 41-44:
  ```typescript
  const userIdSuffix = orderId.split('_')[0]
  const user = await prisma.user.findFirst({
    where: { id: { endsWith: userIdSuffix } },
  })
  ```
- **Risk Level**: **HIGH**
- **Recommendation**: Store payment metadata (userId, planSlug) in a database record keyed by orderId. Retrieve user via exact ID match, not pattern matching.

### HIGH-002: Missing CSRF Protection on Payment Callbacks

- **Threat**: VNPay and PayPal callback endpoints accept GET parameters without CSRF validation, enabling potential subscription activation via crafted URLs.
- **Current State**: Both use GET endpoints accepting payment data directly from URL params.
- **Risk Level**: **HIGH**
- **Recommendation**: Add HMAC signature verification, use POST callbacks where possible, store and validate expected callback tokens server-side.

### HIGH-003: No Rate Limiting on AI Endpoints

- **Threat**: Authenticated users can make unlimited GPT-4o/GPT-4o-mini API calls via `/api/sessions/[id]/feedback`, `/api/micro-sessions`, `/api/assistant/chat`, causing unbounded OpenAI costs.
- **Current State**: Only signup and mobile login have rate limits. AI endpoints have no throttling.
- **Risk Level**: **HIGH**
- **Recommendation**: Add per-user rate limits: 5 feedback requests/hour, 10 micro-sessions/hour, 20 chat messages/day (already configured in access-control but not enforced server-side for all plans).

### HIGH-004: Unauthenticated /api/logs Endpoint

- **Threat**: Anyone can POST arbitrary error logs, enabling log injection attacks, spam, and potential storage exhaustion.
- **Current State**: `src/app/api/logs/route.ts` — IP rate limited (10/min) but no auth.
- **Risk Level**: **HIGH**
- **Recommendation**: Require at least a valid session or CSRF token. Sanitize all user-submitted metadata.

### HIGH-005: Broad CORS on Non-Public Endpoints

- **Threat**: `/api/arcade` and other non-public routes expose `Access-Control-Allow-Origin: *`, allowing cross-origin API access from any domain.
- **Current State**: Multiple endpoints return wildcard CORS headers.
- **Risk Level**: **HIGH**
- **Recommendation**: Restrict CORS to `https://seeneyu.vercel.app` for non-public routes. Only `/api/public/*` should have wildcard CORS.

### HIGH-006: dangerouslySetInnerHTML Without Sanitization

- **Threat**: 9 locations render admin-entered HTML without sanitization. If an admin account is compromised, stored XSS attacks target all users.
- **Locations**:
  - `src/app/about/page.tsx` — page.content.html
  - `src/app/blog/[slug]/page.tsx` — post.body
  - `src/app/foundation/[courseSlug]/[lessonSlug]/LessonClient.tsx` — lesson.theoryHtml
  - `src/app/knowledge/[slug]/page.tsx` — post.body
  - `src/app/policies/privacy/page.tsx` — page.content.html
  - `src/app/policies/terms/page.tsx` — page.content.html
  - `src/app/admin/email/[id]/edit/page.tsx` — previewHtml
- **Risk Level**: **HIGH**
- **Recommendation**: Install `dompurify` or `isomorphic-dompurify` and sanitize all HTML before rendering.

### HIGH-007: Auto-Approved Signup Bypasses Approval Workflow

- **Threat**: New users are created with `status: 'approved'` immediately, bypassing the admin approval flow defined in the schema (`status: 'pending'`).
- **Current State**: `src/app/api/auth/signup/route.ts` line 59: `status: 'approved'`
- **Risk Level**: **HIGH** (if approval workflow is intended for production)
- **Recommendation**: Change to `status: 'pending'` and implement email verification + admin approval. Or document that auto-approval is intentional.

---

## Medium Findings

### MED-001: Embed Routes Allow Framing from Any Origin

- **Threat**: `/embed/*` routes have `frame-ancestors *`, enabling clickjacking on embedded content.
- **Current State**: Intentional for viral distribution but creates risk.
- **Recommendation**: Whitelist known embedding domains if possible. Add anti-clickjacking UI within embeds.

### MED-002: Cron Jobs Lack Replay Protection

- **Threat**: If CRON_SECRET leaks, cron jobs can be triggered multiple times causing duplicate emails, subscription renewals, or race conditions.
- **Recommendation**: Use Vercel's built-in `X-Vercel-Cron` header validation. Add idempotency tokens.

### MED-003: No Email Verification on Signup

- **Threat**: Users can register with any email without verification, enabling fake accounts and spam.
- **Recommendation**: Add email verification flow before account activation.

### MED-004: Stripe Webhook Error Logging

- **Threat**: Webhook handler logs error messages that could expose internal structure.
- **Recommendation**: Log to monitoring service, not console. Don't log sensitive error details.

### MED-005: Predictable Blob Storage Paths

- **Threat**: Blob paths like `recordings/{clipId}/{timestamp}.webm` follow predictable patterns.
- **Recommendation**: Use opaque UUIDs instead of sequential IDs. Generate signed URLs with expiry.

---

## Low Findings

### LOW-001: Console Logging in Production

- **Threat**: `console.error()` throughout codebase may expose details in Vercel logs.
- **Recommendation**: Use structured logging library (Pino, Sentry).

### LOW-002: VAPID Key Fallback Logic

- **Threat**: `/api/push/vapid-key` checks two env vars which could cause confusion.
- **Recommendation**: Standardize on `NEXT_PUBLIC_VAPID_PUBLIC_KEY` only.

### LOW-003: Missing Audit Logging for Admin Actions

- **Threat**: No audit trail for admin CMS changes. Compromised admin account changes are untrackable.
- **Recommendation**: Add audit log table tracking admin mutations.

### LOW-004: Security Headers Not Tested in Development

- **Threat**: Development may not enforce production security headers.
- **Recommendation**: Add header validation to CI/CD pipeline.

### LOW-005: In-Memory Rate Limiters Reset Per Instance

- **Threat**: Vercel serverless instances don't share memory — rate limits reset on cold starts.
- **Recommendation**: Use Vercel KV or Upstash Redis for persistent rate limiting at scale.

---

## Positive Findings

1. **Stripe webhook signature verification** — properly implemented with `stripe.webhooks.constructEvent()` ✓
2. **Database connection pooling** — Neon pgbouncer enabled via connection string ✓
3. **NextAuth middleware** — enforces auth on `/admin`, `/dashboard`, `/onboarding` routes ✓
4. **Parameterized queries** — all Prisma queries use parameterized templates, zero raw SQL injection risk ✓
5. **bcrypt-12 password hashing** — industry-standard cost factor ✓
6. **Upload validation** — file type + size validation on all upload routes (added in v1.2.1) ✓
7. **Security headers** — X-Frame-Options, CSP, nosniff, Referrer-Policy on all non-embed routes ✓

---

## Priority Action Plan

**Immediate (This Week):**
1. Rotate ALL API keys (CRIT-002)
2. Change user recording uploads to `access: 'private'` (CRIT-001)
3. Fix VNPay user identification (HIGH-001)
4. Add CSRF to payment callbacks (HIGH-002)

**Short-term (This Month):**
5. Add rate limiting to AI endpoints (HIGH-003)
6. Authenticate /api/logs (HIGH-004)
7. Restrict CORS to specific origins (HIGH-005)
8. Install DOMPurify for HTML sanitization (HIGH-006)
9. Decide on signup approval workflow (HIGH-007)

**Medium-term (Next Quarter):**
10. Add email verification to signup
11. Implement audit logging for admin actions
12. Move to structured logging
13. Add cron idempotency tokens
14. Penetration testing (focus: payment flow + blob access)
