'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react'

const EXPRESSION_LABELS = [
  'surprise', 'happiness', 'sadness', 'anger', 'fear',
  'disgust', 'contempt', 'neutral',
]

interface Submission {
  id: string
  challengeLabel: string
  imageUrl: string
  aiScore: number | null
  aiAnalysis: string | null
  status: string
  createdAt: string
  label?: {
    id: string
    expressionLabel: string
    confidence: number
    validatedBy: string | null
    validatedAt: string | null
  } | null
}

export default function LabelsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expressionFilter, setExpressionFilter] = useState('')
  const [validationFilter, setValidationFilter] = useState<'all' | 'validated' | 'unvalidated'>('all')
  const [savingId, setSavingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch submissions
      const params = new URLSearchParams({ page: String(page) })
      if (expressionFilter) params.set('label', expressionFilter)
      const res = await fetch(`/api/admin/data/labels?${params}`)
      const labelsData = await res.json()

      // Also fetch expression submissions for the grid
      // We'll use submissions directly from the ExpressionSubmission table
      const subRes = await fetch(`/api/admin/data/labels?page=${page}${expressionFilter ? `&expression=${expressionFilter}` : ''}`)
      const subData = await subRes.json()

      // We need to get submissions from the ExpressionSubmission table
      // For now, let's use what we have and enrich with label data
      setSubmissions([])
      setTotalPages(subData.totalPages || 1)

      // Fetch actual expression submissions via a dedicated call
      const fetchSubs = await fetch(`/api/admin/data/submissions?page=${page}${expressionFilter ? `&expression=${expressionFilter}` : ''}`)
      if (fetchSubs.ok) {
        const data = await fetchSubs.json()
        setSubmissions(data.submissions || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      // fallback
    }
    setLoading(false)
  }, [page, expressionFilter])

  useEffect(() => { fetchData() }, [fetchData])

  async function validateLabel(submissionId: string, expressionLabel: string, confidence: number) {
    setSavingId(submissionId)
    await fetch('/api/admin/data/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, expressionLabel, confidence }),
    })
    setSavingId(null)
    fetchData()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Training Data Labels</h1>
        <p className="text-text-secondary text-sm mt-1">Validate and label expression submissions</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="text-xs text-text-muted block mb-1">Expression</label>
          <select
            value={expressionFilter}
            onChange={e => { setExpressionFilter(e.target.value); setPage(1) }}
            className="bg-bg-inset border border-black/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
          >
            <option value="">All expressions</option>
            {EXPRESSION_LABELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Status</label>
          <select
            value={validationFilter}
            onChange={e => setValidationFilter(e.target.value as any)}
            className="bg-bg-inset border border-black/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
          >
            <option value="all">All</option>
            <option value="validated">Validated</option>
            <option value="unvalidated">Unvalidated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-text-muted" size={24} />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-8 text-center text-text-muted text-sm">
          No expression submissions found. Submissions will appear here as users play mini-games.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {submissions
              .filter(s => {
                if (validationFilter === 'validated') return s.label?.validatedBy
                if (validationFilter === 'unvalidated') return !s.label?.validatedBy
                return true
              })
              .map(sub => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  saving={savingId === sub.id}
                  onValidate={validateLabel}
                />
              ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SubmissionCard({
  submission,
  saving,
  onValidate,
}: {
  submission: Submission
  saving: boolean
  onValidate: (id: string, label: string, confidence: number) => void
}) {
  const [selectedLabel, setSelectedLabel] = useState(
    submission.label?.expressionLabel || submission.challengeLabel
  )
  const isValidated = !!submission.label?.validatedBy

  return (
    <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
      {/* Thumbnail */}
      <div className="aspect-square bg-bg-inset relative">
        <img
          src={submission.imageUrl}
          alt={submission.challengeLabel}
          className="w-full h-full object-cover"
        />
        {isValidated && (
          <div className="absolute top-2 right-2 bg-emerald-500/90 rounded-full p-1">
            <Check size={12} className="text-white" />
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        {/* AI label */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">AI Label:</span>
          <span className="text-xs font-medium text-text-primary capitalize">{submission.challengeLabel}</span>
        </div>
        {submission.aiScore != null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">AI Score:</span>
            <span className="text-xs font-medium text-accent-400">{submission.aiScore}/100</span>
          </div>
        )}

        {/* Validation controls */}
        <div>
          <select
            value={selectedLabel}
            onChange={e => setSelectedLabel(e.target.value)}
            className="w-full bg-bg-inset border border-black/10 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-400/50"
          >
            {EXPRESSION_LABELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onValidate(submission.id, selectedLabel, 1.0)}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            isValidated
              ? 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
              : 'bg-accent-400/10 text-accent-400 hover:bg-accent-400/20'
          } disabled:opacity-50`}
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isValidated ? (
            <>
              <Check size={12} />
              Update
            </>
          ) : (
            'Validate'
          )}
        </button>
      </div>
    </div>
  )
}
