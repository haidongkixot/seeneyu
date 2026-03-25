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
| Builder | `roles/builder/` | Git, GitHub, infrastructure provisioning, Vercel deployment |

## Shared Data Pool
All roles read/write to `../../.shared/` (relative to their role directory):
- `signals/` — inter-role trigger messages
- `state/` — project state, milestones, decisions
- `memory/` — shared knowledge, tech stack, design system
- `outputs/` — artifacts from each role

## Signal Protocol
- Signals are stored in `../../.shared/signals/board.json` (centralized board).
- When starting a session: **read board.json**, filter signals by your role's `"to"` field.
- To send a signal: `node ../../scripts/signal-send.js --from <your-role> --to <target> --message "..."` (uses file locking to prevent race conditions).
- To complete a signal: `node ../../scripts/signal-done.js <signal-id>` (moves to archive.json).
- Signal status: `unread` → `read` → `done` (never delete signals).

## State File Ownership (CRITICAL — prevents data loss)
**ONLY PM edits these files directly:**
- `.shared/state/milestones.json`
- `.shared/state/project-state.json`
- `.shared/state/decisions.json`

**All other roles: signal PM with status updates instead of editing state files.**
If you need to update a milestone status or add a task, send a signal to PM. PM will apply the change.
Each role may freely edit its own output files (`.shared/outputs/<role>/`).

## Current Phase
See `../../.shared/state/project-state.json`

## Key Principles
1. File-based state — nothing lives only in memory
2. Checkpoint everything — long tasks save progress to files
3. PM is source of truth — all milestone decisions go through PM
4. Append-only logs — activity-log.md and signals are never deleted
5. Tester sign-off required before any milestone is marked complete
6. **Never edit shared state files unless you are PM** — signal PM instead
