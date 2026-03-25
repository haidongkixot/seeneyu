import { NavBar } from '@/components/NavBar'
import { prisma } from '@/lib/prisma'

async function getTeamMembers() {
  try {
    return await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function TeamPage() {
  const members = await getTeamMembers()

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
            The People
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
            Our Team
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Meet the people building the future of communication coaching.
          </p>
        </div>

        {members.length === 0 ? (
          <p className="text-center text-text-muted py-12">Team info coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => (
              <div
                key={member.id}
                className="flex flex-col items-center text-center p-6 bg-bg-surface border border-black/8 rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:border-accent-400/20 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-400 flex items-center justify-center mb-4 shadow-lg overflow-hidden">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-0.5">{member.name}</h3>
                <p className="text-xs font-medium text-accent-400 mb-3">{member.title}</p>
                {member.bio && (
                  <p className="text-sm text-text-secondary leading-relaxed">{member.bio}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
