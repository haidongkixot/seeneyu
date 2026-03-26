import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'

/**
 * POST /api/auth/mobile-login
 * Body: { email, password }
 * Returns: { token, user: { id, name, email, role, plan, status } }
 *
 * Issues a simple bearer token for mobile app auth.
 * Token is stored as a hash in the Account table.
 */
export async function POST(req: Request) {
  try {
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

    // Store token hash in Account table (provider: 'mobile-token')
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
      },
      update: {
        access_token: tokenHash,
      },
    })

    return NextResponse.json({
      token,
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
