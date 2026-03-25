import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getExportStats } from '@/services/data-exporter'
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
    const [stats, exportCount] = await Promise.all([
      getExportStats(),
      prisma.gameDataExport.count(),
    ])
    return NextResponse.json({ ...stats, totalExports: exportCount })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
