import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

/**
 * Get user ID from either NextAuth session (web) or Bearer token (mobile).
 * Returns the user object or null if not authenticated.
 */
export async function getUserFromRequest(req: Request): Promise<{
  id: string
  plan?: string
} | null> {
  // 1. Try NextAuth session (works for web browser with cookies)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    const user = session.user as any
    return { id: user.id, plan: user.plan }
  }

  // 2. Try Bearer token (mobile app)
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const account = await (prisma as any).account.findFirst({
    where: {
      provider: 'mobile-token',
      access_token: tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
          plan: true,
          status: true,
        },
      },
    },
  })

  if (!account?.user) return null
  if (account.user.status !== 'approved') return null

  // HIGH-001: Check token expiry (expires_at is stored as Unix seconds)
  if (account.expires_at) {
    const expiresAtMs = account.expires_at * 1000
    if (Date.now() > expiresAtMs) return null // token expired — force re-login
  }

  return { id: account.user.id, plan: account.user.plan }
}
