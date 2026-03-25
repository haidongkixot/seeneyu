import Link from 'next/link'
import { Eye, Move, Ear, Mic, ShieldCheck, Trophy } from 'lucide-react'
import { SkillProgressBar } from '@/components/SkillProgressBar'
import { LearningPathCard } from '@/components/LearningPathCard'
import { SKILL_LABELS } from '@/lib/types'
import type { SkillTrack, SkillCategory, SkillLevel } from '@/lib/types'

const SKILL_ICONS: Record<SkillCategory, React.ReactNode> = {
  'eye-contact':            <Eye size={16} />,
  'open-posture':           <Move size={16} />,
  'active-listening':       <Ear size={16} />,
  'vocal-pacing':           <Mic size={16} />,
  'confident-disagreement': <ShieldCheck size={16} />,
}

const LEVEL_BADGE: Record<SkillLevel, { label: string; className: string }> = {
  beginner:     { label: 'Developing',  className: 'bg-success/10 text-success border border-success/30' },
  intermediate: { label: 'Practising',  className: 'bg-warning/10 text-warning border border-warning/30' },
  advanced:     { label: 'Fluent',      className: 'bg-accent-400/10 text-accent-400 border border-accent-400/30' },
}

interface SkillTrackColumnProps {
  track: SkillTrack
}

export function SkillTrackColumn({ track }: SkillTrackColumnProps) {
  const badge = LEVEL_BADGE[track.currentLevel]
  const isComplete = track.clipsCompleted >= track.clipsTotal && track.currentLevel === 'advanced'

  return (
    <div className="bg-bg-surface border border-black/8 rounded-2xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-black/5 border border-black/8 flex items-center justify-center text-text-secondary">
          {SKILL_ICONS[track.skillCategory]}
        </div>
        <span className="text-sm font-semibold text-text-primary">{SKILL_LABELS[track.skillCategory]}</span>
      </div>

      <div className="border-t border-black/8" />

      {/* Level badge */}
      <div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-semibold uppercase tracking-wider ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Progress bar */}
      <SkillProgressBar
        completed={track.clipsCompleted}
        total={track.clipsTotal}
        currentLevel={track.currentLevel}
      />

      <div className="border-t border-black/8" />

      {/* Next up */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Next Up</span>
        {isComplete ? (
          <div className="flex flex-col items-start gap-2">
            <span className="text-accent-400 font-semibold text-sm flex items-center gap-2">
              <Trophy size={14} /> Level Complete!
            </span>
            <Link
              href={`/library?skill=${track.skillCategory}`}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Explore Advanced Clips →
            </Link>
          </div>
        ) : track.nextClip ? (
          <LearningPathCard clip={track.nextClip} />
        ) : (
          <p className="text-xs text-text-tertiary">No clips available yet.</p>
        )}
      </div>
    </div>
  )
}
