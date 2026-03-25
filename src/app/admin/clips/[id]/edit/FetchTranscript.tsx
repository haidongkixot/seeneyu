'use client'

import { useState } from 'react'
import { Loader2, MessageSquareText, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  clipId: string
  existingScript: string | null
}

export function FetchTranscript({ clipId, existingScript }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState<string | null>(existingScript)
  const [description, setDescription] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function fetchTranscript() {
    setLoading(true)
    setError('')
    setDone(false)
    try {
      const res = await fetch(`/api/admin/clips/${clipId}/transcript`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to fetch transcript')
      } else {
        setTranscript(data.transcript)
        setDescription(data.description)
        setDone(true)
      }
    } catch (err: any) {
      setError(err.message ?? 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const previewText = transcript
    ? expanded
      ? transcript
      : transcript.slice(0, 1500) + (transcript.length > 1500 ? '...' : '')
    : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={fetchTranscript}
          disabled={loading}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150 disabled:opacity-60"
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : done
            ? <CheckCircle size={14} />
            : <MessageSquareText size={14} />
          }
          {loading
            ? 'Fetching...'
            : done
            ? 'Fetched!'
            : transcript
            ? 'Re-fetch Transcript'
            : 'Fetch Transcript'}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {done && transcript && (
          <p className="text-sm text-success">
            Saved {transcript.length.toLocaleString()} characters to script field.
          </p>
        )}
      </div>

      {/* Video description if fetched */}
      {description && (
        <div className="bg-bg-base border border-black/8 rounded-xl p-4">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
            Video Description
          </p>
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
            {description.slice(0, 500)}{description.length > 500 ? '...' : ''}
          </p>
        </div>
      )}

      {/* Transcript display */}
      {previewText && (
        <div className="bg-bg-base border border-black/8 rounded-xl p-4">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
            Transcript (saved to script field)
          </p>
          <pre className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
            {previewText}
          </pre>
          {transcript && transcript.length > 1500 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 mt-3 transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Show less' : `Show all (${transcript.length.toLocaleString()} chars)`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
