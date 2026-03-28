import jwt from 'jsonwebtoken'

/**
 * Generate a JWT token for Kling AI API authentication.
 *
 * Based on official Kling API docs:
 * - Header: {"alg": "HS256", "typ": "JWT"}
 * - Payload: {"iss": access_key, "exp": now+1800, "nbf": now-5}
 * - Signed with secret_key using HS256
 *
 * Env vars: KLING_ACCESS_KEY, KLING_SECRET_KEY
 */
export function getKlingToken(): string {
  const accessKey = process.env.KLING_ACCESS_KEY
  const secretKey = process.env.KLING_SECRET_KEY

  if (!accessKey || !secretKey) {
    throw new Error('KLING_ACCESS_KEY and KLING_SECRET_KEY must be set')
  }

  const now = Math.floor(Date.now() / 1000)

  // Exact payload format from Kling docs — no iat field
  const payload = {
    iss: accessKey,
    exp: now + 1800,
    nbf: now - 5,
  }

  return jwt.sign(payload, secretKey, { algorithm: 'HS256' })
}
