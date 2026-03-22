import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { NavBar } from '@/components/NavBar'
import { SkillBadge } from '@/components/SkillBadge'
import { FeedbackPoller } from './FeedbackPoller'
import type { FeedbackResult, ActionPlanStep, SkillCategory } from '@/lib/types'
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
        className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8"
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

        {session.status === 'failed' ? (
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
        ) : !feedback ? (
          <FeedbackPoller sessionId={sessionId} />
        ) : (
          <FeedbackDisplay
            feedback={feedback!}
            clipId={session.clipId}
            youtubeVideoId={session.clip.youtubeVideoId}
            startSec={session.clip.startSec}
            endSec={session.clip.endSec}
            recordingUrl={session.recordingUrl}
          />
        )}
      </main>
    </div>
  )
}

function ActionPlan({ steps, title, subtitle }: { steps: ActionPlanStep[]; title?: string; subtitle?: string }) {
  return (
    <div role="region" aria-label="Action plan" className="space-y-4">
      <div className="space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
          {title ?? 'YOUR ACTION PLAN'}
        </p>
        <p className="text-sm text-text-secondary">
          {subtitle ?? 'Do these in order at your next practice session.'}
        </p>
      </div>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.number}
            className="flex items-start gap-4 bg-bg-surface border border-white/8 rounded-xl pl-0 pr-4 py-4 shadow-card overflow-hidden relative animate-fade-in-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent-400 rounded-l-xl" />
            <span aria-hidden="true" className="flex-shrink-0 w-10 h-10 flex items-center justify-center ml-4 text-accent-400 text-xl font-bold font-mono">
              {step.number}
            </span>
            <div className="flex-1 space-y-0.5">
              <p className="text-base font-semibold text-text-primary leading-snug">{step.action}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{step.why}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

interface FeedbackDisplayProps {
  feedback: FeedbackResult
  clipId: string
  youtubeVideoId: string
  startSec: number
  endSec: number
  recordingUrl: string | null
}

function FeedbackDisplay({ feedback, clipId, youtubeVideoId, startSec, endSec, recordingUrl }: FeedbackDisplayProps) {
  const score = feedback.overallScore

  // Ring color changes by score tier
  const ringStart = score >= 80 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171'
  const ringEnd   = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  const scoreColor = ringStart

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
              <stop offset="0%" stopColor={ringStart} />
              <stop offset="100%" stopColor={ringEnd} />
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

      {/* Action Plan */}
      {feedback.steps && feedback.steps.length > 0 && (
        <ActionPlan steps={feedback.steps} />
      )}

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

      {/* Video comparison — reference clip + your recording */}
      <div>
        <p className="text-text-tertiary text-xs font-semibold uppercase tracking-widest mb-4">Compare</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text-tertiary">Reference clip</span>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-bg-inset">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?start=${startSec}&end=${endSec}&controls=1&rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="youtube-iframe"
                title="Reference clip"
              />
            </div>
          </div>
          {recordingUrl && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-tertiary">Your recording</span>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-bg-inset">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={recordingUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            </div>
          )}
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
