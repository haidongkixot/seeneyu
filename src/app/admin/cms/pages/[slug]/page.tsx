'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function AdminCmsPageEditor() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [title, setTitle] = useState('')
  const [pageSlug, setPageSlug] = useState('')
  const [contentJson, setContentJson] = useState('')
  const [status, setStatus] = useState('draft')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`/api/admin/cms/pages/${slug}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title ?? '')
        setPageSlug(data.slug ?? '')
        setContentJson(JSON.stringify(data.content ?? {}, null, 2))
        setStatus(data.status ?? 'draft')
        setLoading(false)
      })
  }, [slug])

  async function handleSave() {
    setSaving(true)
    setMessage('')

    let content: unknown
    try {
      content = JSON.parse(contentJson)
    } catch {
      setMessage('Invalid JSON in content field')
      setSaving(false)
      return
    }

    const res = await fetch(`/api/admin/cms/pages/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug: pageSlug, content, status }),
    })

    if (res.ok) {
      setMessage('Saved successfully')
      if (pageSlug !== slug) {
        router.push(`/admin/cms/pages/${pageSlug}`)
      }
    } else {
      const err = await res.json()
      setMessage(`Error: ${err.error}`)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-text-muted">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/cms/pages"
          className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">Edit Page</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-bg-surface border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Slug</label>
          <input
            type="text"
            value={pageSlug}
            onChange={e => setPageSlug(e.target.value)}
            className="w-full bg-bg-surface border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent-400/50"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Content (JSON)</label>
          <textarea
            value={contentJson}
            onChange={e => setContentJson(e.target.value)}
            rows={16}
            className="w-full bg-bg-surface border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent-400/50 resize-y"
          />
          <p className="text-xs text-text-muted mt-1">
            Use {`{"html": "<h2>...</h2><p>...</p>"}`} for rich content.
          </p>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="bg-bg-surface border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {message && (
          <p className={`text-sm ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-accent-500 disabled:opacity-50 transition-all duration-150"
        >
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Page'}
        </button>
      </div>
    </div>
  )
}
