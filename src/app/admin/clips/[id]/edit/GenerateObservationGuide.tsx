'use client'

import { useState } from 'react'
import { Loader2, Sparkles, CheckCircle } from 'lucide-react'

interface Props {
  clipId: string
  hasGuide: boolean
}

export function GenerateObservationGuide({ clipId, hasGuide }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    setDone(false)
    try {
      const res = await fetch(`/api/admin/clips/${clipId}/observation`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Generation failed (${res.status})`)
      } else {
        setDone(true)
      }
    } catch (err: any) {
      setError(`Connection error: ${err?.message || 'Network request failed'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150 disabled:opacity-60"
      >
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : done
          ? <CheckCircle size={14} />
          : <Sparkles size={14} />
        }
        {loading ? 'Generating…' : done ? 'Generated!' : hasGuide ? 'Regenerate Guide' : 'Generate Guide'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {done && <p className="text-sm text-success">Guide saved. Reload the clip page to preview it.</p>}
    </div>
  )
}
