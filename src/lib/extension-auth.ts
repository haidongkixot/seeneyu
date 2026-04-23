import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { isAllowedExtensionId } from '@/lib/extension-id-allowlist'

const ACCESS_TTL_MS = 15 * 60 * 1000
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex')
}

export interface ExtensionAuthResult {
  userId: string
  tokenId: string
  extensionId: string
}

export async function getUserFromExtensionRequest(
  req: Request,
): Promise<ExtensionAuthResult | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const extensionIdHeader = req.headers.get('x-extension-id')
  if (!isAllowedExtensionId(extensionIdHeader)) return null

  const accessToken = authHeader.slice(7).trim()
  if (!accessToken) return null
  const tokenHash = sha256(accessToken)

  const token = await (prisma as any).extensionToken.findUnique({
    where: { tokenHash },
  })
  if (!token) return null
  if (token.revokedAt) return null
  if (token.expiresAt.getTime() <= Date.now()) return null
  if (token.extensionId !== extensionIdHeader) return null

  await (prisma as any).extensionToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    userId: token.userId,
    tokenId: token.id,
    extensionId: token.extensionId,
  }
}

export interface IssuedTokenPair {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  refreshExpiresAt: Date
  tokenId: string
}

export async function issueExtensionTokenPair(params: {
  userId: string
  extensionId: string
  userAgent?: string | null
}): Promise<IssuedTokenPair> {
  const accessToken = generateOpaqueToken()
  const refreshToken = generateOpaqueToken()
  const now = Date.now()
  const expiresAt = new Date(now + ACCESS_TTL_MS)
  const refreshExpiresAt = new Date(now + REFRESH_TTL_MS)

  const created = await (prisma as any).extensionToken.create({
    data: {
      userId: params.userId,
      tokenHash: sha256(accessToken),
      refreshHash: sha256(refreshToken),
      extensionId: params.extensionId,
      userAgent: params.userAgent ?? null,
      expiresAt,
      refreshExpiresAt,
    },
  })

  return { accessToken, refreshToken, expiresAt, refreshExpiresAt, tokenId: created.id }
}

export async function rotateExtensionToken(params: {
  refreshToken: string
  extensionId: string
}): Promise<IssuedTokenPair | null> {
  const refreshHash = sha256(params.refreshToken)
  const existing = await (prisma as any).extensionToken.findUnique({
    where: { refreshHash },
  })
  if (!existing) return null
  if (existing.revokedAt) return null
  if (existing.refreshExpiresAt.getTime() <= Date.now()) return null
  if (existing.extensionId !== params.extensionId) return null

  // Delete the old token atomically before creating a replacement — rotation
  // invalidates the refresh token exactly once. If it's presented again, the
  // lookup returns null and we can detect reuse (see revokeUserExtensionTokens).
  await (prisma as any).extensionToken.delete({ where: { id: existing.id } })

  return issueExtensionTokenPair({
    userId: existing.userId,
    extensionId: existing.extensionId,
    userAgent: existing.userAgent,
  })
}

export async function revokeExtensionToken(tokenId: string, userId: string) {
  await (prisma as any).extensionToken.updateMany({
    where: { id: tokenId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllUserExtensionTokens(userId: string): Promise<number> {
  const res = await (prisma as any).extensionToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  return res.count as number
}

// ── Pairing code (DB-backed — survives serverless Lambda cold-splits) ──
const PAIRING_TTL_MS = 120_000

export async function issuePairingCode(userId: string): Promise<string> {
  // Opportunistically clean expired codes, and wipe any prior code this user
  // had outstanding — one active pairing code per user at a time.
  await (prisma as any).extensionPairingCode.deleteMany({
    where: { OR: [{ expiresAt: { lte: new Date() } }, { userId }] },
  })

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    try {
      await (prisma as any).extensionPairingCode.create({
        data: { code, userId, expiresAt: new Date(Date.now() + PAIRING_TTL_MS) },
      })
      return code
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err // retry only on unique-constraint collision
    }
  }
  throw new Error('Could not generate pairing code after 5 attempts')
}

export async function consumePairingCode(code: string): Promise<string | null> {
  if (!/^\d{6}$/.test(code)) return null
  const row = await (prisma as any).extensionPairingCode.findUnique({ where: { code } })
  if (!row) return null
  // Single-use: delete regardless of validity so a replay can't succeed.
  await (prisma as any).extensionPairingCode.delete({ where: { code } })
  if (row.expiresAt.getTime() <= Date.now()) return null
  return row.userId as string
}
