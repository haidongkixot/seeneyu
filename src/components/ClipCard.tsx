'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { SkillBadge } from './SkillBadge'
import { DifficultyPill } from './DifficultyPill'
import type { Clip } from '@/lib/types'

interface ClipCardProps {
  clip: Pick<Clip,
    'id' | 'youtubeVideoId' | 'movieTitle' | 'year' | 'characterName' |
    'sceneDescription' | 'skillCategory' | 'difficulty' | 'startSec' | 'endSec'
  >
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ClipCard({ clip }: ClipCardProps) {
  const duration = clip.endSec - clip.startSec
  const thumbnailUrl = `https://img.youtube.com/vi/${clip.youtubeVideoId}/maxresdefault.jpg`
  const fallbackUrl  = `https://img.youtube.com/vi/${clip.youtubeVideoId}/hqdefault.jpg`

  return (
    <Link
      href={`/library/${clip.id}`}
      className="group relative flex flex-col bg-bg-surface border border-white/8 rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:border-accent-400/20 transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60"
      role="article"
      aria-label={`${clip.skillCategory} clip: ${clip.sceneDescription} from ${clip.movieTitle}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-bg-inset">
        <Image
          src={thumbnailUrl}
          alt={`${clip.movieTitle} — ${clip.sceneDescription}`}
          fill
          sizes="(max-width: 375px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackUrl }}
          loading="lazy"
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-accent-400 flex items-center justify-center shadow-glow-sm">
            <Play size={20} fill="currentColor" className="text-text-inverse ml-0.5" />
          </div>
        </div>
        {/* Badges overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-none">
          <SkillBadge skill={clip.skillCategory} size="sm" />
          <div className="flex items-center gap-1.5">
            <span className="bg-black/60 text-white text-xs font-mono px-1.5 py-0.5 rounded">
              {formatDuration(duration)}
            </span>
            <DifficultyPill difficulty={clip.difficulty} size="sm" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex flex-col gap-1">
          <p className="text-text-primary text-sm font-semibold leading-snug line-clamp-2">
            {clip.sceneDescription}
          </p>
          <p className="text-text-secondary text-xs">
            {clip.characterName ? `${clip.characterName} · ` : ''}
            {clip.movieTitle}
            {clip.year ? ` (${clip.year})` : ''}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/6 mt-auto">
          <span className="flex items-center gap-1 text-text-tertiary text-xs">
            <Play size={12} strokeWidth={2} />
            <span>Watch &amp; Mimic</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export function ClipCardSkeleton() {
  return (
    <div className="flex flex-col bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 w-3/4 skeleton rounded-md" />
        <div className="h-3 w-1/2 skeleton rounded-md" />
        <div className="h-px bg-white/6 mt-1" />
        <div className="h-3 w-16 skeleton rounded-md" />
      </div>
    </div>
  )
}
