import { aggregateSamples, type MirrorMetricSample } from '@seeneyu/scoring'
import type { CoachingNudge } from './coaching-rules'

export interface TimeSeriesPoint {
  t: number // seconds since session start
  eyeContact: number | null // 0..100
  posture: number | null
  pace: number | null
}

export interface SessionAggregate {
  startedAt: string
  endedAt: string
  durationSeconds: number
  avgEyeContactPct: number | null
  avgPostureScore: number | null
  avgVocalPaceWpm: number | null
  sampleCount: number
  clientVersion: string
  // Phase B additions
  timeSeries: TimeSeriesPoint[]
  nudges: Array<{
    at: number // seconds since session start
    pattern: string
    headline: string
  }>
}

export class AggregationBuffer {
  private samples: MirrorMetricSample[] = []
  private nudges: CoachingNudge[] = []
  private startedAt: number | null = null

  start() {
    this.samples = []
    this.nudges = []
    this.startedAt = Date.now()
  }

  push(sample: MirrorMetricSample) {
    if (this.startedAt === null) this.startedAt = Date.now()
    this.samples.push(sample)
  }

  pushNudge(nudge: CoachingNudge) {
    this.nudges.push(nudge)
  }

  finalize(clientVersion: string): SessionAggregate | null {
    if (this.startedAt === null || this.samples.length === 0) return null
    const endedAtMs = Date.now()
    const agg = aggregateSamples(this.samples)
    const durationSeconds = Math.max(1, Math.round((endedAtMs - this.startedAt) / 1000))

    // Down-sample to ~1 sample per second to keep payload bounded
    // (a 30-min session would otherwise be ~3600 samples).
    const timeSeries = downsampleTimeSeries(this.samples, durationSeconds)

    const result: SessionAggregate = {
      startedAt: new Date(this.startedAt).toISOString(),
      endedAt: new Date(endedAtMs).toISOString(),
      durationSeconds,
      avgEyeContactPct: agg.avgEyeContactPct,
      avgPostureScore: agg.avgPostureScore,
      avgVocalPaceWpm: agg.avgVocalPaceWpm,
      sampleCount: agg.sampleCount,
      clientVersion,
      timeSeries,
      nudges: this.nudges.map((n) => ({
        at: Math.round(n.emittedAt / 1000),
        pattern: n.pattern,
        headline: n.headline,
      })),
    }
    this.samples = []
    this.nudges = []
    this.startedAt = null
    return result
  }
}

function downsampleTimeSeries(
  samples: MirrorMetricSample[],
  durationSec: number,
): TimeSeriesPoint[] {
  if (samples.length === 0) return []
  const targetBuckets = Math.min(Math.max(durationSec, 1), 1800) // hard cap 30 min worth
  const out: TimeSeriesPoint[] = []
  const bucketSizeMs = (samples[samples.length - 1].t - samples[0].t) / targetBuckets || 500
  let cursorMs = samples[0].t
  let bucket: MirrorMetricSample[] = []
  let secondCursor = 0

  const flush = () => {
    if (bucket.length === 0) return
    let eyeYes = 0
    let eyeN = 0
    let postureSum = 0
    let postureN = 0
    let paceSum = 0
    let paceN = 0
    for (const s of bucket) {
      if (s.eyeContact !== null) {
        eyeN++
        if (s.eyeContact) eyeYes++
      }
      if (typeof s.posture === 'number') {
        postureSum += s.posture
        postureN++
      }
      if (typeof s.vocalPaceWpm === 'number') {
        paceSum += s.vocalPaceWpm
        paceN++
      }
    }
    out.push({
      t: secondCursor,
      eyeContact: eyeN > 0 ? Math.round((eyeYes / eyeN) * 100) : null,
      posture: postureN > 0 ? Math.round(postureSum / postureN) : null,
      pace: paceN > 0 ? Math.round(paceSum / paceN) : null,
    })
    secondCursor++
    bucket = []
  }

  for (const s of samples) {
    if (s.t - cursorMs >= bucketSizeMs) {
      flush()
      cursorMs = s.t
    }
    bucket.push(s)
  }
  flush()
  return out
}
