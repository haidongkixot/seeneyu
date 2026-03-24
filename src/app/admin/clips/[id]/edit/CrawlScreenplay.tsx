'use client'

import { useState } from 'react'
import { Loader2, FileText, CheckCircle } from 'lucide-react'

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
    const res = await fetch(`/api/admin/clips/${clipId}/crawl-screenplay`, { method: 'POST' })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Crawl failed')
    } else {
      const data = await res.json()
      setCharCount(data.charCount)
      setDone(true)
    }
  }

  return (
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
          ? 'Crawling…'
          : done
          ? 'Crawled!'
          : hasScreenplayText
          ? 'Re-crawl Screenplay'
          : 'Crawl Screenplay'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {done && charCount && (
        <p className="text-sm text-success">
          Saved {charCount.toLocaleString()} characters. Reload to preview.
        </p>
      )}
    </div>
  )
}
