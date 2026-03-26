'use client'
import { usePathname } from 'next/navigation'
import { NavBar } from './NavBar'

const HIDE_NAVBAR_PREFIXES = ['/admin', '/auth', '/onboarding', '/embed']

export function NavBarWrapper() {
  const pathname = usePathname()
  // Hide NavBar on admin, auth, onboarding, and embed game routes
  if (HIDE_NAVBAR_PREFIXES.some(p => pathname.startsWith(p))) return null
  // Embed routes use (embed) route group — they have their own layout
  // so NavBar won't render there anyway
  return <NavBar />
}
