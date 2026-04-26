// Live coaching rules engine. Pure function over the rolling sample buffer.
// Patterns fire when their condition holds for N consecutive samples; each
// pattern has a cooldown so the user isn't spammed.
//
// Card text follows the Coach Ney "act / say / how" structure used on the
// platform — actionable, specific, encouraging.

import type { MirrorMetricSample } from '@seeneyu/scoring'

export interface CoachingNudge {
  pattern: string
  emittedAt: number // ms since session start
  headline: string
  act: string
  say: string
  how: string
  tone: 'reset' | 'encourage' | 'recover'
}

interface RuleContext {
  samples: MirrorMetricSample[]
  sessionStartMs: number
  emittedAt: Map<string, number> // pattern → last-emitted ms-since-session-start
}

interface Rule {
  id: string
  cooldownSec: number
  evaluate: (ctx: RuleContext) => CoachingNudge | null
}

function lastN(samples: MirrorMetricSample[], n: number): MirrorMetricSample[] {
  return samples.slice(-n)
}

function avgEye(samples: MirrorMetricSample[]): number | null {
  const vals = samples
    .map((s) => (s.eyeContact === null ? null : s.eyeContact ? 100 : 0))
    .filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function avgNum(samples: MirrorMetricSample[], key: 'posture' | 'vocalPaceWpm'): number | null {
  const vals = samples.map((s) => s[key]).filter((v): v is number => typeof v === 'number')
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const RULES: Rule[] = [
  {
    id: 'eye-drift',
    cooldownSec: 90,
    evaluate: (ctx) => {
      // Need 30s of recent samples (sample rate is ~2 Hz → 60 samples)
      const window = lastN(ctx.samples, 60)
      if (window.length < 50) return null
      const avg = avgEye(window)
      if (avg === null || avg >= 35) return null
      return {
        pattern: 'eye-drift',
        emittedAt: 0,
        headline: 'Looking down a lot',
        act: 'Lift your gaze and aim at the camera lens itself, not the face on screen.',
        say: '"I want to make sure I\'m clear on this — let me check…" buys you a beat to reset.',
        how: 'Stick a small dot or sticker right next to your camera lens — your eyes will find it naturally.',
        tone: 'recover',
      }
    },
  },
  {
    id: 'pace-runaway',
    cooldownSec: 90,
    evaluate: (ctx) => {
      const window = lastN(ctx.samples, 40) // ~20s
      if (window.length < 30) return null
      const avg = avgNum(window, 'vocalPaceWpm')
      if (avg === null || avg < 180) return null
      return {
        pattern: 'pace-runaway',
        emittedAt: 0,
        headline: `Pace climbing (${Math.round(avg)} wpm)`,
        act: 'Pause for two beats. Let the silence land.',
        say: '"Let me say that one more way."',
        how: 'Inhale through your nose on the pause. Exhale on the next sentence — you\'ll naturally drop to ~130 wpm.',
        tone: 'reset',
      }
    },
  },
  {
    id: 'posture-slump',
    cooldownSec: 120,
    evaluate: (ctx) => {
      const window = lastN(ctx.samples, 120) // ~60s
      if (window.length < 100) return null
      const avg = avgNum(window, 'posture')
      if (avg === null || avg >= 50) return null
      return {
        pattern: 'posture-slump',
        emittedAt: 0,
        headline: `Posture dropping (${Math.round(avg)}/100)`,
        act: 'Roll your shoulders back. Sit tall through the crown of your head.',
        say: 'Nothing — let your body reset for one full sentence.',
        how: 'Imagine a string pulling you up from the ceiling. Chest forward two inches.',
        tone: 'reset',
      }
    },
  },
  {
    id: 'streak-strong',
    cooldownSec: 240, // Compliments are precious — don't overdo
    evaluate: (ctx) => {
      const window = lastN(ctx.samples, 240) // ~2 min
      if (window.length < 200) return null
      const eye = avgEye(window)
      const posture = avgNum(window, 'posture')
      if (eye === null || posture === null) return null
      if (eye < 75 || posture < 75) return null
      return {
        pattern: 'streak-strong',
        emittedAt: 0,
        headline: 'Locked in 🔥',
        act: 'Whatever you\'re doing, keep doing it.',
        say: 'Your delivery is in the zone — eye contact ' + Math.round(eye) + '%, posture ' + Math.round(posture) + '.',
        how: 'This is the version of you we\'re training. Notice how it feels in your body.',
        tone: 'encourage',
      }
    },
  },
  {
    id: 'pace-flat',
    cooldownSec: 180,
    evaluate: (ctx) => {
      // After at least 3 minutes of session and pace consistently very low while
      // posture is fine — likely monotone/under-energized speaking.
      if (ctx.samples.length < 360) return null // need 3 min of data
      const window = lastN(ctx.samples, 60)
      if (window.length < 50) return null
      const pace = avgNum(window, 'vocalPaceWpm')
      const posture = avgNum(window, 'posture')
      if (pace === null || posture === null) return null
      if (pace > 90 || pace < 30) return null // ignore silence (=0) and normal speech
      if (posture < 50) return null
      return {
        pattern: 'pace-flat',
        emittedAt: 0,
        headline: `Pace very low (${Math.round(pace)} wpm)`,
        act: 'Land your next key point with vocal emphasis — louder, slower, then a pause.',
        say: 'Try: "And here\'s the part that matters…" — the setup invites attention.',
        how: 'Hands move when voice moves. Use a small open-palm gesture on the emphasized word.',
        tone: 'encourage',
      }
    },
  },
]

export function evaluateRules(ctx: RuleContext): CoachingNudge | null {
  const nowMs = ctx.samples[ctx.samples.length - 1]?.t ?? 0
  for (const rule of RULES) {
    const lastEmitted = ctx.emittedAt.get(rule.id) ?? -Infinity
    if (nowMs - lastEmitted < rule.cooldownSec * 1000) continue
    const nudge = rule.evaluate(ctx)
    if (nudge) {
      nudge.emittedAt = nowMs
      ctx.emittedAt.set(rule.id, nowMs)
      return nudge
    }
  }
  return null
}

export class CoachingEngine {
  private samples: MirrorMetricSample[] = []
  private emittedAt = new Map<string, number>()
  private nudgeLog: CoachingNudge[] = []

  reset() {
    this.samples = []
    this.emittedAt.clear()
    this.nudgeLog = []
  }

  ingest(sample: MirrorMetricSample): CoachingNudge | null {
    this.samples.push(sample)
    // Cap at 30 minutes worth of samples to bound memory.
    if (this.samples.length > 60 * 60) this.samples.shift()
    const nudge = evaluateRules({
      samples: this.samples,
      sessionStartMs: 0,
      emittedAt: this.emittedAt,
    })
    if (nudge) this.nudgeLog.push(nudge)
    return nudge
  }

  log(): CoachingNudge[] {
    return [...this.nudgeLog]
  }
}
