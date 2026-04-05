/**
 * Page Sections — server-side helper to load CMS-managed content sections.
 *
 * Each section is a SiteSettings entry with key "section_{pageSlug}_{sectionName}".
 * Falls back to hardcoded defaults if not set in CMS.
 *
 * Usage:
 *   const hero = await getSection('home', 'hero', DEFAULT_HERO)
 */

import { prisma } from '@/lib/prisma'

/**
 * Get a single page section from CMS. Falls back to defaultValue if not found.
 */
export async function getSection<T>(
  page: string,
  section: string,
  defaultValue: T,
): Promise<T> {
  try {
    const key = `section_${page}_${section}`
    const setting = await prisma.siteSettings.findUnique({ where: { key } })
    if (setting?.value) return setting.value as T
  } catch {
    // DB error — fall back to default
  }
  return defaultValue
}

/**
 * Get all sections for a page. Returns a map of sectionName → value.
 */
export async function getPageSections(page: string): Promise<Record<string, any>> {
  try {
    const prefix = `section_${page}_`
    const settings = await prisma.siteSettings.findMany({
      where: { key: { startsWith: prefix } },
    })
    const result: Record<string, any> = {}
    for (const s of settings) {
      const sectionName = s.key.replace(prefix, '')
      result[sectionName] = s.value
    }
    return result
  } catch {
    return {}
  }
}
