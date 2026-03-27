import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllProviders } from '@/toolkit/ai-content-generator'

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

    const providers = getAllProviders().map((p) => ({
      id: p.id,
      name: p.name,
      models: p.models.map((m) => ({ id: m, name: m, type: p.type })),
      available: p.available,
    }))

    return NextResponse.json(providers)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
