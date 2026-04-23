import { NextRequest, NextResponse } from 'next/server'
import { checkUserRateLimit, EXT_TOKEN_ISSUE_LIMIT } from '@/lib/rate-limit-user'
import { getExtensionCorsHeaders } from '@/lib/extension-cors'
import { isAllowedExtensionId, isExtensionEnabled } from '@/lib/extension-id-allowlist'
import { consumePairingCode, issueExtensionTokenPair } from '@/lib/extension-auth'

// Device-code flow: the 6-digit code is the authenticator. No session cookie
// is required — and cannot be required — because the extension runs on a
// chrome-extension:// origin from which seeneyu.com cookies are not sent.
// Rate limit by IP since we have no userId before the code is validated.
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { headers: getExtensionCorsHeaders(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const cors = getExtensionCorsHeaders(req.headers.get('origin'))
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503, headers: cors })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = checkUserRateLimit({
    key: 'ext:issue:ip',
    userId: ip,
    ...EXT_TOKEN_ISSUE_LIMIT,
  })
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

  const pairedUserId = await consumePairingCode(pairingCode)
  if (!pairedUserId) {
    return NextResponse.json({ error: 'Invalid or expired pairing code' }, { status: 400, headers: cors })
  }

  const pair = await issueExtensionTokenPair({
    userId: pairedUserId,
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
