const TRUSTED_ORIGINS = [
  'https://seeneyu.vercel.app',
  'https://www.seeneyu.com',
  'https://seeneyu.com',
]

if (process.env.NODE_ENV !== 'production') {
  TRUSTED_ORIGINS.push('http://localhost:3000')
  TRUSTED_ORIGINS.push('http://localhost:3001')
}

export function getTrustedCorsHeaders(origin?: string | null) {
  const allowOrigin = origin && TRUSTED_ORIGINS.includes(origin) ? origin : TRUSTED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

export const PUBLIC_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
