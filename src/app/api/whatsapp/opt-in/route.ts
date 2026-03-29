import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'

/**
 * POST /api/whatsapp/opt-in
 * Set WhatsApp phone number and enable opt-in for the authenticated user.
 */
export async function POST(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { phone } = body

    if (!phone || typeof phone !== 'string' || phone.length < 7) {
      return NextResponse.json(
        { error: 'A valid phone number is required' },
        { status: 400 }
      )
    }

    // Strip non-digit characters except leading +
    const cleaned = phone.replace(/[^\d]/g, '')

    await prisma.learnerProfile.upsert({
      where: { userId: authUser.id },
      update: {
        whatsappPhone: cleaned,
        whatsappOptIn: true,
      },
      create: {
        userId: authUser.id,
        whatsappPhone: cleaned,
        whatsappOptIn: true,
      },
    })

    return NextResponse.json({ success: true, phone: cleaned, optIn: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
