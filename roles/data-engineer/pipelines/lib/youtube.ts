/**
 * YouTube Data API v3 client
 * Requires YOUTUBE_API_KEY in .env.local at project root
 */

const BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubeSearchResult {
  youtube_video_id: string;
  title: string;
  channel: string;
  published_at: string;
}

export interface YouTubeVideoDetails extends YouTubeSearchResult {
  duration_seconds: number;
  view_count: number;
}

function parseDuration(iso: string): number {
  // Parse ISO 8601 duration e.g. PT4M13S
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  return h * 3600 + m * 60 + s;
}

export async function searchYouTube(
  query: string,
  apiKey: string,
  maxResults = 5
): Promise<YouTubeSearchResult[]> {
  const url = new URL(`${BASE}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoDuration", "short");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`YouTube search failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    items: Array<{
      id: { videoId: string };
      snippet: { title: string; channelTitle: string; publishedAt: string };
    }>;
  };

  return data.items.map((item) => ({
    youtube_video_id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    published_at: item.snippet.publishedAt,
  }));
}

export async function getVideoDetails(
  videoId: string,
  apiKey: string
): Promise<YouTubeVideoDetails | null> {
  const url = new URL(`${BASE}/videos`);
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as {
    items: Array<{
      id: string;
      snippet: { title: string; channelTitle: string; publishedAt: string };
      contentDetails: { duration: string };
      statistics: { viewCount: string };
    }>;
  };

  if (!data.items.length) return null;
  const item = data.items[0];
  return {
    youtube_video_id: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    published_at: item.snippet.publishedAt,
    duration_seconds: parseDuration(item.contentDetails.duration),
    view_count: parseInt(item.statistics.viewCount ?? "0"),
  };
}
