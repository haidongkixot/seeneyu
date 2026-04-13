'use client'

import { useState } from 'react'
import Link from 'next/link'
// Using native img instead of next/image to avoid hydration issues
import { Play, Lock } from 'lucide-react'
import { SkillBadge } from './SkillBadge'
import { DifficultyPill } from './DifficultyPill'
import { UpgradePromptModal } from './UpgradePromptModal'
import type { Clip } from '@/lib/types'

interface ClipCardProps {
  clip: Pick<Clip,
    'id' | 'youtubeVideoId' | 'movieTitle' | 'year' | 'characterName' |
    'sceneDescription' | 'skillCategory' | 'difficulty' | 'startSec' | 'endSec'
  > & { screenplaySource?: string | null; mediaType?: string | null; mediaUrl?: string | null }
  locked?: boolean
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ClipCard({ clip, locked = false }: ClipCardProps) {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const duration = clip.endSec - clip.startSec
  const isAiImage = clip.mediaType === 'ai_image'
  const isAiVideo = clip.mediaType === 'ai_video'
  const isAi = isAiImage || isAiVideo
  const hasRealYoutubeId = !!clip.youtubeVideoId && !clip.youtubeVideoId.startsWith('ai-')
  const thumbnailUrl = isAiImage && clip.mediaUrl
    ? clip.mediaUrl
    : hasRealYoutubeId
    ? `https://img.youtube.com/vi/${clip.youtubeVideoId}/maxresdefault.jpg`
    : null
  const fallbackUrl = hasRealYoutubeId
    ? `https://img.youtube.com/vi/${clip.youtubeVideoId}/hqdefault.jpg`
    : null

  const cardContent = (
    <>
      {/* Thumbnail */}
      <div className={`relative ${isAiImage ? 'aspect-square' : 'aspect-video'} overflow-hidden bg-bg-inset`}>
        {isAiVideo && clip.mediaUrl ? (
          /* AI video: use <video> element as thumbnail with poster frame */
          <video
            src={clip.mediaUrl}
            muted
            playsInline
            preload="metadata"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${locked ? 'blur-[6px] scale-105' : ''}`}
            onLoadedData={(e) => {
              // Seek to 1s to get a meaningful poster frame instead of black
              const v = e.target as HTMLVideoElement
              if (v.duration > 1) v.currentTime = 1
            }}
          />
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${clip.movieTitle} — ${clip.sceneDescription}`}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${locked ? 'blur-[6px] scale-105' : ''}`}
            onError={(e) => { if (fallbackUrl) (e.target as HTMLImageElement).src = fallbackUrl }}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-tertiary text-xs">
            No thumbnail
          </div>
        )}
        {isAi && !locked && (
          <div className="absolute top-2 left-2">
            <span className="text-[9px] font-medium text-purple-300 bg-purple-500/30 backdrop-blur-sm border border-purple-400/20 rounded-full px-1.5 py-0.5">
              AI Generated
            </span>
          </div>
        )}
        {/* Lock overlay for locked clips */}
        {locked && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Lock size={18} className="text-white/80" />
            </div>
          </div>
        )}
        {/* Play button overlay (only for video clips, not locked) */}
        {!isAiImage && !locked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-accent-400/90 flex items-center justify-center">
              <Play size={18} fill="currentColor" className="text-text-inverse ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Body — compact */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <SkillBadge skill={clip.skillCategory} size="sm" />
          <DifficultyPill difficulty={clip.difficulty} size="sm" />
          {clip.screenplaySource && !locked && (
            <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-1.5 py-0.5">
              📄
            </span>
          )}
          {locked && (
            <span className="text-[10px] font-medium text-text-tertiary bg-black/5 border border-black/8 rounded-full px-1.5 py-0.5">
              Locked
            </span>
          )}
        </div>
        <h3 className={`text-sm font-semibold line-clamp-2 leading-snug mb-1 ${locked ? 'text-text-tertiary' : 'text-text-primary'}`}>
          {clip.sceneDescription}
        </h3>
        <p className="text-xs text-text-tertiary mt-auto">
          {clip.movieTitle} · {formatDuration(duration)}
        </p>
      </div>
    </>
  )

  if (locked) {
    return (
      <>
        <button
          onClick={() => setShowUpgrade(true)}
          className="group relative flex flex-col bg-bg-surface border border-black/8 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 text-left cursor-pointer"
          role="article"
          aria-label={`Locked clip: ${clip.sceneDescription} from ${clip.movieTitle}`}
        >
          {cardContent}
        </button>
        <UpgradePromptModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          reason="locked_clip"
        />
      </>
    )
  }

  return (
    <Link
      href={`/library/${clip.id}`}
      className="group relative flex flex-col bg-bg-surface border border-black/8 rounded-xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-accent-400/20 transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60"
      role="article"
      aria-label={`${clip.skillCategory} clip: ${clip.sceneDescription} from ${clip.movieTitle}`}
    >
      {cardContent}
    </Link>
  )
}

export function ClipCardSkeleton() {
  return (
    <div className="flex flex-col bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 w-3/4 skeleton rounded-md" />
        <div className="h-3 w-1/2 skeleton rounded-md" />
        <div className="h-px bg-black/[0.04] mt-1" />
        <div className="h-3 w-16 skeleton rounded-md" />
      </div>
    </div>
  )
}
