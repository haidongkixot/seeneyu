'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface CmsPage {
  id: string
  slug: string
  title: string
  status: string
  updatedAt: string
}

export default function AdminCmsPagesPage() {
  const [pages, setPages] = useState<CmsPage[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    fetch('/api/admin/cms/pages')
      .then(r => r.json())
      .then(data => { setPages(data); setLoading(false) })
  }, [])

  async function handleCreate() {
    if (!newSlug || !newTitle) return
    const res = await fetch('/api/admin/cms/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: newSlug, title: newTitle, content: { html: '' }, status: 'draft' }),
    })
    if (res.ok) {
      const page = await res.json()
      setPages(prev => [page, ...prev])
      setShowCreate(false)
      setNewSlug('')
      setNewTitle('')
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('Delete this page? This cannot be undone.')) return
    await fetch(`/api/admin/cms/pages/${slug}`, { method: 'DELETE' })
    setPages(prev => prev.filter(p => p.slug !== slug))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">CMS Pages</h1>
          <p className="text-text-secondary text-sm mt-1">{pages.length} pages</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
        >
          <Plus size={15} />
          Create Page
        </button>
      </div>

      {showCreate && (
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="slug (e.g. about)"
            value={newSlug}
            onChange={e => setNewSlug(e.target.value)}
            className="flex-1 bg-bg-elevated border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
          />
          <input
            type="text"
            placeholder="Page title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="flex-1 bg-bg-elevated border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="bg-accent-400 text-text-inverse rounded-xl px-4 py-2 text-sm font-semibold hover:bg-accent-500 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="bg-bg-elevated text-text-secondary rounded-xl px-4 py-2 text-sm hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Title</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Slug</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Updated</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-text-muted">Loading...</td></tr>
            ) : pages.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-text-muted">No pages yet.</td></tr>
            ) : (
              pages.map(page => (
                <tr key={page.id} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{page.title}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{page.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      page.status === 'published'
                        ? 'bg-green-900/40 text-green-400'
                        : 'bg-yellow-900/40 text-yellow-400'
                    }`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/cms/pages/${page.slug}`}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(page.slug)}
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
    </div>
  )
}
