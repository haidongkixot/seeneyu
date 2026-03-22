import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OnboardingFlow } from './OnboardingFlow'

const db = prisma as any

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/signin')

  const userId = (session.user as any).id as string
  const user = await db.user.findUnique({ where: { id: userId }, select: { onboardingComplete: true } })
  if (user?.onboardingComplete) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <OnboardingFlow />
    </div>
  )
}
