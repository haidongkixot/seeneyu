/**
 * Preference Matcher — filters and scores content by user preferences.
 * Used by: dashboard, activity-planner, library, arcade, foundation, games.
 *
 * Matching logic:
 * - Within a category (e.g., genres): OR — clip matches if ANY user genre matches
 * - Across categories: AND — clip must match in ALL categories the user has set
 * - Untagged clips (no ClipTag records): always included (backward compatible)
 * - No preferences set: return null (show everything)
 * - Sparse content (<5 matches): relax to OR across categories
 */

import { prisma } from '@/lib/prisma'

interface UserPrefs {
  genres: string[]
  purposes: string[]
  traits: string[]
}

interface ClipMatchResult {
  clipId: string
  score: number // higher = better match
}

/**
 * Get clip IDs that match the user's preferences, ordered by match score.
 * Returns null if user has no preferences (= show everything).
 */
export async function getPreferenceMatchedClipIds(
  userId: string,
): Promise<ClipMatchResult[] | null> {
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  })
  if (!prefs) return null

  const genres = (prefs.genres as string[]) ?? []
  const purposes = (prefs.purposes as string[]) ?? []
  const traits = (prefs.traits as string[]) ?? []

  // No preferences set in any category = show everything
  if (genres.length === 0 && purposes.length === 0 && traits.length === 0) {
    return null
  }

  // Fetch all active clips with their tags
  const clips = await prisma.clip.findMany({
    where: { isActive: true },
    select: {
      id: true,
      tags: { select: { category: true, value: true } },
    },
  })

  const results: ClipMatchResult[] = []

  for (const clip of clips) {
    // Untagged clips always included with base score
    if (clip.tags.length === 0) {
      results.push({ clipId: clip.id, score: 0 })
      continue
    }

    const clipGenres = clip.tags.filter(t => t.category === 'genre').map(t => t.value)
    const clipPurposes = clip.tags.filter(t => t.category === 'purpose').map(t => t.value)
    const clipTraits = clip.tags.filter(t => t.category === 'trait').map(t => t.value)

    // Check AND across categories (clip must match in ALL categories user has set)
    let matches = true
    let score = 0

    if (genres.length > 0) {
      const genreMatch = genres.some(g => clipGenres.includes(g))
      if (!genreMatch) { matches = false }
      else { score += genres.filter(g => clipGenres.includes(g)).length * 3 }
    }

    if (purposes.length > 0) {
      const purposeMatch = purposes.some(p => clipPurposes.includes(p))
      if (!purposeMatch) { matches = false }
      else { score += purposes.filter(p => clipPurposes.includes(p)).length * 2 }
    }

    if (traits.length > 0) {
      const traitMatch = traits.some(t => clipTraits.includes(t))
      if (!traitMatch) { matches = false }
      else { score += traits.filter(t => clipTraits.includes(t)).length * 1 }
    }

    if (matches) {
      results.push({ clipId: clip.id, score })
    }
  }

  // Sparse content handling: if too few matches, relax to OR across categories
  if (results.length < 5) {
    const relaxedResults: ClipMatchResult[] = []
    for (const clip of clips) {
      if (clip.tags.length === 0) {
        relaxedResults.push({ clipId: clip.id, score: 0 })
        continue
      }
      const clipValues = clip.tags.map(t => t.value)
      const allUserValues = [...genres, ...purposes, ...traits]
      const matchCount = allUserValues.filter(v => clipValues.includes(v)).length
      if (matchCount > 0) {
        relaxedResults.push({ clipId: clip.id, score: matchCount })
      }
    }
    // Sort by score descending
    relaxedResults.sort((a, b) => b.score - a.score)
    return relaxedResults
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)
  return results
}

/**
 * Calculate match score for a single clip against user preferences.
 * Used for ordering within lists (arcade, foundation, etc).
 */
export function calculateMatchScore(
  clipTags: { category: string; value: string }[],
  preferences: UserPrefs,
): number {
  let score = 0
  for (const tag of clipTags) {
    if (tag.category === 'genre' && preferences.genres.includes(tag.value)) score += 3
    if (tag.category === 'purpose' && preferences.purposes.includes(tag.value)) score += 2
    if (tag.category === 'trait' && preferences.traits.includes(tag.value)) score += 1
  }
  return score
}
