'use client'

import { useState, useEffect } from 'react'
import { Tag, Trash2, Plus, RefreshCw } from 'lucide-react'

interface ClipTag {
  id: string
  clipId: string
  category: string
  value: string
  source: string
  confidence: number | null
}

interface ClipWithTags {
  id: string
  movieTitle: string
  skillCategory: string
  isActive: boolean
  tags: ClipTag[]
}

const CATEGORIES = ['genre', 'purpose', 'trait'] as const
const CATEGORY_VALUES: Record<string, string[]> = {
  genre: ['drama', 'comedy', 'action', 'thriller', 'romance', 'ted-talk', 'ai-generated', 'documentary', 'animation'],
  purpose: ['for-work', 'for-hobby', 'for-performing', 'for-education', 'for-social', 'for-leadership'],
  trait: ['confident', 'empathetic', 'aggressive', 'vulnerable', 'humorous', 'authoritative', 'calm', 'passionate'],
}

const CATEGORY_COLORS: Record<string, string> = {
  genre: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  purpose: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  trait: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
}

export default function AdminTagsPage() {
  const [clips, setClips] = useState<ClipWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'tagged' | 'untagged'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => { loadClips() }, [])

  async function loadClips() {
    setLoading(true)
    const res = await fetch('/api/admin/clips?limit=200')
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    // Fetch tags for each clip
    const clipsWithTags: ClipWithTags[] = await Promise.all(
      data.clips.map(async (clip: any) => {
        const tagRes = await fetch(`/api/admin/clips/${clip.id}/tags`)
        const tagData = tagRes.ok ? await tagRes.json() : { tags: [] }
        return { ...clip, tags: tagData.tags }
      })
    )
    setClips(clipsWithTags)
    setLoading(false)
  }

  async function addTag(clipId: string, category: string, value: string) {
    const res = await fetch(`/api/admin/clips/${clipId}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, value }),
    })
    if (res.ok) {
      const { tag } = await res.json()
      setClips(prev => prev.map(c =>
        c.id === clipId ? { ...c, tags: [...c.tags.filter(t => t.id !== tag.id), tag] } : c
      ))
    }
  }

  async function removeTag(clipId: string, tagId: string) {
    const res = await fetch(`/api/admin/clips/${clipId}/tags?tagId=${tagId}`, { method: 'DELETE' })
    if (res.ok) {
      setClips(prev => prev.map(c =>
        c.id === clipId ? { ...c, tags: c.tags.filter(t => t.id !== tagId) } : c
      ))
    }
  }

  const filtered = clips.filter(c => {
    if (filter === 'tagged' && c.tags.length === 0) return false
    if (filter === 'untagged' && c.tags.length > 0) return false
    if (search && !c.movieTitle.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalTags = clips.reduce((acc, c) => acc + c.tags.length, 0)
  const clipsWithTags = clips.filter(c => c.tags.length > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Clip Tags</h1>
          <p className="text-sm text-text-secondary mt-1">
            {clipsWithTags}/{clips.length} clips tagged · {totalTags} total tags
          </p>
        </div>
        <button
          onClick={loadClips}
          className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-black/10 rounded-xl text-sm hover:bg-bg-overlay transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search clips..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-bg-surface border border-black/10 rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-400/40"
        />
        {(['all', 'tagged', 'untagged'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f ? 'bg-accent-400/10 text-accent-400 border border-accent-400/30' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-tertiary">Loading clips...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(clip => (
            <div key={clip.id} className="bg-bg-surface border border-black/8 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{clip.movieTitle}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {clip.skillCategory} · {clip.isActive ? 'Active' : 'Inactive'} · {clip.tags.length} tags
                  </p>
                </div>
              </div>

              {/* Current tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {clip.tags.map(tag => (
                  <span
                    key={tag.id}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-pill border ${CATEGORY_COLORS[tag.category] ?? 'bg-black/5 text-text-secondary border-black/10'}`}
                  >
                    {tag.category}:{tag.value}
                    {tag.confidence != null && <span className="opacity-60">({Math.round(tag.confidence * 100)}%)</span>}
                    <button onClick={() => removeTag(clip.id, tag.id)} className="ml-0.5 opacity-60 hover:opacity-100">
                      <Trash2 size={10} />
                    </button>
                  </span>
                ))}
                {clip.tags.length === 0 && (
                  <span className="text-xs text-text-tertiary">No tags yet</span>
                )}
              </div>

              {/* Add tag dropdowns */}
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <select
                    key={cat}
                    onChange={e => { if (e.target.value) { addTag(clip.id, cat, e.target.value); e.target.value = '' } }}
                    className="text-xs px-2 py-1.5 bg-bg-base border border-black/10 rounded-lg text-text-secondary focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>+ {cat}</option>
                    {CATEGORY_VALUES[cat]
                      .filter(v => !clip.tags.some(t => t.category === cat && t.value === v))
                      .map(v => <option key={v} value={v}>{v}</option>)
                    }
                  </select>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
