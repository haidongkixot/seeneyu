import jwt from 'jsonwebtoken'

/**
 * Generate a JWT token for Kling AI API authentication.
 *
 * Kling requires:
 * - KLING_ACCESS_KEY (ak)
 * - KLING_SECRET_KEY (sk)
 *
 * The JWT is signed with the secret key using HS256.
 * Token expires after 30 minutes.
 */
export function getKlingToken(): string {
  const accessKey = process.env.KLING_ACCESS_KEY
  const secretKey = process.env.KLING_SECRET_KEY

  if (!accessKey || !secretKey) {
    throw new Error('KLING_ACCESS_KEY and KLING_SECRET_KEY must be set')
  }

  const now = Math.floor(Date.now() / 1000)

  const payload = {
    iss: accessKey,
    exp: now + 1800, // 30 minutes
    nbf: now - 5,    // Allow 5s clock skew
    iat: now,
  }

  return jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT',
    },
  })
}
