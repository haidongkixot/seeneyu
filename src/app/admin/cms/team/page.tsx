'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Save, X, Upload, ArrowUp, ArrowDown } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  title: string
  bio: string | null
  avatarUrl: string | null
  order: number
  isActive: boolean
}

const empty: Omit<TeamMember, 'id'> = { name: '', title: '', bio: '', avatarUrl: '', order: 0, isActive: true }

export default function AdminCmsTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null) // id or 'new'
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/cms/team')
      .then(r => r.json())
      .then(data => { setMembers(data); setLoading(false) })
  }, [])

  function startEdit(m: TeamMember) {
    setEditing(m.id)
    setForm({ name: m.name, title: m.title, bio: m.bio ?? '', avatarUrl: m.avatarUrl ?? '', order: m.order, isActive: m.isActive })
  }

  function startNew() {
    setEditing('new')
    setForm({ ...empty, order: members.length })
  }

  function cancelEdit() {
    setEditing(null)
    setForm(empty)
  }

  async function handleUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/cms/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setForm(f => ({ ...f, avatarUrl: url }))
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editing === 'new') {
      const res = await fetch('/api/admin/cms/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const member = await res.json()
        setMembers(prev => [...prev, member].sort((a, b) => a.order - b.order))
        cancelEdit()
      }
    } else if (editing) {
      const res = await fetch(`/api/admin/cms/team/${editing}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const updated = await res.json()
        setMembers(prev => prev.map(m => m.id === updated.id ? updated : m).sort((a, b) => a.order - b.order))
        cancelEdit()
      }
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this team member?')) return
    await fetch(`/api/admin/cms/team/${id}`, { method: 'DELETE' })
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const idx = members.findIndex(m => m.id === id)
    if (direction === 'up' && idx <= 0) return
    if (direction === 'down' && idx >= members.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const updated = [...members]
    const tempOrder = updated[idx].order
    updated[idx].order = updated[swapIdx].order
    updated[swapIdx].order = tempOrder

    await Promise.all([
      fetch(`/api/admin/cms/team/${updated[idx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: updated[idx].order }),
      }),
      fetch(`/api/admin/cms/team/${updated[swapIdx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: updated[swapIdx].order }),
      }),
    ])

    setMembers(updated.sort((a, b) => a.order - b.order))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Team Members</h1>
          <p className="text-text-secondary text-sm mt-1">{members.length} members</p>
        </div>
        <button
          onClick={startNew}
          disabled={editing !== null}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 disabled:opacity-50 transition-all duration-150"
        >
          <Plus size={15} />
          Add Member
        </button>
      </div>

      {editing && (
        <div className="bg-bg-surface border border-accent-400/30 rounded-2xl p-5 mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {editing === 'new' ? 'New Member' : 'Edit Member'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-bg-elevated border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-bg-elevated border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Bio</label>
            <textarea
              value={form.bio ?? ''}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={2}
              className="w-full bg-bg-elevated border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50 resize-y"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Avatar</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={form.avatarUrl ?? ''}
                onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                placeholder="URL or upload..."
                className="flex-1 bg-bg-elevated border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              />
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadAvatar} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 bg-bg-elevated border border-white/8 rounded-xl px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <Upload size={14} />
                {uploading ? '...' : 'Upload'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                className="w-full bg-bg-elevated border border-white/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded"
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-accent-400 text-text-inverse rounded-xl px-4 py-2 text-sm font-semibold hover:bg-accent-500 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1.5 bg-bg-elevated text-text-secondary rounded-xl px-4 py-2 text-sm hover:text-text-primary transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <p className="text-text-muted py-8 text-center">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-text-muted py-8 text-center">No team members yet.</p>
        ) : (
          members.map((m, idx) => (
            <div
              key={m.id}
              className="bg-bg-surface border border-white/8 rounded-xl p-4 flex items-center gap-4 hover:border-white/12 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-bg-elevated border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-text-secondary">
                    {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{m.name}</p>
                <p className="text-xs text-text-secondary">{m.title}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${m.isActive ? 'bg-green-900/40 text-green-400' : 'bg-bg-inset text-text-muted'}`}>
                {m.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleReorder(m.id, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => handleReorder(m.id, 'down')}
                  disabled={idx === members.length - 1}
                  className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => startEdit(m)}
                  disabled={editing !== null}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg disabled:opacity-30 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
