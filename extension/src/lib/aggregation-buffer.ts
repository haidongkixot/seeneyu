import { aggregateSamples, type MirrorMetricSample } from '@seeneyu/scoring'

export interface SessionAggregate {
  startedAt: string
  endedAt: string
  durationSeconds: number
  avgEyeContactPct: number | null
  avgPostureScore: number | null
  avgVocalPaceWpm: number | null
  sampleCount: number
  clientVersion: string
}

export class AggregationBuffer {
  private samples: MirrorMetricSample[] = []
  private startedAt: number | null = null

  start() {
    this.samples = []
    this.startedAt = Date.now()
  }

  push(sample: MirrorMetricSample) {
    if (this.startedAt === null) this.startedAt = Date.now()
    this.samples.push(sample)
  }

  finalize(clientVersion: string): SessionAggregate | null {
    if (this.startedAt === null || this.samples.length === 0) return null
    const endedAtMs = Date.now()
    const agg = aggregateSamples(this.samples)
    const durationSeconds = Math.max(1, Math.round((endedAtMs - this.startedAt) / 1000))
    const result: SessionAggregate = {
      startedAt: new Date(this.startedAt).toISOString(),
      endedAt: new Date(endedAtMs).toISOString(),
      durationSeconds,
      avgEyeContactPct: agg.avgEyeContactPct,
      avgPostureScore: agg.avgPostureScore,
      avgVocalPaceWpm: agg.avgVocalPaceWpm,
      sampleCount: agg.sampleCount,
      clientVersion,
    }
    this.samples = []
    this.startedAt = null
    return result
  }
}
