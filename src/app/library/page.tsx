import { Suspense } from 'react'
import { NavBar } from '@/components/NavBar'
import { ClipCard, ClipCardSkeleton } from '@/components/ClipCard'
import { LibraryFilters } from './LibraryFilters'
import { prisma } from '@/lib/prisma'
import type { SkillCategory, Difficulty } from '@/lib/types'
import { SearchX } from 'lucide-react'
import Link from 'next/link'

interface LibraryPageProps {
  searchParams: Promise<{ skill?: string; difficulty?: string; film?: string; screenplay?: string }>
}

async function ClipGrid({ skill, difficulty, film, screenplay }: { skill?: string; difficulty?: string; film?: string; screenplay?: string }) {
  const clips = await prisma.clip.findMany({
    where: {
      isActive: true,
      ...(skill && { skillCategory: skill }),
      ...(difficulty && { difficulty }),
      ...(film && { movieTitle: film }),
      ...(screenplay === 'true' && { screenplaySource: { not: null } }),
    },
    orderBy: [{ skillCategory: 'asc' }, { difficultyScore: 'asc' }],
    select: {
      id: true,
      youtubeVideoId: true,
      movieTitle: true,
      year: true,
      characterName: true,
      sceneDescription: true,
      skillCategory: true,
      difficulty: true,
      startSec: true,
      endSec: true,
      screenplaySource: true,
    },
  }).catch(() => [] as never[])

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <SearchX size={64} className="text-text-tertiary" />
        <h3 className="text-xl font-semibold text-text-primary mt-4">No clips match your filters</h3>
        <p className="text-sm text-text-tertiary mt-2">Try removing some filters to see more clips</p>
        <Link
          href="/library"
          className="mt-6 border border-white/10 text-text-primary rounded-xl px-6 py-2.5 text-sm hover:border-white/20 hover:bg-bg-overlay transition-all duration-150"
        >
          Clear all filters
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={{ ...clip, skillCategory: clip.skillCategory as SkillCategory, difficulty: clip.difficulty as Difficulty }} />
      ))}
    </div>
  )
}

function ClipGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <ClipCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams
  const skill = params.skill as SkillCategory | undefined
  const difficulty = params.difficulty as Difficulty | undefined
  const film = params.film
  const screenplay = params.screenplay

  const totalCount = await prisma.clip.count({ where: { isActive: true } }).catch(() => 0)
  const filteredCount = await prisma.clip.count({
    where: {
      isActive: true,
      ...(skill && { skillCategory: skill }),
      ...(difficulty && { difficulty }),
      ...(film && { movieTitle: film }),
      ...(screenplay === 'true' && { screenplaySource: { not: null } }),
    },
  }).catch(() => 0)

  // Fetch distinct film titles for filter
  const filmRows = await prisma.clip.findMany({
    where: { isActive: true },
    select: { movieTitle: true },
    distinct: ['movieTitle'],
    orderBy: { movieTitle: 'asc' },
  }).catch(() => [] as { movieTitle: string }[])
  const filmOptions = filmRows.map(r => r.movieTitle)

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">The Library</h1>
            <p className="text-sm text-text-tertiary mt-1">
              {skill || difficulty || film || screenplay ? `${filteredCount} of ${totalCount}` : totalCount} clips available
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <LibraryFilters
          activeSkill={skill}
          activeDifficulty={difficulty}
          activeFilm={film}
          hasScreenplay={screenplay === 'true'}
          filmOptions={filmOptions}
        />

        {/* Grid */}
        <div className="mt-8">
          <Suspense fallback={<ClipGridSkeleton />}>
            <ClipGrid skill={skill} difficulty={difficulty} film={film} screenplay={screenplay} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
