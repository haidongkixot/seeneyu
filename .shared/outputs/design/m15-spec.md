# M15 UI Spec — Performing Foundation Section
> Owner: Designer | Milestone: M15 | Delivered: 2026-03-23

## Overview
Brand new section at `/foundation`. Completely separate from the clip practice library. Udemy-style structured learning: courses → lessons → theory + examples + quiz. Three courses:
- 🎙️ **Voice Mastery** (amber)
- 💬 **Verbal Communication** (blue)
- 🤝 **Body Language Fundamentals** (green)

Dark UI consistent with seeneyu. Distinct visual identity from the practice section.

---

## Page 1: /foundation — Course Catalog

### Layout
```
┌───────────────────────────────────────────────────────────────────────────┐
│  [NavBar: ... Library | Foundation | ...]                                  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Performing Foundation                                                     │
│  Master the core building blocks of human communication — voice,          │
│  language, and body. Theory, examples, and quizzes.                        │
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │  🎙️               │  │  💬               │  │  🤝               │         │
│  │  Voice Mastery    │  │  Verbal Comms     │  │  Body Language   │         │
│  │                   │  │                   │  │                  │         │
│  │  Learn to project │  │  Master what you  │  │  Your body speaks│         │
│  │  pitch, and pace  │  │  say and how you  │  │  before you open │         │
│  │  your voice...    │  │  frame it...      │  │  your mouth...   │         │
│  │                   │  │                   │  │                  │         │
│  │  10 lessons       │  │  10 lessons        │  │  10 lessons      │         │
│  │  [===== ] 3/10    │  │  [=====   ] 0/10  │  │  [=  ] 1/10      │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

### Course card styles (by color variant)
```tsx
// Voice Mastery (amber):
"bg-gradient-to-b from-amber-500/15 to-amber-500/5 border border-amber-500/20
 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 rounded-2xl p-6"

// Verbal Communication (blue):
"bg-gradient-to-b from-blue-500/15 to-blue-500/5 border border-blue-500/20
 hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-200 rounded-2xl p-6"

// Body Language (green/emerald):
"bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20
 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200 rounded-2xl p-6"
```

### Course card anatomy
```tsx
<Link href="/foundation/[slug]">
  <div className="text-5xl mb-4">{course.icon}</div>
  <h2 className="text-xl font-bold text-text-primary mb-2">{course.title}</h2>
  <p className="text-text-secondary text-sm mb-4 flex-1 leading-relaxed">{course.description}</p>

  {/* Lesson count + progress badge */}
  <div className="flex items-center justify-between text-xs mb-3">
    <span className="text-text-tertiary">{totalLessons} lessons</span>
    <span className="[color-variant badge] px-2 py-0.5 rounded-full font-semibold">
      {completed}/{total} done
    </span>
  </div>

  {/* Progress bar */}
  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
    <div className="h-full [color-variant] rounded-full" style={{ width: `${pct}%` }} />
  </div>
</Link>
```

### Progress badge colors
- amber: `text-amber-400 bg-amber-400/10`
- blue: `text-blue-400 bg-blue-400/10`
- green: `text-emerald-400 bg-emerald-400/10`

### Progress bar fill colors
- amber: `bg-amber-400`
- blue: `bg-blue-400`
- green: `bg-emerald-400`

---

## Page 2: /foundation/[courseSlug] — Course Page

### Layout
```
┌───────────────────────────────────────────────────────────────────────────┐
│  Foundation  >  Voice Mastery                    (breadcrumb)             │
│                                                                            │
│  🎙️                                                                         │
│  Voice Mastery                                                             │
│  Learn to project, pitch, and pace your voice with intention.             │
│                                                                            │
│  10 lessons  ·  3/10 complete                                             │
│  [=========          ] 30%                                                 │
│                                                                            │
│  ─────────────────────────────────────────────────────────                 │
│                                                                            │
│  ✓  Lesson 1  Vocal Projection              ›    (completed — checkmark)  │
│  ✓  Lesson 2  Pitch Variation               ›                             │
│  ✓  Lesson 3  Pacing & Rhythm               ›                             │
│  ○  Lesson 4  Articulation & Diction        ›    (incomplete — circle)    │
│  ○  Lesson 5  Resonance & Tone              ›                             │
│  ○  Lesson 6  Breath Control                ›                             │
│  ○  Lesson 7  Vocal Warm-Ups                ›                             │
│  ○  Lesson 8  Tone Matching                 ›                             │
│  ○  Lesson 9  Volume Dynamics               ›                             │
│  ○  Lesson 10 Eliminating Filler Words      ›                             │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

### Breadcrumb
```tsx
<nav className="flex items-center gap-2 text-sm text-text-tertiary mb-8">
  <Link href="/foundation" className="hover:text-text-primary transition-colors">Foundation</Link>
  <ChevronRight size={14} />
  <span className="text-text-primary">{course.title}</span>
</nav>
```

### Lesson row
```tsx
// Completed:
<Link className="flex items-center gap-4 p-4 bg-bg-surface border border-white/8 rounded-xl
                  hover:border-accent-400/25 hover:bg-bg-overlay transition-all duration-150 group">
  <CheckCircle2 size={20} className="text-accent-400 shrink-0" />
  <div className="flex-1">
    <span className="text-xs text-text-tertiary">Lesson {n}</span>
    <p className="text-text-primary font-medium group-hover:text-accent-400 transition-colors">
      {lesson.title}
    </p>
  </div>
  <ChevronRight size={16} className="text-text-muted group-hover:text-accent-400 shrink-0" />
</Link>

// Incomplete:
// Same but: <Circle size={20} className="text-text-muted shrink-0" />
```

---

## Page 3: /foundation/[courseSlug]/[lessonSlug] — Lesson Page

### Full page layout
```
┌───────────────────────────────────────────────────────────────────────────┐
│  Foundation  >  Voice Mastery  >  Vocal Projection      (breadcrumb)      │
│  Lesson 1 of 10  [●●○○○○○○○○]  (progress dots)                           │
│                                                                            │
│  Vocal Projection                           (h1, text-2xl font-bold)      │
│                                                                            │
│  ┌─ [1] Theory ──────────────────────────────────────────────────────┐    │
│  │                                                                    │    │
│  │  What Is Vocal Projection?                                        │    │
│  │  ─────────────────────────                                        │    │
│  │  Vocal projection is the ability to...                            │    │
│  │                                                                    │    │
│  │  The Diaphragm Technique                                          │    │
│  │  ─────────────────────────                                        │    │
│  │  Place your hand on your stomach...                               │    │
│  │                                                                    │    │
│  │  • Key point one                                                   │    │
│  │  • Key point two                                                   │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─ [2] See It In Action ────────────────────────────────────────────┐    │
│  │                                                                    │    │
│  │  ┌────────────────────────────────────────────────────────┐       │    │
│  │  │                                                         │       │    │
│  │  │          [YouTube Embed — 16:9]                        │       │    │
│  │  │                                                         │       │    │
│  │  └────────────────────────────────────────────────────────┘       │    │
│  │  Example Title                                                     │    │
│  │  Notice how the speaker uses diaphragmatic support...             │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─ [3] Test Your Understanding ─────────────────────────────────────┐    │
│  │                                                                    │    │
│  │  1. What does vocal projection primarily rely on?                 │    │
│  │     ( ) Shouting louder                                           │    │
│  │     (●) Diaphragmatic breathing     ← selected before submit     │    │
│  │     ( ) Speaking faster                                           │    │
│  │     ( ) Using a microphone                                        │    │
│  │                                                                    │    │
│  │  2. Which technique prevents throat strain?                       │    │
│  │     (options...)                                                   │    │
│  │                                                                    │    │
│  │  [Submit Answers]  ← disabled until all answered                 │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ─────────────────────────────────────────────────────────────────────    │
│  ← Prev Lesson (if any)              Next Lesson → (or Finish Course)     │
└───────────────────────────────────────────────────────────────────────────┘
```

### Section headers (numbered badges)
```tsx
<h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-3">
  <span className="w-7 h-7 rounded-full bg-accent-400/15 text-accent-400 text-xs
                   flex items-center justify-center font-bold shrink-0">
    {n}
  </span>
  {sectionTitle}
</h2>
```

### Theory section
```tsx
<section className="mb-12">
  {/* section header */}
  <div
    className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed
               [&_h3]:text-text-primary [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-3
               [&_p]:mb-4 [&_strong]:text-text-primary [&_strong]:font-semibold
               [&_ul]:space-y-1 [&_li]:text-text-secondary [&_li]:marker:text-accent-400"
    dangerouslySetInnerHTML={{ __html: lesson.theoryHtml }}
  />
</section>
```

### Examples section
```tsx
// Example card:
<div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden mb-6">
  <div className="aspect-video">
    <iframe src="..." className="w-full h-full" allowFullScreen />
  </div>
  <div className="p-4 border-t border-white/8">
    <p className="font-semibold text-text-primary text-sm mb-1">{title}</p>
    <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
  </div>
</div>
```

### Quiz section — BEFORE submit
```tsx
// Question card:
<div className="bg-bg-surface border border-white/8 rounded-2xl p-5 mb-4">
  <p className="text-text-primary font-medium text-sm mb-4">
    {qi + 1}. {question}
  </p>
  <div className="space-y-2">
    {options.map((opt, oi) => (
      <button
        onClick={() => select(qi, oi)}
        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-150
          ${selected === oi
            ? 'border border-accent-400/60 text-accent-400 bg-accent-400/8'
            : 'border border-white/8 text-text-secondary hover:border-white/15 hover:text-text-primary'
          }`}
      >
        {opt}
      </button>
    ))}
  </div>
</div>

// Submit button:
<button
  disabled={!allAnswered}
  className="w-full py-3 rounded-xl bg-accent-400 text-bg-base font-semibold text-sm
             hover:bg-amber-300 disabled:opacity-35 disabled:cursor-not-allowed
             transition-all duration-150"
>
  Submit Answers
</button>
```

### Quiz section — AFTER submit (result states)
```
PASSED (score ≥ 60%):
┌──────────────────────────────────────────┐
│  ✓  Lesson Complete!           4/4 correct│  ← emerald bg
│  You've mastered this lesson.             │
└──────────────────────────────────────────┘

FAILED (score < 60%):
┌──────────────────────────────────────────┐
│  ✕  Not quite — review and retry         │  ← red/rose bg
│  Score: 2/4 correct                       │
└──────────────────────────────────────────┘
```

**Per-option states after submit:**
```tsx
// Correct option (always shown green):
"border border-emerald-500/50 text-emerald-400 bg-emerald-500/8"

// Selected wrong option (user chose incorrectly):
"border border-red-500/50 text-red-400 bg-red-500/8"

// Unselected wrong option (neutral):
"border border-white/6 text-text-muted opacity-50"
```

**Explanation text (shown after submit per question):**
```tsx
<p className="mt-3 text-xs text-text-tertiary leading-relaxed
              border-t border-white/6 pt-3 italic">
  {question.explanation}
</p>
```

### Score banner
```tsx
// Passed:
<div className="mb-6 p-4 rounded-xl border bg-emerald-500/8 border-emerald-500/20 text-emerald-400">
  <p className="font-semibold">✓ Lesson Complete!</p>
  <p className="text-sm mt-1 opacity-75">Score: {score}/{total} · {pct}% correct</p>
</div>

// Failed:
<div className="mb-6 p-4 rounded-xl border bg-red-500/8 border-red-500/20 text-red-400">
  <p className="font-semibold">✕ Not quite — review the theory and try again</p>
  <p className="text-sm mt-1 opacity-75">Score: {score}/{total} correct</p>
</div>
```

### Lesson progress indicator (top of page)
```tsx
// Position indicator: "Lesson 3 of 10"
<div className="flex items-center justify-between text-xs text-text-tertiary mb-6">
  <span>Lesson {currentIdx + 1} of {total}</span>
  {/* Progress dots */}
  <div className="flex gap-1">
    {lessons.map((_, i) => (
      <div key={i} className={`h-1 w-5 rounded-full transition-colors ${
        i === currentIdx ? 'bg-accent-400' :
        i < currentIdx  ? 'bg-accent-400/35' :
                          'bg-white/10'
      }`} />
    ))}
  </div>
</div>
```

### Prev / Next navigation
```tsx
<div className="flex items-center justify-between mt-12 pt-8 border-t border-white/8">
  {/* Previous */}
  <Link className="flex items-center gap-2 text-sm text-text-tertiary
                   hover:text-text-primary transition-colors">
    <ChevronLeft size={16} />
    <span>{prevLesson?.title ?? `Back to ${course.title}`}</span>
  </Link>

  {/* Next */}
  <Link className="flex items-center gap-2 text-sm text-text-primary font-medium
                   hover:text-accent-400 transition-colors">
    <span>{nextLesson?.title ?? 'Finish Course'}</span>
    <ChevronRight size={16} />
  </Link>
</div>
```

---

## NavBar update

Add "Foundation" link after "Library" in NavBar.tsx. Match existing link styling exactly.

```tsx
// In NavBar.tsx, after the Library link:
<Link
  href="/foundation"
  className={`text-sm font-medium transition-colors duration-150 ${
    pathname.startsWith('/foundation')
      ? 'text-text-primary'
      : 'text-text-tertiary hover:text-text-secondary'
  }`}
>
  Foundation
</Link>
```

---

## Component breakdown

| Component | Type | File |
|---|---|---|
| FoundationCatalogPage | Server | src/app/foundation/page.tsx |
| CoursePage | Server | src/app/foundation/[courseSlug]/page.tsx |
| LessonPage | Server | src/app/foundation/[courseSlug]/[lessonSlug]/page.tsx |
| LessonClient | `'use client'` | src/app/foundation/[courseSlug]/[lessonSlug]/LessonClient.tsx |

LessonClient handles: quiz answer state, submit handler, score display, POST to /api/foundation/progress.

---

## Responsive behaviour
- Course catalog: 1 col (mobile) → 3 col (md+)
- Lesson list: always 1 col, full width
- Lesson page: max-w-3xl centered, single column
- YouTube embeds: aspect-video, full width
- Quiz: full width options, stacked
