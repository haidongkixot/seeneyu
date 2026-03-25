export function trackEvent(type: string, metadata?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  // Fire and forget — don't block UI
  fetch('/api/activity/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, metadata }),
  }).catch(() => {
    // Silently fail — analytics should never break the app
  })
}
