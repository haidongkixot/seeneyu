import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Providers } from '@/components/Providers'
import { Footer } from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BottomTabBarWrapper } from '@/components/BottomTabBarWrapper'
import { NavBarWrapper } from '@/components/NavBarWrapper'
import './globals.css'

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'seeneyu — Learn body language from Hollywood',
  description: 'Watch curated Hollywood clips, record yourself mimicking the behavior, and get AI feedback to improve your communication.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans bg-bg-base text-text-primary antialiased min-h-screen flex flex-col">
        <Providers session={session}>
          <ErrorBoundary>
            <NavBarWrapper />
            <div className="flex-1 pb-20 md:pb-0 page-fade-in">{children}</div>
            <Footer />
            <BottomTabBarWrapper />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
