/**
 * YouTube Transcript Fetcher — fetches captions/transcripts from YouTube videos
 * without requiring an API key.
 *
 * Approach:
 * 1. Fetch the YouTube watch page HTML
 * 2. Extract ytInitialPlayerResponse JSON from inline script tags
 * 3. Parse captionTracks to get caption URLs
 * 4. Fetch the XML caption track
 * 5. Parse XML to extract timestamped text segments
 */

export interface TranscriptSegment {
  startSec: number
  durationSec: number
  text: string
}

export interface TranscriptResult {
  segments: TranscriptSegment[]
  fullText: string
  language: string
}

/**
 * Fetch YouTube video transcript (auto-generated or manual captions).
 * Returns formatted transcript with timestamps, or null if unavailable.
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    const playerResponse = await fetchPlayerResponse(videoId)
    if (!playerResponse) return null

    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (!captionTracks || captionTracks.length === 0) return null

    // Prefer English, then any language
    const track =
      captionTracks.find((t: any) => t.languageCode === 'en') ||
      captionTracks.find((t: any) => t.languageCode?.startsWith('en')) ||
      captionTracks[0]

    if (!track?.baseUrl) return null

    // Fetch the XML caption data
    const captionRes = await fetch(track.baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!captionRes.ok) return null

    const xml = await captionRes.text()
    const segments = parseTranscriptXml(xml)

    if (segments.length === 0) return null

    // Format as timestamped text
    return segments
      .map((seg) => `[${formatTimestamp(seg.startSec)}] ${seg.text}`)
      .join('\n')
  } catch (err) {
    console.error('[youtube-transcript] Failed to fetch transcript:', err)
    return null
  }
}

/**
 * Fetch video description from YouTube page HTML.
 */
export async function fetchVideoDescription(videoId: string): Promise<string | null> {
  try {
    const playerResponse = await fetchPlayerResponse(videoId)
    if (!playerResponse) return null

    return playerResponse?.videoDetails?.shortDescription ?? null
  } catch (err) {
    console.error('[youtube-transcript] Failed to fetch description:', err)
    return null
  }
}

/**
 * Fetch and parse ytInitialPlayerResponse from the YouTube watch page.
 * Uses string searching + brace matching rather than regex on large HTML.
 */
async function fetchPlayerResponse(videoId: string): Promise<any | null> {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })

  if (!res.ok) return null

  const html = await res.text()

  // Strategy: find the marker string, then extract the JSON object by brace-matching
  const markers = [
    'var ytInitialPlayerResponse = ',
    'ytInitialPlayerResponse = ',
  ]

  for (const marker of markers) {
    const idx = html.indexOf(marker)
    if (idx === -1) continue

    const jsonStart = idx + marker.length
    const jsonStr = extractJsonObject(html, jsonStart)
    if (jsonStr) {
      try {
        return JSON.parse(jsonStr)
      } catch {
        // Malformed JSON, try next marker
      }
    }
  }

  return null
}

/**
 * Extract a complete JSON object from a string starting at the given position.
 * Counts braces to find the matching closing brace.
 */
function extractJsonObject(str: string, startIdx: number): string | null {
  if (str[startIdx] !== '{') return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = startIdx; i < str.length; i++) {
    const ch = str[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (ch === '\\' && inString) {
      escaped = true
      continue
    }

    if (ch === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        return str.substring(startIdx, i + 1)
      }
    }
  }

  return null
}

/**
 * Parse YouTube's XML caption format into transcript segments.
 * Format: <transcript><text start="0.0" dur="3.5">Hello world</text>...</transcript>
 */
function parseTranscriptXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  const re = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/gi
  let match: RegExpExecArray | null

  while ((match = re.exec(xml)) !== null) {
    const startSec = parseFloat(match[1])
    const durationSec = parseFloat(match[2])
    const text = decodeXmlEntities(match[3].trim())

    if (text) {
      segments.push({ startSec, durationSec, text })
    }
  }

  return segments
}

/**
 * Decode XML/HTML entities in caption text.
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/\n/g, ' ')
    .trim()
}

/**
 * Format seconds into M:SS or H:MM:SS timestamp.
 */
function formatTimestamp(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = Math.floor(totalSec % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
