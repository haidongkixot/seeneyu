import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createExport } from '@/services/data-exporter'

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
    const exports = await prisma.gameDataExport.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(exports)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin()
    const { name, format, filters } = await req.json()

    if (!name || !format || !['csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'name and format (csv|json) required' }, { status: 400 })
    }

    const exportRecord = await createExport(
      name,
      format,
      filters || {},
      (session.user as any).id
    )

    return NextResponse.json(exportRecord, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
