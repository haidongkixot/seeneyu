/**
 * YouTube Transcript Fetcher — uses youtube-transcript package
 * which handles YouTube's anti-bot protections properly.
 */

// youtube-transcript is ESM-only, use dynamic import
async function getYoutubeTranscript() {
  const mod: any = await import('youtube-transcript')
  return mod.YoutubeTranscript ?? mod.default?.YoutubeTranscript ?? mod.default
}

export interface TranscriptSegment {
  startSec: number
  durationSec: number
  text: string
}

/**
 * Fetch YouTube video transcript.
 * Returns formatted transcript with timestamps, or null if unavailable.
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    const YT = await getYoutubeTranscript()
    if (!YT) throw new Error('youtube-transcript module not available')

    let segments: any[] | null = null
    try {
      segments = await YT.fetchTranscript(videoId, { lang: 'en' })
    } catch {
      // Try without language preference
      segments = await YT.fetchTranscript(videoId).catch(() => null)
    }

    if (!segments || segments.length === 0) return null

    return segments
      .map((seg: any) => `[${formatTimestamp((seg.offset ?? seg.start ?? 0) / 1000)}] ${(seg.text ?? '').trim()}`)
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
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'CONSENT=PENDING+987',
      },
    })

    if (!res.ok) return null
    const html = await res.text()

    // Extract from ytInitialPlayerResponse
    const markers = ['var ytInitialPlayerResponse = ', 'ytInitialPlayerResponse = ']
    for (const marker of markers) {
      const idx = html.indexOf(marker)
      if (idx === -1) continue
      const jsonStart = idx + marker.length
      const endIdx = html.indexOf(';</script>', jsonStart)
      if (endIdx === -1) continue

      try {
        const obj = JSON.parse(html.substring(jsonStart, endIdx))
        return obj?.videoDetails?.shortDescription ?? null
      } catch {
        continue
      }
    }

    return null
  } catch (err) {
    console.error('[youtube-transcript] Failed to fetch description:', err)
    return null
  }
}

function formatTimestamp(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = Math.floor(totalSec % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
