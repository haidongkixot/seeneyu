import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MicroPracticeFlow } from '@/components/MicroPracticeFlow'
import { AiImagePractice } from '@/components/AiImagePractice'
import PracticeModeToggle, { HandsFreeWrapper } from './PracticeModeToggle'
import type { PracticeStep } from '@/lib/types'

interface PageProps {
  params: Promise<{ clipId: string }>
  searchParams: Promise<{ mode?: string }>
}

export default async function PracticePage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const { clipId } = await params
  const { mode } = await searchParams
  const isHandsFree = mode === 'handsfree'

  const clip = await prisma.clip.findUnique({
    where: { id: clipId, isActive: true },
    include: {
      annotations: { orderBy: { atSecond: 'asc' } },
      practiceSteps: { orderBy: { stepNumber: 'asc' } },
    },
  })

  if (!clip) notFound()

  const clipAny = clip as any

  // AI-generated image → Expression King style practice
  if (clipAny.mediaType === 'ai_image' && clipAny.mediaUrl) {
    return (
      <AiImagePractice
        clipId={clip.id}
        imageUrl={clipAny.mediaUrl}
        title={clip.sceneDescription}
        skillCategory={clip.skillCategory}
        annotation={clip.annotation}
      />
    )
  }

  // AI-generated video → same as YouTube flow but with different player
  // YouTube / video → standard micro-practice flow
  const steps: PracticeStep[] = clip.practiceSteps.length > 0
    ? clip.practiceSteps.map(s => ({
        id: s.id,
        clipId: s.clipId,
        stepNumber: s.stepNumber,
        skillFocus: s.skillFocus,
        instruction: s.instruction,
        tip: s.tip,
        targetDurationSec: s.targetDurationSec,
        demoImageUrl: (s as any).demoImageUrl ?? null,
        subSteps: (s as any).subSteps ?? null,
        voiceUrl: (s as any).voiceUrl ?? null,
      }))
    : clip.annotations.length > 0
    ? clip.annotations.slice(0, 5).map((a, i) => ({
        id: `ann-${a.id}`,
        clipId: clip.id,
        stepNumber: i + 1,
        skillFocus: clip.skillCategory.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        instruction: a.note,
        tip: null,
        targetDurationSec: 20,
      }))
    : [{
        id: 'default-1',
        clipId: clip.id,
        stepNumber: 1,
        skillFocus: clip.skillCategory.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        instruction: clip.annotation || `Practice the ${clip.skillCategory.replace(/-/g, ' ')} technique shown in this clip.`,
        tip: 'Watch carefully, then try to replicate the body language.',
        targetDurationSec: 30,
      }]

  return (
    <>
      <PracticeModeToggle clipId={clip.id} isHandsFree={isHandsFree} />
      {isHandsFree ? (
        <HandsFreeWrapper
          clipId={clip.id}
          steps={steps}
          skillCategory={clip.skillCategory}
        />
      ) : (
        <MicroPracticeFlow
          clipId={clip.id}
          characterName={clip.characterName}
          skillCategory={clip.skillCategory}
          clipTitle={clip.sceneDescription}
          steps={steps}
        />
      )}
    </>
  )
}
