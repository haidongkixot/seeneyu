import { Eye, Move, Ear, Mic, ShieldCheck, type LucideIcon } from 'lucide-react'

const SKILL_ICONS: Record<string, LucideIcon> = {
  'eye-contact':            Eye,
  'open-posture':           Move,
  'active-listening':       Ear,
  'vocal-pacing':           Mic,
  'confident-disagreement': ShieldCheck,
}

interface CharacterBannerProps {
  characterName: string
  actorName: string | null
  movieTitle: string
  skillCategory: string
}

export function CharacterBanner({ characterName, actorName, movieTitle, skillCategory }: CharacterBannerProps) {
  const Icon = SKILL_ICONS[skillCategory] ?? Mic
  const byline = [actorName, movieTitle].filter(Boolean).join(' · ')

  return (
    <div className="flex items-center gap-4 px-4 py-4 md:px-6 bg-bg-surface border border-white/8 rounded-2xl shadow-card animate-fade-in">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-400/10 text-accent-400 shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg md:text-xl font-semibold text-text-primary leading-tight truncate">{characterName}</p>
        {byline && <p className="text-sm text-text-secondary truncate">{byline}</p>}
      </div>
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-accent-400/10 border border-accent-400/30 text-accent-400 text-xs font-semibold uppercase tracking-wider shrink-0">
        NOW MIMICKING
      </div>
    </div>
  )
}
