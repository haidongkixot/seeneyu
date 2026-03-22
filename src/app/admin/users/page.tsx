'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, UserMinus } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  _count: { userSessions: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false) })
  }, [])

  async function updateRole(id: string, role: 'admin' | 'learner') {
    const action = role === 'admin' ? 'promote to Admin' : 'demote to Learner'
    if (!confirm(`${action} this user?`)) return
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <p className="text-text-secondary text-sm mt-1">{users.length} registered learners</p>
      </div>

      <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Name</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Email</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Role</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Joined</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Sessions</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-muted">Loading…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-muted">No users yet.</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="text-text-primary font-medium hover:text-accent-400 transition-colors">
                      {user.name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-accent-400/20 text-accent-400' : 'bg-bg-inset text-text-muted'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{user._count.userSessions}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {user.role === 'learner' ? (
                        <button
                          onClick={() => updateRole(user.id, 'admin')}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors"
                          title="Promote to Admin"
                        >
                          <ShieldCheck size={12} />
                          Promote
                        </button>
                      ) : (
                        <button
                          onClick={() => updateRole(user.id, 'learner')}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-bg-overlay rounded-lg transition-colors"
                          title="Demote to Learner"
                        >
                          <UserMinus size={12} />
                          Demote
                        </button>
                      )}
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
