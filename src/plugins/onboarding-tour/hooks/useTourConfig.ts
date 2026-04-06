'use client'

import { useState, useEffect } from 'react'
import type { TourConfig } from '../types'

export function useTourConfig() {
  const [config, setConfig] = useState<TourConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/onboarding-tour/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.enabled) setConfig(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}
