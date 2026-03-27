'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Example {
  id: string
  youtubeId: string
  title: string
  description: string
  startTime?: number | null
  mediaUrl?: string | null
  mediaType?: string | null
}

interface Question {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  order: number
}

interface LessonData {
  id: string
  theoryHtml: string
  examples: Example[]
  questions: Question[]
}

interface Props {
  lesson: LessonData
  existingProgress: { quizScore?: number | null; quizPassed: boolean } | null
  isLoggedIn: boolean
}

export default function LessonClient({ lesson, existingProgress, isLoggedIn }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(!!existingProgress?.quizPassed)
  const [score, setScore] = useState<number | null>(existingProgress?.quizScore ?? null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (Object.keys(answers).length < lesson.questions.length) return

    const correct = lesson.questions.filter((q, i) => answers[i] === q.correctIndex).length
    const total = lesson.questions.length
    const passed = correct >= Math.ceil(total * 0.6) // 60% to pass

    setScore(correct)
    setSubmitted(true)

    if (isLoggedIn) {
      setSaving(true)
      await fetch('/api/foundation/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, quizScore: correct, quizPassed: passed }),
      })
      setSaving(false)
    }
  }

  const allAnswered = Object.keys(answers).length === lesson.questions.length
  const totalQ = lesson.questions.length
  const passed = score !== null && score >= Math.ceil(totalQ * 0.6)

  return (
    <div className="space-y-12">
      {/* SECTION 1: Theory */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent-400/20 text-accent-400 text-xs flex items-center justify-center font-bold">1</span>
          Theory
        </h2>
        <div
          className="prose prose-invert prose-sm max-w-none text-text-secondary [&_h3]:text-text-primary [&_h3]:font-semibold [&_h3]:text-base [&_strong]:text-text-primary [&_ul]:text-text-secondary [&_li]:marker:text-accent-400"
          dangerouslySetInnerHTML={{ __html: lesson.theoryHtml }}
        />
      </section>

      {/* SECTION 2: Examples */}
      {lesson.examples.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent-400/20 text-accent-400 text-xs flex items-center justify-center font-bold">2</span>
            See It In Action
          </h2>
          <div className="space-y-6">
            {lesson.examples.map((ex) => {
              const isAiImage = ex.mediaUrl && ex.mediaType === 'ai_image'
              const isAiVideo = ex.mediaUrl && ex.mediaType === 'ai_video'
              const src = `https://www.youtube.com/embed/${ex.youtubeId}${ex.startTime ? `?start=${ex.startTime}` : ''}`
              return (
                <div key={ex.id} className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
                  <div className={`${isAiImage ? 'aspect-square' : 'aspect-video'} w-full`}>
                    {isAiImage ? (
                      <img src={ex.mediaUrl!} alt={ex.title} className="w-full h-full object-cover" />
                    ) : isAiVideo ? (
                      <video src={ex.mediaUrl!} controls className="w-full h-full object-cover" />
                    ) : (
                      <iframe
                        src={src}
                        title={ex.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-text-primary text-sm mb-1">{ex.title}</p>
                    <p className="text-text-secondary text-sm">{ex.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* SECTION 3: Quiz */}
      {lesson.questions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent-400/20 text-accent-400 text-xs flex items-center justify-center font-bold">3</span>
            Test Your Understanding
          </h2>

          {submitted && score !== null && (
            <div className={`mb-6 p-4 rounded-xl border ${passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <p className="font-semibold text-base flex items-center gap-2">
                {passed
                  ? <><CheckCircle2 size={18} /> Lesson Complete!</>
                  : <><XCircle size={18} /> Not quite — review and try again</>
                }
              </p>
              <p className="text-sm mt-1 opacity-80">Score: {score}/{totalQ} correct</p>
            </div>
          )}

          <div className="space-y-6">
            {lesson.questions.map((q, qi) => {
              const selected = answers[qi]
              const isSubmitted = submitted
              return (
                <div key={q.id} className="bg-bg-surface border border-black/8 rounded-2xl p-5">
                  <p className="font-medium text-text-primary mb-4 text-sm">{qi + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const isSelected = selected === oi
                      const isCorrect = oi === q.correctIndex
                      let btnClass = 'border border-black/10 text-text-secondary hover:border-black/20 hover:text-text-primary'
                      if (isSelected && !isSubmitted) btnClass = 'border border-accent-400/60 text-accent-400 bg-accent-400/10'
                      if (isSubmitted && isCorrect) btnClass = 'border border-emerald-500/60 text-emerald-400 bg-emerald-500/10'
                      if (isSubmitted && isSelected && !isCorrect) btnClass = 'border border-red-500/60 text-red-400 bg-red-500/10'

                      return (
                        <button
                          key={oi}
                          disabled={isSubmitted}
                          onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-150 ${btnClass}`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {isSubmitted && (
                    <p className="mt-3 text-xs text-text-tertiary border-t border-black/8 pt-3">
                      {q.explanation}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {!submitted && (
            <button
              disabled={!allAnswered || saving}
              onClick={handleSubmit}
              className="mt-6 w-full py-3 rounded-xl bg-accent-400 text-text-inverse font-semibold text-sm hover:bg-accent-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Saving...' : 'Submit Answers'}
            </button>
          )}
        </section>
      )}
    </div>
  )
}
