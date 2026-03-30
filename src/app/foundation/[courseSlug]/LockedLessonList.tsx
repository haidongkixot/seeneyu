'use client'

import { useState } from 'react'
import { Lock, GraduationCap, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { UpgradePromptModal } from '@/components/UpgradePromptModal'

interface LockedLessonListProps {
  lessons: { id: string; title: string; order: number }[]
  completedIds: string[]
}

export function LockedLessonList({ lessons, completedIds }: LockedLessonListProps) {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const completedSet = new Set(completedIds)

  return (
    <>
      {/* Upgrade banner */}
      <div className="mt-6 mb-4 bg-gradient-to-r from-accent-400/10 to-accent-600/5 border border-accent-400/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-400/20 flex items-center justify-center shrink-0">
            <GraduationCap size={18} className="text-accent-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">
              Upgrade to Standard to continue your learning journey
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {lessons.length} more lesson{lessons.length !== 1 ? 's' : ''} available with Standard or Advanced plans
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 bg-accent-400 text-text-inverse rounded-xl px-4 py-2 text-xs font-semibold hover:bg-accent-500 transition-colors hidden sm:block"
          >
            View Plans
          </Link>
        </div>
      </div>

      {/* Locked lessons */}
      <div className="space-y-2">
        {lessons.map((lesson) => {
          const isDone = completedSet.has(lesson.id)
          return (
            <button
              key={lesson.id}
              onClick={() => setShowUpgrade(true)}
              className="w-full flex items-center gap-4 p-4 bg-bg-surface/60 border border-black/6 rounded-xl opacity-60 hover:opacity-80 transition-all duration-150 cursor-pointer group"
            >
              <Lock size={18} className="text-text-muted shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <span className="text-xs text-text-tertiary">Lesson {lesson.order}</span>
                <p className="text-text-tertiary font-medium">{lesson.title}</p>
              </div>
              <ChevronRight size={16} className="text-text-muted shrink-0" />
            </button>
          )
        })}
      </div>

      <UpgradePromptModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="locked_lesson"
      />
    </>
  )
}
