'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

interface UpgradePromptModalProps {
  open: boolean
  onClose: () => void
  reason: string
  title?: string
  message?: string
}

interface PromptData {
  title: string
  body: string
  ctaText: string
  coachMessage: string
}

export function UpgradePromptModal({ open, onClose, reason, title, message }: UpgradePromptModalProps) {
  const [prompt, setPrompt] = useState<PromptData | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      // Trigger fade-in after mount
      requestAnimationFrame(() => setVisible(true))

      // Fetch contextual message if not provided
      if (!title || !message) {
        fetch(`/api/upgrade-prompt?reason=${encodeURIComponent(reason)}`)
          .then(r => r.json())
          .then(data => {
            if (!data.error) setPrompt(data)
          })
          .catch(() => {})
      }
    } else {
      setVisible(false)
    }
  }, [open, reason, title, message])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  if (!open) return null

  const displayTitle = title || prompt?.title || 'Unlock Your Full Potential'
  const displayMessage = message || prompt?.coachMessage || prompt?.body || 'Upgrade to Standard for full access to lessons, clips, discussions, and more.'
  const ctaText = prompt?.ctaText || 'Start 7-Day Free Trial'

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center px-4',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card */}
      <div
        className={cn(
          'relative w-full max-w-md bg-bg-surface border border-black/10 rounded-2xl shadow-xl',
          'transition-all duration-200',
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        )}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-6 text-center">
          {/* Coach Ney avatar */}
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-accent-400/30 to-accent-600/20 border-2 border-accent-400/40 flex items-center justify-center mb-4">
            <GraduationCap size={24} className="text-accent-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {displayTitle}
          </h2>

          {/* Coach message */}
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            {displayMessage}
          </p>

          {/* CTA button */}
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center w-full bg-accent-400 text-text-inverse rounded-xl px-6 py-3 text-sm font-semibold hover:bg-accent-500 transition-all duration-150 shadow-glow-sm"
          >
            {ctaText}
          </Link>

          {/* View Plans link */}
          <Link
            href="/pricing"
            className="inline-block mt-3 text-sm text-accent-400 hover:text-accent-300 font-medium transition-colors"
          >
            View Plans
          </Link>

          {/* Dismiss link */}
          <div className="mt-2">
            <button
              onClick={handleClose}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
