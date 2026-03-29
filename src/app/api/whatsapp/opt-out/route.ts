import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'

/**
 * POST /api/whatsapp/opt-out
 * Disable WhatsApp notifications for the authenticated user.
 */
export async function POST(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.learnerProfile.updateMany({
      where: { userId: authUser.id },
      data: { whatsappOptIn: false },
    })

    return NextResponse.json({ success: true, optIn: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
