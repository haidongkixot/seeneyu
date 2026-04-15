import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'

// HIGH-002: IP-based rate limiting for mobile login (10 attempts per 15 min)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= MAX_ATTEMPTS
}

// HIGH-001: Token expiry — 30 days
const TOKEN_EXPIRY_DAYS = 30

/**
 * POST /api/auth/mobile-login
 * Body: { email, password }
 * Returns: { token, expiresAt, user: { id, name, email, role, plan, status } }
 *
 * Issues a bearer token with 30-day expiry for mobile app auth.
 * Token is stored as a hash in the Account table.
 */
export async function POST(req: Request) {
  try {
    // HIGH-002: Rate limit check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again in 15 minutes.' },
        { status: 429 },
      )
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.status !== 'approved') {
      return NextResponse.json({
        error: user.status === 'pending'
          ? 'Your account is pending approval'
          : user.status === 'rejected'
          ? 'Your registration was not approved'
          : 'Your account has been suspended',
        status: user.status,
      }, { status: 403 })
    }

    // Generate a bearer token
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // HIGH-001: Token expires in 30 days
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    // Store token hash + expiry in Account table (provider: 'mobile-token')
    await (prisma as any).account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'mobile-token',
          providerAccountId: user.id,
        },
      },
      create: {
        userId: user.id,
        type: 'bearer',
        provider: 'mobile-token',
        providerAccountId: user.id,
        access_token: tokenHash,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
      },
      update: {
        access_token: tokenHash,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
      },
    })

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        status: user.status,
      },
    })
  } catch (err: any) {
    console.error('Mobile login error:', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
