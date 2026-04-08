# Seeneyu Blueprint Versions

The live blueprint lives at `d:/Claude Projects/seeneyu-blueprint.md`. Each
material change is snapshotted here so we can trace back what the system
looked like at any point in time.

## Version Format

`v<MAJOR>.<MINOR>.<PATCH>_<YYYY-MM-DD>_<short-slug>.md`

- **MAJOR**: schema-breaking changes, new core systems (e.g., Personalized Learning Curve)
- **MINOR**: new features that don't break existing flows (e.g., spaced review, feedforward)
- **PATCH**: bug fixes, copy changes, UI tweaks

## Version History

| Version | Date | Description | Key Commits |
|---------|------|-------------|-------------|
| v1.0.0  | 2026-04-08 | Pre-learning-system baseline (M0–M73 platform with onboarding tour, gamification, multi-tenant CMS) | through `5353b82` |
| v1.1.1  | 2026-04-08 | Arcade hands-free mode + mobile nav parity | `9d178d5` |
| v1.1.0  | 2026-04-08 | Learning system upgrade: I1 session deltas, I2 feedforward, I3 spaced review, I4 ungated dimensions, LC personalized learning curve, +50 Hollywood clips, MediaPipe feedback fix, gamification XP awarding fixes, tour overlay fix | `c271598` → `c40d4bb` |

## How to Snapshot a New Version

```bash
cd "d:/Claude Projects/seeneyu"
node scripts/blueprint-snapshot.js <version> "<short description>"
```

This copies `../seeneyu-blueprint.md` into `.blueprint-versions/` with a
timestamped filename and appends a row to this file.
