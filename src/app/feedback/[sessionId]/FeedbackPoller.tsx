'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles } from 'lucide-react'

interface FeedbackPollerProps {
  sessionId: string
}

export function FeedbackPoller({ sessionId }: FeedbackPollerProps) {
  const [dots, setDots] = useState('.')

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

  useEffect(() => {
    const interval = setInterval(async () => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
      await poll()
    }, 2000)
    return () => clearInterval(interval)
  }, [poll])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6" aria-live="polite">
      <div className="w-16 h-16 bg-accent-400/10 rounded-full flex items-center justify-center">
        <Sparkles size={32} className="text-accent-400 animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-text-primary text-lg font-semibold">Analyzing your recording{dots}</p>
        <p className="text-text-secondary text-sm mt-2">GPT-4o Vision is reviewing your body language</p>
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
    </div>
  )
}
