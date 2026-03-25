'use client'

import { useSession } from 'next-auth/react'
import { SignInPrompt } from './SignInPrompt'

export function AuthGate({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 rounded-full bg-bg-elevated animate-pulse" />
        <div className="w-32 h-4 rounded-md bg-bg-elevated animate-pulse" />
      </div>
    )
  }

  if (!session) {
    return <>{fallback ?? <SignInPrompt />}</>
  }

  return <>{children}</>
}
