import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Users, ChevronRight } from 'lucide-react'

export default async function AdminTeamsPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role

  if (!session || role !== 'admin') redirect('/dashboard')

  const teams = await (prisma as any).teamPlan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      admin: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true } },
    },
  }).catch(() => [])

  return (
    <div className="min-h-screen bg-bg-base">
      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent-400/10 flex items-center justify-center">
            <Users size={20} className="text-accent-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Team Plans</h1>
            <p className="text-sm text-text-secondary">{teams.length} active team{teams.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="bg-bg-surface border border-black/8 rounded-2xl px-6 py-12 text-center">
            <p className="text-text-secondary text-sm">No team plans yet.</p>
          </div>
        ) : (
          <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-black/8 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
              <div className="col-span-2">Team</div>
              <div>Admin</div>
              <div>Seats</div>
              <div>Status</div>
            </div>
            <div className="divide-y divide-black/5">
              {teams.map((team: any) => (
                <Link
                  key={team.id}
                  href={`/admin/teams/${team.id}`}
                  className="grid grid-cols-5 gap-4 px-5 py-4 hover:bg-bg-overlay transition-colors group items-center"
                >
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-accent-400 transition-colors">{team.name}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{team._count.members} members</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-primary truncate">{team.admin?.name ?? '—'}</p>
                    <p className="text-xs text-text-tertiary truncate">{team.admin?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-primary">{team.seats} seats</p>
                    <p className="text-xs text-text-tertiary">${(team.seats * team.pricePerSeat).toFixed(0)}/mo</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${
                      team.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {team.status}
                    </span>
                    <ChevronRight size={14} className="text-text-muted group-hover:text-accent-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
