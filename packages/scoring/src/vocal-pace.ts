// Vocal pace estimator — DOM-free, deterministic, unit-testable.
//
// Algorithm (de Jong & Wempe-inspired Praat syllable nuclei, browser-grade):
//   1. AudioWorklet upstream emits per-frame { rms, zcr } at 50ms hops.
//   2. VadFrameBuffer classifies speech / non-speech with hysteresis.
//   3. SyllablePeakDetector picks local maxima in the smoothed loudness
//      envelope of speech-only frames, with a syllabic-dip requirement and
//      a minimum inter-peak gap.
//   4. wpmFromOnsets normalizes by ACTUAL speaking time (not wall clock),
//      so a user who pauses to listen and then talks fast is reported
//      truthfully.
//
// All thresholds are in dBFS (relative to full scale, RMS) — using dB rather
// than raw RMS makes them stable across different mic gains.

export interface FrameInput {
  rms: number // 0..~0.7 typical; root-mean-square of the frame samples
  zcr: number // 0..1; fraction of zero-crossings in the frame
  t: number // ms — frame timestamp from start of session
}

const FRAME_MS = 50

export class VadFrameBuffer {
  // Hysteresis thresholds — looser exit than entry prevents flapping.
  private readonly enterDb: number
  private readonly exitDb: number
  private readonly enterZcrLow: number
  private readonly enterZcrHigh: number
  private readonly exitZcrLow: number
  private readonly exitZcrHigh: number
  private readonly enterFrames: number // confirmation frames before flipping to speech
  private readonly exitFrames: number // hangover frames before flipping back to silence

  private state: 'silent' | 'speaking' = 'silent'
  private candidateFrames = 0
  private speakingMs = 0
  private lastT: number | null = null

  constructor(opts: Partial<{
    enterDb: number; exitDb: number;
    enterZcrLow: number; enterZcrHigh: number;
    exitZcrLow: number; exitZcrHigh: number;
    enterFrames: number; exitFrames: number;
  }> = {}) {
    this.enterDb = opts.enterDb ?? -32
    this.exitDb = opts.exitDb ?? -42
    this.enterZcrLow = opts.enterZcrLow ?? 0.04
    this.enterZcrHigh = opts.enterZcrHigh ?? 0.30
    this.exitZcrLow = opts.exitZcrLow ?? 0.02
    this.exitZcrHigh = opts.exitZcrHigh ?? 0.50
    this.enterFrames = opts.enterFrames ?? 2 // ~100ms
    this.exitFrames = opts.exitFrames ?? 6 // ~300ms hangover
  }

  /** Returns isSpeech for this frame. */
  push(frame: FrameInput): boolean {
    const dB = rmsToDb(frame.rms)

    if (this.state === 'silent') {
      const looksSpeech =
        dB > this.enterDb &&
        frame.zcr >= this.enterZcrLow &&
        frame.zcr <= this.enterZcrHigh
      this.candidateFrames = looksSpeech ? this.candidateFrames + 1 : 0
      if (this.candidateFrames >= this.enterFrames) {
        this.state = 'speaking'
        this.candidateFrames = 0
      }
    } else {
      const looksSilence =
        dB < this.exitDb ||
        frame.zcr < this.exitZcrLow ||
        frame.zcr > this.exitZcrHigh
      this.candidateFrames = looksSilence ? this.candidateFrames + 1 : 0
      if (this.candidateFrames >= this.exitFrames) {
        this.state = 'silent'
        this.candidateFrames = 0
      }
    }

    if (this.state === 'speaking') {
      this.speakingMs += FRAME_MS
    }
    this.lastT = frame.t
    return this.state === 'speaking'
  }

  getSpeakingMs(): number {
    return this.speakingMs
  }

  reset() {
    this.state = 'silent'
    this.candidateFrames = 0
    this.speakingMs = 0
    this.lastT = null
  }
}

/**
 * Picks local maxima in a smoothed loudness envelope as syllable onsets.
 * Operates only on frames where VAD says "speaking" — call with isSpeech=false
 * to advance time without considering non-speech for peaks.
 *
 * A peak is accepted when:
 *   - smoothed dBFS reaches a local maximum
 *   - the maximum is ≥ minDipDb above the lowest point in the prior 250ms
 *   - at least minInterPeakMs has elapsed since the previous accepted peak
 */
export class SyllablePeakDetector {
  private readonly windowMs: number
  private readonly smoothMs: number
  private readonly minInterPeakMs: number
  private readonly minDipDb: number

  // Rolling history of recent dBFS values for envelope smoothing + dip check.
  private history: Array<{ t: number; db: number; isSpeech: boolean }> = []
  private lastPeakT: number | null = null
  private onsets = 0
  // Debounce: track if smoothed envelope is currently rising or falling.
  private rising = false
  private lastSmoothedDb = -Infinity
  private peakCandidate: { t: number; db: number } | null = null

  constructor(opts: Partial<{
    smoothMs: number; windowMs: number;
    minInterPeakMs: number; minDipDb: number;
  }> = {}) {
    this.smoothMs = opts.smoothMs ?? 100
    this.windowMs = opts.windowMs ?? 250
    this.minInterPeakMs = opts.minInterPeakMs ?? 180
    this.minDipDb = opts.minDipDb ?? 4
  }

  push(frame: FrameInput, isSpeech: boolean): void {
    const dB = rmsToDb(frame.rms)
    this.history.push({ t: frame.t, db: dB, isSpeech })
    // Drop history older than windowMs.
    while (this.history.length > 0 && frame.t - this.history[0].t > this.windowMs) {
      this.history.shift()
    }

    if (!isSpeech) {
      // Reset the rising-edge tracker when we leave speech so the next speech
      // burst starts fresh.
      this.rising = false
      this.peakCandidate = null
      this.lastSmoothedDb = -Infinity
      return
    }

    const smoothed = this.smoothedDb(frame.t)

    // Detect local maximum: track peak as smoothed value rises, then accept
    // when it starts falling.
    if (smoothed > this.lastSmoothedDb) {
      this.rising = true
      this.peakCandidate = { t: frame.t, db: smoothed }
    } else if (this.rising && smoothed < this.lastSmoothedDb && this.peakCandidate) {
      // We just turned over — the previous frame was the peak.
      this.maybeAcceptPeak(this.peakCandidate)
      this.rising = false
      this.peakCandidate = null
    }
    this.lastSmoothedDb = smoothed
  }

  private smoothedDb(now: number): number {
    let sum = 0
    let n = 0
    for (let i = this.history.length - 1; i >= 0; i--) {
      const h = this.history[i]
      if (now - h.t > this.smoothMs) break
      sum += h.db
      n++
    }
    return n === 0 ? -Infinity : sum / n
  }

  private maybeAcceptPeak(candidate: { t: number; db: number }) {
    // Inter-peak gap.
    if (this.lastPeakT !== null && candidate.t - this.lastPeakT < this.minInterPeakMs) {
      return
    }
    // Syllabic-dip requirement: the peak must rise ≥ minDipDb above the
    // minimum dB observed in the prior windowMs of speech-only frames.
    let minPriorDb = Infinity
    for (let i = this.history.length - 1; i >= 0; i--) {
      const h = this.history[i]
      if (candidate.t - h.t > this.windowMs) break
      if (!h.isSpeech) continue
      if (h.db < minPriorDb) minPriorDb = h.db
    }
    if (!isFinite(minPriorDb)) return
    if (candidate.db - minPriorDb < this.minDipDb) return

    this.onsets++
    this.lastPeakT = candidate.t
  }

  getOnsets(): number {
    return this.onsets
  }

  reset() {
    this.history = []
    this.lastPeakT = null
    this.onsets = 0
    this.rising = false
    this.lastSmoothedDb = -Infinity
    this.peakCandidate = null
  }
}

/**
 * Convert syllable onset count + actual speaking time to WPM.
 * Returns null if speakingMs < 3000 (insufficient signal — UI should show "—").
 */
export function wpmFromOnsets(onsets: number, speakingMs: number): number | null {
  if (speakingMs < 3000) return null
  if (onsets <= 0) return 0
  const words = onsets / 1.5 // English avg syllables-per-word
  const wpm = words * (60_000 / speakingMs)
  return Math.round(Math.max(0, Math.min(350, wpm)))
}

export function rmsToDb(rms: number): number {
  return 20 * Math.log10(rms + 1e-9)
}

/**
 * Stateful per-session aggregator. The offscreen doc creates one of these,
 * pushes frames as they arrive from the AudioWorklet, and reads currentWpm()
 * on each emit tick.
 *
 * Maintains a rolling 30-second window so quick changes in pace surface in
 * the HUD within seconds.
 */
export class PaceTracker {
  private readonly windowMs: number
  private vad = new VadFrameBuffer()
  private peaks = new SyllablePeakDetector()
  private window: Array<{ t: number; isSpeech: boolean; onsetCount: number }> = []
  private prevOnsetTotal = 0

  constructor(windowMs = 30_000) {
    this.windowMs = windowMs
  }

  push(frame: FrameInput): void {
    const isSpeech = this.vad.push(frame)
    this.peaks.push(frame, isSpeech)
    const onsetTotal = this.peaks.getOnsets()
    const onsetDelta = onsetTotal - this.prevOnsetTotal
    this.prevOnsetTotal = onsetTotal
    this.window.push({ t: frame.t, isSpeech, onsetCount: onsetDelta })
    while (this.window.length > 0 && frame.t - this.window[0].t > this.windowMs) {
      this.window.shift()
    }
  }

  /** WPM for the rolling window, or null if too little speech in window. */
  currentWpm(): number | null {
    if (this.window.length === 0) return null
    let onsets = 0
    let speakingFrames = 0
    for (const e of this.window) {
      onsets += e.onsetCount
      if (e.isSpeech) speakingFrames++
    }
    return wpmFromOnsets(onsets, speakingFrames * FRAME_MS)
  }

  reset() {
    this.vad.reset()
    this.peaks.reset()
    this.window = []
    this.prevOnsetTotal = 0
  }
}
