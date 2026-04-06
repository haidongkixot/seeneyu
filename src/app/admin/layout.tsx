import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { LayoutDashboard, Film, Users, Search, Upload, Gamepad2, BarChart3, CreditCard, Wrench, AlertTriangle, FileText, Database, Zap, Mail, Compass, Tags } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/auth/signin')
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/clips', label: 'Practices', Icon: Film },
    { href: '/admin/users', label: 'Users', Icon: Users },
    { href: '/admin/crawl-jobs', label: 'Materials', Icon: Search },
    { href: '/admin/import', label: 'Import', Icon: Upload },
    { href: '/admin/arcade', label: 'Arcade', Icon: Gamepad2 },
    { href: '/admin/analytics', label: 'Analytics', Icon: BarChart3 },
    { href: '/admin/plans', label: 'Plans', Icon: CreditCard },
    { href: '/admin/toolkit', label: 'Toolkit', Icon: Wrench },
    { href: '/admin/data', label: 'Data', Icon: Database },
    { href: '/admin/cms', label: 'CMS', Icon: FileText },
    { href: '/admin/engine', label: 'Engine', Icon: Zap },
    { href: '/admin/email', label: 'Email', Icon: Mail },
    { href: '/admin/cms/onboarding-tour', label: 'Tour', Icon: Compass },
    { href: '/admin/tags', label: 'Clip Tags', Icon: Tags },
    { href: '/admin/logs', label: 'Logs', Icon: AlertTriangle },
  ]

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside className="w-56 fixed top-0 left-0 h-full bg-bg-elevated border-r border-black/8 flex flex-col z-40">
        <div className="h-14 flex items-center px-4 border-b border-black/8">
          <Link href="/" className="font-black text-lg tracking-tight text-text-primary hover:text-accent-400 transition-colors">
            seeneyu
          </Link>
          <span className="ml-2 text-[10px] font-semibold bg-accent-400/20 text-accent-400 rounded px-1.5 py-0.5 uppercase tracking-wide">Admin</span>
        </div>
        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-all duration-150"
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-black/8">
          <p className="text-xs text-text-muted truncate">{(session.user as any).email}</p>
          <Link href="/" className="mt-1 text-xs text-text-secondary hover:text-text-primary transition-colors">← Back to app</Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
