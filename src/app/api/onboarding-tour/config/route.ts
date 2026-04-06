import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'onboarding_tour' },
    })
    if (!setting?.value) return NextResponse.json({ enabled: false })
    return NextResponse.json(setting.value)
  } catch {
    return NextResponse.json({ enabled: false })
  }
}
