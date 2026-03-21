# seeneyu — Onboarding (Quick Start for any new session)
> Keep under 100 lines. Updated by Reporter after each milestone.

## What is this?
seeneyu is a body language coaching web app. Users watch Hollywood movie clips, mimic the skill shown, record themselves, get AI feedback, and repeat.

## Current Phase
**Phase 5-launch: ACTIVE** — All code complete. Blocked on env var configuration by user.

| Milestone | Status |
|---|---|
| M0 Setup | ✅ Complete |
| M1 Design System | ✅ Complete |
| M2 Data Pipeline (15 clips) | ✅ Complete (YouTube IDs need verification) |
| M3 Clip Library UI | ✅ Complete |
| M4 Coaching Loop | ✅ Complete |
| M5 AI Feedback Engine | ✅ Complete |
| M6 MVP Launch Ready | 🔄 Blocked — needs env vars + deploy |

## Tech Stack (1-liner each)
- **App**: Next.js 14 App Router, TypeScript
- **Style**: Tailwind CSS (dark, gray-950 base)
- **DB**: Neon PostgreSQL + Prisma
- **Video**: YouTube IFrame API (no self-hosting)
- **AI**: GPT-4o Vision for feedback
- **Deploy**: Vercel

## Where to find things
| What | Where |
|---|---|
| Project state | `.shared/state/project-state.json` |
| Milestones | `.shared/state/milestones.json` |
| Decisions | `.shared/state/decisions.json` |
| Your signal queue | `.shared/signals/<your-role>.json` |
| Tech stack details | `.shared/memory/tech-stack.md` |
| Design tokens | `.shared/memory/design-system.md` |
| Shared facts | `.shared/memory/shared-knowledge.md` |
| Activity history | `.shared/outputs/reports/activity-log.md` |

## How to work as a role
1. `cd roles/<role-name>/` and open Claude Code
2. Claude auto-loads that role's `CLAUDE.md`
3. Start every session by reading your signal queue
4. End every session by writing signals to affected roles

## DO NOTs
- Never self-host video — YouTube IFrame only
- Never mark a milestone complete without Tester sign-off
- Never assume prior session state exists — always read from files
- Never push to production branch without PM approval
- Never delete signal entries — mark as "read" only
