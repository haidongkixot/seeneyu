import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MicroPracticeFlow } from '@/components/MicroPracticeFlow'
import type { PracticeStep } from '@/lib/types'

interface PageProps {
  params: Promise<{ clipId: string }>
}

export default async function PracticePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const { clipId } = await params

  const clip = await prisma.clip.findUnique({
    where: { id: clipId, isActive: true },
    include: {
      annotations: { orderBy: { atSecond: 'asc' } },
      practiceSteps: { orderBy: { stepNumber: 'asc' } },
    },
  })

  if (!clip) notFound()

  // Use seeded practiceSteps if available, otherwise derive from annotations
  const steps: PracticeStep[] = clip.practiceSteps.length > 0
    ? clip.practiceSteps.map(s => ({
        id: s.id,
        clipId: s.clipId,
        stepNumber: s.stepNumber,
        skillFocus: s.skillFocus,
        instruction: s.instruction,
        tip: s.tip,
        targetDurationSec: s.targetDurationSec,
      }))
    : clip.annotations.slice(0, 5).map((a, i) => ({
        id: `ann-${a.id}`,
        clipId: clip.id,
        stepNumber: i + 1,
        skillFocus: clip.skillCategory.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        instruction: a.note,
        tip: null,
        targetDurationSec: 20,
      }))

  if (steps.length === 0) notFound()

  return (
    <MicroPracticeFlow
      clipId={clip.id}
      characterName={clip.characterName}
      skillCategory={clip.skillCategory}
      clipTitle={clip.sceneDescription}
      steps={steps}
    />
  )
}
