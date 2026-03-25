import Link from 'next/link'
import Image from 'next/image'
import { PlayCircle, ArrowRight } from 'lucide-react'
import { DifficultyPill } from '@/components/DifficultyPill'
import type { SkillTrackNextClip } from '@/lib/types'

interface LearningPathCardProps {
  clip: SkillTrackNextClip
}

export function LearningPathCard({ clip }: LearningPathCardProps) {
  return (
    <Link
      href={`/library/${clip.id}`}
      className="bg-bg-elevated border border-black/8 rounded-xl overflow-hidden hover:border-accent-400/20 hover:shadow-card-hover transition-all duration-200 group block"
    >
      <div className="aspect-video w-full bg-bg-inset relative overflow-hidden">
        {clip.thumbnailUrl ? (
          <Image
            src={clip.thumbnailUrl}
            alt={clip.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-tertiary">
            <PlayCircle size={32} />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2">
        <p className="text-xs font-medium text-text-primary leading-snug line-clamp-2">{clip.title}</p>
        <div className="flex items-center gap-1.5">
          <DifficultyPill difficulty={clip.difficulty} size="sm" />
        </div>
        <span className="text-xs font-semibold text-accent-400 flex items-center gap-1 group-hover:gap-1.5 transition-all duration-150">
          Practice Now <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  )
}
