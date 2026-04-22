export function getAllowedExtensionIds(): string[] {
  const raw = process.env.EXTENSION_IDS || ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function isAllowedExtensionId(id: string | null | undefined): boolean {
  if (!id) return false
  const list = getAllowedExtensionIds()
  if (list.length === 0) return false
  return list.includes(id)
}

export function isExtensionEnabled(): boolean {
  return process.env.EXTENSION_ENABLED === 'true'
}
