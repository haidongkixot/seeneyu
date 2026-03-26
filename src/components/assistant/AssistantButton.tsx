'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, X, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AssistantPanel } from './AssistantPanel'

interface AssistantButtonProps {
  context: string
}

export function AssistantButton({ context }: AssistantButtonProps) {
  const { status } = useSession()
  const [open, setOpen] = useState(false)
  const [showNudge, setShowNudge] = useState(false)
  const [nudgeText, setNudgeText] = useState({
    title: 'Need help with this lesson?',
    subtitle: 'Tap to ask Coach Ney',
  })
  const [nudgeFading, setNudgeFading] = useState(false)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nudgeDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nudgeShownRef = useRef(0)

  // Idle nudge: show after 60s, then 120s
  useEffect(() => {
    if (status !== 'authenticated' || open) {
      setShowNudge(false)
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
      if (nudgeDismissRef.current) clearTimeout(nudgeDismissRef.current)
      return
    }

    function scheduleNudge(delay: number, text: { title: string; subtitle: string }) {
      nudgeTimerRef.current = setTimeout(() => {
        if (nudgeShownRef.current >= 2) return
        setNudgeText(text)
        setShowNudge(true)
        setNudgeFading(false)
        nudgeShownRef.current += 1

        // Auto-dismiss after 8s
        nudgeDismissRef.current = setTimeout(() => {
          setNudgeFading(true)
          setTimeout(() => setShowNudge(false), 500)
        }, 8000)
      }, delay)
    }

    scheduleNudge(60000, {
      title: 'Need help with this lesson?',
      subtitle: 'Tap to ask Coach Ney',
    })

    const secondTimer = setTimeout(() => {
      scheduleNudge(0, {
        title: "I noticed you've been here a while. Want some tips?",
        subtitle: 'Tap to ask Coach Ney',
      })
    }, 120000)

    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
      if (nudgeDismissRef.current) clearTimeout(nudgeDismissRef.current)
      clearTimeout(secondTimer)
    }
  }, [open, status])

  // Don't render for unauthenticated users
  if (status !== 'authenticated') return null

  function dismissNudge(e: React.MouseEvent) {
    e.stopPropagation()
    setNudgeFading(true)
    setTimeout(() => setShowNudge(false), 500)
  }

  function handleNudgeClick() {
    setShowNudge(false)
    setOpen(true)
  }

  return (
    <>
      {/* Idle nudge toast */}
      {showNudge && (
        <div
          onClick={handleNudgeClick}
          className={cn(
            'fixed bottom-40 right-4 z-toast md:bottom-28 md:right-8 w-72 md:w-80',
            'bg-bg-elevated/95 backdrop-blur-sm border border-accent-400/20 rounded-2xl',
            'px-4 py-3 shadow-glow-sm cursor-pointer',
            'hover:border-accent-400/40 hover:shadow-glow transition-all duration-200',
            nudgeFading ? 'opacity-0 transition-opacity duration-500' : 'animate-slide-up'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-400/20 flex items-center justify-center">
              <GraduationCap size={16} className="text-accent-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                {nudgeText.title}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {nudgeText.subtitle}
              </p>
            </div>
            <button
              onClick={dismissNudge}
              className="absolute top-2 right-2 p-1 text-text-tertiary hover:text-text-secondary rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Floating button — hidden on mobile when panel is open (panel has its own close) */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-[5.5rem] right-4 z-toast md:bottom-8 md:right-8',
          'w-14 h-14 rounded-full flex items-center justify-center',
          'transition-all duration-200',
          open
            ? 'hidden md:flex bg-bg-elevated border border-black/10 text-text-secondary shadow-lg'
            : 'bg-accent-400 text-text-inverse shadow-glow hover:bg-accent-500 hover:shadow-[0_0_30px_rgba(251,191,36,0.35),0_0_80px_rgba(251,191,36,0.15)] hover:scale-105 active:scale-95'
        )}
        aria-label={open ? 'Close assistant' : 'Open Coach Ney assistant'}
      >
        {/* Glow ring (only when closed) */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-accent-400/15 animate-glow-pulse scale-110 -z-10" />
        )}
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Panel */}
      <AssistantPanel context={context} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
