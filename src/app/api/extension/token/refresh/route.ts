import { NextRequest, NextResponse } from 'next/server'
import { checkUserRateLimit, EXT_TOKEN_REFRESH_LIMIT } from '@/lib/rate-limit-user'
import { getExtensionCorsHeaders } from '@/lib/extension-cors'
import { isAllowedExtensionId, isExtensionEnabled } from '@/lib/extension-id-allowlist'
import { rotateExtensionToken, revokeAllUserExtensionTokens, sha256 } from '@/lib/extension-auth'
import { prisma } from '@/lib/prisma'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { headers: getExtensionCorsHeaders(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const cors = getExtensionCorsHeaders(req.headers.get('origin'))
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503, headers: cors })
  }

  const extensionId = req.headers.get('x-extension-id')
  if (!isAllowedExtensionId(extensionId)) {
    return NextResponse.json({ error: 'Extension not allowed' }, { status: 403, headers: cors })
  }

  const body = await req.json().catch(() => null)
  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : null
  if (!refreshToken) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers: cors })
  }

  const rotated = await rotateExtensionToken({ refreshToken, extensionId: extensionId! })

  // Refresh-token reuse detection: if we can't rotate but the hash existed on a
  // now-deleted row (i.e., already used), defensively revoke all tokens for that
  // user. We check the hash against currently valid tokens — if no match, treat
  // as compromise when the refreshToken has the right length.
  if (!rotated) {
    // Attempt best-effort reuse detection: find any token (including revoked)
    // that has this refreshHash — in rotation, we delete on use, so finding one
    // here would indicate a revoked pair from a separate flow.
    const suspect = await (prisma as any).extensionToken.findFirst({
      where: { refreshHash: sha256(refreshToken) },
    })
    if (suspect) {
      await revokeAllUserExtensionTokens(suspect.userId)
    }
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401, headers: cors })
  }

  const rl = checkUserRateLimit({
    key: 'ext:refresh',
    userId: 'tokenId:' + rotated.tokenId,
    ...EXT_TOKEN_REFRESH_LIMIT,
  })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: cors })
  }

  return NextResponse.json(
    {
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      expiresAt: rotated.expiresAt.toISOString(),
      refreshExpiresAt: rotated.refreshExpiresAt.toISOString(),
    },
    { headers: cors },
  )
}
