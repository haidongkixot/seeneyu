'use client'

import { useState } from 'react'
import { Crown, Share2, Download, QrCode } from 'lucide-react'

interface CertificateCardProps {
  playerName: string
  date: string
  challengesPassed: number
  totalChallenges: number
  avgScore?: number
  bestScore?: number
}

export default function CertificateCard({
  playerName,
  date,
  challengesPassed,
  totalChallenges,
  avgScore = 0,
  bestScore = 0,
}: CertificateCardProps) {
  const [copied, setCopied] = useState(false)

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'King of Expression - seeneyu',
          text: `${playerName} earned the King of Expression certificate on seeneyu!`,
          url,
        })
      } catch {
        // Fallback to clipboard
        await copyToClipboard(url)
      }
    } else {
      await copyToClipboard(url)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="w-full max-w-[380px] mx-auto bg-bg-surface border-2 border-accent-400/30 rounded-3xl p-6 shadow-glow relative overflow-hidden">
      {/* Subtle radial glow background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent-400/5 blur-3xl pointer-events-none" />

      {/* Crown icon */}
      <div className="flex justify-center mb-4 relative">
        <div className="w-16 h-16 rounded-full bg-accent-400/10 border border-accent-400/30 flex items-center justify-center">
          <Crown size={32} className="text-accent-400" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-text-primary text-center tracking-tight mb-1 relative">
        King of Expression
      </h2>

      {/* Decorative divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-accent-400/20" />
        <div className="w-2 h-2 rounded-full bg-accent-400/40" />
        <div className="flex-1 h-px bg-accent-400/20" />
      </div>

      {/* Player name */}
      <p className="text-lg font-semibold text-accent-400 text-center mb-1">{playerName}</p>

      {/* Date */}
      <p className="text-xs text-text-tertiary text-center mb-6">{formattedDate}</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center">
          <span className="text-xl font-bold text-text-primary font-mono">
            {challengesPassed}/{totalChallenges}
          </span>
          <p className="text-xs text-text-tertiary mt-0.5">Challenges</p>
        </div>
        <div className="text-center">
          <span className="text-xl font-bold text-accent-400 font-mono">{avgScore}</span>
          <p className="text-xs text-text-tertiary mt-0.5">Avg Score</p>
        </div>
        <div className="text-center">
          <span className="text-xl font-bold text-success font-mono">{bestScore}</span>
          <p className="text-xs text-text-tertiary mt-0.5">Best Score</p>
        </div>
      </div>

      {/* QR code placeholder */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-xl bg-white p-2 flex items-center justify-center">
          <div className="w-full h-full bg-bg-inset rounded-md flex items-center justify-center">
            <QrCode size={24} className="text-text-tertiary" />
          </div>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="
          w-full py-3 rounded-pill
          bg-accent-400 text-text-inverse font-semibold text-sm
          hover:bg-accent-500 hover:shadow-glow-sm
          active:bg-accent-600 active:scale-[0.98]
          transition-all duration-150
          flex items-center justify-center gap-2
        "
      >
        <Share2 size={16} />
        {copied ? 'Link copied!' : 'Share Certificate'}
      </button>

      {/* Download button */}
      <button
        className="
          w-full py-3 rounded-pill mt-2
          bg-transparent border border-white/10 text-text-primary font-semibold text-sm
          hover:border-white/20 hover:bg-bg-overlay
          transition-all duration-150
          flex items-center justify-center gap-2
        "
      >
        <Download size={16} />
        Download
      </button>
    </div>
  )
}
