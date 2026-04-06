/**
 * Holistic Scorer — combines visual (face + pose + hands), temporal, and voice
 * analysis into a unified communication score.
 *
 * Used by M65 to produce comprehensive feedback that covers all modalities.
 */

import type { AnalysisSnapshot, TemporalAnalysis } from '@/lib/mediapipe-types'
import type { VoiceMetrics } from './voice-analyzer'
import type { FullPerformanceMetrics, DimensionScore } from './expression-scorer'
import { scoreFullPerformanceFromAnalysis, combineVisualAndVoiceScores } from './expression-scorer'
import { computeTemporalAnalysis } from './temporal-analyzer'

// ── Types ───────────────────────────────────────────────────────────

export interface HolisticScore {
  /** Breakdown by modality */
  visual: { face: number; pose: number; hands: number }
  /** Temporal pattern scores */
  temporal: { smoothness: number; rhythm: number; variety: number }
  /** Voice metrics (null if no audio or analysis failed) */
  voice: VoiceMetrics | null
  /** Final blended score (0-100) */
  composite: number
  /** Per-dimension scores (skill-specific) */
  dimensionScores: DimensionScore[]
  /** Full visual metrics from expression-scorer */
  visualMetrics: FullPerformanceMetrics
  /** Full temporal analysis */
  temporalAnalysis: TemporalAnalysis | null
}

// ── Helpers ─────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// ── Main ────────────────────────────────────────────────────────────

/**
 * Compute a holistic communication score from all available signals.
 * Gracefully handles missing data (no hands, no voice, etc).
 */
export function computeHolisticScore(
  snapshots: AnalysisSnapshot[],
  skillCategory: string,
  voiceMetrics: VoiceMetrics | null = null,
): HolisticScore {
  // 1. Visual scoring (face + pose + hands)
  const visualMetrics = scoreFullPerformanceFromAnalysis(skillCategory, snapshots)

  // Face score: from blendshape engagement
  const faceSnapshots = snapshots.filter((s) => s.faceDetected)
  const faceScore = faceSnapshots.length > 0
    ? clamp(avg(faceSnapshots.map((s) => {
        const vals = Object.values(s.blendshapes).filter((_, i) => i > 0)
        return avg(vals) * 200 + 30
      })), 0, 100)
    : 0

  // Pose score: from shoulder openness
  const poseSnapshots = snapshots.filter((s) => s.poseLandmarks)
  const poseScore = poseSnapshots.length > 0
    ? clamp(avg(poseSnapshots.map((s) => {
        const p = s.poseLandmarks!
        const width = Math.abs(p.leftShoulder.x - p.rightShoulder.x)
        const headSize = Math.abs(p.leftEar.x - p.rightEar.x) || 0.01
        return (width / headSize) * 30
      })), 0, 100)
    : 0

  // Hands score: from hand detection + openness
  const handSnapshots = snapshots.filter((s) => s.handLandmarks)
  const handsScore = handSnapshots.length > 0
    ? clamp((handSnapshots.length / snapshots.length) * 100 * 0.5 + 50, 0, 100)
    : 0

  // 2. Temporal analysis
  const temporalAnalysis = snapshots.length >= 4
    ? computeTemporalAnalysis(snapshots)
    : null

  const temporal = {
    smoothness: temporalAnalysis?.avgTransitionSmoothness ?? 50,
    rhythm: temporalAnalysis?.rhythmScore ?? 50,
    variety: temporalAnalysis
      ? clamp(temporalAnalysis.expressionVariety * 20, 0, 100)
      : 0,
  }

  // 3. Composite score: weighted blend of all modalities
  let composite = visualMetrics.overallScore

  // Blend voice if available
  if (voiceMetrics && voiceMetrics.voiceScore > 0) {
    composite = combineVisualAndVoiceScores(composite, voiceMetrics.voiceScore, skillCategory)
  }

  // Temporal bonus: ±5% for smoothness/rhythm
  if (temporalAnalysis) {
    const temporalAvg = (temporal.smoothness + temporal.rhythm) / 2
    const temporalBonus = ((temporalAvg - 50) / 50) * 5
    composite = Math.round(clamp(composite + temporalBonus, 0, 100))
  }

  return {
    visual: {
      face: Math.round(faceScore),
      pose: Math.round(poseScore),
      hands: Math.round(handsScore),
    },
    temporal,
    voice: voiceMetrics,
    composite,
    dimensionScores: visualMetrics.dimensions,
    visualMetrics,
    temporalAnalysis,
  }
}

// ── Per-frame scoring (I2: Feedforward) ──────────────────────────────

export interface SnapshotScore {
  sec: number
  score: number
}

/**
 * Score a single analysis snapshot (one frame).
 * Returns 0-100 composite from face + pose + hands presence.
 * Used to build per-frame score arrays for peak detection.
 */
export function scoreSnapshot(snapshot: AnalysisSnapshot, skillCategory: string): number {
  let score = 0
  let weights = 0

  // Face score (same logic as above, single frame)
  if (snapshot.faceDetected) {
    const vals = Object.values(snapshot.blendshapes).filter((_, i) => i > 0)
    const faceScore = clamp(avg(vals) * 200 + 30, 0, 100)
    score += faceScore * 0.5
    weights += 0.5
  }

  // Pose score
  if (snapshot.poseLandmarks) {
    const p = snapshot.poseLandmarks
    const width = Math.abs(p.leftShoulder.x - p.rightShoulder.x)
    const headSize = Math.abs(p.leftEar.x - p.rightEar.x) || 0.01
    const poseScore = clamp((width / headSize) * 30, 0, 100)
    score += poseScore * 0.3
    weights += 0.3
  }

  // Hands score
  if (snapshot.handLandmarks) {
    score += 75 * 0.2 // hands detected = 75 base score
    weights += 0.2
  }

  return weights > 0 ? Math.round(score / weights) : 0
}

/**
 * Find the best-performing window of `windowSec` seconds within snapshot scores.
 * Returns the start/end seconds and average score of the peak window.
 * Returns null if data is insufficient.
 */
export function findPeakWindow(
  scores: SnapshotScore[],
  windowSec: number = 3,
): { startSec: number; endSec: number; avgScore: number } | null {
  if (scores.length < 2) return null

  const totalDuration = scores[scores.length - 1].sec - scores[0].sec
  if (totalDuration < windowSec) {
    // Recording shorter than window — use entire recording
    const avgScore = Math.round(avg(scores.map(s => s.score)))
    return { startSec: scores[0].sec, endSec: scores[scores.length - 1].sec, avgScore }
  }

  let bestStart = 0
  let bestAvg = 0

  for (let i = 0; i < scores.length; i++) {
    const windowStart = scores[i].sec
    const windowEnd = windowStart + windowSec

    // Collect scores within this window
    const windowScores = scores.filter(s => s.sec >= windowStart && s.sec <= windowEnd)
    if (windowScores.length === 0) continue

    const windowAvg = avg(windowScores.map(s => s.score))
    if (windowAvg > bestAvg) {
      bestAvg = windowAvg
      bestStart = windowStart
    }
  }

  return {
    startSec: Math.round(bestStart * 10) / 10,
    endSec: Math.round((bestStart + windowSec) * 10) / 10,
    avgScore: Math.round(bestAvg),
  }
}
