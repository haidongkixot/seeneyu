'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Loader2, Check, X } from 'lucide-react'

interface WhatsAppOptInProps {
  initialPhone?: string | null
  initialOptIn?: boolean
}

export default function WhatsAppOptIn({ initialPhone, initialOptIn }: WhatsAppOptInProps) {
  const [phone, setPhone] = useState(initialPhone || '')
  const [optedIn, setOptedIn] = useState(initialOptIn || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone)
    if (initialOptIn !== undefined) setOptedIn(initialOptIn)
  }, [initialPhone, initialOptIn])

  const handleOptIn = async () => {
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      setError('Enter a valid phone number with country code')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/whatsapp/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to opt in')
      }
      const data = await res.json()
      setOptedIn(true)
      setPhone(data.phone || phone)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleOptOut = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/whatsapp/opt-out', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to opt out')
      setOptedIn(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/10 text-green-600">
          <MessageCircle size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Get coaching tips on WhatsApp
          </h3>
          <p className="text-xs text-text-tertiary">
            Receive reminders and motivation from Coach Ney directly on WhatsApp.
          </p>
        </div>
      </div>

      {optedIn ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/8 border border-green-500/20 rounded-xl">
            <Check size={14} className="text-green-600" />
            <span className="text-sm text-text-primary">
              WhatsApp enabled: +{phone}
            </span>
          </div>
          <button
            onClick={handleOptOut}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl hover:bg-red-500/15 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Disable WhatsApp
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
              Phone number (with country code)
            </label>
            <input
              type="tel"
              placeholder="1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-bg-base border border-black/8 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Include country code without + (e.g. 14155551234)
            </p>
          </div>
          <button
            onClick={handleOptIn}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MessageCircle size={14} />
            )}
            Enable WhatsApp
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-500">{error}</p>
      )}
      {success && (
        <p className="mt-3 text-xs text-green-600">
          {optedIn ? 'WhatsApp notifications enabled!' : 'WhatsApp notifications disabled.'}
        </p>
      )}
    </div>
  )
}
