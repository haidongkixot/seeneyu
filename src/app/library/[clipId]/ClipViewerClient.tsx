'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { AnnotationType } from '@/lib/types'

interface Annotation {
  id: string
  atSecond: number
  note: string
  type: AnnotationType
}

interface ClipViewerClientProps {
  youtubeVideoId: string
  startSec: number
  endSec: number
  annotations: Annotation[]
}

const TYPE_ICONS: Record<AnnotationType, string> = {
  eye_contact: '👁',
  posture:     '🫸',
  gesture:     '🤝',
  voice:       '🗣',
  expression:  '😶',
}

declare global {
  interface Window {
    YT: {
      Player: new (el: string | HTMLElement, opts: object) => YTPlayer
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayer {
  seekTo: (sec: number, allow: boolean) => void
  playVideo: () => void
  getCurrentTime: () => number
  destroy: () => void
}

export function ClipViewerClient({
  youtubeVideoId,
  startSec,
  annotations,
}: ClipViewerClientProps) {
  const playerRef = useRef<YTPlayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null)
  const [playerReady, setPlayerReady] = useState(false)

  const checkAnnotations = useCallback((currentTime: number) => {
    const relativeTime = currentTime - startSec
    const active = annotations.find(
      a => relativeTime >= a.atSecond && relativeTime < a.atSecond + 5
    )
    setActiveAnnotation(active ?? null)
  }, [annotations, startSec])

  useEffect(() => {
    const loadAPI = () => {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }

    if (!window.YT) {
      window.onYouTubeIframeAPIReady = () => {
        if (!containerRef.current) return
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: youtubeVideoId,
          playerVars: {
            start: startSec,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: () => setPlayerReady(true),
            onStateChange: (e: { data: number }) => {
              if (e.data === window.YT.PlayerState.PLAYING) {
                intervalRef.current = setInterval(() => {
                  if (playerRef.current) {
                    checkAnnotations(playerRef.current.getCurrentTime())
                  }
                }, 500)
              } else {
                if (intervalRef.current) clearInterval(intervalRef.current)
              }
            },
          },
        })
      }
      loadAPI()
    } else {
      if (!containerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeVideoId,
        playerVars: { start: startSec, controls: 1, rel: 0, modestbranding: 1, enablejsapi: 1 },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                if (playerRef.current) checkAnnotations(playerRef.current.getCurrentTime())
              }, 500)
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current)
            }
          },
        },
      })
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      playerRef.current?.destroy()
    }
  }, [youtubeVideoId, startSec, checkAnnotations])

  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-bg-inset shadow-xl">
      <div ref={containerRef} className="w-full h-full" id={`yt-player-${youtubeVideoId}`} />

      {/* Loading overlay */}
      {!playerReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-inset">
          <div className="w-8 h-8 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Annotation overlay */}
      {activeAnnotation && (
        <div className="absolute bottom-16 left-4 right-4 animate-fade-in pointer-events-none">
          <div className="glass-panel rounded-xl p-4 max-w-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{TYPE_ICONS[activeAnnotation.type]}</span>
              <span className="text-xs font-semibold text-accent-400 uppercase tracking-wide">
                {activeAnnotation.type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">{activeAnnotation.note}</p>
          </div>
        </div>
      )}
    </div>
  )
}
