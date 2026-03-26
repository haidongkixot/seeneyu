import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SkillBadge } from '@/components/SkillBadge'
import { DifficultyPill } from '@/components/DifficultyPill'
import { CharacterBanner } from '@/components/CharacterBanner'
import { ScriptPanel } from '@/components/ScriptPanel'
import { StickyPracticeLayout } from '@/components/StickyPracticeLayout'
import { RecordClient } from './RecordClient'
import type { SkillCategory, Difficulty } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ clipId: string }>
}

export default async function RecordPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const { clipId } = await params

  const clip = await prisma.clip.findUnique({
    where: { id: clipId, isActive: true },
    include: { annotations: { orderBy: { atSecond: 'asc' } } },
  })

  if (!clip) notFound()

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Compact top bar */}
      <div className="sticky top-14 z-raised h-12 bg-bg-surface/80 backdrop-blur-md border-b border-black/8 flex items-center justify-between px-4 lg:px-8">
        <Link
          href={`/library/${clipId}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          <ArrowLeft size={15} />
          Watch Again
        </Link>
        <div className="flex items-center gap-2">
          <SkillBadge skill={clip.skillCategory as SkillCategory} size="sm" />
          <DifficultyPill difficulty={clip.difficulty as Difficulty} size="sm" />
        </div>
      </div>

      {/* Character banner — full width above columns */}
      {clip.characterName && (
        <div className="px-4 pt-4 lg:px-6 lg:pt-5">
          <CharacterBanner
            characterName={clip.characterName}
            actorName={clip.actorName}
            movieTitle={clip.movieTitle}
            skillCategory={clip.skillCategory}
          />
        </div>
      )}

      {/* Main split layout with sticky camera */}
      <StickyPracticeLayout
        cameraSlot={
          <RecordClient
            clipId={clip.id}
            skillCategory={clip.skillCategory}
            annotations={clip.annotations.slice(0, 4).map(a => ({ note: a.note }))}
          />
        }
        contentSlot={
          <>
            {/* Reference video */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-bg-inset shadow-xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${clip.youtubeVideoId}?start=${clip.startSec}&end=${clip.endSec}&controls=1&rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="youtube-iframe"
                title={clip.sceneDescription}
              />
            </div>

            {/* Reference annotation */}
            <div className="bg-bg-elevated border border-black/8 rounded-xl p-4">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">Reference</p>
              <p className="text-sm text-text-secondary leading-relaxed">{clip.annotation}</p>
            </div>

            {/* Script panel */}
            {(clip as any).script && (
              <ScriptPanel
                type="dialogue"
                content={(clip as any).script as string}
                tip="Say this out loud while recording."
              />
            )}

            {/* Observation annotations */}
            {clip.annotations.length > 0 && (
              <div className="bg-bg-elevated border border-black/8 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Key Observations
                </p>
                {clip.annotations.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <span className="text-accent-400 font-mono text-xs mt-0.5 shrink-0">
                      {Math.floor(a.atSecond / 60)}:{(a.atSecond % 60).toString().padStart(2, '0')}
                    </span>
                    <p className="text-text-secondary leading-relaxed">{a.note}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        }
      />
    </div>
  )
}
