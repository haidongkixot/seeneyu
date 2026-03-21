import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { NavBar } from '@/components/NavBar'
import { SkillBadge } from '@/components/SkillBadge'
import { FeedbackPoller } from './FeedbackPoller'
import type { FeedbackResult, SkillCategory } from '@/lib/types'
import { ArrowLeft, RotateCcw } from 'lucide-react'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default async function FeedbackPage({ params }: PageProps) {
  const { sessionId } = await params

  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
    include: { clip: true },
  })

  if (!session) notFound()

  const feedback = session.feedback as FeedbackResult | null

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />

      <main
        className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8"
        aria-label={`AI Feedback for ${session.clip.skillCategory}`}
      >
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link
            href={`/library/${session.clipId}`}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            <ArrowLeft size={15} />
            Back to Clip
          </Link>
          <SkillBadge skill={session.clip.skillCategory as SkillCategory} size="sm" />
        </div>

        {!feedback || session.status === 'feedback_pending' || session.status === 'uploaded' ? (
          <FeedbackPoller sessionId={sessionId} />
        ) : session.status === 'failed' ? (
          <div className="text-center py-16">
            <p className="text-error font-semibold text-lg">Feedback generation failed</p>
            <p className="text-text-secondary text-sm mt-2">Please try submitting your recording again.</p>
            <Link
              href={`/library/${session.clipId}/record`}
              className="mt-6 inline-flex items-center gap-2 border border-white/10 text-text-primary rounded-xl px-6 py-3 text-sm hover:bg-bg-overlay transition-all duration-150"
            >
              <RotateCcw size={16} />
              Try Again
            </Link>
          </div>
        ) : (
          <FeedbackDisplay feedback={feedback!} clipId={session.clipId} />
        )}
      </main>
    </div>
  )
}

function FeedbackDisplay({ feedback, clipId }: { feedback: FeedbackResult; clipId: string }) {
  const score = feedback.overallScore
  const scoreColor = score >= 85 ? '#22c55e' : score >= 70 ? '#fbbf24' : score >= 50 ? '#f59e0b' : '#ef4444'

  // SVG ring constants
  const r = 54; const cx = 60; const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col gap-8">
      {/* Score ring */}
      <div className="flex flex-col items-center gap-3 py-4">
        <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Score: ${score} out of 100`}>
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx={cx} cy={cx} r={r} fill="none"
            stroke="url(#scoreGrad)" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
          />
          <text x="60" y="54" textAnchor="middle" fill={scoreColor} fontSize="26" fontWeight="800" fontFamily="inherit">{score}</text>
          <text x="60" y="70" textAnchor="middle" fill="#5c5c72" fontSize="11" fontFamily="inherit">/100</text>
        </svg>
        <p className="text-text-secondary text-base text-center max-w-sm">{feedback.summary}</p>
      </div>

      {/* Score breakdown */}
      <div className="bg-bg-surface border border-white/8 rounded-2xl p-6">
        <p className="text-text-tertiary text-xs font-semibold uppercase tracking-widest mb-5">Score Breakdown</p>
        <div className="flex flex-col gap-4">
          {feedback.dimensions.map((dim) => (
            <div key={dim.label} className="flex items-center gap-3">
              <span className="text-text-secondary text-sm w-36 shrink-0">{dim.label}</span>
              <div className="flex-1 bg-white/8 rounded-pill h-2 overflow-hidden">
                <div
                  className="bg-accent-400 h-2 rounded-pill transition-all duration-700"
                  style={{ width: `${dim.score * 10}%` }}
                />
              </div>
              <span className="text-text-primary text-sm font-semibold w-10 text-right">{dim.score}/10</span>
            </div>
          ))}
        </div>
      </div>

      {/* Positives / Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.2)] rounded-xl p-5">
          <p className="text-success text-xs font-semibold uppercase tracking-widest mb-3">What you did well</p>
          <ul className="flex flex-col gap-2">
            {feedback.positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                <span className="text-success mt-0.5">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-xl p-5">
          <p className="text-error text-xs font-semibold uppercase tracking-widest mb-3">What to improve</p>
          <ul className="flex flex-col gap-2">
            {feedback.improvements.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                <span className="text-error mt-0.5">✗</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Tips */}
      <div>
        <p className="text-text-tertiary text-xs font-semibold uppercase tracking-widest mb-4">AI Tips</p>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {feedback.tips.map((tip, i) => (
            <div key={i} className="w-64 shrink-0 bg-bg-elevated border border-white/8 rounded-2xl p-5">
              <p className="text-accent-400 text-sm font-semibold mb-2">💡 {tip.title}</p>
              <p className="text-text-secondary text-sm leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Link
          href={`/library/${clipId}/record`}
          className="flex-1 border border-white/10 text-text-primary rounded-xl py-3.5 text-base text-center hover:border-white/20 hover:bg-bg-overlay transition-all duration-150 flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Try This Clip Again
        </Link>
        {feedback.nextClipId ? (
          <Link
            href={`/library/${feedback.nextClipId}`}
            className="flex-1 bg-accent-400 text-text-inverse rounded-pill py-3.5 text-base font-semibold text-center hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150"
          >
            Next Clip →
          </Link>
        ) : (
          <Link
            href="/library"
            className="flex-1 bg-accent-400 text-text-inverse rounded-pill py-3.5 text-base font-semibold text-center hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150"
          >
            Browse More Clips →
          </Link>
        )}
      </div>
    </div>
  )
}
