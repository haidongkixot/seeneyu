const DEFAULT_BASE = 'https://seeneyu.vercel.app'

export async function getApiBase(): Promise<string> {
  const stored = await chrome.storage.local.get('apiBase')
  return (stored.apiBase as string) || DEFAULT_BASE
}

export async function setApiBase(url: string): Promise<void> {
  await chrome.storage.local.set({ apiBase: url })
}
