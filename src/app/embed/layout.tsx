import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'seeneyu — Mini Games',
  description: 'Test your expression recognition skills with fun mini-games.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
