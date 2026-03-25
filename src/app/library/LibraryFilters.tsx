'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SkillBadge } from '@/components/SkillBadge'
import { DifficultyPill } from '@/components/DifficultyPill'
import type { SkillCategory, Difficulty } from '@/lib/types'
import { X, SlidersHorizontal, ChevronDown, Search } from 'lucide-react'

const FILM_VISIBLE_COUNT = 8
const LS_KEY = 'library-filters-open'

const SKILLS: SkillCategory[] = [
  'eye-contact', 'open-posture', 'active-listening', 'vocal-pacing', 'confident-disagreement',
]
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']

interface LibraryFiltersProps {
  activeSkill?: SkillCategory
  activeDifficulty?: Difficulty
  activeFilm?: string
  hasScreenplay?: boolean
  filmOptions: string[]
  clipCount: number
  initialSearch?: string
}

export function LibraryFilters({ activeSkill, activeDifficulty, activeFilm, hasScreenplay, filmOptions, clipCount, initialSearch }: LibraryFiltersProps) {
  const router = useRouter()
  const [filmExpanded, setFilmExpanded] = useState(false)
  const [panelOpen, setPanelOpen] = useState<boolean | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialSearch ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mount: expand on desktop or restore from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (stored !== null) {
      setPanelOpen(stored === 'true')
    } else {
      setPanelOpen(window.innerWidth >= 768)
    }
  }, [])

  // Debounced search → update URL
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (activeSkill) params.set('skill', activeSkill)
      if (activeDifficulty) params.set('difficulty', activeDifficulty)
      if (activeFilm) params.set('film', activeFilm)
      if (hasScreenplay) params.set('screenplay', 'true')
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      router.push(`/library${params.toString() ? `?${params}` : ''}`)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  function togglePanel() {
    const next = !panelOpen
    setPanelOpen(next)
    localStorage.setItem(LS_KEY, String(next))
  }

  function navigate(skill?: SkillCategory, difficulty?: Difficulty, film?: string, screenplay?: boolean) {
    const params = new URLSearchParams()
    if (skill) params.set('skill', skill)
    if (difficulty) params.set('difficulty', difficulty)
    if (film) params.set('film', film)
    if (screenplay) params.set('screenplay', 'true')
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    router.push(`/library${params.toString() ? `?${params}` : ''}`)
  }

  function clearSearch() {
    setSearchQuery('')
    const params = new URLSearchParams()
    if (activeSkill) params.set('skill', activeSkill)
    if (activeDifficulty) params.set('difficulty', activeDifficulty)
    if (activeFilm) params.set('film', activeFilm)
    if (hasScreenplay) params.set('screenplay', 'true')
    router.push(`/library${params.toString() ? `?${params}` : ''}`)
  }

  function clearAll() {
    setSearchQuery('')
    router.push('/library')
  }

  const hasFilters = !!activeSkill || !!activeDifficulty || !!activeFilm || !!hasScreenplay
  const activeFilterCount = [activeSkill, activeDifficulty, activeFilm, hasScreenplay ? 'yes' : undefined].filter(Boolean).length

  return (
    <div className="sticky top-14 z-raised bg-bg-base/90 backdrop-blur-md border-b border-black/6 pb-4 mb-8 -mx-4 px-4 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 pt-4">

        {/* Search bar — always visible */}
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-inset border border-black/10 rounded-xl pl-9 pr-24 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-400/60 focus:shadow-glow-sm focus:outline-none transition-all duration-150"
            placeholder="Search clips, films, characters…"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-xs text-text-tertiary tabular-nums whitespace-nowrap">
              {clipCount} clips
            </span>
            {searchQuery && (
              <button onClick={clearSearch} className="text-text-tertiary hover:text-text-primary transition-colors p-0.5">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter toggle row */}
        <div className="flex items-center justify-between">
          <button
            onClick={togglePanel}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-pill bg-accent-400 text-text-inverse text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={16}
              className={`text-text-tertiary transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {(hasFilters || searchQuery) && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary transition-colors duration-150"
            >
              <X size={12} />
              Clear all
            </button>
          )}
        </div>

        {/* Active filter chips — shown when panel is collapsed */}
        {!panelOpen && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeSkill && (
              <ActiveFilterChip label={activeSkill} onRemove={() => navigate(undefined, activeDifficulty, activeFilm, hasScreenplay)} />
            )}
            {activeDifficulty && (
              <ActiveFilterChip label={activeDifficulty} onRemove={() => navigate(activeSkill, undefined, activeFilm, hasScreenplay)} />
            )}
            {activeFilm && (
              <ActiveFilterChip label={activeFilm} onRemove={() => navigate(activeSkill, activeDifficulty, undefined, hasScreenplay)} />
            )}
            {hasScreenplay && (
              <ActiveFilterChip label="Has Screenplay" onRemove={() => navigate(activeSkill, activeDifficulty, activeFilm, false)} />
            )}
          </div>
        )}

        {/* Collapsible filter panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            panelOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-3 pt-1">
            {/* Skill row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest w-16 shrink-0">Skill</span>
              <button
                onClick={() => navigate(undefined, activeDifficulty, activeFilm, hasScreenplay)}
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
                  onClick={() => navigate(activeSkill === skill ? undefined : skill, activeDifficulty, activeFilm, hasScreenplay)}
                />
              ))}
            </div>

            {/* Difficulty row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest w-16 shrink-0">Level</span>
              <button
                onClick={() => navigate(activeSkill, undefined, activeFilm, hasScreenplay)}
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
                  onClick={() => navigate(activeSkill, activeDifficulty === diff ? undefined : diff, activeFilm, hasScreenplay)}
                />
              ))}
            </div>

            {/* Film row */}
            {filmOptions.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest w-16 shrink-0 pt-1">Film</span>

                {/* Desktop: collapsible pills */}
                <div className="hidden sm:flex items-center gap-2 flex-wrap flex-1">
                  <button
                    onClick={() => navigate(activeSkill, activeDifficulty, undefined, hasScreenplay)}
                    className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium border transition-all duration-150 ${
                      !activeFilm
                        ? 'bg-accent-400 text-text-inverse border-accent-400'
                        : 'bg-accent-400/10 text-accent-400 border-accent-400/30 hover:bg-accent-400/20'
                    }`}
                  >
                    All Films
                  </button>
                  {(filmExpanded ? filmOptions : filmOptions.slice(0, FILM_VISIBLE_COUNT)).map((film) => (
                    <button
                      key={film}
                      onClick={() => navigate(activeSkill, activeDifficulty, activeFilm === film ? undefined : film, hasScreenplay)}
                      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium border transition-all duration-150 ${
                        activeFilm === film
                          ? 'bg-accent-400 text-text-inverse border-accent-400'
                          : 'bg-accent-400/10 text-accent-400 border-accent-400/30 hover:bg-accent-400/20'
                      }`}
                    >
                      {film}
                    </button>
                  ))}
                  {filmOptions.length > FILM_VISIBLE_COUNT && (
                    <button
                      onClick={() => setFilmExpanded(!filmExpanded)}
                      className="inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium border border-accent-400/30 text-accent-400 bg-transparent hover:bg-accent-400/10 transition-all duration-150"
                    >
                      {filmExpanded ? 'Show fewer ▴' : `+ ${filmOptions.length - FILM_VISIBLE_COUNT} more ▾`}
                    </button>
                  )}
                </div>

                {/* Mobile: native select */}
                <select
                  className="sm:hidden flex-1 bg-bg-inset border border-black/10 rounded-xl px-3 py-2 text-text-primary text-xs"
                  value={activeFilm || ''}
                  onChange={(e) => navigate(activeSkill, activeDifficulty, e.target.value || undefined, hasScreenplay)}
                >
                  <option value="">All Films</option>
                  {filmOptions.map((film) => (
                    <option key={film} value={film}>{film}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Screenplay row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest w-16 shrink-0">Extra</span>
              <button
                onClick={() => navigate(activeSkill, activeDifficulty, activeFilm, !hasScreenplay)}
                className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium border transition-all duration-150 ${
                  hasScreenplay
                    ? 'bg-accent-400 text-text-inverse border-accent-400'
                    : 'bg-accent-400/10 text-accent-400 border-accent-400/30 hover:bg-accent-400/20'
                }`}
              >
                📄 Has Screenplay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium bg-accent-400/15 text-accent-400 border border-accent-400/30">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-accent-300">
        <X size={10} />
      </button>
    </span>
  )
}
