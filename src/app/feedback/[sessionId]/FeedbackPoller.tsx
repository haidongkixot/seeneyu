'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles } from 'lucide-react'

const TIPS = [
  'Maintaining eye contact signals confidence and builds trust.',
  'Open posture communicates approachability and openness.',
  'Nodding at key moments shows active engagement.',
  'Varied vocal pace keeps listeners engaged and emphasizes key points.',
  'A well-timed pause is more powerful than filling silence.',
  'Leaning slightly forward signals genuine interest.',
  'Mirroring the other person\'s posture builds rapport.',
  'Stillness during disagreement projects calm authority.',
]

interface FeedbackPollerProps {
  sessionId: string
}

export function FeedbackPoller({ sessionId }: FeedbackPollerProps) {
  const [dots, setDots] = useState('.')
  const [tipIndex, setTipIndex] = useState(0)

  const poll = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}/feedback`)
    if (!res.ok) return false
    const data = await res.json()
    if (data.status === 'complete' || data.status === 'failed') {
      window.location.reload()
      return true
    }
    return false
  }, [sessionId])

  // Trigger the feedback job on mount — include MediaPipe analysis if available
  useEffect(() => {
    const body: Record<string, unknown> = {}
    try {
      const stored = sessionStorage.getItem(`analysis_${sessionId}`)
      if (stored) {
        body.analysisData = JSON.parse(stored)
        sessionStorage.removeItem(`analysis_${sessionId}`)
      }
    } catch { /* ignore parse errors */ }

    fetch(`/api/sessions/${sessionId}/feedback`, {
      method: 'POST',
      headers: body.analysisData ? { 'Content-Type': 'application/json' } : {},
      body: body.analysisData ? JSON.stringify(body) : undefined,
    }).catch(console.error)
  }, [sessionId])

  useEffect(() => {
    const interval = setInterval(async () => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
      await poll()
    }, 2000)
    return () => clearInterval(interval)
  }, [poll])

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex(i => (i + 1) % TIPS.length)
    }, 3000)
    return () => clearInterval(tipInterval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6" aria-live="polite">
      <div className="w-16 h-16 bg-accent-400/10 rounded-full flex items-center justify-center">
        <Sparkles size={32} className="text-accent-400 animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-text-primary text-lg font-semibold">Analyzing your recording{dots}</p>
        <p className="text-text-secondary text-sm mt-2">Analyzing your body language and expression</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-accent-400/40"
            style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
      <div className="max-w-xs text-center bg-bg-surface border border-black/8 rounded-xl px-5 py-3 transition-all duration-500">
        <p className="text-text-tertiary text-xs font-semibold uppercase tracking-widest mb-1">Coaching Tip</p>
        <p className="text-text-secondary text-sm leading-relaxed">{TIPS[tipIndex]}</p>
      </div>
    </div>
  )
}
