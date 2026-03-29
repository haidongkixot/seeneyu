import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'

/**
 * GET /api/preferences/notifications
 * Returns user's notification preferences from LearnerProfile.
 */
export async function GET(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId: authUser.id },
  })

  if (!profile) {
    return NextResponse.json({
      timezone: 'UTC',
      preferredChannels: ['in_app'],
      optOutChannels: [],
      notificationFrequency: 'normal',
      whatsappOptIn: false,
    })
  }

  return NextResponse.json({
    timezone: profile.timezone,
    preferredChannels: profile.preferredChannels,
    optOutChannels: profile.optOutChannels,
    notificationFrequency: profile.notificationFrequency,
    optimalPracticeTime: profile.optimalPracticeTime,
    whatsappPhone: profile.whatsappPhone,
    whatsappOptIn: profile.whatsappOptIn,
  })
}

/**
 * PATCH /api/preferences/notifications
 * Update notification preferences.
 */
export async function PATCH(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Validate frequency
  const validFrequencies = ['quiet', 'normal', 'active']
  if (body.notificationFrequency && !validFrequencies.includes(body.notificationFrequency)) {
    return NextResponse.json({ error: 'Invalid frequency. Use: quiet, normal, active' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.timezone) data.timezone = body.timezone
  if (body.preferredChannels) data.preferredChannels = body.preferredChannels
  if (body.optOutChannels) data.optOutChannels = body.optOutChannels
  if (body.notificationFrequency) data.notificationFrequency = body.notificationFrequency
  if (body.whatsappPhone !== undefined) data.whatsappPhone = body.whatsappPhone
  if (body.whatsappOptIn !== undefined) data.whatsappOptIn = body.whatsappOptIn

  const profile = await prisma.learnerProfile.upsert({
    where: { userId: authUser.id },
    create: { userId: authUser.id, ...data },
    update: data,
  })

  return NextResponse.json({
    timezone: profile.timezone,
    preferredChannels: profile.preferredChannels,
    optOutChannels: profile.optOutChannels,
    notificationFrequency: profile.notificationFrequency,
    whatsappPhone: profile.whatsappPhone,
    whatsappOptIn: profile.whatsappOptIn,
  })
}
