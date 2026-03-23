export interface YouTubeSearchResult {
  youtubeId: string
  title: string
  channelName: string
  thumbnailUrl: string
  description: string
  durationSec: number | null
  publishedAt: string | null
  viewCount: number | null
}

function parseDuration(iso: string): number | null {
  // Parse ISO 8601 duration e.g. PT4M13S
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return null
  const h = parseInt(m[1] ?? '0')
  const min = parseInt(m[2] ?? '0')
  const s = parseInt(m[3] ?? '0')
  return h * 3600 + min * 60 + s
}

export async function searchYouTube(
  query: string,
  maxResults: number
): Promise<YouTubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set')

  // Search for videos
  const searchParams = new URLSearchParams({
    key: apiKey,
    q: query,
    part: 'snippet',
    type: 'video',
    maxResults: String(Math.min(maxResults, 50)),
    relevanceLanguage: 'en',
    safeSearch: 'strict',
    videoEmbeddable: 'true',
  })

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${searchParams}`
  )
  if (!searchRes.ok) {
    const err = await searchRes.text()
    throw new Error(`YouTube search failed: ${searchRes.status} — ${err}`)
  }
  const searchData = await searchRes.json()
  const items: any[] = searchData.items ?? []

  if (items.length === 0) return []

  // Fetch video details for duration + view count
  const ids = items.map((i: any) => i.id.videoId).join(',')
  const detailParams = new URLSearchParams({
    key: apiKey,
    id: ids,
    part: 'contentDetails,statistics',
  })
  const detailRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${detailParams}`
  )
  const detailData = detailRes.ok ? await detailRes.json() : { items: [] }
  const detailMap: Record<string, any> = {}
  for (const d of detailData.items ?? []) {
    detailMap[d.id] = d
  }

  return items.map((item: any) => {
    const videoId = item.id.videoId
    const snippet = item.snippet
    const detail = detailMap[videoId]
    const duration = detail?.contentDetails?.duration
      ? parseDuration(detail.contentDetails.duration)
      : null
    const viewCount = detail?.statistics?.viewCount
      ? parseInt(detail.statistics.viewCount)
      : null

    return {
      youtubeId: videoId,
      title: snippet.title ?? '',
      channelName: snippet.channelTitle ?? '',
      thumbnailUrl:
        snippet.thumbnails?.medium?.url ??
        snippet.thumbnails?.default?.url ??
        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      description: snippet.description ?? '',
      durationSec: duration,
      publishedAt: snippet.publishedAt ?? null,
      viewCount,
    }
  })
}
