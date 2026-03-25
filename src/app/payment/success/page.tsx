'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function verify() {
      const token = searchParams.get('token')
      const payerId = searchParams.get('PayerID')
      const vnpResponseCode = searchParams.get('vnp_ResponseCode')

      if (token && payerId) {
        try {
          const res = await fetch(`/api/payments/paypal?token=${token}&PayerID=${payerId}`)
          const data = await res.json()
          if (res.ok) {
            setStatus('success')
            setMessage('Your subscription is now active!')
          } else {
            setStatus('error')
            setMessage(data.error || 'Payment verification failed.')
          }
        } catch {
          setStatus('error')
          setMessage('Could not verify payment. Please contact support.')
        }
      } else if (vnpResponseCode) {
        if (vnpResponseCode === '00') {
          setStatus('success')
          setMessage('Your subscription is now active!')
        } else {
          setStatus('error')
          setMessage('Payment was not completed.')
        }
      } else {
        setStatus('success')
        setMessage('Your subscription is now active!')
      }
    }

    verify()
  }, [searchParams])

  return (
    <main className="max-w-lg mx-auto px-4 pt-20 pb-20 text-center">
      {status === 'verifying' && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-accent-400 animate-spin" />
          <h1 className="text-2xl font-bold text-text-primary">Verifying Payment...</h1>
          <p className="text-text-secondary">Please wait while we confirm your payment.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Payment Successful!</h1>
          <p className="text-text-secondary">{message}</p>
          <div className="flex gap-3 mt-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-pill bg-accent-400 text-text-inverse font-semibold text-sm hover:bg-accent-500 shadow-glow-sm transition-all duration-150"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/library"
              className="px-6 py-3 rounded-pill border border-black/15 text-text-primary font-semibold text-sm hover:border-black/15 transition-all duration-150"
            >
              Browse Library
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
            <XCircle size={40} className="text-error" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Payment Issue</h1>
          <p className="text-text-secondary">{message}</p>
          <div className="flex gap-3 mt-4">
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-pill bg-accent-400 text-text-inverse font-semibold text-sm hover:bg-accent-500 shadow-glow-sm transition-all duration-150"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-pill border border-black/15 text-text-primary font-semibold text-sm hover:border-black/15 transition-all duration-150"
            >
              Go Home
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <Suspense fallback={
        <main className="max-w-lg mx-auto px-4 pt-20 pb-20 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-accent-400 animate-spin" />
            <h1 className="text-2xl font-bold text-text-primary">Verifying Payment...</h1>
          </div>
        </main>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  )
}
