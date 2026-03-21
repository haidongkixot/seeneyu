# User Flow — Core Coaching Loop
> Owner: Designer
> Created: 2026-03-21

---

## Primary Flow (Happy Path)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ENTRY POINTS                                │
│   [Landing Page]    [Direct URL]    [Returning User Dashboard]      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Skill Library      │
                    │  (filterable grid)   │
                    │                      │
                    │  Filter by:          │
                    │  • Skill type        │
                    │  • Difficulty        │
                    └──────────┬───────────┘
                               │ tap a ClipCard
                               ▼
                    ┌──────────────────────┐
                    │   Clip Detail Page   │
                    │                      │
                    │  • Movie context     │
                    │  • Skill description │
                    │  • What to observe   │
                    │  • Difficulty score  │
                    └──────────┬───────────┘
                               │ tap "Watch Clip"
                               ▼
                    ┌──────────────────────┐
                    │   Clip Viewer        │
                    │                      │
                    │  YouTube embed plays │
                    │  Annotations appear  │
                    │  at key timestamps   │
                    │                      │
                    │  [Replay] [I'm Ready]│
                    └──────────┬───────────┘
                               │ tap "I'm Ready"
                               ▼
                    ┌──────────────────────┐
                    │   Record Yourself    │
                    │                      │
                    │  Split view:         │
                    │  LEFT: reference     │
                    │  RIGHT: webcam       │
                    │                      │
                    │  [3] [2] [1] [●REC]  │
                    │  Timer shows elapsed │
                    │  [Stop & Submit]     │
                    └──────────┬───────────┘
                               │ recording submitted
                               ▼
                    ┌──────────────────────┐
                    │   Processing         │
                    │                      │
                    │  "Analyzing your     │
                    │   performance..."    │
                    │                      │
                    │  Skeleton loader     │
                    │  (~5–15 seconds)     │
                    └──────────┬───────────┘
                               │ AI analysis complete
                               ▼
                    ┌──────────────────────┐
                    │   Feedback Screen    │
                    │                      │
                    │  Overall score ring  │
                    │  Per-dimension bars  │
                    │  AI coach notes      │
                    │  Your recording      │
                    │                      │
                    │  [Try Again] [Next→] │
                    └──────────┬───────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
   [Try Again]                        [Next Clip]
   → back to Record Yourself           → back to Clip Detail
     same clip                           (next recommended)
```

---

## Secondary Flows

### New User Onboarding

```
[Landing] → [See Hero Demo] → [Browse Library (no auth)] → [Try Clip]
         → [Prompted to sign up on Record]
         → [Quick signup (email / Google)]
         → [Back to Record Yourself]
```

### Returning User

```
[Dashboard] → [Resume last clip] OR [Browse new clips]
           → picks up at last step (Clip Viewer or Record)
```

### Skill Filter Flow

```
[Library] → [tap Skill filter chip] → [grid filters in-place, no reload]
         → [tap Difficulty filter]  → [further narrows grid]
         → [clear filters button]   → [all clips shown]
```

---

## State Transitions

| From              | To                 | Trigger                            |
|---|---|---|
| Library           | Clip Detail        | tap ClipCard                       |
| Clip Detail       | Clip Viewer        | tap "Watch Clip"                   |
| Clip Viewer       | Record Yourself    | tap "I'm Ready to Mimic"           |
| Clip Viewer       | Clip Detail        | tap "← Back"                       |
| Record Yourself   | Processing         | tap "Stop & Submit"                |
| Record Yourself   | Clip Viewer        | tap "Watch Again"                  |
| Processing        | Feedback           | AI analysis resolves               |
| Feedback          | Record Yourself    | tap "Try Again"                    |
| Feedback          | Clip Detail        | tap "Next Clip"                    |
| Any screen        | Library            | tap nav "Library" or logo          |

---

## Error States

```
Recording fails (no webcam permission):
  → show permission error card with instructions
  → "Try Again" re-triggers permission request

AI analysis fails:
  → show error state on Feedback screen
  → "Retry Analysis" button (re-submits same recording blob)
  → if retry fails: "Skip Feedback" → still awards attempt badge

Clip unavailable (YouTube removed):
  → ClipCard shows "Unavailable" overlay
  → removed from browsable grid
  → Clip Detail shows error state with "Browse Similar Clips"
```
