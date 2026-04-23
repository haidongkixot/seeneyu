// Offscreen document — the ONLY surface that touches webcam/mic.
// MediaPipe + WebAudio run here. We emit scored numbers (not frames) to the
// service worker via chrome.runtime.sendMessage. Raw media never leaves this
// document and is discarded on stop.
//
// Degraded mode: if WebGL is unavailable (Chrome hardware acceleration off),
// MediaPipe cannot run. We still run the WebAudio-only pace meter so the
// user gets partial value and a clear message telling them how to enable GPU.

import {
  estimateVocalPaceWpm,
  scoreEyeContactFromLandmarks,
  scorePostureFromLandmarks,
  type MirrorMetricSample,
} from '@seeneyu/scoring'
import { loadMirrorPipeline, type MirrorPipeline } from '../lib/mediapipe-loader'

let stream: MediaStream | null = null
let video: HTMLVideoElement | null = null
let audioCtx: AudioContext | null = null
let pipeline: MirrorPipeline | null = null
let loopActive = false
let sessionStart = 0
let tickTimer: number | null = null
let lastDiagAt = 0
let tickCount = 0
let faceHits = 0
let poseHits = 0
let lastFaceLandmarkCount = 0
let lastPoseLandmarkCount = 0
let degraded = false
let forceGpuAttempt = false
const syllableBuckets: number[] = []

const WEBGL_HINT =
  "Try these in order: (1) chrome://settings/system → 'Use graphics acceleration when available' → relaunch. (2) chrome://gpu — check the 'WebGL' row. If it says 'software only' or 'disabled', your GPU is on Chrome's blocklist. (3) chrome://flags → search 'ignore-gpu-blocklist' → set to Enabled → relaunch. After relaunch reload the Seeneyu extension and click Try anyway below."

type StatusKind = 'info' | 'warn' | 'error' | 'degraded'
function status(message: string, opts: { kind?: StatusKind; error?: unknown; hint?: string } = {}) {
  chrome.runtime
    .sendMessage({
      type: 'mirror/status',
      running: loopActive,
      message,
      kind: opts.kind ?? (opts.error ? 'error' : 'info'),
      error: opts.error ? String((opts.error as Error)?.message ?? opts.error) : undefined,
      hint: opts.hint,
    })
    .catch(() => {})
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    c.width = 1
    c.height = 1
    if (c.getContext('webgl2')) return true
    // Fresh canvas because getContext commits the type on first call.
    const c2 = document.createElement('canvas')
    c2.width = 1
    c2.height = 1
    return !!c2.getContext('webgl')
  } catch {
    return false
  }
}

async function start() {
  if (loopActive) return
  try {
    status('Requesting camera and microphone…')
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, frameRate: 15 },
      audio: true,
    })
    sessionStart = Date.now()
    loopActive = true

    // Attach hidden video — required for Chrome to decode frames in an
    // offscreen doc.
    video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.width = 640
    video.height = 480
    video.style.cssText = 'position:fixed;left:-9999px;top:0'
    document.body.appendChild(video)
    await video.play()

    if (video.readyState < 2) {
      await new Promise<void>((resolve) => {
        const onReady = () => resolve()
        video!.addEventListener('loadeddata', onReady, { once: true })
        setTimeout(onReady, 3000) // don't block forever
      })
    }

    // Audio pipeline runs regardless of GPU availability.
    startAudioAnalyser(stream)

    // Try MediaPipe if WebGL looks available — OR if the user explicitly
    // clicked 'Try anyway' (force flag), because hasWebGL() can be a false
    // negative in offscreen contexts even when MediaPipe's own WebGL creation
    // would succeed. If MediaPipe fails we surface the real error.
    const shouldAttempt = hasWebGL() || forceGpuAttempt
    if (!shouldAttempt) {
      degraded = true
      status('GPU acceleration is off — running in pace-only mode.', {
        kind: 'degraded',
        hint: WEBGL_HINT,
      })
    } else {
      status(forceGpuAttempt ? 'Trying GPU anyway…' : 'Loading coaching models…')
      try {
        pipeline = await loadMirrorPipeline()
        forceGpuAttempt = false
        status('Running', { kind: 'info' })
      } catch (err) {
        degraded = true
        pipeline = null
        status('Coaching models could not load — running in pace-only mode.', {
          kind: 'degraded',
          error: err,
          hint: WEBGL_HINT,
        })
      }
    }

    tickTimer = window.setInterval(tick, 500)
  } catch (err) {
    loopActive = false
    status('Start failed', { kind: 'error', error: err })
  }
}

function stop() {
  loopActive = false
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  if (video) {
    video.pause()
    video.srcObject = null
    video.remove()
    video = null
  }
  pipeline?.close()
  pipeline = null
  audioCtx?.close().catch(() => {})
  audioCtx = null
  syllableBuckets.length = 0
  tickCount = 0
  faceHits = 0
  poseHits = 0
  degraded = false
}

function tick() {
  if (!loopActive || !video) return

  // Degraded (pace-only) mode: never touch MediaPipe, just emit audio-only.
  if (degraded || !pipeline) {
    emitSample(null, null)
    return
  }

  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    emitSample(null, null)
    return
  }

  const now = performance.now()
  let faceLandmarks: Array<{ x: number; y: number; z?: number }> | null = null
  let poseLandmarks: Array<{ x: number; y: number; z?: number }> | null = null
  let detectErr: unknown = null

  try {
    const faceResult = pipeline.face.detectForVideo(video, now)
    faceLandmarks = (faceResult.faceLandmarks?.[0] as any) ?? null
  } catch (err) {
    detectErr = err
  }
  try {
    const poseResult = pipeline.pose.detectForVideo(video, now)
    poseLandmarks = (poseResult.landmarks?.[0] as any) ?? null
  } catch (err) {
    detectErr = detectErr || err
  }

  // If both detectors throw consistently, MediaPipe has broken — drop to
  // degraded rather than spamming errors.
  if (detectErr) {
    const msg = String((detectErr as Error)?.message || detectErr)
    if (msg.includes('WebGL') || msg.includes('kGpuService') || msg.includes('GPU')) {
      degraded = true
      pipeline?.close()
      pipeline = null
      status('GPU pipeline broke mid-session — dropping to pace-only mode.', {
        kind: 'degraded',
        error: detectErr,
      })
      emitSample(null, null)
      return
    }
    status('Detection error', { kind: 'error', error: detectErr })
  }

  tickCount++
  if (faceLandmarks) {
    faceHits++
    lastFaceLandmarkCount = faceLandmarks.length
  }
  if (poseLandmarks) {
    poseHits++
    lastPoseLandmarkCount = poseLandmarks.length
  }

  const nowMs = Date.now()
  if (nowMs - lastDiagAt > 2500) {
    lastDiagAt = nowMs
    status(
      `face ${faceHits}/${tickCount} (${lastFaceLandmarkCount} lmk) · pose ${poseHits}/${tickCount} (${lastPoseLandmarkCount} lmk)`,
      { kind: 'info' },
    )
    tickCount = 0
    faceHits = 0
    poseHits = 0
  }

  emitSample(faceLandmarks, poseLandmarks)
}

function emitSample(
  faceLandmarks: Array<{ x: number; y: number; z?: number }> | null,
  poseLandmarks: Array<{ x: number; y: number; z?: number }> | null,
) {
  const sample: MirrorMetricSample = {
    t: Date.now() - sessionStart,
    eyeContact: scoreEyeContactFromLandmarks(faceLandmarks),
    posture: scorePostureFromLandmarks(poseLandmarks),
    vocalPaceWpm: estimateVocalPaceWpm(syllableBuckets.slice(-30)),
  }
  chrome.runtime.sendMessage({ type: 'mirror/sample', sample }).catch(() => {})
}

function startAudioAnalyser(src: MediaStream) {
  audioCtx = new AudioContext()
  const node = audioCtx.createMediaStreamSource(src)
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 1024
  node.connect(analyser)

  const buf = new Float32Array(analyser.fftSize)
  let bucket = 0
  let lastTick = Date.now()
  const PEAK_THRESHOLD = 0.04

  const loop = () => {
    if (!loopActive) return
    analyser.getFloatTimeDomainData(buf)
    let peak = 0
    for (let i = 0; i < buf.length; i++) {
      const v = Math.abs(buf[i])
      if (v > peak) peak = v
    }
    if (peak > PEAK_THRESHOLD) bucket++

    const now = Date.now()
    if (now - lastTick >= 1000) {
      syllableBuckets.push(bucket)
      if (syllableBuckets.length > 30) syllableBuckets.shift()
      bucket = 0
      lastTick = now
    }
    requestAnimationFrame(loop)
  }
  loop()
}

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg?.type === 'mirror/start') {
    start().then(() => sendResponse({ ok: true }))
    return true
  }
  if (msg?.type === 'mirror/stop') {
    stop()
    sendResponse({ ok: true })
    return false
  }
  if (msg?.type === 'mirror/force-gpu-retry') {
    forceGpuAttempt = true
    stop()
    start().then(() => sendResponse({ ok: true }))
    return true
  }
})

// Offscreen doc is only created when the user clicks Start Mirror, so auto-
// starting on load is safe.
start()
