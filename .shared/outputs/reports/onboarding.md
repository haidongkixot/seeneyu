# seeneyu — Onboarding (Quick Start for any new session)
> Keep under 100 lines. Updated by Reporter after each milestone.

## What is this?
seeneyu is a body language coaching web app. Users watch Hollywood movie clips, mimic the skill shown, record themselves, get AI feedback, and repeat.

## Current Phase
**Phase 10-personalization: ACTIVE** — M10–M13 shipped. Tester sign-off for M11/M12/M13 pending.

| Milestone | Status |
|---|---|
| M0 Setup | ✅ Complete |
| M1 Design System | ✅ Complete |
| M2 Data Pipeline (15 clips) | ✅ Complete |
| M3 Clip Library UI | ✅ Complete |
| M4 Coaching Loop | ✅ Complete |
| M5 AI Feedback Engine | ✅ Complete |
| M6 MVP Launch Ready | ✅ Complete — live at https://seeneyu.vercel.app |
| M7 Auth System | ✅ Complete — NextAuth.js v4, learner/admin roles |
| M8 Admin CMS | ✅ Complete — clip CRUD + user management |
| M9 Marketing Materials | 🔄 In-progress — Marketer (VC fundraising package) |
| M10 Script-Aware Coaching | ✅ Complete — BUG-001 fix, CharacterBanner, ScriptPanel, ActionPlan |
| M11 Observation Guide | ✅ Code complete — awaiting tester sign-off |
| M12 Micro-Practice Stepper | ✅ Code complete — awaiting tester sign-off |
| M13 Onboarding Assessment | ✅ Code complete — awaiting tester sign-off |

## Tech Stack (1-liner each)
- **App**: Next.js 14 App Router, TypeScript
- **Style**: Tailwind CSS (dark, gray-950 base)
- **DB**: Neon PostgreSQL + Prisma
- **Video**: YouTube IFrame API (no self-hosting)
- **AI**: GPT-4o Vision for feedback (JPEG frames via Canvas API, not raw video)
- **Auth**: NextAuth.js v4, credentials (email+password), roles: learner | admin
- **Deploy**: Vercel — https://seeneyu.vercel.app

## Team Roles
| Role | Directory | Owns |
|---|---|---|
| PM | `roles/pm/` | Milestones, decisions, orchestration |
| Designer | `roles/designer/` | Design system, component specs, UI review |
| Tester | `roles/tester/` | Test cases, sign-off, coverage |
| Data Engineer | `roles/data-engineer/` | Clip pipelines, data schema |
| Reporter | `roles/reporter/` | Activity log, shared-knowledge, onboarding |
| Builder | `roles/builder/` | Git, GitHub, Neon, Vercel deployment |
| Backend Engineer | `roles/backend-engineer/` | Auth, Admin CMS, all coaching features |
| Marketer | `roles/marketer/` | Brand brief, pitch deck, VC materials |

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
| Decisions summary | `.shared/outputs/reports/decisions-summary.md` |
| M10 spec | `.shared/outputs/design/m10-spec.md` |
| M11/M12/M13 specs | `.shared/outputs/design/m11-spec.md` etc. |
| Assessment data | `.shared/outputs/data/m13-assessment-data.json` |

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
- Never send .webm video to GPT-4o Vision — capture JPEG frames instead
- Never run `prisma generate` if dev server is running — use `(prisma as any)` cast pattern; Vercel postinstall handles regen
