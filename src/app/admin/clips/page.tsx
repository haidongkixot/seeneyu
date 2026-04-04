'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

interface Clip {
  id: string
  youtubeVideoId: string
  movieTitle: string
  skillCategory: string
  difficulty: string
  isActive: boolean
  createdAt: string
  mediaType?: string | null
  mediaUrl?: string | null
}

const PAGE_SIZE = 20

export default function AdminClipsPage() {
  const [clips, setClips] = useState<Clip[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/clips')
      .then(r => r.json())
      .then(data => { setClips(data); setLoading(false) })
  }, [])

  const filtered = clips.filter(c =>
    c.movieTitle.toLowerCase().includes(search.toLowerCase()) ||
    c.skillCategory.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  async function handleDelete(id: string) {
    if (!confirm('Delete this clip? This cannot be undone.')) return
    await fetch(`/api/admin/clips/${id}`, { method: 'DELETE' })
    setClips(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Practices</h1>
          <p className="text-text-secondary text-sm mt-1">{clips.length} total practices</p>
        </div>
        <Link
          href="/admin/clips/new"
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
        >
          <Plus size={15} />
          Add Practice
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search by title or skill…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="w-full bg-bg-surface border border-black/8 rounded-xl pl-8 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50 transition-colors"
        />
      </div>

      <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/8">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Thumbnail</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Movie / Title</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Skill</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Difficulty</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-muted">Loading…</td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-muted">No clips found.</td>
              </tr>
            ) : (
              paginated.map(clip => (
                <tr key={clip.id} className="border-b border-black/[0.04] hover:bg-bg-overlay transition-colors">
                  <td className="px-4 py-3">
                    {clip.mediaType === 'ai_image' && clip.mediaUrl ? (
                      <div className="relative">
                        <img src={clip.mediaUrl} alt="" className="w-16 h-10 object-cover rounded-lg" />
                        <span className="absolute -top-1 -right-1 text-[8px] font-medium text-purple-300 bg-purple-500/30 border border-purple-400/20 rounded-full px-1">AI</span>
                      </div>
                    ) : (
                      <img
                        src={`https://img.youtube.com/vi/${clip.youtubeVideoId}/default.jpg`}
                        alt=""
                        className="w-16 h-10 object-cover rounded-lg"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary font-medium">{clip.movieTitle}</td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{clip.skillCategory.replace(/-/g, ' ')}</td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{clip.difficulty}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${clip.isActive ? 'bg-green-900/40 text-green-400' : 'bg-bg-inset text-text-muted'}`}>
                      {clip.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/clips/${clip.id}/edit`}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(clip.id)}
                        className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-muted">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm bg-bg-surface border border-black/8 rounded-lg text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm bg-bg-surface border border-black/8 rounded-lg text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
