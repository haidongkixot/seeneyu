import { CrawledArticle, DEFAULT_CRAWLER_CONFIG } from '../types'

/**
 * Strip HTML tags and decode common entities using regex (no cheerio dependency).
 */
function stripHtml(html: string): string {
  return html
    // Remove script/style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Replace br / p / div / li tags with newlines
    .replace(/<\s*(br|p|div|li|h[1-6])\b[^>]*>/gi, '\n')
    // Remove all other tags
    .replace(/<[^>]+>/g, '')
    // Decode common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Extract title from HTML using regex.
 */
function extractTitle(html: string): string {
  // Try og:title first
  const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
  if (ogMatch) return ogMatch[1]

  // Try <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) return titleMatch[1].trim()

  // Try first h1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match) return stripHtml(h1Match[1])

  return 'Untitled'
}

/**
 * Extract image URLs from HTML.
 */
function extractImages(html: string): string[] {
  const images: string[] = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1]
    // Only keep http(s) URLs, skip data URIs and small icons
    if (src.startsWith('http') && !src.includes('favicon') && !src.includes('logo')) {
      images.push(src)
    }
  }
  return images.slice(0, 20) // Cap at 20 images
}

/**
 * Extract the main article body from HTML.
 * Tries to find <article>, <main>, or common content selectors via regex.
 */
function extractBody(html: string): string {
  // Try <article> tag
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) return stripHtml(articleMatch[1])

  // Try <main> tag
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  if (mainMatch) return stripHtml(mainMatch[1])

  // Try common content class patterns
  const contentPatterns = [
    /<div[^>]+class=["'][^"']*(?:article|content|post|entry|story)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ]
  for (const pattern of contentPatterns) {
    const match = html.match(pattern)
    if (match) return stripHtml(match[1])
  }

  // Fallback: strip the entire body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) return stripHtml(bodyMatch[1])

  return stripHtml(html)
}

/**
 * Crawl an article URL and extract structured content.
 */
export async function crawlArticle(url: string): Promise<CrawledArticle> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_CRAWLER_CONFIG.timeoutMs)

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': DEFAULT_CRAWLER_CONFIG.userAgent },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const title = extractTitle(html)
    const bodyText = extractBody(html)
    const images = extractImages(html)

    return { title, bodyText, images, url }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Search for articles by keywords.
 * This is a placeholder — actual search would require API keys (Google Custom Search, etc.)
 * Returns mock URLs for demonstration / manual entry workflow.
 */
export async function searchArticles(keywords: string[]): Promise<{ url: string; title: string }[]> {
  const query = keywords.join(' ')
  // Return placeholder results — admin manually adds real URLs via the UI
  return [
    {
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query + ' body language')}`,
      title: `Google Scholar: ${query} body language`,
    },
    {
      url: `https://www.psychologytoday.com/us/basics/body-language`,
      title: 'Psychology Today: Body Language',
    },
    {
      url: `https://www.sciencedirect.com/search?qs=${encodeURIComponent(query + ' nonverbal communication')}`,
      title: `ScienceDirect: ${query} nonverbal communication`,
    },
  ]
}
