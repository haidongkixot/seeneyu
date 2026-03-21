'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SkillBadge } from '@/components/SkillBadge'
import { DifficultyPill } from '@/components/DifficultyPill'
import type { SkillCategory, Difficulty } from '@/lib/types'
import { X } from 'lucide-react'

const SKILLS: SkillCategory[] = [
  'eye-contact', 'open-posture', 'active-listening', 'vocal-pacing', 'confident-disagreement',
]
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']

interface LibraryFiltersProps {
  activeSkill?: SkillCategory
  activeDifficulty?: Difficulty
}

export function LibraryFilters({ activeSkill, activeDifficulty }: LibraryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(skill?: SkillCategory, difficulty?: Difficulty) {
    const params = new URLSearchParams()
    if (skill) params.set('skill', skill)
    if (difficulty) params.set('difficulty', difficulty)
    router.push(`/library${params.toString() ? `?${params}` : ''}`)
  }

  const hasFilters = !!activeSkill || !!activeDifficulty

  return (
    <div className="sticky top-14 z-raised bg-bg-base/90 backdrop-blur-md border-b border-white/6 pb-4 mb-8 -mx-4 px-4 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 pt-4">
        {/* Skill row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest w-16 shrink-0">Skill</span>
          <button
            onClick={() => navigate(undefined, activeDifficulty)}
            className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border transition-all duration-150 ${
              !activeSkill
                ? 'bg-accent-400 text-text-inverse border-accent-400'
                : 'bg-accent-400/10 text-accent-400 border-accent-400/30 hover:bg-accent-400/20'
            }`}
          >
            All
          </button>
          {SKILLS.map((skill) => (
            <SkillBadge
              key={skill}
              skill={skill}
              size="sm"
              interactive
              selected={activeSkill === skill}
              onClick={() => navigate(activeSkill === skill ? undefined : skill, activeDifficulty)}
            />
          ))}
        </div>

        {/* Difficulty row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest w-16 shrink-0">Level</span>
          <button
            onClick={() => navigate(activeSkill, undefined)}
            className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium border transition-all duration-150 ${
              !activeDifficulty
                ? 'bg-accent-400 text-text-inverse border-accent-400'
                : 'bg-accent-400/10 text-accent-400 border-accent-400/30 hover:bg-accent-400/20'
            }`}
          >
            All
          </button>
          {DIFFICULTIES.map((diff) => (
            <DifficultyPill
              key={diff}
              difficulty={diff}
              size="sm"
              interactive
              selected={activeDifficulty === diff}
              onClick={() => navigate(activeSkill, activeDifficulty === diff ? undefined : diff)}
            />
          ))}
          {hasFilters && (
            <button
              onClick={() => navigate()}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary transition-colors duration-150 ml-2"
            >
              <X size={12} />
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
