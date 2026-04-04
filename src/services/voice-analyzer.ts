/**
 * Voice Analyzer — server-side audio analysis using open-source libraries.
 *
 * Zero AI API cost. Uses:
 * - Meyda: spectral features (RMS energy, spectral centroid, loudness)
 * - pitchy: pitch/F0 detection (YIN algorithm)
 *
 * Analyzes: pitch range/variation, speaking rate, pause patterns,
 * volume dynamics, vocal variety.
 */

import Meyda from 'meyda'
import { PitchDetector } from 'pitchy'
import { extractAudioFromWebm } from './audio-extractor'

// ── Types ───────────────────────────────────────────────────────────

export interface VoiceMetrics {
  pitchMean: number            // Hz
  pitchRange: number           // Hz (max - min)
  pitchVariation: number       // coefficient of variation (0-1)
  speakingRate: number         // estimated syllables/sec
  pauseCount: number
  avgPauseDurationMs: number
  longestPauseMs: number
  volumeMean: number           // dB RMS
  volumeRange: number          // dB
  volumeDynamics: number       // 0-100 (variety score)
  spectralCentroidMean: number // brightness indicator (Hz)
  voiceScore: number           // composite 0-100
}

// ── Constants ───────────────────────────────────────────────────────

const FRAME_SIZE = 512
const HOP_SIZE = 256 // 50% overlap
const SILENCE_THRESHOLD_DB = -40 // below this = silence/pause
const MIN_PAUSE_MS = 300 // minimum pause duration to count
const PITCH_CONFIDENCE_THRESHOLD = 0.85

// ── Helpers ─────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function rmsToDb(rms: number): number {
  return rms > 0 ? 20 * Math.log10(rms) : -100
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = avg(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
}

// ── Core Analysis ───────────────────────────────────────────────────

/**
 * Analyze voice from a recording URL. Downloads, decodes, and extracts metrics.
 */
export async function analyzeVoice(recordingUrl: string): Promise<VoiceMetrics> {
  const { samples, sampleRate } = await extractAudioFromWebm(recordingUrl)
  return analyzeAudioBuffer(samples, sampleRate)
}

/**
 * Analyze raw PCM audio samples. Core analysis function.
 */
export function analyzeAudioBuffer(
  samples: Float32Array,
  sampleRate: number,
): VoiceMetrics {
  const totalFrames = Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1
  if (totalFrames < 2) {
    return emptyMetrics()
  }

  // Configure Meyda for this sample rate
  Meyda.sampleRate = sampleRate
  Meyda.bufferSize = FRAME_SIZE

  // Prepare pitch detector
  const detector = PitchDetector.forFloat32Array(FRAME_SIZE)

  // Per-frame metrics
  const pitchValues: number[] = []
  const rmsValues: number[] = []
  const dbValues: number[] = []
  const centroidValues: number[] = []

  // Pause detection state
  const pauses: number[] = [] // durations in ms
  let inPause = false
  let pauseStartFrame = 0
  const msPerFrame = (HOP_SIZE / sampleRate) * 1000

  for (let i = 0; i < totalFrames; i++) {
    const offset = i * HOP_SIZE
    const frame = samples.slice(offset, offset + FRAME_SIZE)

    // Meyda feature extraction (sampleRate and bufferSize set globally above)
    const features = Meyda.extract(
      ['rms', 'spectralCentroid', 'loudness'],
      frame,
    )

    const rms = (features as any)?.rms ?? 0
    const db = rmsToDb(rms)
    rmsValues.push(rms)
    dbValues.push(db)

    const centroid = (features as any)?.spectralCentroid ?? 0
    if (centroid > 0 && db > SILENCE_THRESHOLD_DB) {
      centroidValues.push(centroid * (sampleRate / FRAME_SIZE)) // Convert bin to Hz
    }

    // Pitch detection
    const [pitch, clarity] = detector.findPitch(frame, sampleRate)
    if (clarity > PITCH_CONFIDENCE_THRESHOLD && pitch > 50 && pitch < 600 && db > SILENCE_THRESHOLD_DB) {
      pitchValues.push(pitch)
    }

    // Pause detection
    if (db < SILENCE_THRESHOLD_DB) {
      if (!inPause) {
        inPause = true
        pauseStartFrame = i
      }
    } else {
      if (inPause) {
        const pauseDuration = (i - pauseStartFrame) * msPerFrame
        if (pauseDuration >= MIN_PAUSE_MS) {
          pauses.push(pauseDuration)
        }
        inPause = false
      }
    }
  }

  // Close final pause if still in one
  if (inPause) {
    const pauseDuration = (totalFrames - pauseStartFrame) * msPerFrame
    if (pauseDuration >= MIN_PAUSE_MS) {
      pauses.push(pauseDuration)
    }
  }

  // ── Compute metrics ─────────────────────────────────────────────

  const pitchMean = avg(pitchValues)
  const pitchMin = pitchValues.length > 0 ? Math.min(...pitchValues) : 0
  const pitchMax = pitchValues.length > 0 ? Math.max(...pitchValues) : 0
  const pitchRange = pitchMax - pitchMin
  const pitchStd = stdDev(pitchValues)
  const pitchVariation = pitchMean > 0 ? clamp(pitchStd / pitchMean, 0, 1) : 0

  // Speaking rate: estimate syllables from energy peaks
  const totalDurationSec = samples.length / sampleRate
  const voicedFrames = dbValues.filter((d) => d > SILENCE_THRESHOLD_DB).length
  const voicedDurationSec = (voicedFrames * HOP_SIZE) / sampleRate
  // Rough estimate: ~4-5 syllables/sec for English
  const speakingRate = voicedDurationSec > 0
    ? clamp(pitchValues.length / voicedDurationSec * 0.3, 0, 10)
    : 0

  const volumeDbValues = dbValues.filter((d) => d > -80) // exclude dead silence
  const volumeMean = avg(volumeDbValues)
  const volumeMin = volumeDbValues.length > 0 ? Math.min(...volumeDbValues) : -80
  const volumeMax = volumeDbValues.length > 0 ? Math.max(...volumeDbValues) : 0
  const volumeRange = volumeMax - volumeMin
  const volumeStd = stdDev(volumeDbValues)
  const volumeDynamics = clamp(volumeStd * 5, 0, 100)

  const spectralCentroidMean = avg(centroidValues)

  // ── Composite voice score ───────────────────────────────────────

  const voiceScore = computeVoiceScore({
    pitchVariation,
    pitchRange,
    speakingRate,
    pauseCount: pauses.length,
    volumeDynamics,
    totalDurationSec,
  })

  return {
    pitchMean: Math.round(pitchMean * 10) / 10,
    pitchRange: Math.round(pitchRange * 10) / 10,
    pitchVariation: Math.round(pitchVariation * 1000) / 1000,
    speakingRate: Math.round(speakingRate * 10) / 10,
    pauseCount: pauses.length,
    avgPauseDurationMs: pauses.length > 0 ? Math.round(avg(pauses)) : 0,
    longestPauseMs: pauses.length > 0 ? Math.round(Math.max(...pauses)) : 0,
    volumeMean: Math.round(volumeMean * 10) / 10,
    volumeRange: Math.round(volumeRange * 10) / 10,
    volumeDynamics: Math.round(volumeDynamics),
    spectralCentroidMean: Math.round(spectralCentroidMean),
    voiceScore: Math.round(voiceScore),
  }
}

// ── Composite Score ─────────────────────────────────────────────────

function computeVoiceScore(params: {
  pitchVariation: number
  pitchRange: number
  speakingRate: number
  pauseCount: number
  volumeDynamics: number
  totalDurationSec: number
}): number {
  const { pitchVariation, pitchRange, speakingRate, pauseCount, volumeDynamics, totalDurationSec } = params

  // Pitch variety: CV of 0.1-0.3 is natural speaking range
  const pitchScore = pitchVariation > 0.05
    ? clamp(pitchVariation * 300, 0, 100)
    : 20 // monotone penalty

  // Pitch range: 50-200Hz range is dynamic speaking
  const rangeScore = clamp(pitchRange / 2, 0, 100)

  // Pacing: natural rate ~3-5 syllables/sec, pauses show deliberate delivery
  const pacingScore = speakingRate >= 2 && speakingRate <= 6
    ? 80 + (pauseCount > 0 ? 20 : 0)
    : clamp(60 - Math.abs(speakingRate - 4) * 15, 0, 100)

  // Volume: some dynamics = engaging, flat = monotone
  const volumeScore = clamp(volumeDynamics * 1.5, 0, 100)

  // Weight: pitch variety (30%), range (20%), pacing (30%), volume (20%)
  return clamp(
    pitchScore * 0.3 + rangeScore * 0.2 + pacingScore * 0.3 + volumeScore * 0.2,
    0,
    100,
  )
}

// ── Fallback ────────────────────────────────────────────────────────

function emptyMetrics(): VoiceMetrics {
  return {
    pitchMean: 0, pitchRange: 0, pitchVariation: 0,
    speakingRate: 0, pauseCount: 0, avgPauseDurationMs: 0, longestPauseMs: 0,
    volumeMean: -80, volumeRange: 0, volumeDynamics: 0,
    spectralCentroidMean: 0, voiceScore: 0,
  }
}
