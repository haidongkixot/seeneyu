Save current work and prepare for session restart.

Execute these steps in order:
1. Finish the current step you are on (do not leave work half-done).
2. Update `../../.shared/outputs/builder/progress.json` — capture exactly where you are.
3. Write a "checkpoint-saved" signal to `../../.shared/signals/pm.json` listing: what was completed, what step is next, and any blockers.
4. Tell the user: "Checkpoint saved. Safe to restart this window."
