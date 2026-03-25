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

export async function GET(
  _req: Request,
  { params }: { params: { key: string } }
) {
  try {
    await requireAdmin()
    const setting = await prisma.siteSettings.findUnique({
      where: { key: params.key },
    })
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(setting)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    await requireAdmin()
    const { value } = await req.json()

    const setting = await prisma.siteSettings.upsert({
      where: { key: params.key },
      update: { value },
      create: { key: params.key, value },
    })
    return NextResponse.json(setting)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
