import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider } = await params
  const body = await req.json()
  const { isEnabled, config } = body

  await prisma.cloudStorageConfig.upsert({
    where: { provider },
    update: { isEnabled: isEnabled ?? false, config: config ?? {} },
    create: { provider, isEnabled: isEnabled ?? false, config: config ?? {} },
  })

  return NextResponse.json({ ok: true })
}
