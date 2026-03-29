'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Gamepad2,
  Film,
  Puzzle,
  Check,
  ChevronRight,
  RefreshCw,
  Loader2,
  Calendar,
} from 'lucide-react'

interface PlanActivity {
  id: string
  type: 'lesson' | 'arcade' | 'game' | 'clip'
  title: string
  reason: string
  linkUrl: string
  completed: boolean
}

interface LearningPlan {
  date: string
  activities: PlanActivity[]
  completedCount: number
  totalCount: number
}

const typeIcons: Record<PlanActivity['type'], typeof BookOpen> = {
  lesson: BookOpen,
  arcade: Gamepad2,
  game: Puzzle,
  clip: Film,
}

const typeColors: Record<PlanActivity['type'], string> = {
  lesson: 'bg-violet-100 text-violet-600',
  arcade: 'bg-sky-100 text-sky-600',
  game: 'bg-emerald-100 text-emerald-600',
  clip: 'bg-orange-100 text-orange-600',
}

export function LearningPlanCard() {
  const [plan, setPlan] = useState<LearningPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPlan = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const r = await fetch('/api/learning-plan')
      if (!r.ok) throw new Error('Failed to fetch plan')
      const data = await r.json()
      setPlan(data)
    } catch {
      // Not authenticated or endpoint missing
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPlan()
  }, [fetchPlan])

  if (loading) {
    return (
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    )
  }

  if (!plan || plan.activities.length === 0) {
    return (
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-accent-400" />
          <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Plan</h2>
        </div>
        <p className="text-sm text-text-secondary">
          No plan yet — start practicing to get personalized recommendations!
        </p>
      </div>
    )
  }

  const progress =
    plan.totalCount > 0 ? (plan.completedCount / plan.totalCount) * 100 : 0
  const displayActivities = plan.activities.slice(0, 3)
  const hasMore = plan.activities.length > 3

  // Find the next uncompleted activity
  const nextActivityId = plan.activities.find((a) => !a.completed)?.id

  return (
    <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-accent-400" />
          <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Plan</h2>
          <span className="text-xs text-text-tertiary">{plan.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">
            {plan.completedCount}/{plan.totalCount}
          </span>
          <button
            onClick={() => fetchPlan(true)}
            disabled={refreshing}
            className="p-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-overlay transition-colors disabled:opacity-50"
            aria-label="Refresh plan"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-bg-overlay rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-accent-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        {displayActivities.map((activity) => {
          const Icon = typeIcons[activity.type]
          const colorClass = typeColors[activity.type]
          const isNext = activity.id === nextActivityId && !activity.completed

          return (
            <Link
              key={activity.id}
              href={activity.linkUrl}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isNext
                  ? 'bg-accent-400/8 border border-accent-400/25 hover:bg-accent-400/12'
                  : 'hover:bg-bg-overlay'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${
                  activity.completed ? 'bg-success-dim text-success' : colorClass
                }`}
              >
                {activity.completed ? <Check size={16} /> : <Icon size={16} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium leading-tight ${
                    activity.completed
                      ? 'text-text-tertiary line-through'
                      : 'text-text-primary'
                  }`}
                >
                  {activity.title}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5 truncate">
                  {activity.reason}
                </p>
              </div>

              {/* Arrow / check */}
              {activity.completed ? (
                <Check size={14} className="text-success flex-shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-text-tertiary flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </div>

      {/* View All */}
      {hasMore && (
        <Link
          href="/learning-plan"
          className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-black/6 text-sm text-accent-400 hover:text-accent-500 font-medium transition-colors"
        >
          View All
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  )
}
