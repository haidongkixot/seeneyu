'use client'

import { useRef, useState, useCallback } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface SideBySideCompareProps {
  youtubeVideoId: string
  startSec: number
  endSec: number
  recordingUrl: string
}

/**
 * Side-by-side comparison: reference YouTube clip on the left,
 * user recording on the right, with synced play/pause controls.
 */
export function SideBySideCompare({ youtubeVideoId, startSec, endSec, recordingUrl }: SideBySideCompareProps) {
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const ytRef = useRef<any>(null)
  const [playing, setPlaying] = useState(false)
  const [ytReady, setYtReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Initialize YT player via postMessage API (no YT.Player dependency)
  const onIframeLoad = useCallback(() => {
    setYtReady(true)
  }, [])

  const postCommand = (command: string, args?: Record<string, unknown>) => {
    if (!iframeRef.current?.contentWindow) return
    const msg = JSON.stringify({ event: 'command', func: command, args: args ? Object.values(args) : [] })
    iframeRef.current.contentWindow.postMessage(msg, '*')
  }

  const playBoth = () => {
    postCommand('playVideo')
    userVideoRef.current?.play()
    setPlaying(true)
  }

  const pauseBoth = () => {
    postCommand('pauseVideo')
    userVideoRef.current?.pause()
    setPlaying(false)
  }

  const resetBoth = () => {
    postCommand('seekTo', { seconds: startSec, allowSeekAhead: true })
    postCommand('pauseVideo')
    if (userVideoRef.current) {
      userVideoRef.current.currentTime = 0
      userVideoRef.current.pause()
    }
    setPlaying(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reference */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-text-tertiary font-semibold uppercase tracking-wider">Reference Clip</span>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-bg-inset">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?start=${startSec}&end=${endSec}&enablejsapi=1&controls=0&rel=0&modestbranding=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="youtube-iframe"
              title="Reference clip"
              onLoad={onIframeLoad}
            />
          </div>
        </div>

        {/* User recording */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-text-tertiary font-semibold uppercase tracking-wider">Your Recording</span>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-bg-inset">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={userVideoRef}
              src={recordingUrl}
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        </div>
      </div>

      {/* Synced controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={resetBoth}
          className="p-2 rounded-lg border border-black/10 text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-all duration-150"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={playing ? pauseBoth : playBoth}
          disabled={!ytReady}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-pill px-6 py-2.5 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? 'Pause Both' : 'Play Both'}
        </button>
      </div>
    </div>
  )
}
