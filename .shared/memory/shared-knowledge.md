# Shared Knowledge — seeneyu
> Updated by: Reporter after each milestone
> Read by: All roles at session start

## What is seeneyu?
A body language & communication coaching web app. Learners watch curated Hollywood movie clips, observe a specific skill demonstrated by the character, record themselves mimicking it, receive AI feedback, and repeat to improve.

## Core User Flow
```
Browse Library → Select Clip → Watch + Annotations → Record Yourself
                                                            ↓
                                              AI Feedback (score + tips)
                                                            ↓
                                              Retry or Move to Next Clip
```

## Skills Taxonomy (MVP)
| Skill | Key Signal | Why Important |
|---|---|---|
| eye-contact | Holding gaze 2–3 seconds, breaking intentionally | Foundation of confidence and trust |
| open-posture | Uncrossed arms, feet apart, upright spine | Signals openness and authority |
| active-listening | Nods, lean-in, mirror expression, minimal interruption | Builds rapport, makes others feel heard |
| vocal-pacing | Strategic pause, varied tempo, silence comfort | Controls the room, signals confidence |
| confident-disagreement | Hold position without aggression, body stays open | Most valued in professional settings |

## Difficulty Scoring System
Score each clip 1–3 on 4 dimensions. Sum = difficulty:
- Signal Clarity (1=obvious, 3=subtle)
- Noise Level (1=clean, 3=chaotic)
- Context Dependency (1=universal, 3=needs backstory)
- Replication Difficulty (1=easy, 3=hard)

Sum 4–5 = Beginner | 6–8 = Intermediate | 9–12 = Advanced

## Team Roles & What They Own
- **PM**: project-state.json, milestones.json, decisions.json
- **Designer**: design-system.md, .shared/outputs/design/
- **Tester**: test-cases.json, bug reports, coverage.json
- **Data Engineer**: clip pipelines, .shared/outputs/data/
- **Reporter**: activity-log.md, shared-knowledge.md (this file), onboarding.md

## Critical Constraints
1. Never self-host video — YouTube IFrame only (store video_id + timestamps)
2. Data pipelines MUST checkpoint — context resets are expected, pipelines must resume
3. No milestone is complete without Tester sign-off
4. All decisions go to decisions.json (PM writes, Reporter summarizes)
5. Tester sign-off required on Tester-approved field in milestones.json before PM marks complete

## Current Status
- Phase: 0-setup (COMPLETE)
- Next: M1 — Designer to deliver design system
- Active: Waiting for PM to assign M1 tasks to Designer
