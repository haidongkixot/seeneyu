export type ContentSourceType = 'article' | 'research_paper' | 'expression_db' | 'youtube_timestamp'
export type ContentSourceStatus = 'raw' | 'curated' | 'published' | 'rejected'
export type ExpressionAssetStatus = 'pending' | 'verified' | 'rejected'

export interface CrawlerConfig {
  maxConcurrency: number
  timeoutMs: number
  userAgent: string
}

export interface CrawlSource {
  url: string
  type: ContentSourceType
  title?: string
  metadata?: Record<string, unknown>
}

export interface CrawledArticle {
  title: string
  bodyText: string
  images: string[]
  url: string
}

export interface Timestamp {
  time: number // seconds
  label: string
}

export interface ExpressionAssetInput {
  imageUrl: string
  label: string
  tags: string[]
  sourceUrl?: string
  description?: string
  confidence?: number
}

export const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  maxConcurrency: 3,
  timeoutMs: 15000,
  userAgent: 'seeneyu-crawler/1.0 (+https://seeneyu.com)',
}
