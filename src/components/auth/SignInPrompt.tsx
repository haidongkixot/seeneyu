'use client'

import Link from 'next/link'
import { KeyRound } from 'lucide-react'

export function SignInPrompt({ context }: { context?: string }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div className="w-14 h-14 rounded-2xl bg-accent-400/10 border border-accent-400/20 flex items-center justify-center mb-4">
        <KeyRound size={24} className="text-accent-400" />
      </div>

      <h3 className="text-xl font-bold text-text-primary mb-2">
        Sign in to continue
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        {context || 'Create a free account to access practice sessions, arcade challenges, and AI feedback.'}
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Link
          href="/auth/signin"
          className="px-6 py-2.5 rounded-pill bg-accent-400 text-text-inverse font-semibold text-sm hover:bg-accent-500 shadow-glow-sm transition-all duration-150"
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="px-6 py-2.5 rounded-pill border border-black/15 text-text-secondary font-semibold text-sm hover:border-black/15 hover:text-text-primary transition-all duration-150"
        >
          Create Account
        </Link>
      </div>
    </div>
  )
}
