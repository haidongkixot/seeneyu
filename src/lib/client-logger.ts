/**
 * Client-side error reporting utilities.
 * These run in the browser and POST errors to /api/logs.
 */

export async function reportError(
  message: string,
  stack?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        source: 'client',
        message,
        stack,
        metadata,
      }),
    })
  } catch {
    // Silently fail — we don't want error reporting to itself cause errors
  }
}

/**
 * Attach global error handlers (window.onerror + unhandledrejection).
 * Call once in a top-level client component.
 */
export function setupGlobalErrorHandler() {
  if (typeof window === 'undefined') return

  window.onerror = (message, source, lineno, colno, error) => {
    reportError(
      String(message),
      error?.stack,
      { source, lineno, colno }
    )
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message = reason instanceof Error ? reason.message : String(reason)
    const stack = reason instanceof Error ? reason.stack : undefined
    reportError(message, stack, { type: 'unhandledrejection' })
  })
}
