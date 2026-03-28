# seeneyu — Decisions Summary
> Maintained by: Reporter
> Source: `.shared/state/decisions.json`
> Updated: 2026-03-22

## Decision Log

### DEC-001 — 2026-03-21: Next.js App Router as application framework
**Decided**: Use Next.js (App Router) with TypeScript
**Why**: Team familiarity, server components for data fetching, excellent Vercel integration
**Alternatives**: Vite + React SPA, Remix

### DEC-002 — 2026-03-21: YouTube IFrame API (no self-hosted video)
**Decided**: Embed YouTube clips via IFrame API — store only video_id + timestamps
**Why**: Zero hosting cost, no copyright risk, YouTube handles CDN and playback
**Constraint**: Clips must remain publicly available on YouTube; if removed, clip is broken
**Alternatives**: Cloudflare Stream, Mux, S3 + CloudFront

### DEC-003 — 2026-03-21: File-based shared state for multi-agent coordination
**Decided**: Use `.shared/` directory for all inter-role state and signals
**Why**: Works across separate Claude Code windows without external services, persists between sessions, human-readable
**Alternatives**: Redis pub/sub, SQLite, Single shared CLAUDE.md

### DEC-004 — 2026-03-21: GPT-4o Vision for AI feedback
**Decided**: Use GPT-4o Vision to analyze user recordings and generate body language feedback
**Why**: Best multimodal model for analyzing body language in video frames
**Implementation note**: Vision receives JPEG frames (captured via Canvas API), not raw video — .webm is not analyzable
**Alternatives**: MediaPipe pose estimation, peer review, Claude vision

### DEC-005 — 2026-03-21: MVP scope — 15 clips across 5 skills × 3 difficulties
**Decided**: 5 skills × 3 difficulty levels = 15 clips minimum for MVP
**Skills**: eye-contact, open-posture, active-listening, vocal-pacing, confident-disagreement
**Why**: Enough to validate full coaching loop without over-investing in content before product-market fit

### DEC-006 — 2026-03-23: Accept 65 clips for M14 (YouTube quota)
**Decided**: Accept 65 clips as M14 sprint delivery (original target: 100+)
**Why**: YouTube Data API v3 daily quota exhausted at 65 clips. All 65 fully verified with script + observation_guide + practice_steps + screenplaySource. Represents 4.3× expansion from 15.
**Alternatives**: Block M14 until 100; use different API key; reduce per-clip data richness

### DEC-007 — 2026-03-23: Semi-automated content discovery (M16)
**Decided**: Admin creates crawl jobs targeting named communication tactics via YouTube Data API + GPT-4o relevance scoring
**Why**: Diversify library with niche/advanced tactics (Power Pause, Triangle Gaze, Proxemic Management) beyond 5 standard skill categories. Admin approval gate maintains quality.
**Alternatives**: Manual curation only; fully automated ingestion; external marketplace

### DEC-008 — 2026-03-25: M21-M25 platform expansion
**Decided**: Arcade admin CRUD, analytics dashboards (DAU/WAU/MAU), feature performance monitoring, freemium access (first 3 free), 3-tier subscription with PayPal + VNPay
**Why**: User requirement for content management, usage insights, monetization, and Vietnam market payment support
**Alternatives**: Stripe-only; 2-tier pricing; no free tier

### DEC-009 — 2026-03-25: Signal system file locking
**Decided**: Add exclusive file locks (O_EXCL) with stale lock detection + atomic writes (temp+rename) to signal-send.js and signal-done.js
**Why**: Multiple roles editing board.json simultaneously caused data loss — M21-M25 milestones were wiped by concurrent edits
**Alternatives**: Per-role signal files; database-backed signals; append-only log format

### DEC-010 — 2026-03-25: M26-M28 feature plan
**Decided**: M26 Registration Approval → M27 Discussions + M28 AI Voice Assistant (Coach Ney) in parallel
**Why**: M26 (user approval gate) blocks M27+M28. Voice uses OpenAI (already a dependency). Flat comment threading (1 level) keeps complexity manageable. Coach Ney persona for assistant.
**Alternatives**: Deep threading (Reddit-style); ElevenLabs for voice; sequential M27→M28

### DEC-011 — 2026-03-25: M29-M35 Toolkit + Gamification + UX
**Decided**: Backend Toolkit (data crawler + embeddable mini-games), Duolingo-style gamification (XP, streaks, hearts, quests, badges, leagues, leaderboards), UI/UX overhaul (micro-interactions, Coach Ney mascot, bottom tab bar, skill tree)
**Why**: Mini-games needed for expression data collection; leaderboards drive retention; gamification proven in language-learning apps
**Alternatives**: Gamification without social features; skip mini-games; third-party gamification SDK

### DEC-012 — 2026-03-25: M36-M45 execution plan
**Decided**: Four phases — A: M36 Error Logging + M37 CMS + M41 Sticky Practice + M42 Submission Review (parallel). B: M38 Light Mode (depends M37). C: M39 Homepage Media + M40 App Download (depends M37+M38). D: M43 Tiered Feedback + M44 User Mgmt v2 + M45 Game Data Pipeline.
**Why**: CMS (M37) is critical path for homepage/light mode. Error logging ships independently as infrastructure.
**Alternatives**: Light mode before CMS; skip error logging; combine M39+M40

### DEC-013 — 2026-03-26: M46 AI Content Generator
**Decided**: Free AI image generation — Pollinations.ai (primary, no API key) → HF free tier (secondary) → DALL-E 3 (fallback, existing OPENAI_API_KEY). Video generation optional.
**Why**: Enable AI-generated practice content without relying on YouTube. Pollinations.ai is free with no key. Admin review gate before publishing.
**Alternatives**: DALL-E only ($0.04/image); Stable Diffusion self-hosted (no GPU); stock photos; Midjourney (no API)
