/**
 * Temporal Pattern Analyzer — analyzes expression transitions across snapshots.
 *
 * Detects: state transitions, expression holds, recovery speed, rhythm.
 * Replaces snapshot-independent scoring with sequence-aware analysis.
 */

import type { AnalysisSnapshot, TemporalAnalysis, TransitionEvent } from '@/lib/mediapipe-types'

// ── Helpers ─────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Cosine similarity between two blendshape vectors (0-1) */
function cosineSim(a: Record<string, number>, b: Record<string, number>): number {
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
  let dot = 0, magA = 0, magB = 0
  for (const k of keys) {
    if (k === '_neutral') continue
    const va = a[k] ?? 0
    const vb = b[k] ?? 0
    dot += va * vb
    magA += va * va
    magB += vb * vb
  }
  if (magA === 0 || magB === 0) return 1 // both zero = identical
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

/** Cosine distance (0 = identical, 1 = orthogonal) */
function cosineDist(a: Record<string, number>, b: Record<string, number>): number {
  return 1 - cosineSim(a, b)
}

/** Dominant expression state from blendshapes */
function dominantState(blendshapes: Record<string, number>): string {
  let maxK = 'neutral'
  let maxV = 0
  for (const [k, v] of Object.entries(blendshapes)) {
    if (k === '_neutral') continue
    if (v > maxV) { maxV = v; maxK = k }
  }
  return maxV > 0.15 ? maxK : 'neutral'
}

/** Overall blendshape magnitude (expression intensity) */
function magnitude(bs: Record<string, number>): number {
  let sum = 0
  for (const [k, v] of Object.entries(bs)) {
    if (k === '_neutral') continue
    sum += v * v
  }
  return Math.sqrt(sum)
}

// ── Transition Detection ────────────────────────────────────────────

const TRANSITION_THRESHOLD = 0.3

/**
 * Detect state transitions between consecutive snapshots.
 * A transition occurs when cosine distance exceeds the threshold.
 */
export function analyzeTransitions(snapshots: AnalysisSnapshot[]): TransitionEvent[] {
  if (snapshots.length < 2) return []

  const transitions: TransitionEvent[] = []

  for (let i = 1; i < snapshots.length; i++) {
    const dist = cosineDist(snapshots[i - 1].blendshapes, snapshots[i].blendshapes)
    if (dist >= TRANSITION_THRESHOLD) {
      const fromState = dominantState(snapshots[i - 1].blendshapes)
      const toState = dominantState(snapshots[i].blendshapes)
      const dt = snapshots[i].timestampMs - snapshots[i - 1].timestampMs

      // Smoothness: check acceleration across 3 frames (if possible)
      let smoothness = 50
      if (i >= 2) {
        const d1 = cosineDist(snapshots[i - 2].blendshapes, snapshots[i - 1].blendshapes)
        const d2 = dist
        const accel = Math.abs(d2 - d1)
        smoothness = clamp(100 - accel * 300, 0, 100)
      }

      transitions.push({
        fromState,
        toState,
        atMs: snapshots[i].timestampMs,
        transitionDurationMs: dt,
        smoothnessScore: Math.round(smoothness),
      })
    }
  }

  return transitions
}

// ── Expression Holds ────────────────────────────────────────────────

/**
 * Detect sustained expressions (same dominant state held for >2 seconds).
 */
export function detectExpressionHolds(
  snapshots: AnalysisSnapshot[],
): { expression: string; durationMs: number }[] {
  if (snapshots.length < 2) return []

  const holds: { expression: string; durationMs: number }[] = []
  let currentState = dominantState(snapshots[0].blendshapes)
  let startMs = snapshots[0].timestampMs

  for (let i = 1; i < snapshots.length; i++) {
    const state = dominantState(snapshots[i].blendshapes)
    if (state !== currentState) {
      const dur = snapshots[i].timestampMs - startMs
      if (dur >= 2000 && currentState !== 'neutral') {
        holds.push({ expression: currentState, durationMs: dur })
      }
      currentState = state
      startMs = snapshots[i].timestampMs
    }
  }

  // Check last segment
  const lastDur = snapshots[snapshots.length - 1].timestampMs - startMs
  if (lastDur >= 2000 && currentState !== 'neutral') {
    holds.push({ expression: currentState, durationMs: lastDur })
  }

  return holds
}

// ── Recovery Speed ──────────────────────────────────────────────────

/**
 * Time to return to neutral after the peak expression moment.
 */
export function measureRecoverySpeed(snapshots: AnalysisSnapshot[]): number | null {
  if (snapshots.length < 3) return null

  // Find peak intensity frame
  let peakIdx = 0
  let peakMag = 0
  for (let i = 0; i < snapshots.length; i++) {
    const mag = magnitude(snapshots[i].blendshapes)
    if (mag > peakMag) { peakMag = mag; peakIdx = i }
  }

  // Find when it drops below 30% of peak after peak
  const threshold = peakMag * 0.3
  for (let i = peakIdx + 1; i < snapshots.length; i++) {
    if (magnitude(snapshots[i].blendshapes) < threshold) {
      return snapshots[i].timestampMs - snapshots[peakIdx].timestampMs
    }
  }

  return null // never fully recovered
}

// ── Rhythm Score ────────────────────────────────────────────────────

/**
 * Rhythm score: regularity of expression changes.
 * High rhythm = natural, varied expression; low = static or robotic.
 */
export function computeRhythmScore(snapshots: AnalysisSnapshot[]): number {
  if (snapshots.length < 4) return 50

  // Compute frame-to-frame distances
  const dists: number[] = []
  for (let i = 1; i < snapshots.length; i++) {
    dists.push(cosineDist(snapshots[i - 1].blendshapes, snapshots[i].blendshapes))
  }

  const avgDist = dists.reduce((a, b) => a + b, 0) / dists.length
  if (avgDist < 0.01) return 20 // nearly static = low rhythm

  // Variance of distances — too uniform = robotic, natural has moderate variance
  const variance = dists.reduce((s, d) => s + (d - avgDist) ** 2, 0) / dists.length
  const cv = Math.sqrt(variance) / (avgDist || 0.001) // coefficient of variation

  // Sweet spot: CV of 0.3-0.7 = natural rhythm
  if (cv >= 0.3 && cv <= 0.7) return clamp(80 + (0.5 - Math.abs(cv - 0.5)) * 40, 0, 100)
  if (cv < 0.3) return clamp(40 + cv * 100, 0, 100) // too uniform
  return clamp(80 - (cv - 0.7) * 50, 0, 100) // too chaotic
}

// ── Main Entry Point ────────────────────────────────────────────────

/**
 * Full temporal analysis of a snapshot sequence.
 */
export function computeTemporalAnalysis(snapshots: AnalysisSnapshot[]): TemporalAnalysis {
  const filtered = snapshots.filter((s) => s.faceDetected)
  if (filtered.length < 2) {
    return {
      transitions: [],
      holdDurations: [],
      avgTransitionSmoothness: 50,
      recoverySpeedMs: null,
      rhythmScore: 50,
      expressionVariety: 0,
    }
  }

  const transitions = analyzeTransitions(filtered)
  const holdDurations = detectExpressionHolds(filtered)
  const recoverySpeedMs = measureRecoverySpeed(filtered)
  const rhythmScore = Math.round(computeRhythmScore(filtered))

  const avgTransitionSmoothness = transitions.length > 0
    ? Math.round(transitions.reduce((s, t) => s + t.smoothnessScore, 0) / transitions.length)
    : 50

  // Count distinct expression states
  const states = new Set(filtered.map((s) => dominantState(s.blendshapes)))
  const expressionVariety = states.size

  return {
    transitions,
    holdDurations,
    avgTransitionSmoothness,
    recoverySpeedMs,
    rhythmScore,
    expressionVariety,
  }
}
