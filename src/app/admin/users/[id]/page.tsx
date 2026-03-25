import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft } from 'lucide-react'

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      userSessions: {
        orderBy: { createdAt: 'desc' },
        include: { clip: { select: { movieTitle: true, skillCategory: true } } },
      },
    },
  })
  if (!user) notFound()

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
          <ArrowLeft size={14} />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">{user.name ?? user.email}</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-text-secondary text-sm">{user.email}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-accent-400/20 text-accent-400' : 'bg-bg-inset text-text-muted'}`}>
            {user.role}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 mb-6">
        <p className="text-sm text-text-secondary mb-1">Total Sessions</p>
        <p className="text-3xl font-bold text-text-primary">{user.userSessions.length}</p>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-3">Session History</h2>
      {user.userSessions.length === 0 ? (
        <p className="text-text-muted text-sm">No sessions yet.</p>
      ) : (
        <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Movie</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Skill</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Score</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {user.userSessions.map(session => {
                const scores = session.scores as any
                const overall = scores?.overallScore
                return (
                  <tr key={session.id} className="border-b border-black/[0.04] hover:bg-bg-overlay transition-colors">
                    <td className="px-4 py-3 text-text-primary">{session.clip.movieTitle}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{session.clip.skillCategory.replace(/-/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${session.status === 'complete' ? 'bg-green-900/40 text-green-400' : 'bg-bg-inset text-text-muted'}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{overall != null ? `${overall}/100` : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{new Date(session.createdAt).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
