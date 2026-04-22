import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkUserRateLimit, EXT_TOKEN_ISSUE_LIMIT } from '@/lib/rate-limit-user'
import { getExtensionCorsHeaders } from '@/lib/extension-cors'
import { isAllowedExtensionId, isExtensionEnabled } from '@/lib/extension-id-allowlist'
import { consumePairingCode, issueExtensionTokenPair } from '@/lib/extension-auth'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { headers: getExtensionCorsHeaders(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const cors = getExtensionCorsHeaders(req.headers.get('origin'))
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503, headers: cors })
  }

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })
  }

  const rl = checkUserRateLimit({ key: 'ext:issue', userId, ...EXT_TOKEN_ISSUE_LIMIT })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: cors })
  }

  const body = await req.json().catch(() => null)
  const extensionId = typeof body?.extensionId === 'string' ? body.extensionId : null
  const pairingCode = typeof body?.pairingCode === 'string' ? body.pairingCode : null
  if (!extensionId || !pairingCode) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers: cors })
  }
  if (!isAllowedExtensionId(extensionId)) {
    return NextResponse.json({ error: 'Extension not allowed' }, { status: 403, headers: cors })
  }

  const pairedUserId = consumePairingCode(pairingCode)
  if (!pairedUserId || pairedUserId !== userId) {
    return NextResponse.json({ error: 'Invalid pairing code' }, { status: 400, headers: cors })
  }

  const pair = await issueExtensionTokenPair({
    userId,
    extensionId,
    userAgent: req.headers.get('user-agent'),
  })

  return NextResponse.json(
    {
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      expiresAt: pair.expiresAt.toISOString(),
      refreshExpiresAt: pair.refreshExpiresAt.toISOString(),
    },
    { headers: cors },
  )
}
