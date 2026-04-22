import { getApiBase } from './api-base'

interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresAt: string
  refreshExpiresAt: string
}

const STORE_KEY = 'mirrorTokens'

export async function loadTokens(): Promise<TokenPair | null> {
  const res = await chrome.storage.session.get(STORE_KEY)
  const v = res[STORE_KEY] as TokenPair | undefined
  return v ?? null
}

export async function saveTokens(pair: TokenPair): Promise<void> {
  await chrome.storage.session.set({ [STORE_KEY]: pair })
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.session.remove(STORE_KEY)
}

export async function issueTokens(pairingCode: string): Promise<TokenPair> {
  const base = await getApiBase()
  const res = await fetch(`${base}/api/extension/token/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Extension-Id': chrome.runtime.id,
    },
    credentials: 'include',
    body: JSON.stringify({ extensionId: chrome.runtime.id, pairingCode }),
  })
  if (!res.ok) throw new Error(`Issue failed: ${res.status}`)
  const pair = (await res.json()) as TokenPair
  await saveTokens(pair)
  return pair
}

export async function refreshTokens(): Promise<TokenPair | null> {
  const current = await loadTokens()
  if (!current) return null
  const base = await getApiBase()
  const res = await fetch(`${base}/api/extension/token/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Extension-Id': chrome.runtime.id,
    },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  })
  if (!res.ok) {
    await clearTokens()
    return null
  }
  const pair = (await res.json()) as TokenPair
  await saveTokens(pair)
  return pair
}

// Returns a valid access token, refreshing 60s before expiry.
export async function getAccessToken(): Promise<string | null> {
  let tokens = await loadTokens()
  if (!tokens) return null
  const expMs = new Date(tokens.expiresAt).getTime()
  if (Date.now() > expMs - 60_000) {
    tokens = await refreshTokens()
    if (!tokens) return null
  }
  return tokens.accessToken
}

export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken()
  if (!token) throw new Error('Not paired')
  const base = await getApiBase()
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('X-Extension-Id', chrome.runtime.id)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(`${base}${path}`, { ...init, headers })
}

export async function revokeAll(): Promise<void> {
  try {
    await authedFetch('/api/extension/token/revoke', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  } catch {
    /* ignore network errors on revoke */
  } finally {
    await clearTokens()
  }
}
