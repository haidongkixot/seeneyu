import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClipForm from '../../ClipForm'

export default async function EditClipPage({ params }: { params: { id: string } }) {
  const clip = await prisma.clip.findUnique({ where: { id: params.id } })
  if (!clip) notFound()

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
    </div>
  )
}
