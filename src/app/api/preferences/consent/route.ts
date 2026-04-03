import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserConsent, updateConsent } from '@/services/consent-manager'

/** GET — read current consent state */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string
  const consent = await getUserConsent(userId)

  return NextResponse.json(consent)
}

/** PUT — update consent preference */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string
  const body = await req.json()
  const { storageAgreed } = body as { storageAgreed?: boolean }

  if (typeof storageAgreed !== 'boolean') {
    return NextResponse.json(
      { error: 'storageAgreed (boolean) is required' },
      { status: 400 },
    )
  }

  const consent = await updateConsent(userId, storageAgreed)
  return NextResponse.json(consent)
}
