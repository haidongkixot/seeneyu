import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8),
  ref: z.string().optional(), // referral code
})

// Simple in-memory IP rate limit: max 5 signups per IP per hour
const signupAttempts = new Map<string, number[]>()
const SIGNUP_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const SIGNUP_MAX = 5

function checkSignupRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = (signupAttempts.get(ip) ?? []).filter(t => now - t < SIGNUP_WINDOW_MS)
  if (attempts.length >= SIGNUP_MAX) return false
  attempts.push(now)
  signupAttempts.set(ip, attempts)
  return true
}

export async function POST(req: NextRequest) {
  // IP-based rate limiting to prevent bot account spam
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
  if (!checkSignupRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many sign-up attempts. Please try again later.' },
      { status: 429 }
    )
  }

  // Also check ref from URL query params
  const url = new URL(req.url)
  const refFromQuery = url.searchParams.get('ref')

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { name, email, password } = parsed.data
  const refCode = parsed.data.ref ?? refFromQuery ?? null

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }
  const passwordHash = await bcrypt.hash(password, 12)
  const newUser = await prisma.user.create({
    data: { name, email, passwordHash, role: 'learner', status: 'approved' },
  })

  // Handle referral code conversion
  if (refCode) {
    try {
      const referral = await (prisma as any).referral.findUnique({ where: { code: refCode.toUpperCase() } })
      if (referral && referral.status !== 'converted') {
        // Convert the referral
        await (prisma as any).referral.update({
          where: { id: referral.id },
          data: {
            referredId: newUser.id,
            status: 'converted',
            convertedAt: new Date(),
          },
        })

        // Give referrer 1 month free — extend their subscription endDate
        const referrerSub = await prisma.subscription.findFirst({
          where: { userId: referral.referrerId, status: { not: 'cancelled' } },
          orderBy: { createdAt: 'desc' },
        })
        if (referrerSub) {
          const currentEnd = referrerSub.endDate ?? new Date()
          const newEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000)
          await prisma.subscription.update({
            where: { id: referrerSub.id },
            data: { endDate: newEnd },
          })
        }
      }
    } catch {
      // Don't fail signup if referral processing fails
    }
  }

  return NextResponse.json(
    { success: true, message: 'Account created! You can now sign in.' },
    { status: 201 }
  )
}
