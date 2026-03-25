'use client'

import { useState, useCallback, createElement } from 'react'
import { CelebrationOverlay } from '@/components/gamification/CelebrationOverlay'

type CelebrationRequest =
  | { type: 'level-up'; data: { level: number } }
  | { type: 'badge'; data: { badge: any } }
  | { type: 'streak'; data: { streak: number } }
  | { type: 'perfect-score'; data?: Record<string, unknown> }

interface CelebrationState {
  active: boolean
  type: CelebrationRequest['type']
  data: any
}

export function useCelebration() {
  const [state, setState] = useState<CelebrationState | null>(null)

  const celebrate = useCallback((req: CelebrationRequest) => {
    setState({ active: true, type: req.type, data: req.data ?? {} })
  }, [])

  const dismiss = useCallback(() => {
    setState(null)
  }, [])

  function CelebrationPortal() {
    if (!state || !state.active) return null
    return createElement(CelebrationOverlay, {
      type: state.type,
      data: state.data,
      onDismiss: dismiss,
    })
  }

  return { celebrate, CelebrationPortal }
}
