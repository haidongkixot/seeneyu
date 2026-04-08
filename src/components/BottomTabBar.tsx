'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Library, BookOpen, Zap, Gamepad2, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/cn'

// Mirrors desktop NavBar baseLinks (icons + labels) so mobile and desktop
// stay consistent. 5 tabs max for usability.
const tabs = [
  { href: '/dashboard', label: 'My Path', Icon: LayoutDashboard },
  { href: '/library', label: 'Library', Icon: Library },
  { href: '/foundation', label: 'Foundation', Icon: BookOpen },
  { href: '/arcade', label: 'Arcade', Icon: Zap },
  { href: '/games', label: 'Games', Icon: Gamepad2 },
] as const

export function BottomTabBar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session) return null

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[50] block md:hidden bg-white/95 backdrop-blur-md border-t border-black/8"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 pb-safe">
        {tabs.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150',
                active ? 'text-accent-500' : 'text-text-tertiary'
              )}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                fill={active ? 'currentColor' : 'none'}
              />
              <span className={cn(
                'text-[9px] leading-none',
                active ? 'font-semibold' : 'font-medium'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
