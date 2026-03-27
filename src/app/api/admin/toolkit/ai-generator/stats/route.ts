import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET() {
  try {
    await requireAdmin()

    const [total, draft, generating, review, published, failed, totalAssets] = await Promise.all([
      prisma.aiContentRequest.count(),
      prisma.aiContentRequest.count({ where: { status: 'draft' } }),
      prisma.aiContentRequest.count({ where: { status: 'generating' } }),
      prisma.aiContentRequest.count({ where: { status: 'review' } }),
      prisma.aiContentRequest.count({ where: { status: 'published' } }),
      prisma.aiContentRequest.count({ where: { status: 'failed' } }),
      prisma.aiGeneratedAsset.count(),
    ])

    return NextResponse.json({
      total,
      byStatus: { draft, generating, review, published, failed },
      totalAssets,
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
