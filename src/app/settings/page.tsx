'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Bell, Chrome, ChevronRight, Shield, Sliders } from 'lucide-react'

const SECTIONS = [
  {
    href: '/settings/extension',
    title: 'Mirror Mode Extension',
    description: 'Pair the browser extension, toggle post-call sync, revoke devices.',
    Icon: Chrome,
  },
  {
    href: '/settings/preferences',
    title: 'Preferences',
    description: 'Learning goal, content preferences, display options.',
    Icon: Sliders,
  },
  {
    href: '/settings/notifications',
    title: 'Notifications',
    description: 'Email, push, and SMS reminder settings.',
    Icon: Bell,
  },
  {
    href: '/settings/privacy',
    title: 'Privacy',
    description: 'Data storage consent, recording retention.',
    Icon: Shield,
  },
]

export default function SettingsIndexPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, color: '#e5e7eb' }}>
      <h1 style={{ fontSize: 28, margin: 0 }}>Settings</h1>
      <p style={{ color: '#9ca3af', margin: '8px 0 20px 0' }}>
        Manage your account, privacy, and integrations.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SECTIONS.map(({ href, title, description, Icon }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: 10,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #1f2937',
                borderRadius: 8,
                padding: 10,
                color: '#f59e0b',
              }}
            >
              <Icon size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{description}</div>
            </div>
            <ChevronRight size={18} color="#6b7280" />
          </Link>
        ))}
      </div>
    </div>
  )
}
