// AudioWorklet processor source — emits per-frame {rms, zcr} every ~50ms.
// Runs on the audio thread, so it's not subject to main-thread throttling
// in hidden offscreen documents. The processor source is exported as a string
// because AudioWorklet expects to be loaded from a URL — we materialize the
// string into a Blob URL at runtime to keep this file inside the bundled
// extension (no separate static asset to ship).

export const PACE_WORKLET_NAME = 'seeneyu-pace-processor'

export const PACE_WORKLET_SOURCE = `
class SeeneyuPaceProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    // 50ms hop @ 48kHz = 2400 samples. Browsers deliver in 128-sample blocks,
    // so we accumulate into a buffer and emit when the buffer fills.
    this.hopSamples = Math.round(sampleRate * 0.05)
    this.buf = new Float32Array(this.hopSamples)
    this.idx = 0
    this.tMs = 0
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const ch = input[0]
    if (!ch) return true

    for (let i = 0; i < ch.length; i++) {
      this.buf[this.idx++] = ch[i]
      if (this.idx >= this.hopSamples) {
        // Compute RMS + ZCR over the hop.
        let sumSq = 0
        let zc = 0
        let prev = this.buf[0]
        for (let j = 0; j < this.hopSamples; j++) {
          const v = this.buf[j]
          sumSq += v * v
          if ((prev >= 0 && v < 0) || (prev < 0 && v >= 0)) zc++
          prev = v
        }
        const rms = Math.sqrt(sumSq / this.hopSamples)
        const zcr = zc / this.hopSamples
        this.tMs += this.hopSamples * 1000 / sampleRate
        this.port.postMessage({ rms, zcr, t: this.tMs })
        this.idx = 0
      }
    }
    return true
  }
}

registerProcessor('${PACE_WORKLET_NAME}', SeeneyuPaceProcessor)
`

/**
 * Load the AudioWorklet processor from an inline blob URL. Returns the URL
 * (caller revokes when done). Falls back gracefully if AudioWorklet is
 * unsupported — the caller can detect by checking `audioCtx.audioWorklet`.
 */
export function paceWorkletBlobUrl(): string {
  const blob = new Blob([PACE_WORKLET_SOURCE], { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}
