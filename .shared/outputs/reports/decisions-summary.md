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
