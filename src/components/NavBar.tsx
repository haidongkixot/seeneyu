'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Library, LayoutDashboard, Menu, X, User, LogOut, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'

export function NavBar() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const { data: session } = useSession()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const baseLinks = [
    { href: '/library', label: 'Library', Icon: Library },
  ]

  const authLinks = session
    ? [{ href: '/dashboard', label: 'My Path', Icon: LayoutDashboard }]
    : []

  const navLinks = [...baseLinks, ...authLinks]

  const userRole = (session?.user as any)?.role
  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <nav className="sticky top-0 z-[50] h-14 bg-bg-surface/80 backdrop-blur-md border-b border-white/8 flex items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-black text-lg tracking-tight text-text-primary hover:text-accent-400 transition-colors duration-150">
          seeneyu
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 md:gap-2">
          {navLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150',
                isActive(href)
                  ? 'text-accent-400 bg-accent-400/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-overlay',
              )}
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </Link>
          ))}

          {session ? (
            <div className="relative ml-2">
              <button
                onClick={() => setAvatarOpen(o => !o)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-400/20 text-accent-400 text-xs font-bold hover:bg-accent-400/30 transition-colors"
                aria-label="Account menu"
              >
                {initials}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-10 w-48 bg-bg-elevated border border-white/8 rounded-xl shadow-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-white/8">
                    <p className="text-sm text-text-primary font-medium truncate">{session.user?.name ?? session.user?.email}</p>
                    <p className="text-xs text-text-muted capitalize">{userRole}</p>
                  </div>
                  {userRole === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
                    >
                      <ShieldCheck size={14} />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { setAvatarOpen(false); signOut({ callbackUrl: '/' }) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/auth/signin"
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-all duration-150"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-accent-400 text-text-inverse rounded-pill px-4 py-1.5 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
          onClick={() => setDrawerOpen(o => !o)}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
        >
          {drawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden sticky top-14 z-[49] bg-bg-surface/95 backdrop-blur-md border-b border-white/8 px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                isActive(href)
                  ? 'text-accent-400 bg-accent-400/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-overlay',
              )}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </Link>
          ))}

          {session ? (
            <>
              {userRole === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-all duration-150"
                >
                  <ShieldCheck size={16} strokeWidth={1.5} />
                  Admin
                </Link>
              )}
              <button
                onClick={() => { setDrawerOpen(false); signOut({ callbackUrl: '/' }) }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-all duration-150"
              >
                <LogOut size={16} strokeWidth={1.5} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-all duration-150"
              >
                <User size={16} strokeWidth={1.5} />
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setDrawerOpen(false)}
                className="mt-1 bg-accent-400 text-text-inverse rounded-pill px-4 py-2.5 text-sm font-semibold text-center hover:bg-accent-500 transition-all duration-150"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </>
  )
}
