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

// ── Pairing code (in-memory, single-process only; fine for MVP) ──
interface PairingEntry {
  userId: string
  expiresAt: number
}
const pairingCodes = new Map<string, PairingEntry>()
const PAIRING_TTL_MS = 120_000

export function issuePairingCode(userId: string): string {
  const now = Date.now()
  pairingCodes.forEach((entry, code) => {
    if (entry.expiresAt <= now) pairingCodes.delete(code)
  })
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  pairingCodes.set(code, { userId, expiresAt: now + PAIRING_TTL_MS })
  return code
}

export function consumePairingCode(code: string): string | null {
  const entry = pairingCodes.get(code)
  if (!entry) return null
  pairingCodes.delete(code)
  if (entry.expiresAt <= Date.now()) return null
  return entry.userId
}
