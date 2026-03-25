import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runExport } from '@/services/data-exporter'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const exportRecord = await prisma.gameDataExport.findUnique({
      where: { id: params.id },
    })
    if (!exportRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(exportRecord)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const exportRecord = await prisma.gameDataExport.findUnique({
      where: { id: params.id },
    })
    if (!exportRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (exportRecord.status === 'processing') {
      return NextResponse.json({ error: 'Export is already processing' }, { status: 400 })
    }

    const result = await runExport(params.id)
    return NextResponse.json(result)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
