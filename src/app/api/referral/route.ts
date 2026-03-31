import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateCode(userId: string): string {
  const prefix = userId.slice(-6).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}${random}`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string

  // Get or create referral record
  let referral = await (prisma as any).referral.findFirst({
    where: { referrerId: userId, referredId: null },
    orderBy: { createdAt: 'asc' },
  })

  if (!referral) {
    let code = generateCode(userId)
    // Ensure uniqueness
    let attempts = 0
    while (attempts < 5) {
      const existing = await (prisma as any).referral.findUnique({ where: { code } })
      if (!existing) break
      code = generateCode(userId)
      attempts++
    }

    referral = await (prisma as any).referral.create({
      data: { referrerId: userId, code, status: 'pending' },
    })
  }

  // Count conversions for this user
  const conversions = await (prisma as any).referral.count({
    where: { referrerId: userId, status: 'converted' },
  })

  const referralUrl = `https://seeneyu.vercel.app/join?ref=${referral.code}`

  return NextResponse.json({
    code: referral.code,
    referralUrl,
    conversions,
    status: referral.status,
  })
}
