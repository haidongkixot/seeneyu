import { prisma } from '@/lib/prisma'
import { Timestamp } from '../types'

/**
 * Parse timestamps from a YouTube video description.
 * Handles formats like:
 *   0:00 Introduction
 *   1:23 Key moment
 *   01:05:30 Long video timestamp
 *   (1:23) or [1:23] bracketed formats
 */
export function parseTimestampsFromText(text: string): Timestamp[] {
  const timestamps: Timestamp[] = []
  // Match patterns like 0:00, 1:23, 01:05:30, with optional brackets/parentheses
  const regex = /[\[(]?(\d{1,2}):(\d{2})(?::(\d{2}))?[\])]?\s+(.+)/gm
  let match

  while ((match = regex.exec(text)) !== null) {
    const hours = match[3] ? parseInt(match[1]) : 0
    const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1])
    const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2])
    const label = match[4].trim()

    // Skip empty labels or very short ones
    if (label.length < 2) continue

    const time = hours * 3600 + minutes * 60 + seconds
    timestamps.push({ time, label })
  }

  // Sort by time
  timestamps.sort((a, b) => a.time - b.time)

  return timestamps
}

/**
 * Fetch a YouTube video's description and extract timestamps.
 * Uses the YouTube Data API if YOUTUBE_API_KEY is set, otherwise extracts from oEmbed.
 */
export async function parseTimestamps(videoUrl: string): Promise<{
  videoId: string
  title: string
  timestamps: Timestamp[]
}> {
  // Extract video ID from URL
  const videoId = extractVideoId(videoUrl)
  if (!videoId) {
    throw new Error(`Could not extract video ID from URL: ${videoUrl}`)
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not set — required for fetching video descriptions')
  }

  const params = new URLSearchParams({
    key: apiKey,
    id: videoId,
    part: 'snippet',
  })

  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`)
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status}`)
  }

  const data = await res.json()
  const item = data.items?.[0]
  if (!item) {
    throw new Error(`Video not found: ${videoId}`)
  }

  const title = item.snippet.title ?? 'Untitled'
  const description = item.snippet.description ?? ''
  const timestamps = parseTimestampsFromText(description)

  return { videoId, title, timestamps }
}

/**
 * Extract YouTube video ID from various URL formats.
 */
function extractVideoId(url: string): string | null {
  // Handle youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  // Handle youtube.com/watch?v=ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (longMatch) return longMatch[1]

  // Handle youtube.com/embed/ID
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]

  // If it's already just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url

  return null
}

/**
 * Create ContentSource entries for each timestamp as potential clip candidates.
 * Admins can then review and approve them for clip creation.
 */
export async function suggestClipCandidates(
  videoId: string,
  timestamps: Timestamp[]
): Promise<{ created: number }> {
  if (timestamps.length === 0) return { created: 0 }

  const data = timestamps.map((ts, index) => {
    const nextTs = timestamps[index + 1]
    const estimatedEndSec = nextTs ? nextTs.time : ts.time + 60 // Default 60s segment

    return {
      type: 'youtube_timestamp' as const,
      url: `https://www.youtube.com/watch?v=${videoId}&t=${ts.time}`,
      title: ts.label,
      rawContent: null,
      metadata: {
        videoId,
        startSec: ts.time,
        estimatedEndSec,
        timestampLabel: ts.label,
        timestampIndex: index,
        totalTimestamps: timestamps.length,
      },
      status: 'raw' as const,
    }
  })

  const result = await prisma.contentSource.createMany({ data })
  return { created: result.count }
}
