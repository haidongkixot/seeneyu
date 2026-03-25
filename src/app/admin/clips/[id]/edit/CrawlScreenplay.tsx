'use client'

import { useState, useEffect } from 'react'
import { Loader2, FileText, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  clipId: string
  hasScreenplaySource: boolean
  hasScreenplayText: boolean
}

export function CrawlScreenplay({ clipId, hasScreenplaySource, hasScreenplayText }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [charCount, setCharCount] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [screenplayText, setScreenplayText] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loadingText, setLoadingText] = useState(false)

  // Load stored screenplay text on mount if it exists
  useEffect(() => {
    if (hasScreenplayText) {
      setLoadingText(true)
      fetch(`/api/admin/clips/${clipId}/screenplay`)
        .then((res) => res.json())
        .then((data) => {
          if (data.screenplayText) {
            setScreenplayText(data.screenplayText)
          }
        })
        .catch(() => {})
        .finally(() => setLoadingText(false))
    }
  }, [clipId, hasScreenplayText])

  if (!hasScreenplaySource) {
    return (
      <p className="text-sm text-text-muted italic">
        No screenplay source URL set for this clip.
      </p>
    )
  }

  async function crawl() {
    setLoading(true)
    setError('')
    setDone(false)
    const res = await fetch(`/api/admin/clips/${clipId}/screenplay`, { method: 'POST' })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Crawl failed')
    } else {
      const data = await res.json()
      setCharCount(data.charCount)
      setDone(true)
      // Reload the screenplay text
      const textRes = await fetch(`/api/admin/clips/${clipId}/screenplay`)
      const textData = await textRes.json()
      if (textData.screenplayText) {
        setScreenplayText(textData.screenplayText)
      }
    }
  }

  const previewText = screenplayText
    ? expanded
      ? screenplayText
      : screenplayText.slice(0, 2000) + (screenplayText.length > 2000 ? '...' : '')
    : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={crawl}
          disabled={loading}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150 disabled:opacity-60"
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : done
            ? <CheckCircle size={14} />
            : <FileText size={14} />
          }
          {loading
            ? 'Crawling...'
            : done
            ? 'Crawled!'
            : hasScreenplayText
            ? 'Re-crawl Screenplay'
            : 'Crawl Screenplay'}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {done && charCount && (
          <p className="text-sm text-success">
            Saved {charCount.toLocaleString()} characters.
          </p>
        )}
      </div>

      {/* Inline screenplay text display */}
      {loadingText && (
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <Loader2 size={14} className="animate-spin" />
          Loading screenplay text...
        </div>
      )}

      {previewText && (
        <div className="bg-bg-base border border-black/8 rounded-xl p-4">
          <pre className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
            {previewText}
          </pre>
          {screenplayText && screenplayText.length > 2000 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 mt-3 transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Show less' : `Show all (${screenplayText.length.toLocaleString()} chars)`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
