'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight } from 'lucide-react'
import { CoachNeyAvatar } from '@/components/gamification/CoachNeyAvatar'

interface Suggestion {
  id: string
  text: string
  linkUrl: string
  linkLabel?: string
}

export function ProactiveSuggestionBanner() {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/proactive-suggestion')
      .then((r) => {
        if (!r.ok) throw new Error('No suggestion')
        return r.json()
      })
      .then((data: any) => {
        // API returns { suggestion: "text" } — normalise to Suggestion shape
        const text = data.text ?? data.suggestion
        if (!text) return
        setSuggestion({
          id: data.id ?? 'proactive',
          text,
          linkUrl: data.linkUrl ?? '/dashboard',
          linkLabel: data.linkLabel,
        })
        // Trigger slide-in after a brief delay for mount
        requestAnimationFrame(() => setVisible(true))
      })
      .catch(() => {
        // Not authenticated or no suggestion available
      })
  }, [])

  if (!suggestion || dismissed) return null

  return (
    <div
      className={`transition-all duration-300 ease-smooth ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-3'
      }`}
    >
      <div className="bg-bg-surface border border-accent-400/30 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <CoachNeyAvatar size="sm" />

          {/* Speech bubble */}
          <div className="flex-1 min-w-0">
            <div className="relative bg-accent-400/10 rounded-xl px-4 py-3">
              {/* Speech tail */}
              <div className="absolute top-3 -left-1.5 w-3 h-3 bg-accent-400/10 rotate-45" />
              <p className="relative z-10 text-sm text-text-primary leading-relaxed">
                <span className="font-semibold text-accent-600">Coach Ney:</span>{' '}
                {suggestion.text}
              </p>
            </div>

            <Link
              href={suggestion.linkUrl}
              className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 bg-accent-400 text-text-inverse text-sm font-semibold rounded-xl hover:bg-accent-500 transition-colors"
            >
              {suggestion.linkLabel || "Let's go!"}
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-overlay transition-colors"
            aria-label="Dismiss suggestion"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
