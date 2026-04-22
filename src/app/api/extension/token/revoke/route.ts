import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkUserRateLimit, EXT_TOKEN_REVOKE_LIMIT } from '@/lib/rate-limit-user'
import { getExtensionCorsHeaders } from '@/lib/extension-cors'
import { isExtensionEnabled } from '@/lib/extension-id-allowlist'
import {
  getUserFromExtensionRequest,
  revokeAllUserExtensionTokens,
  revokeExtensionToken,
} from '@/lib/extension-auth'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { headers: getExtensionCorsHeaders(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const cors = getExtensionCorsHeaders(req.headers.get('origin'))
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503, headers: cors })
  }

  let userId: string | null = null
  let currentTokenId: string | null = null

  const extAuth = await getUserFromExtensionRequest(req)
  if (extAuth) {
    userId = extAuth.userId
    currentTokenId = extAuth.tokenId
  } else {
    const session = await getServerSession(authOptions)
    userId = ((session?.user as any)?.id as string) || null
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })
  }

  const rl = checkUserRateLimit({ key: 'ext:revoke', userId, ...EXT_TOKEN_REVOKE_LIMIT })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: cors })
  }

  const body = await req.json().catch(() => null)
  const tokenId = typeof body?.tokenId === 'string' ? body.tokenId : null

  if (tokenId) {
    await revokeExtensionToken(tokenId, userId)
    return NextResponse.json({ revokedCount: 1 }, { headers: cors })
  }

  const count = await revokeAllUserExtensionTokens(userId)
  return NextResponse.json(
    { revokedCount: count, currentTokenRevoked: currentTokenId !== null },
    { headers: cors },
  )
}
