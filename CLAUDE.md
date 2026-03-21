# seeneyu — Project Overview

## What is seeneyu?
A body language & communication coaching app. Learners watch curated Hollywood movie clips, observe specific skills (eye contact, posture, vocal pacing, etc.), record themselves mimicking the behavior, receive AI feedback, and repeat to improve.

## Core Loop
Watch → Observe → Mimic → Feedback → Repeat

## Tech Stack
- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS (dark UI, gray-900/950 base)
- **Database**: PostgreSQL (Neon) + Prisma
- **Video**: YouTube IFrame API (no self-hosted video)
- **Recording**: MediaRecorder API (browser webcam)
- **AI Feedback**: GPT-4o Vision
- **Storage**: Vercel Blob (user recordings, temp)
- **Deploy**: Vercel

## Team Roles
Each role runs in a separate Claude Code window by opening its subdirectory:

| Role | Directory | Responsibility |
|---|---|---|
| Project Manager | `roles/pm/` | Orchestration, milestones, decisions |
| Designer | `roles/designer/` | UX/UI specs, design system, component specs |
| Tester | `roles/tester/` | Test cases, bug reports, coverage |
| Data Engineer | `roles/data-engineer/` | YouTube API, screenplay parser, data pipeline |
| Reporter | `roles/reporter/` | Activity logs, documentation, memory consolidation |

## Shared Data Pool
All roles read/write to `../../.shared/` (relative to their role directory):
- `signals/` — inter-role trigger messages
- `state/` — project state, milestones, decisions
- `memory/` — shared knowledge, tech stack, design system
- `outputs/` — artifacts from each role

## Signal Protocol
When starting a session: **always read your signal queue first** (`../../.shared/signals/<your-role>.json`)
When completing a task: **write signals to affected roles' queues**
Signal status: `unread` → `read` (never delete signals)

## Current Phase
See `../../.shared/state/project-state.json`

## Key Principles
1. File-based state — nothing lives only in memory
2. Checkpoint everything — long tasks save progress to files
3. PM is source of truth — all milestone decisions go through PM
4. Append-only logs — activity-log.md and signals are never deleted
5. Tester sign-off required before any milestone is marked complete
