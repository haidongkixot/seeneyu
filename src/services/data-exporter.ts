import { prisma } from '@/lib/prisma'

interface ExportFilters {
  gameTypes?: string[]
  dateFrom?: string
  dateTo?: string
  minScore?: number
}

export async function createExport(
  name: string,
  format: 'csv' | 'json',
  filters: ExportFilters,
  userId: string
) {
  return prisma.gameDataExport.create({
    data: {
      name,
      format,
      filters: filters as any,
      createdBy: userId,
      status: 'pending',
    },
  })
}

export async function runExport(exportId: string) {
  // Mark as processing
  await prisma.gameDataExport.update({
    where: { id: exportId },
    data: { status: 'processing' },
  })

  try {
    const exportRecord = await prisma.gameDataExport.findUnique({ where: { id: exportId } })
    if (!exportRecord) throw new Error('Export not found')

    const filters = exportRecord.filters as ExportFilters

    // Build query conditions
    const sessionWhere: any = {}
    const submissionWhere: any = {}

    if (filters.dateFrom) {
      sessionWhere.createdAt = { ...sessionWhere.createdAt, gte: new Date(filters.dateFrom) }
      submissionWhere.createdAt = { ...submissionWhere.createdAt, gte: new Date(filters.dateFrom) }
    }
    if (filters.dateTo) {
      sessionWhere.createdAt = { ...sessionWhere.createdAt, lte: new Date(filters.dateTo) }
      submissionWhere.createdAt = { ...submissionWhere.createdAt, lte: new Date(filters.dateTo) }
    }
    if (filters.minScore != null) {
      sessionWhere.score = { gte: filters.minScore }
      submissionWhere.aiScore = { gte: filters.minScore }
    }
    if (filters.gameTypes && filters.gameTypes.length > 0) {
      sessionWhere.game = { type: { in: filters.gameTypes } }
    }

    // Fetch data
    const [sessions, submissions] = await Promise.all([
      prisma.miniGameSession.findMany({
        where: sessionWhere,
        include: { game: { select: { type: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expressionSubmission.findMany({
        where: submissionWhere,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const records = [
      ...sessions.map(s => ({
        type: 'session',
        gameType: s.game.type,
        gameTitle: s.game.title,
        playerId: s.playerId,
        playerName: s.playerName,
        score: s.score,
        totalRounds: s.totalRounds,
        createdAt: s.createdAt.toISOString(),
      })),
      ...submissions.map(s => ({
        type: 'submission',
        challengeLabel: s.challengeLabel,
        imageUrl: s.imageUrl,
        aiScore: s.aiScore,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
    ]

    let content: string
    let contentType: string
    let filename: string

    if (exportRecord.format === 'json') {
      content = JSON.stringify(records, null, 2)
      contentType = 'application/json'
      filename = `${exportRecord.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`
    } else {
      // CSV format
      if (records.length === 0) {
        content = ''
      } else {
        const allKeys = new Set<string>()
        records.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)))
        const headers = Array.from(allKeys)
        const rows = records.map(r =>
          headers.map(h => {
            const val = (r as any)[h]
            if (val == null) return ''
            const str = String(val)
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str
          }).join(',')
        )
        content = [headers.join(','), ...rows].join('\n')
      }
      contentType = 'text/csv'
      filename = `${exportRecord.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv`
    }

    // Upload to Vercel Blob if available, otherwise store as data URL
    let fileUrl: string
    try {
      const { put } = await import('@vercel/blob')
      const blob = await put(`exports/${filename}`, content, {
        access: 'public',
        contentType,
      })
      fileUrl = blob.url
    } catch {
      // Fallback: store as base64 data URL for local dev
      const base64 = Buffer.from(content).toString('base64')
      fileUrl = `data:${contentType};base64,${base64}`
    }

    await prisma.gameDataExport.update({
      where: { id: exportId },
      data: {
        status: 'complete',
        recordCount: records.length,
        fileUrl,
        completedAt: new Date(),
      },
    })

    return { recordCount: records.length, fileUrl }
  } catch (err: any) {
    await prisma.gameDataExport.update({
      where: { id: exportId },
      data: { status: 'failed' },
    })
    throw err
  }
}

export async function getExportStats() {
  const [totalSubmissions, labeledCount, labelDistribution] = await Promise.all([
    prisma.expressionSubmission.count(),
    prisma.trainingDataLabel.count(),
    prisma.trainingDataLabel.groupBy({
      by: ['expressionLabel'],
      _count: { expressionLabel: true },
      orderBy: { _count: { expressionLabel: 'desc' } },
    }),
  ])

  return {
    totalSubmissions,
    labeled: labeledCount,
    unlabeled: totalSubmissions - labeledCount,
    labelDistribution: labelDistribution.map(d => ({
      label: d.expressionLabel,
      count: d._count.expressionLabel,
    })),
  }
}

export async function getPreviewCount(filters: ExportFilters) {
  const sessionWhere: any = {}
  const submissionWhere: any = {}

  if (filters.dateFrom) {
    sessionWhere.createdAt = { ...sessionWhere.createdAt, gte: new Date(filters.dateFrom) }
    submissionWhere.createdAt = { ...submissionWhere.createdAt, gte: new Date(filters.dateFrom) }
  }
  if (filters.dateTo) {
    sessionWhere.createdAt = { ...sessionWhere.createdAt, lte: new Date(filters.dateTo) }
    submissionWhere.createdAt = { ...submissionWhere.createdAt, lte: new Date(filters.dateTo) }
  }
  if (filters.minScore != null) {
    sessionWhere.score = { gte: filters.minScore }
    submissionWhere.aiScore = { gte: filters.minScore }
  }
  if (filters.gameTypes && filters.gameTypes.length > 0) {
    sessionWhere.game = { type: { in: filters.gameTypes } }
  }

  const [sessions, submissions] = await Promise.all([
    prisma.miniGameSession.count({ where: sessionWhere }),
    prisma.expressionSubmission.count({ where: submissionWhere }),
  ])

  return sessions + submissions
}
