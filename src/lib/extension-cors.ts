import { getAllowedExtensionIds } from './extension-id-allowlist'

export function getExtensionCorsHeaders(origin?: string | null) {
  const allowed = getAllowedExtensionIds()
  const ok =
    typeof origin === 'string' &&
    origin.startsWith('chrome-extension://') &&
    allowed.some((id) => origin === `chrome-extension://${id}`)

  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Extension-Id',
    'Access-Control-Allow-Credentials': 'false',
    Vary: 'Origin',
  }
}

export function isExtensionOriginAllowed(origin?: string | null): boolean {
  if (!origin || !origin.startsWith('chrome-extension://')) return false
  return getAllowedExtensionIds().some((id) => origin === `chrome-extension://${id}`)
}
