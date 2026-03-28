# seeneyu — Onboarding (Quick Start for any new session)
> Keep under 100 lines. Updated by Reporter 2026-03-28.

## What is this?
seeneyu is a body language & communication coaching web + mobile app. Users watch Hollywood clips, mimic skills, record themselves, get AI feedback (MediaPipe + GPT-4o), and repeat. Gamified with XP, streaks, badges, leaderboards. Monetized via 3-tier subscriptions.

## Current Phase
**Phase 36-cms-logging-rebrand** — M0-M8 tester-approved. M10-M25 code-complete, deployed, awaiting tester. M26-M45 in planning. M9 (marketing) in-progress.

| Range | Status |
|---|---|
| M0–M8 | ✅ Complete + tester-approved |
| M9 Marketing | 🔄 In-progress (VC fundraising package) |
| M10–M25 | ✅ Code-complete + deployed — **awaiting tester sign-off (16 milestones!)** |
| M26–M28 | 📋 Backend specs + design specs ready. M26 backend code done. |
| M29–M45 | 📋 Planned (approved by PM) |
| M46 | 📋 AI Content Generator (approved) |

## Tech Stack (1-liner each)
- **App**: Next.js 14 App Router, TypeScript
- **Style**: Tailwind CSS (dark, transitioning to light mode per M38)
- **DB**: Neon PostgreSQL + Prisma (45+ models)
- **Video**: YouTube IFrame API (no self-hosting)
- **AI Scoring**: Google MediaPipe (client-side, zero API cost) — replaced GPT-4o Vision
- **AI Feedback**: GPT-4o TEXT (optional, for rich feedback)
- **AI Assistant**: OpenAI GPT-4o + Whisper + TTS (Coach Ney)
- **Auth**: NextAuth.js v4, email+password, registration approval gate
- **Payments**: PayPal + VNPay (sandbox)
- **Deploy**: Vercel (web), Expo SDK 52 (mobile)
- **Live URL**: https://seeneyu.vercel.app

## Team Roles
| Role | Directory | Owns |
|---|---|---|
| PM | `roles/pm/` | Milestones, decisions, orchestration |
| Designer | `roles/designer/` | Design system, component specs, UI review |
| Tester | `roles/tester/` | Test cases, sign-off, coverage |
| Data Engineer | `roles/data-engineer/` | Clip pipelines, data schema |
| Reporter | `roles/reporter/` | Activity log, shared-knowledge, onboarding |
| Builder | `roles/builder/` | Git, GitHub, Neon, Vercel, mobile app |
| Backend Engineer | `roles/backend-engineer/` | APIs, services, Prisma schema, admin CMS |
| Marketer | `roles/marketer/` | Brand, pitch deck, VC materials |

## Where to find things
| What | Where |
|---|---|
| Project state | `.shared/state/project-state.json` |
| Milestones | `.shared/state/milestones.json` |
| Decisions | `.shared/state/decisions.json` |
| Signal board | `.shared/signals/board.json` (filter by your role's `to` field) |
| Shared knowledge | `.shared/memory/shared-knowledge.md` |
| Design tokens | `.shared/memory/design-system.md` |
| Activity log | `.shared/outputs/reports/activity-log.md` |
| Decisions summary | `.shared/outputs/reports/decisions-summary.md` |
| Design specs | `.shared/outputs/designer/m*-spec.md` |

## Open Bugs
- **BUG-005**: FIXED — pricing page now uses /api/public/plans
- **BUG-006**: Plan + ArcadeBundle tables not seeded in prod. Need: `npx tsx scripts/seed-plans.ts` + `npm run db:seed`

## How to work as a role
1. `cd roles/<role-name>/` and open Claude Code
2. Claude auto-loads that role's `CLAUDE.md`
3. Read `.shared/signals/board.json` — filter by your `to` field
4. Send signals: `node scripts/signal-send.js --from <role> --to <target> --message "..."`
5. Complete signals: `node scripts/signal-done.js <signal-id>`

## DO NOTs
- Never self-host video — YouTube IFrame only
- Never mark a milestone complete without Tester sign-off
- Never edit state files (milestones/project-state/decisions) unless you are PM
- Never assume prior session state exists — always read from files
- Never send .webm to GPT-4o Vision — MediaPipe handles scoring now
- Never run `prisma generate` with dev server running — use `(prisma as any)` cast
- Never push to production without PM approval
