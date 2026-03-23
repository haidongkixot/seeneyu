import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ progress: null })

  const { lessonId } = await params
  const progress = await prisma.foundationProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  })

  return NextResponse.json({ progress })
}
