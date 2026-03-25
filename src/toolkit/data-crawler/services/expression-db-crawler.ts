import { prisma } from '@/lib/prisma'
import { ExpressionAssetInput, DEFAULT_CRAWLER_CONFIG } from '../types'

/**
 * Known public expression databases and their metadata endpoints.
 */
const EXPRESSION_DB_SOURCES: Record<string, { name: string; description: string }> = {
  'fer2013': {
    name: 'FER-2013',
    description: 'Facial Expression Recognition 2013 dataset — 35,887 grayscale images across 7 emotions',
  },
  'affectnet': {
    name: 'AffectNet',
    description: 'Large-scale facial expression database with ~450K images, 8 expression categories',
  },
  'ck+': {
    name: 'CK+ (Extended Cohn-Kanade)',
    description: 'Posed and spontaneous facial expression sequences from 123 subjects',
  },
  'rafdb': {
    name: 'RAF-DB',
    description: 'Real-world Affective Faces Database — ~30K images with crowd-sourced labels',
  },
}

export interface ExpressionDBInfo {
  source: string
  name: string
  description: string
  labels: string[]
  note: string
}

/**
 * Fetch metadata about a public expression database.
 * Returns database info without downloading actual images (which require academic access).
 */
export async function crawlExpressionDB(source: string): Promise<ExpressionDBInfo> {
  const db = EXPRESSION_DB_SOURCES[source.toLowerCase()]

  const standardLabels = [
    'anger', 'contempt', 'disgust', 'fear', 'happiness', 'sadness', 'surprise', 'neutral',
  ]

  if (db) {
    return {
      source: source.toLowerCase(),
      name: db.name,
      description: db.description,
      labels: standardLabels,
      note: 'Academic datasets require registration for full access. Use this metadata to guide manual asset collection.',
    }
  }

  // For unknown sources, try to fetch metadata from URL
  if (source.startsWith('http')) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_CRAWLER_CONFIG.timeoutMs)

    try {
      const res = await fetch(source, {
        headers: { 'User-Agent': DEFAULT_CRAWLER_CONFIG.userAgent },
        signal: controller.signal,
      })
      const text = await res.text()
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i)

      return {
        source,
        name: titleMatch ? titleMatch[1].trim() : 'Unknown DB',
        description: `External expression database at ${source}`,
        labels: standardLabels,
        note: 'Metadata extracted from URL. Manual review recommended.',
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    source,
    name: source,
    description: 'Unknown expression database',
    labels: standardLabels,
    note: `Source "${source}" not recognized. Supported: ${Object.keys(EXPRESSION_DB_SOURCES).join(', ')}`,
  }
}

/**
 * Bulk import expression assets to the ExpressionAsset table.
 * Returns the count of successfully created assets.
 */
export async function importExpressionAssets(
  assets: ExpressionAssetInput[]
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = []
  let created = 0

  // Process in batches of 50
  const batchSize = 50
  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = assets.slice(i, i + batchSize)
    const data = batch
      .filter((a) => {
        if (!a.imageUrl || !a.label) {
          errors.push(`Skipped asset at index ${i}: missing imageUrl or label`)
          return false
        }
        return true
      })
      .map((a) => ({
        imageUrl: a.imageUrl,
        sourceUrl: a.sourceUrl ?? null,
        label: a.label.toLowerCase(),
        description: a.description ?? null,
        tags: a.tags ?? [],
        confidence: a.confidence ?? null,
        status: 'pending' as const,
      }))

    if (data.length > 0) {
      const result = await prisma.expressionAsset.createMany({ data })
      created += result.count
    }
  }

  return { created, errors }
}
