Save current work and prepare for session restart.

Execute these steps in order:
1. Finish the current step you are on (do not leave code half-written).
2. Run `npx tsc --noEmit` to confirm no TypeScript errors.
3. Update `../../.shared/outputs/backend-engineer/progress.json` — set all completed steps to "complete", current in-progress step to the exact sub-step you are on.
4. Write a "checkpoint-saved" signal to `../../.shared/signals/pm.json` listing: what was completed, what step is next, and any blockers.
5. Tell the user: "Checkpoint saved. Safe to restart this window."
