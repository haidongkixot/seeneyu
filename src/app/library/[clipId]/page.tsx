import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SkillBadge } from '@/components/SkillBadge'
import { DifficultyPill } from '@/components/DifficultyPill'
import { ClipViewerClient } from './ClipViewerClient'
import { ClipDetailTabs } from './ClipDetailTabs'
import type { SkillCategory, Difficulty, ObservationGuide } from '@/lib/types'
import { ArrowLeft, FileText } from 'lucide-react'

interface PageProps {
  params: Promise<{ clipId: string }>
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default async function ClipViewerPage({ params }: PageProps) {
  const { clipId } = await params

  const clip = await prisma.clip.findUnique({
    where: { id: clipId, isActive: true },
    include: { annotations: { orderBy: { atSecond: 'asc' } } },
  })

  if (!clip) notFound()

  const duration = clip.endSec - clip.startSec
  const observationGuide = ((clip as any).observationGuide ?? null) as ObservationGuide | null
  const scriptText = (clip.script as string | null) ?? null
  const screenplayText = (clip.screenplayText as string | null) ?? null

  return (
    <div className="min-h-screen bg-bg-base">
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        {/* Back */}
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Library
        </Link>

        {/* Video/Image player */}
        {(clip as any).mediaType === 'ai_image' && (clip as any).mediaUrl ? (
          <div className="w-full rounded-2xl overflow-hidden bg-bg-elevated border border-black/8">
            <img
              src={(clip as any).mediaUrl}
              alt={clip.sceneDescription}
              className="w-full h-auto max-h-[500px] object-contain"
            />
          </div>
        ) : (clip as any).mediaType === 'ai_video' && (clip as any).mediaUrl ? (
          <div className="w-full rounded-2xl overflow-hidden bg-black">
            <video
              src={(clip as any).mediaUrl}
              controls
              autoPlay
              loop
              className="w-full h-auto max-h-[500px]"
            />
          </div>
        ) : clip.youtubeVideoId ? (
          <ClipViewerClient
            youtubeVideoId={clip.youtubeVideoId}
            startSec={clip.startSec}
            endSec={clip.endSec}
            annotations={clip.annotations.map(a => ({
              id: a.id,
              atSecond: a.atSecond,
              note: a.note,
              type: a.type as 'eye_contact' | 'posture' | 'gesture' | 'voice' | 'expression',
            }))}
          />
        ) : (
          <div className="w-full aspect-video rounded-2xl bg-bg-elevated border border-black/8 flex items-center justify-center">
            <p className="text-text-tertiary">No media available</p>
          </div>
        )}

        {/* Clip info header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mt-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-tertiary">
              {clip.movieTitle}{clip.year ? ` (${clip.year})` : ''}
              {clip.characterName ? ` · ${clip.characterName}` : ''}
            </p>
            <h1 className="text-xl font-semibold text-text-primary mt-0.5 leading-snug">
              {clip.sceneDescription}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <SkillBadge skill={clip.skillCategory as SkillCategory} />
            <DifficultyPill difficulty={clip.difficulty as Difficulty} />
            <span className="text-xs font-mono text-text-tertiary bg-bg-elevated rounded-pill px-2.5 py-1">
              {formatDuration(duration)}
            </span>
            {(scriptText || screenplayText) && (
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary bg-bg-elevated rounded-pill px-2.5 py-1">
                <FileText size={12} />
                Script available
              </span>
            )}
          </div>
        </div>

        {/* Watch / How It Works tabs */}
        <div className="mt-6">
          <ClipDetailTabs
            clipId={clipId}
            characterName={clip.characterName}
            sceneDescription={clip.sceneDescription}
            annotation={clip.annotation}
            contextNote={clip.contextNote}
            observationGuide={observationGuide}
            annotations={clip.annotations.map(a => ({ note: a.note, type: a.type }))}
            scriptText={scriptText}
            screenplayText={screenplayText}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
          <Link
            href={`/library/${clipId}/practice`}
            className="bg-accent-400 text-text-inverse rounded-pill px-8 py-3.5 font-semibold hover:bg-accent-500 hover:shadow-glow transition-all duration-150 flex items-center gap-2"
          >
            I&apos;m Ready to Mimic →
          </Link>
        </div>
      </main>
    </div>
  )
}
