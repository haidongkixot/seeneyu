'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload } from 'lucide-react'

export default function AdminCmsBlogEditor() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const isNew = slug === 'new'
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [tagsStr, setTagsStr] = useState('')
  const [status, setStatus] = useState('draft')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/cms/blog/${slug}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title ?? '')
        setPostSlug(data.slug ?? '')
        setExcerpt(data.excerpt ?? '')
        setBody(data.body ?? '')
        setCoverImage(data.coverImage ?? '')
        setTagsStr(Array.isArray(data.tags) ? data.tags.join(', ') : '')
        setStatus(data.status ?? 'draft')
        setLoading(false)
      })
  }, [slug, isNew])

  async function handleUploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/admin/cms/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const { url } = await res.json()
      setCoverImage(url)
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')

    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []

    if (isNew) {
      if (!postSlug || !title || !body) {
        setMessage('Title, slug, and body are required')
        setSaving(false)
        return
      }
      const res = await fetch('/api/admin/cms/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: postSlug, title, excerpt, body, coverImage, tags, status }),
      })
      if (res.ok) {
        const post = await res.json()
        router.push(`/admin/cms/blog/${post.slug}`)
      } else {
        const err = await res.json()
        setMessage(`Error: ${err.error}`)
      }
    } else {
      const res = await fetch(`/api/admin/cms/blog/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug: postSlug, excerpt, body, coverImage, tags, status }),
      })
      if (res.ok) {
        setMessage('Saved successfully')
        if (postSlug !== slug) {
          router.push(`/admin/cms/blog/${postSlug}`)
        }
      } else {
        const err = await res.json()
        setMessage(`Error: ${err.error}`)
      }
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
          href="/admin/cms/blog"
          className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">
          {isNew ? 'New Blog Post' : 'Edit Blog Post'}
        </h1>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Slug</label>
            <input
              type="text"
              value={postSlug}
              onChange={e => setPostSlug(e.target.value)}
              className="w-full bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent-400/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={2}
            className="w-full bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Body (HTML)</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={16}
            className="w-full bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent-400/50 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Cover Image</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              placeholder="URL or upload..."
              className="flex-1 bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            />
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadCover} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-bg-elevated border border-black/8 rounded-xl px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {coverImage && (
            <img src={coverImage} alt="Cover preview" className="mt-2 h-32 object-cover rounded-xl" />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              placeholder="body-language, tips, career"
              className="w-full bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
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
          {saving ? 'Saving...' : isNew ? 'Create Post' : 'Save Post'}
        </button>
      </div>
    </div>
  )
}
