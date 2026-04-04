import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Film, Users, Activity, Plus } from 'lucide-react'

export default async function AdminDashboard() {
  const [clipCount, userCount, sessionCount] = await Promise.all([
    prisma.clip.count(),
    prisma.user.count(),
    prisma.userSession.count({ where: { status: 'complete' } }),
  ])

  const stats = [
    { label: 'Total Practices', value: clipCount, Icon: Film },
    { label: 'Learners', value: userCount, Icon: Users },
    { label: 'Sessions Completed', value: sessionCount, Icon: Activity },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Overview of seeneyu content and learners.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="bg-bg-surface border border-black/8 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-400/10 flex items-center justify-center">
              <Icon size={18} className="text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{value}</p>
              <p className="text-xs text-text-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          href="/admin/clips/new"
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
        >
          <Plus size={15} />
          Add Practice
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 bg-bg-surface border border-black/8 text-text-secondary rounded-xl px-4 py-2.5 text-sm font-medium hover:text-text-primary hover:bg-bg-overlay transition-all duration-150"
        >
          <Users size={15} />
          View Users
        </Link>
      </div>
    </div>
  )
}
