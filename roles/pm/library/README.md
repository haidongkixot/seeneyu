# PM Library
> Decisions, analyses, and plans too detailed for the signal board.
> Read relevant files at session start when working on related milestones.

---

## Contents

| File | Date | Summary |
|---|---|---|
| [scientific-assessment-learning-loop.md](scientific-assessment-learning-loop.md) | 2026-04-06 | Honest audit of what seeneyu gets right and wrong vs. 4 research threads (23 sources). Identifies 3 serious gaps + 2 active undermining factors. Defines the Learning Velocity Index (LVI) as the new north star metric. |
| [improvement-plan-learning-system.md](improvement-plan-learning-system.md) | 2026-04-06 | 4-initiative plan to bridge the gaps: (I4) ungate dimension bars 15min, (I1) session delta 1 day, (I2) feedforward highlight 3 days, (I3) spaced review 5 days. Total: ~9.5 days. |
| [effort-estimation-code-grounded.md](effort-estimation-code-grounded.md) | 2026-04-06 | File-level effort estimates with exact paths, line counts, schema changes, and risks for all 4 initiatives. Includes pre-discovery: snapshotScores blocker for Initiative 2. |

---

## Quick Decisions

- **Ship Initiative 4 first** — 1 line change, unblocks 80% of users from deliberate practice loop
- **Do NOT use 48% effect size** in marketing — use conservative 23–26% (meta-analytic, Grade A)
- **Strongest investor citation:** Bellini & Akullian 2007 meta-analysis (Grade A, social-communication VSM)
- **Known bug:** `progress/page.tsx` fetches sessions with no `userId` filter — fix in Initiative 1
- **Schema blocker for I2:** `snapshotScores Json?` must be added before feedforward UI work
