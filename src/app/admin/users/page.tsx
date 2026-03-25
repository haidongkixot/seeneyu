'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ShieldCheck, UserMinus, CheckCircle2, XCircle, Clock, Ban, X } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  statusNote: string | null
  approvedAt: string | null
  approvedBy: string | null
  createdAt: string
  _count: { userSessions: number }
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'suspended'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
]

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-accent-400/20 text-accent-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
    suspended: 'bg-red-500/20 text-red-400',
  }
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock size={10} />,
    approved: <CheckCircle2 size={10} />,
    rejected: <XCircle size={10} />,
    suspended: <Ban size={10} />,
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-bg-inset text-text-muted'}`}>
      {icons[status]}
      {status}
    </span>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    const url = filter === 'all' ? '/api/admin/users' : `/api/admin/users?status=${filter}`
    fetch(url)
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function updateStatus(id: string, status: string, statusNote?: string) {
    setActionLoading(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, statusNote }),
    })
    if (res.ok) {
      const updated = await res.json()
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u))
    }
    setActionLoading(null)
    setRejectingId(null)
    setRejectNote('')
  }

  async function updateRole(id: string, role: 'admin' | 'learner') {
    const action = role === 'admin' ? 'promote to Admin' : 'demote to Learner'
    if (!confirm(`${action} this user?`)) return
    setActionLoading(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      const updated = await res.json()
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u))
    }
    setActionLoading(null)
  }

  const pendingCount = users.filter(u => u.status === 'pending').length

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <p className="text-text-secondary text-sm mt-1">
          {users.length} registered users
          {pendingCount > 0 && (
            <span className="ml-2 text-accent-400 font-medium">
              ({pendingCount} pending approval)
            </span>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 bg-bg-inset rounded-xl p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              filter === tab.value
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Name</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Email</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Role</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Joined</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Sessions</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-text-muted">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-text-muted">No users found.</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="text-text-primary font-medium hover:text-accent-400 transition-colors">
                      {user.name ?? '\u2014'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-accent-400/20 text-accent-400' : 'bg-bg-inset text-text-muted'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                    {user.statusNote && (
                      <p className="mt-0.5 text-[10px] text-text-muted truncate max-w-[140px]" title={user.statusNote}>
                        {user.statusNote}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{user._count.userSessions}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Approval actions for pending users */}
                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(user.id, 'approved')}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle2 size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectingId(user.id); setRejectNote('') }}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                        </>
                      )}

                      {/* Suspend action for approved users */}
                      {user.status === 'approved' && (
                        <button
                          onClick={() => {
                            if (confirm('Suspend this user?')) updateStatus(user.id, 'suspended')
                          }}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Suspend"
                        >
                          <Ban size={12} />
                          Suspend
                        </button>
                      )}

                      {/* Re-approve for rejected/suspended */}
                      {(user.status === 'rejected' || user.status === 'suspended') && (
                        <button
                          onClick={() => updateStatus(user.id, 'approved')}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Re-approve"
                        >
                          <CheckCircle2 size={12} />
                          Re-approve
                        </button>
                      )}

                      {/* Role management */}
                      {user.status === 'approved' && (
                        <>
                          {user.role === 'learner' ? (
                            <button
                              onClick={() => updateRole(user.id, 'admin')}
                              disabled={actionLoading === user.id}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Promote to Admin"
                            >
                              <ShieldCheck size={12} />
                              Promote
                            </button>
                          ) : (
                            <button
                              onClick={() => updateRole(user.id, 'learner')}
                              disabled={actionLoading === user.id}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-bg-overlay rounded-lg transition-colors disabled:opacity-50"
                              title="Demote to Learner"
                            >
                              <UserMinus size={12} />
                              Demote
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Reject reason input */}
                    {rejectingId === user.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={rejectNote}
                          onChange={e => setRejectNote(e.target.value)}
                          placeholder="Rejection reason (optional)"
                          className="flex-1 bg-bg-inset border border-white/10 rounded-lg px-2 py-1 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-red-400/50"
                          autoFocus
                        />
                        <button
                          onClick={() => updateStatus(user.id, 'rejected', rejectNote || undefined)}
                          disabled={actionLoading === user.id}
                          className="px-2 py-1 text-xs font-medium text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectNote('') }}
                          className="p-1 text-text-muted hover:text-text-secondary transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
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
