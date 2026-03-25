'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Clock, LogOut, RefreshCw } from 'lucide-react'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black tracking-tight text-text-primary hover:text-accent-400 transition-colors">
            seeneyu
          </Link>
        </div>

        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-accent-400/15 flex items-center justify-center">
            <Clock size={28} className="text-accent-400" />
          </div>

          <h1 className="text-lg font-bold text-text-primary mb-2">
            Account Pending Approval
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            Your account has been created and is currently under review.
            An administrator will approve your access shortly.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/signin"
              className="flex items-center justify-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
            >
              <RefreshCw size={14} />
              Check again
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center justify-center gap-2 bg-bg-inset border border-black/10 text-text-secondary rounded-xl px-4 py-2.5 text-sm font-medium hover:text-text-primary hover:border-black/20 transition-all duration-150"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
