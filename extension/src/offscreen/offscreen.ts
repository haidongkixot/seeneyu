// Offscreen document — the ONLY surface that touches webcam/mic.
// MediaPipe + WebAudio run here. We emit scored numbers (not frames) to the
// service worker via chrome.runtime.sendMessage. Raw media never leaves this
// document and is discarded on stop.

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
const syllableBuckets: number[] = [] // rolling 30s of per-second syllable counts

function status(msg: string, error?: unknown) {
  const payload: any = { type: 'mirror/status', running: loopActive, message: msg }
  if (error) payload.error = String((error as Error)?.message ?? error)
  chrome.runtime.sendMessage(payload).catch(() => {})
}

async function start() {
  if (loopActive) return
  try {
    // MediaPipe needs a live WebGL context to exist in this document —
    // create an off-screen canvas and prime the context before the model
    // initializes. Without this MediaPipe crashes with
    // "Cannot read properties of undefined (reading 'activeTexture')".
    const primer = document.createElement('canvas')
    primer.width = 1
    primer.height = 1
    primer.style.position = 'fixed'
    primer.style.left = '-9999px'
    document.body.appendChild(primer)
    const gl = (primer.getContext('webgl2') || primer.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) {
      throw new Error('WebGL is not available in this browser/context')
    }

    status('Requesting camera and microphone…')
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, frameRate: 15 },
      audio: true,
    })
    sessionStart = Date.now()
    loopActive = true

    // Video must be attached to the DOM for Chrome to actually decode frames in
    // a hidden offscreen document. Off-screen positioning keeps it invisible.
    video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.width = 640
    video.height = 480
    video.style.position = 'fixed'
    video.style.left = '-9999px'
    video.style.top = '0'
    document.body.appendChild(video)
    await video.play()

    // Wait for the first decoded frame before we start scoring — otherwise
    // MediaPipe's detectForVideo returns empty landmarks and the HUD just
    // shows "—" forever.
    if (video.readyState < 2) {
      await new Promise<void>((resolve) => {
        const onReady = () => resolve()
        video!.addEventListener('loadeddata', onReady, { once: true })
        setTimeout(onReady, 3000) // fail-open so we at least start trying
      })
    }

    startAudioAnalyser(stream)

    status('Loading coaching models…')
    pipeline = await loadMirrorPipeline()
    status('Running', undefined)

    // Stable 2 Hz via setInterval — rAF is throttled in hidden docs.
    tickTimer = window.setInterval(tick, 500)
  } catch (err) {
    loopActive = false
    status('Start failed', err)
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
}

function tick() {
  if (!loopActive || !video || !pipeline) return
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    // Not yet producing frames. Emit null sample so the HUD at least pulses.
    emitSample(null, null)
    return
  }

  const now = performance.now()
  let faceLandmarks: Array<{ x: number; y: number; z?: number }> | null = null
  let poseLandmarks: Array<{ x: number; y: number; z?: number }> | null = null
  let faceErr: unknown = null
  let poseErr: unknown = null

  try {
    const faceResult = pipeline.face.detectForVideo(video, now)
    faceLandmarks = (faceResult.faceLandmarks?.[0] as any) ?? null
  } catch (err) {
    faceErr = err
  }
  try {
    const poseResult = pipeline.pose.detectForVideo(video, now)
    poseLandmarks = (poseResult.landmarks?.[0] as any) ?? null
  } catch (err) {
    poseErr = err
  }

  if (faceErr || poseErr) {
    status('Detection error', faceErr || poseErr)
  }

  tickCount++
  if (faceLandmarks) { faceHits++; lastFaceLandmarkCount = faceLandmarks.length }
  if (poseLandmarks) { poseHits++; lastPoseLandmarkCount = poseLandmarks.length }

  // Every ~2.5s emit a diagnostic so the HUD can show whether detection
  // is actually working (useful when dials stay at "—").
  const nowMs = Date.now()
  if (nowMs - lastDiagAt > 2500) {
    lastDiagAt = nowMs
    status(
      `face ${faceHits}/${tickCount} (${lastFaceLandmarkCount} lmk) · pose ${poseHits}/${tickCount} (${lastPoseLandmarkCount} lmk)`,
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
})

// The offscreen doc is only created when the user clicks Start Mirror, so
// running as soon as this script loads is safe.
start()
