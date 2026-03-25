'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, FileOutput, Search } from 'lucide-react'

const GAME_TYPES = [
  'guess_expression',
  'match_expression',
  'expression_king',
]

export default function NewExportPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [gameTypes, setGameTypes] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minScore, setMinScore] = useState('')
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function toggleGameType(type: string) {
    setGameTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function buildFilters() {
    const filters: any = {}
    if (gameTypes.length > 0) filters.gameTypes = gameTypes
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    if (minScore) filters.minScore = parseInt(minScore)
    return filters
  }

  async function handlePreview() {
    setPreviewing(true)
    const filters = buildFilters()
    try {
      const res = await fetch('/api/admin/data/stats')
      const data = await res.json()
      // Approximate: use total submissions as preview if no specific preview endpoint
      setPreviewCount(data.totalSubmissions ?? 0)
    } catch {
      setPreviewCount(0)
    }
    setPreviewing(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)

    const filters = buildFilters()

    // Create the export
    const res = await fetch('/api/admin/data/exports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, format, filters }),
    })

    if (res.ok) {
      const exportRecord = await res.json()
      // Trigger processing
      await fetch(`/api/admin/data/exports/${exportRecord.id}`, { method: 'POST' })
      router.push('/admin/data/exports')
    }
    setSubmitting(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/data/exports" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
          <ArrowLeft size={14} />
          Back to Exports
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">New Export</h1>
        <p className="text-text-secondary text-sm mt-1">Configure and create a data export</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-text-secondary block mb-1">Export Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              placeholder="e.g. Expression data March 2026"
            />
          </div>

          {/* Format */}
          <div>
            <label className="text-xs text-text-secondary block mb-1">Format</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value as 'csv' | 'json')}
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          {/* Game types */}
          <div>
            <label className="text-xs text-text-secondary block mb-2">Game Types (leave empty for all)</label>
            <div className="flex flex-wrap gap-2">
              {GAME_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleGameType(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    gameTypes.includes(type)
                      ? 'bg-accent-400/20 border-accent-400/40 text-accent-400'
                      : 'bg-bg-inset border-black/10 text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {type.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              />
            </div>
          </div>

          {/* Min score */}
          <div>
            <label className="text-xs text-text-secondary block mb-1">Minimum Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minScore}
              onChange={e => setMinScore(e.target.value)}
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Preview + submit */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-bg-surface border border-black/8 text-text-primary rounded-lg hover:bg-bg-overlay transition-colors disabled:opacity-50"
          >
            {previewing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Preview Count
          </button>
          {previewCount !== null && (
            <span className="text-sm text-text-secondary">~{previewCount} records</span>
          )}
          <div className="flex-1" />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <FileOutput size={14} />}
            Create & Run Export
          </button>
        </div>
      </form>
    </div>
  )
}
