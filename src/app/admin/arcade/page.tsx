'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Search, Gamepad2 } from 'lucide-react'

interface Bundle {
  id: string
  title: string
  description: string
  theme: string
  difficulty: string
  xpReward: number
  createdAt: string
  _count: { challenges: number }
}

export default function AdminArcadePage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/arcade/bundles')
      .then(r => r.json())
      .then(data => { setBundles(data); setLoading(false) })
  }, [])

  const filtered = bundles.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.theme.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('Delete this bundle and all its challenges? This cannot be undone.')) return
    await fetch(`/api/admin/arcade/bundles/${id}`, { method: 'DELETE' })
    setBundles(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Gamepad2 size={24} />
            Arcade Bundles
          </h1>
          <p className="text-text-secondary text-sm mt-1">{bundles.length} total bundles</p>
        </div>
        <Link
          href="/admin/arcade/new"
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
        >
          <Plus size={15} />
          New Bundle
        </Link>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search by title or theme…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-bg-surface border border-white/8 rounded-xl pl-8 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50 transition-colors"
        />
      </div>

      <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Title</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Theme</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Difficulty</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Challenges</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">XP</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-muted">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-muted">No bundles found.</td>
              </tr>
            ) : (
              filtered.map(bundle => (
                <tr key={bundle.id} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/arcade/${bundle.id}`} className="text-text-primary font-medium hover:text-accent-400 transition-colors">
                      {bundle.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{bundle.theme}</td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{bundle.difficulty}</td>
                  <td className="px-4 py-3 text-text-secondary">{bundle._count.challenges}</td>
                  <td className="px-4 py-3 text-accent-400 font-semibold">{bundle.xpReward}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/arcade/${bundle.id}`}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(bundle.id)}
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
