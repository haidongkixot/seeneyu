'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2, XCircle, RefreshCw,
  X, Send, Image as ImageIcon, Clock, Eye,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface AiAsset {
  id: string
  provider: string
  model: string
  blobUrl: string | null
  type: string
  prompt: string | null
  status: string
  errorMessage: string | null
  metadata: any
  createdAt: string
}

interface AiRequest {
  id: string
  expressionType: string
  bodyLanguageType: string
  scenePrompt: string | null
  generatedDescription: any
  imagePrompt: string | null
  provider: string
  model: string
  status: string
  publishedClipId: string | null
  createdAt: string
  updatedAt: string
  assets: AiAsset[]
}

interface Provider {
  id: string
  name: string
  models: { id: string; name: string; type: string }[]
  available: boolean
}

// ── Status Badge ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-blue-500/20 text-blue-400',
    generating: 'bg-amber-500/20 text-amber-400',
    review: 'bg-purple-500/20 text-purple-400',
    published: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
    ready: 'bg-emerald-500/20 text-emerald-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-bg-inset text-text-muted'}`}>
      {status === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {status}
    </span>
  )
}

// ── Full-size Image Modal ────────────────────────────────────────────

function ImageModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
        <X size={24} />
      </button>
      <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Generated content" className="max-w-full max-h-[90vh] rounded-xl" />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function AiGeneratorDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [request, setRequest] = useState<AiRequest | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [editPrompt, setEditPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [regenProvider, setRegenProvider] = useState('')
  const [regenModel, setRegenModel] = useState('')
  const [regenCount, setRegenCount] = useState(3)
  const [error, setError] = useState('')

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/toolkit/ai-generator/requests/${id}`)
      if (res.ok) {
        const data: AiRequest = await res.json()
        setRequest(data)
        setEditPrompt(data.imagePrompt || '')
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [id])

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/toolkit/ai-generator/providers')
      if (res.ok) {
        const data: Provider[] = await res.json()
        setProviders(data)
        const first = data.find((p) => p.available)
        if (first) {
          setRegenProvider(first.id)
          setRegenModel(first.models[0]?.id || '')
        }
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchRequest()
    fetchProviders()
  }, [fetchRequest, fetchProviders])

  // Poll for generating status
  useEffect(() => {
    if (request?.status !== 'generating') return
    const interval = setInterval(fetchRequest, 3000)
    return () => clearInterval(interval)
  }, [request?.status, fetchRequest])

  async function savePrompt() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/toolkit/ai-generator/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt: editPrompt }),
      })
      if (res.ok) {
        const data = await res.json()
        setRequest(data)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save')
      }
    } catch { setError('Failed to save') }
    setSaving(false)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setError('')
    try {
      // Save prompt first if changed
      if (editPrompt !== request?.imagePrompt) {
        await fetch(`/api/admin/toolkit/ai-generator/requests/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePrompt: editPrompt }),
        })
      }

      const selectedProv = providers.find((p) => p.id === regenProvider)
      const assetType = selectedProv?.models.find((m) => m.id === regenModel)?.type ?? 'image'

      const res = await fetch(`/api/admin/toolkit/ai-generator/requests/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: regenProvider || undefined,
          model: regenModel || undefined,
          count: regenCount,
          type: assetType,
        }),
      })
      if (res.ok) {
        fetchRequest()
      } else {
        const data = await res.json()
        setError(data.error || 'Generation failed')
      }
    } catch { setError('Generation failed') }
    setRegenerating(false)
  }

  async function handlePublish(assetId: string) {
    if (!confirm('Publish this asset to the clip library?')) return
    setPublishing(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/toolkit/ai-generator/requests/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      if (res.ok) {
        fetchRequest()
      } else {
        const data = await res.json()
        setError(data.error || 'Publish failed')
      }
    } catch { setError('Publish failed') }
    setPublishing(false)
  }

  const currentRegenProvider = providers.find((p) => p.id === regenProvider)

  function handleRegenProviderChange(providerId: string) {
    setRegenProvider(providerId)
    const provider = providers.find((p) => p.id === providerId)
    if (provider?.models.length) {
      setRegenModel(provider.models[0].id)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="p-8">
        <p className="text-text-muted">Request not found.</p>
        <Link href="/admin/toolkit/ai-generator" className="text-accent-400 text-sm mt-2 inline-block">
          Back to AI Generator
        </Link>
      </div>
    )
  }

  const readyAssets = request.assets.filter((a) => a.status === 'ready')
  const generatingAssets = request.assets.filter((a) => a.status === 'generating')
  const failedAssets = request.assets.filter((a) => a.status === 'failed')

  // Status timeline steps
  const timeline = [
    { label: 'Draft', key: 'draft', Icon: Sparkles },
    { label: 'Generating', key: 'generating', Icon: Loader2 },
    { label: 'Review', key: 'review', Icon: Eye },
    { label: 'Published', key: 'published', Icon: CheckCircle2 },
  ]
  const statusOrder = ['draft', 'generating', 'review', 'published']
  const currentIdx = statusOrder.indexOf(request.status)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/toolkit/ai-generator" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3">
          <ArrowLeft size={12} /> Back to AI Generator
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary capitalize">
                {request.expressionType} / {request.bodyLanguageType}
              </h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-text-secondary text-sm mt-1">
              Created {new Date(request.createdAt).toLocaleString()} · {request.provider}/{request.model}
            </p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2">
          {timeline.map((step, i) => {
            const isActive = step.key === request.status
            const isPast = i < currentIdx
            const isFailed = request.status === 'failed'
            return (
              <div key={step.key} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? isFailed ? 'bg-red-500/20 text-red-400' : 'bg-accent-400/20 text-accent-400'
                    : isPast ? 'bg-emerald-500/10 text-emerald-400' : 'bg-bg-inset text-text-muted'
                }`}>
                  <step.Icon size={12} className={isActive && step.key === 'generating' ? 'animate-spin' : ''} />
                  {step.label}
                </div>
                {i < timeline.length - 1 && (
                  <div className={`flex-1 h-px ${isPast ? 'bg-emerald-500/30' : 'bg-black/10'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Description + Prompt */}
        <div className="lg:col-span-1 space-y-4">
          {/* Description */}
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-text-primary leading-relaxed">{request.generatedDescription?.sceneDescription || 'No description generated yet.'}</p>
            {request.scenePrompt && (
              <div className="mt-3 pt-3 border-t border-black/[0.04]">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Scene</span>
                <p className="text-xs text-text-secondary mt-0.5">{request.scenePrompt}</p>
              </div>
            )}
          </div>

          {/* Editable Prompt */}
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Image Prompt</h3>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              rows={6}
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50 resize-none"
            />
            <button
              onClick={savePrompt}
              disabled={saving || editPrompt === request.imagePrompt}
              className="mt-2 px-3 py-1.5 text-xs font-medium bg-accent-400/10 text-accent-400 rounded-lg hover:bg-accent-400/20 transition-colors disabled:opacity-30"
            >
              {saving ? 'Saving...' : 'Save Prompt'}
            </button>
          </div>

          {/* Regenerate Controls */}
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Regenerate</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-text-muted mb-1">Provider</label>
                <select
                  value={regenProvider}
                  onChange={(e) => handleRegenProviderChange(e.target.value)}
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-400/50"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id} disabled={!p.available}>
                      {p.name}{!p.available ? ' (no key)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-text-muted mb-1">Model</label>
                <select
                  value={regenModel}
                  onChange={(e) => setRegenModel(e.target.value)}
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-400/50"
                >
                  {(currentRegenProvider?.models ?? []).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-text-muted mb-1">Count (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={regenCount}
                  onChange={(e) => setRegenCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 bg-bg-inset border border-black/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-400/50"
                />
              </div>
              <button
                onClick={handleRegenerate}
                disabled={regenerating || request.status === 'generating'}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50"
              >
                {regenerating ? (
                  <><Loader2 size={12} className="animate-spin" /> Generating...</>
                ) : (
                  <><RefreshCw size={12} /> Regenerate Images</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Assets Grid */}
        <div className="lg:col-span-2">
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Generated Assets ({request.assets.length})
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                {readyAssets.length > 0 && <span className="text-emerald-400">{readyAssets.length} ready</span>}
                {generatingAssets.length > 0 && <span className="text-amber-400">{generatingAssets.length} generating</span>}
                {failedAssets.length > 0 && <span className="text-red-400">{failedAssets.length} failed</span>}
              </div>
            </div>

            {request.assets.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-sm">
                No assets generated yet. Click "Regenerate" to create images.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.assets.map((asset) => (
                  <div key={asset.id} className="bg-bg-overlay border border-black/[0.04] rounded-xl overflow-hidden group">
                    <div className="aspect-square bg-bg-inset relative">
                      {asset.status === 'generating' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <Loader2 size={24} className="animate-spin text-amber-400" />
                          <span className="text-[10px] text-text-muted">Generating...</span>
                        </div>
                      ) : asset.status === 'failed' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <XCircle size={24} className="text-red-400" />
                          <span className="text-[10px] text-red-400 px-2 text-center">{asset.errorMessage || 'Failed'}</span>
                        </div>
                      ) : asset.blobUrl ? (
                        <button
                          onClick={() => setSelectedImage(asset.blobUrl!)}
                          className="w-full h-full"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset.blobUrl}
                            alt="Generated asset"
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </button>
                      ) : null}
                      <div className="absolute top-2 right-2">
                        <StatusBadge status={asset.status} />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-text-muted">{asset.provider}/{asset.model}</span>
                      </div>
                      {asset.status === 'ready' && request.status !== 'published' && (
                        <button
                          onClick={() => handlePublish(asset.id)}
                          disabled={publishing}
                          className="w-full mt-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Send size={10} /> Publish to Library
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published Clip Info */}
          {request.publishedClipId && (
            <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Published to Library</p>
                <Link
                  href={`/library/${request.publishedClipId}`}
                  className="text-xs text-emerald-400/70 hover:text-emerald-400 underline"
                >
                  View clip in library
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && <ImageModal url={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  )
}
