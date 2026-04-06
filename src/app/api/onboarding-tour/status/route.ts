import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ tourCompleted: true })
  const userId = (session.user as any).id as string
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tourCompleted: true },
  })
  return NextResponse.json({ tourCompleted: user?.tourCompleted ?? false })
}
