/**
 * Screenplay Crawler — fetches screenplay text from known sites (primarily IMSDB).
 *
 * Based on Data Engineer audit (m20-screenplay-audit.json):
 * - Primary source: imsdb.com, selector: td.scrtext pre
 * - URL encoding quirks: King's Speech (raw apostrophe vs %27), Schindler's List (%27)
 * - 12 Angry Men uses 'Twelve-Angry-Men.html' slug
 * - Cache by film — 32 unique fetches for 53 clips
 * - 500ms delay recommended between requests
 */

export interface CrawlResult {
  text: string
  charCount: number
  source: string
}

export async function crawlScreenplay(url: string): Promise<CrawlResult> {
  if (!url || url.trim() === '') {
    throw new Error('No screenplay source URL provided')
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; seeneyu-bot/1.0)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch screenplay: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  let text = ''

  if (url.includes('imsdb.com')) {
    text = extractIMSDB(html)
  } else if (url.includes('scriptsavant.com') || url.includes('scripts.com') || url.includes('scriptslug.com')) {
    text = extractGenericScreenplay(html)
  } else {
    // Generic fallback: try to find <pre> blocks or large text blocks
    text = extractGenericScreenplay(html)
  }

  if (!text || text.trim().length < 100) {
    throw new Error('Could not extract meaningful screenplay text from the page')
  }

  // Truncate to 50k chars for MVP storage (per DE recommendation)
  const MAX_CHARS = 50000
  if (text.length > MAX_CHARS) {
    text = text.substring(0, MAX_CHARS) + '\n\n[...truncated]'
  }

  return {
    text: text.trim(),
    charCount: text.trim().length,
    source: url,
  }
}

function extractIMSDB(html: string): string {
  // IMSDB structure: <td class="scrtext"><pre>...screenplay...</pre></td>
  // Use regex since we can't use DOM parser on server
  const scrTextMatch = html.match(/<td[^>]*class="scrtext"[^>]*>([\s\S]*?)<\/td>/i)
  if (!scrTextMatch) {
    // Fallback: find any <pre> tag
    return extractPreBlocks(html)
  }

  const content = scrTextMatch[1]
  // Extract text from <pre> blocks within scrtext
  const preBlocks: string[] = []
  const preRe = /<pre[^>]*>([\s\S]*?)<\/pre>/gi
  let preMatch: RegExpExecArray | null
  while ((preMatch = preRe.exec(content)) !== null) {
    preBlocks.push(stripHtml(preMatch[1]))
  }
  if (preBlocks.length > 0) {
    return preBlocks.join('\n\n')
  }

  // Fallback: strip all HTML from the scrtext cell
  return stripHtml(content)
}

function extractGenericScreenplay(html: string): string {
  // Try to find <pre> blocks first
  const preText = extractPreBlocks(html)
  if (preText.length > 500) return preText

  // Try article or main content area
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i)

  if (articleMatch) {
    return stripHtml(articleMatch[1])
  }

  // Last resort: strip everything
  return stripHtml(html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, ''))
}

function extractPreBlocks(html: string): string {
  const results: string[] = []
  const re = /<pre[^>]*>([\s\S]*?)<\/pre>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    results.push(stripHtml(m[1]))
  }
  return results.join('\n\n')
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
