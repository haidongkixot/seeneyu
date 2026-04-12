import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/me
 * Header: Authorization: Bearer <token>
 * Returns current user profile for mobile app auth validation.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Find account with this token hash
    const account = await (prisma as any).account.findFirst({
      where: {
        provider: 'mobile-token',
        access_token: tokenHash,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            plan: true,
            status: true,
            bio: true,
            phone: true,
            location: true,
            createdAt: true,
          },
        },
      },
    })

    if (!account?.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (account.user.status !== 'approved') {
      return NextResponse.json({ error: 'Account not approved' }, { status: 403 })
    }

    return NextResponse.json({ user: account.user })
  } catch (err: any) {
    console.error('User me error:', err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
