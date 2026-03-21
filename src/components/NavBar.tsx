import Link from 'next/link'
import { Library, TrendingUp } from 'lucide-react'

export function NavBar() {
  return (
    <nav className="sticky top-0 z-[50] h-14 bg-bg-surface/80 backdrop-blur-md border-b border-white/8 flex items-center justify-between px-4 lg:px-8">
      <Link href="/" className="flex items-center gap-2 font-black text-lg tracking-tight text-text-primary hover:text-accent-400 transition-colors duration-150">
        seeneyu
      </Link>

      <div className="flex items-center gap-1 md:gap-2">
        <Link
          href="/library"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-all duration-150"
        >
          <Library size={15} strokeWidth={1.5} />
          <span className="hidden sm:inline">Library</span>
        </Link>
        <Link
          href="/progress"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-all duration-150"
        >
          <TrendingUp size={15} strokeWidth={1.5} />
          <span className="hidden sm:inline">Progress</span>
        </Link>
        <Link
          href="/library"
          className="ml-2 bg-accent-400 text-text-inverse rounded-pill px-4 py-1.5 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150"
        >
          Get Started
        </Link>
      </div>
    </nav>
  )
}
