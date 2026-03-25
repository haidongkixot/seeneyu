'use client'

import Link from 'next/link'
import { SkillBadge } from '@/components/SkillBadge'
import type { SkillCategory } from '@/lib/types'
import { Play } from 'lucide-react'

interface SubmissionCardProps {
  id: string
  type: 'foundation' | 'arcade'
  thumbnailUrl: string | null
  score: number | null
  skillCategory: string
  date: string
}

export function SubmissionCard({ id, type, thumbnailUrl, score, skillCategory, date }: SubmissionCardProps) {
  const scoreColor = score !== null
    ? score >= 80 ? 'text-success' : score >= 50 ? 'text-accent-400' : 'text-error'
    : 'text-text-tertiary'

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link
      href={`/feedback/${id}`}
      className="group bg-bg-surface border border-black/8 rounded-xl overflow-hidden hover:border-black/10 hover:shadow-card transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-bg-inset">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt="Recording thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={32} className="text-text-tertiary opacity-40" />
          </div>
        )}

        {/* Score badge */}
        {score !== null && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
            <span className={`text-sm font-bold ${scoreColor}`}>{score}</span>
            <span className="text-[10px] text-text-tertiary">/100</span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute bottom-2 left-2">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-pill ${
            type === 'arcade'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-accent-400/20 text-accent-400 border border-accent-400/30'
          }`}>
            {type}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <SkillBadge skill={skillCategory as SkillCategory} size="sm" />
          <span className="text-xs text-text-tertiary">{formattedDate}</span>
        </div>
      </div>
    </Link>
  )
}
