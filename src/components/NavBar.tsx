'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Library, LayoutDashboard, Menu, X, User, LogOut, ShieldCheck, BookOpen, Zap, Gamepad2, ExternalLink, CreditCard, UserCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { GamificationBar } from '@/components/gamification/GamificationBar'

export function NavBar() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const { data: session } = useSession()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const baseLinks = [
    { href: '/library', label: 'Library', Icon: Library, tour: 'nav-library' },
    { href: '/knowledge', label: 'Learn', Icon: BookOpen, tour: 'nav-learn' },
    { href: '/foundation', label: 'Foundation', Icon: BookOpen, tour: 'nav-foundation' },
    { href: '/arcade', label: 'Arcade', Icon: Zap, tour: 'nav-arcade' },
    { href: '/games', label: 'Games', Icon: Gamepad2, tour: 'nav-games' },
    { href: '/pricing', label: 'Pricing', Icon: CreditCard, tour: 'nav-pricing' },
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
      <nav className="sticky top-0 z-[50] h-14 bg-bg-surface/80 backdrop-blur-md border-b border-black/8 flex items-center justify-between px-3 lg:px-8">
        <Link href="/" className="flex flex-col leading-none gap-0.5">
          <span className="text-lg font-bold text-text-primary tracking-tight">
            seeneyu
          </span>
          <a
            href="https://www.peetees.ai"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-medium text-text-tertiary hover:text-accent-400 transition-colors duration-150 flex items-center gap-0.5"
          >
            by PeeTeeAI
            <ExternalLink size={8} className="opacity-60" />
          </a>
        </Link>

        {/* Desktop nav — hidden on mobile (BottomTabBar handles mobile nav) */}
        <div className="hidden md:flex items-center gap-1 md:gap-2">
          {navLinks.map(({ href, label, Icon, tour }: any) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              {...(tour ? { 'data-tour': tour } : {})}
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
            <>
              <div className="hidden md:flex ml-2">
                <GamificationBar />
              </div>
              <div className="relative ml-2">
                <button
                  onClick={() => setAvatarOpen(o => !o)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-400/20 text-accent-400 text-xs font-bold hover:bg-accent-400/30 transition-colors"
                  aria-label="Account menu"
                >
                  {initials}
                </button>
              {avatarOpen && (
                <div className="absolute right-0 top-10 w-48 bg-bg-elevated border border-black/8 rounded-xl shadow-xl py-1 z-[100]">
                  <div className="px-3 py-2 border-b border-black/8">
                    <p className="text-sm text-text-primary font-medium truncate">{session.user?.name ?? session.user?.email}</p>
                    <p className="text-xs text-text-muted capitalize">{userRole}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
                  >
                    <UserCircle size={14} />
                    My Profile
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
                  >
                    <CreditCard size={14} />
                    Pricing
                  </Link>
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
            </>
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

        {/* Mobile: gamification bar + avatar only (nav links in BottomTabBar) */}
        <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
          {session && <GamificationBar />}
          {session ? (
            <div className="relative">
              <button
                onClick={() => setAvatarOpen(o => !o)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-400/20 text-accent-400 text-xs font-bold hover:bg-accent-400/30 transition-colors"
                aria-label="Account menu"
              >
                {initials}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-10 w-48 bg-bg-elevated border border-black/8 rounded-xl shadow-xl py-1 z-[100]">
                  <div className="px-3 py-2 border-b border-black/8">
                    <p className="text-sm text-text-primary font-medium truncate">{session.user?.name ?? session.user?.email}</p>
                    <p className="text-xs text-text-muted capitalize">{userRole}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
                  >
                    <UserCircle size={14} />
                    My Profile
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
                  >
                    <CreditCard size={14} />
                    Pricing
                  </Link>
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
            <Link
              href="/auth/signin"
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-lg transition-all duration-150"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
