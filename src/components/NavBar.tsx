'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Library, TrendingUp, Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function NavBar() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const navLinks = [
    { href: '/library', label: 'Library', Icon: Library },
    { href: '/progress', label: 'Progress', Icon: TrendingUp },
  ]

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
          <Link
            href="/library"
            className="ml-2 bg-accent-400 text-text-inverse rounded-pill px-4 py-1.5 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150"
          >
            Get Started
          </Link>
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
          <Link
            href="/library"
            onClick={() => setDrawerOpen(false)}
            className="mt-1 bg-accent-400 text-text-inverse rounded-pill px-4 py-2.5 text-sm font-semibold text-center hover:bg-accent-500 transition-all duration-150"
          >
            Get Started
          </Link>
        </div>
      )}
    </>
  )
}
