import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const expression = searchParams.get('expression')
    const pageSize = 20

    const where: any = {}
    if (expression) where.challengeLabel = expression

    const [submissions, total] = await Promise.all([
      prisma.expressionSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.expressionSubmission.count({ where }),
    ])

    // Fetch existing labels for these submissions
    const submissionIds = submissions.map(s => s.id)
    const labels = await prisma.trainingDataLabel.findMany({
      where: { submissionId: { in: submissionIds } },
    })
    const labelMap = new Map(labels.map(l => [l.submissionId, l]))

    const enriched = submissions.map(s => ({
      ...s,
      label: labelMap.get(s.id) || null,
    }))

    return NextResponse.json({
      submissions: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
