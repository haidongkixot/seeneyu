'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  status: string
  publishedAt: string | null
  updatedAt: string
}

export default function AdminCmsBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const params = statusFilter ? `?status=${statusFilter}` : ''
    fetch(`/api/admin/cms/blog${params}`)
      .then(r => r.json())
      .then(data => { setPosts(data.posts ?? []); setLoading(false) })
  }, [statusFilter])

  async function handleDelete(slug: string) {
    if (!confirm('Delete this blog post? This cannot be undone.')) return
    await fetch(`/api/admin/cms/blog/${slug}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.slug !== slug))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Blog Posts</h1>
          <p className="text-text-secondary text-sm mt-1">{posts.length} posts</p>
        </div>
        <Link
          href="/admin/cms/blog/new"
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
        >
          <Plus size={15} />
          New Post
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'draft', 'published'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setLoading(true) }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              statusFilter === s
                ? 'border-accent-400/50 bg-accent-400/10 text-accent-400'
                : 'border-black/8 text-text-secondary hover:text-text-primary'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/8">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Title</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Slug</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Published</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-text-muted">Loading...</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-text-muted">No posts yet.</td></tr>
            ) : (
              posts.map(post => (
                <tr key={post.id} className="border-b border-black/[0.04] hover:bg-bg-overlay transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{post.title}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{post.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      post.status === 'published'
                        ? 'bg-green-900/40 text-green-400'
                        : 'bg-yellow-900/40 text-yellow-400'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/cms/blog/${post.slug}`}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.slug)}
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
