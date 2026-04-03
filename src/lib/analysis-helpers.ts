/**
 * Client-side analysis collection helpers.
 * Used by recording components to collect MediaPipe snapshots during video capture.
 */

import type { AnalysisSnapshot } from '@/lib/mediapipe-types'
import type { DetectAllFn } from '@/hooks/useMediaPipe'

export interface AnalysisCollector {
  /** Stop collection and return all collected snapshots */
  stop: () => AnalysisSnapshot[]
  /** Get a copy of current snapshots without stopping */
  getSnapshots: () => AnalysisSnapshot[]
  /** Get the snapshot with highest overall expression intensity */
  getPeakSnapshot: () => AnalysisSnapshot | null
}

/**
 * Start collecting MediaPipe analysis snapshots at regular intervals.
 *
 * @param videoEl   - The live video element to analyze
 * @param detectAll - The detection function from useMediaPipe()
 * @param intervalMs - Collection interval (default: 500ms for coaching, 1000ms for arcade)
 */
export function startAnalysisCollection(
  videoEl: HTMLVideoElement,
  detectAll: DetectAllFn,
  intervalMs: number = 500
): AnalysisCollector {
  const snapshots: AnalysisSnapshot[] = []
  let stopped = false

  const id = setInterval(() => {
    if (stopped) return
    const ts = performance.now()
    const snapshot = detectAll(videoEl, ts)
    if (snapshot && snapshot.faceDetected) {
      snapshots.push(snapshot)
    }
  }, intervalMs)

  function getPeakSnapshot(): AnalysisSnapshot | null {
    if (snapshots.length === 0) return null
    let peak = snapshots[0]
    let peakIntensity = computeIntensity(peak.blendshapes)
    for (let i = 1; i < snapshots.length; i++) {
      const intensity = computeIntensity(snapshots[i].blendshapes)
      if (intensity > peakIntensity) {
        peak = snapshots[i]
        peakIntensity = intensity
      }
    }
    return peak
  }

  return {
    stop: () => {
      stopped = true
      clearInterval(id)
      return [...snapshots]
    },
    getSnapshots: () => [...snapshots],
    getPeakSnapshot,
  }
}

/** Compute overall expression intensity as the sum of all non-neutral blendshape values */
function computeIntensity(blendshapes: Record<string, number>): number {
  let sum = 0
  for (const [key, value] of Object.entries(blendshapes)) {
    if (key !== '_neutral') {
      sum += value
    }
  }
  return sum
}

/**
 * Re-export temporal analysis for convenience.
 * Imported dynamically to keep client bundle lean when not needed.
 */
export { computeTemporalAnalysis } from '@/services/temporal-analyzer'
