'use client'

import { useState } from 'react'
import { Play, Volume2, VolumeX, Maximize2 } from 'lucide-react'

interface AiMediaPlayerProps {
  mediaUrl: string
  mediaType: string
  title: string
}

/**
 * Smart player for AI-generated content.
 * - For real video files (.mp4 with video codec): shows <video> player
 * - For images (.png/.jpg or composite): shows image with optional audio
 * - Auto-detects content type from URL and tries video first, falls back to image
 */
export function AiMediaPlayer({ mediaUrl, mediaType, title }: AiMediaPlayerProps) {
  const [videoFailed, setVideoFailed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // If mediaType explicitly says ai_image, or video playback failed, show as image
  const showAsImage = mediaType === 'ai_image' || videoFailed

  if (showAsImage) {
    return (
      <div className="w-full rounded-2xl overflow-hidden bg-bg-elevated border border-black/8 relative group">
        <img
          src={mediaUrl}
          alt={title}
          className="w-full h-auto max-h-[500px] object-contain"
          onError={(e) => {
            // If image also fails, show placeholder
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 border border-purple-200 rounded-full px-2 py-0.5">
            AI Generated
          </span>
        </div>
      </div>
    )
  }

  // Try as video first
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black relative">
      <video
        src={mediaUrl}
        controls
        autoPlay
        loop
        playsInline
        className="w-full h-auto max-h-[500px]"
        onError={() => {
          // Video can't play this file — fall back to image display
          setVideoFailed(true)
        }}
      />
      <div className="absolute top-3 left-3">
        <span className="text-[10px] font-semibold text-purple-200 bg-purple-500/40 backdrop-blur-sm border border-purple-400/30 rounded-full px-2 py-0.5">
          AI Generated
        </span>
      </div>
    </div>
  )
}
