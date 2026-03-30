import { Suspense } from 'react'
import { ClipCard, ClipCardSkeleton } from '@/components/ClipCard'
import { LibraryFilters } from './LibraryFilters'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllowedDifficulties } from '@/lib/access-control'
import type { SkillCategory, Difficulty } from '@/lib/types'
import { SearchX, Lock } from 'lucide-react'
import Link from 'next/link'

interface LibraryPageProps {
  searchParams: { skill?: string; difficulty?: string; film?: string; screenplay?: string; search?: string }
}

function buildWhere(skill?: string, difficulty?: string, film?: string, screenplay?: string, search?: string) {
  const where: any = { isActive: true }
  if (skill) where.skillCategory = skill
  if (difficulty) where.difficulty = difficulty
  if (film) where.movieTitle = film
  if (screenplay === 'true') where.screenplaySource = { not: null }
  if (search) {
    where.OR = [
      { sceneDescription: { contains: search, mode: 'insensitive' } },
      { movieTitle: { contains: search, mode: 'insensitive' } },
      { characterName: { contains: search, mode: 'insensitive' } },
      { skillCategory: { contains: search, mode: 'insensitive' } },
    ]
  }
  return where
}

async function ClipGrid({ skill, difficulty, film, screenplay, search, allowedDifficulties }: { skill?: string; difficulty?: string; film?: string; screenplay?: string; search?: string; allowedDifficulties: string[] }) {
  const clips = await prisma.clip.findMany({
    where: buildWhere(skill, difficulty, film, screenplay, search),
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
  })

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <SearchX size={64} className="text-text-tertiary" />
        <h3 className="text-xl font-semibold text-text-primary mt-4">No clips match your filters</h3>
        <p className="text-sm text-text-tertiary mt-2">Try removing some filters to see more clips</p>
        <Link
          href="/library"
          className="mt-6 border border-black/10 text-text-primary rounded-xl px-6 py-2.5 text-sm hover:border-black/20 hover:bg-bg-overlay transition-all duration-150"
        >
          Clear all filters
        </Link>
      </div>
    )
  }

  const unlockedCount = clips.filter(c => allowedDifficulties.includes(c.difficulty)).length
  const lockedCount = clips.length - unlockedCount

  return (
    <>
      {lockedCount > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-accent-400/10 to-transparent border border-accent-400/15 rounded-xl px-4 py-3">
          <Lock size={14} className="text-accent-400 shrink-0" />
          <p className="text-sm text-text-secondary">
            Showing <span className="font-semibold text-text-primary">{unlockedCount}</span> of{' '}
            <span className="font-semibold text-text-primary">{clips.length}</span> clips{' '}
            <span className="text-text-tertiary">—</span>{' '}
            <Link href="/pricing" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
              Upgrade to see more
            </Link>
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {clips.map((clip) => {
          const isLocked = !allowedDifficulties.includes(clip.difficulty)
          return (
            <ClipCard
              key={clip.id}
              clip={{ ...clip, skillCategory: clip.skillCategory as SkillCategory, difficulty: clip.difficulty as Difficulty }}
              locked={isLocked}
            />
          )
        })}
      </div>
    </>
  )
}

function ClipGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ClipCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = searchParams
  const skill = params.skill as SkillCategory | undefined
  const difficulty = params.difficulty as Difficulty | undefined
  const film = params.film
  const screenplay = params.screenplay
  const search = params.search

  // Get user plan for content gating
  const session = await getServerSession(authOptions)
  let userPlan = 'basic'
  const userId = (session?.user as any)?.id as string | undefined
  if (userId) {
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }).catch(() => null)
    if (dbUser) userPlan = dbUser.plan || 'basic'
  }
  const allowedDifficulties = getAllowedDifficulties(userPlan)

  const totalCount = await prisma.clip.count({ where: { isActive: true } }).catch(() => 0)
  const filteredCount = await prisma.clip.count({
    where: buildWhere(skill, difficulty, film, screenplay, search),
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
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">The Library</h1>
          </div>
        </div>

        {/* Filter bar */}
        <LibraryFilters
          activeSkill={skill}
          activeDifficulty={difficulty}
          activeFilm={film}
          hasScreenplay={screenplay === 'true'}
          filmOptions={filmOptions}
          clipCount={filteredCount}
          initialSearch={search}
        />

        {/* Grid */}
        <div className="mt-8">
          <Suspense fallback={<ClipGridSkeleton />}>
            <ClipGrid skill={skill} difficulty={difficulty} film={film} screenplay={screenplay} search={search} allowedDifficulties={allowedDifficulties} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
