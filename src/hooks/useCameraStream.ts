'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * useCameraStream — single source of truth for camera lifecycle.
 *
 * Guarantees:
 * - Camera stops on component unmount
 * - Camera stops when document becomes hidden (tab switch, lock screen)
 * - Camera stops on beforeunload (tab close, navigation)
 * - srcObject is cleared so the video element releases its reference
 * - streamRef is nulled
 *
 * Use this in any component that calls getUserMedia. Don't roll your own.
 */
export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null } catch { /* ignore */ }
    }
  }, [])

  const startCamera = useCallback(
    async (constraints: MediaStreamConstraints = { video: true, audio: true }) => {
      // Defensively stop any existing stream first
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
      }
      return stream
    },
    [stopCamera],
  )

  // Auto-stop on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  // Auto-stop when tab is hidden or page unloads
  useEffect(() => {
    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        stopCamera()
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', stopCamera)
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', stopCamera)
      }
    }
  }, [stopCamera])

  return { videoRef, streamRef, startCamera, stopCamera }
}
