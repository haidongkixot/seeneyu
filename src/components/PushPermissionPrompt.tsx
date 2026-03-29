'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

const DISMISS_KEY = 'seeneyu_push_dismiss_until'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushPermissionPrompt() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Only show if browser supports Push API and permission is 'default'
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission !== 'default') return

    // Check if user dismissed recently
    const dismissUntil = localStorage.getItem(DISMISS_KEY)
    if (dismissUntil && Date.now() < Number(dismissUntil)) return

    setVisible(true)
  }, [])

  async function enablePush() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setVisible(false)
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      const vapidRes = await fetch('/api/push/vapid-key')
      const { publicKey } = await vapidRes.json()

      if (!publicKey) {
        console.error('No VAPID public key available')
        setVisible(false)
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      setVisible(false)
    } catch (err) {
      console.error('Failed to enable push notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    // Don't show again for 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, String(Date.now() + sevenDays))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative rounded-xl border border-surface-300 bg-surface-100 p-4 flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
        <Bell className="w-5 h-5 text-accent-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary font-medium mb-1">Stay on track</p>
        <p className="text-xs text-text-secondary mb-3">
          Enable notifications to get streak reminders, daily plans, and Coach Ney tips.
        </p>
        <div className="flex gap-2">
          <button
            onClick={enablePush}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enabling...' : 'Enable'}
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
