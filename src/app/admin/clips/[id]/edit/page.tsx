import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClipForm from '../../ClipForm'
import { GenerateObservationGuide } from './GenerateObservationGuide'
import { CrawlScreenplay } from './CrawlScreenplay'

export default async function EditClipPage({ params }: { params: { id: string } }) {
  const clip = await prisma.clip.findUnique({ where: { id: params.id } })
  if (!clip) notFound()

  const hasGuide = !!(clip as any).observationGuide
  const hasScreenplaySource = !!(clip as any).screenplaySource
  const hasScreenplayText = !!(clip as any).screenplayText

  const initial = {
    id: clip.id,
    youtubeVideoId: clip.youtubeVideoId,
    movieTitle: clip.movieTitle,
    characterName: clip.characterName ?? '',
    actorName: clip.actorName ?? '',
    year: clip.year?.toString() ?? '',
    sceneDescription: clip.sceneDescription,
    skillCategory: clip.skillCategory,
    difficulty: clip.difficulty,
    difficultyScore: clip.difficultyScore.toString(),
    signalClarity: clip.signalClarity.toString(),
    noiseLevel: clip.noiseLevel.toString(),
    contextDependency: clip.contextDependency.toString(),
    replicationDifficulty: clip.replicationDifficulty.toString(),
    annotation: clip.annotation,
    contextNote: clip.contextNote ?? '',
    script: (clip as any).script ?? '',
    startSec: clip.startSec.toString(),
    endSec: clip.endSec.toString(),
    isActive: clip.isActive,
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Edit Clip</h1>
        <p className="text-text-secondary text-sm mt-1">{clip.movieTitle}</p>
      </div>

      <ClipForm mode="edit" initial={initial} />

      {/* Observation Guide generation */}
      <div className="max-w-2xl mt-6">
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-6">
          <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-1">
            Observation Guide
          </p>
          <p className="text-sm text-text-tertiary mb-4">
            {hasGuide
              ? 'Guide generated. Click to regenerate with updated clip data.'
              : 'No guide yet. Generate one with AI — takes ~5 seconds.'}
          </p>
          <GenerateObservationGuide clipId={clip.id} hasGuide={hasGuide} />
        </div>
      </div>

      {/* Screenplay Crawl */}
      <div className="max-w-2xl mt-6">
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-6">
          <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-1">
            Screenplay Text
          </p>
          <p className="text-sm text-text-tertiary mb-4">
            {hasScreenplayText
              ? 'Screenplay crawled and stored. Click to re-crawl from source.'
              : hasScreenplaySource
              ? 'Source URL available. Click to crawl and store the screenplay text.'
              : 'No screenplay source URL set for this clip.'}
          </p>
          <CrawlScreenplay
            clipId={clip.id}
            hasScreenplaySource={hasScreenplaySource}
            hasScreenplayText={hasScreenplayText}
          />
        </div>
      </div>
    </div>
  )
}
