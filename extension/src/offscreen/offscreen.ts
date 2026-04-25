// Offscreen document — the ONLY surface that touches webcam/mic.
// TFJS WASM-based ML runtime (no WebGL, no GPU requirement) lets this run on
// any Chrome with WebAssembly support, i.e. every modern install. Scored
// numbers only are posted to the service worker; raw frames and audio stay
// inside this document and are discarded on stop.

import {
  estimateVocalPaceWpm,
  scoreEyeContactFromLandmarks,
  scorePostureFromMoveNet,
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
const syllableBuckets: number[] = []

type StatusKind = 'info' | 'warn' | 'error'
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

    // Video must be attached to the DOM for Chrome to decode frames in a
    // hidden offscreen doc. Keep it off-screen visually.
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
        setTimeout(onReady, 3000)
      })
    }

    startAudioAnalyser(stream)

    status('Loading coaching models…')
    try {
      pipeline = await loadMirrorPipeline({
        onProgress: (msg) => status(msg, { kind: 'info' }),
      })
      status(`Running (${pipeline.backend} backend)`, { kind: 'info' })
    } catch (err) {
      // TFJS WASM should work on any browser with WebAssembly. If something
      // genuinely fails (corporate proxy blocking jsdelivr, etc.) we surface
      // the actual error rather than silently spinning.
      pipeline = null
      status('Coaching models failed to load.', {
        kind: 'error',
        error: err,
        hint:
          'Open chrome://extensions, click "service worker" or "inspect views: offscreen.html" on the Seeneyu Mirror card, copy the console error, and share it. Common causes: corporate firewall blocking cdn.jsdelivr.net, or extension reload needed after CSP changes.',
      })
    }

    tickTimer = window.setInterval(tick, 500)
  } catch (err) {
    loopActive = false
    const name = (err as Error)?.name
    if (name === 'NotAllowedError') {
      status('Camera or microphone access was denied.', {
        kind: 'error',
        error: err,
        hint: 'Click the camera icon in the address bar and choose Allow, then try again.',
      })
    } else {
      status('Start failed', { kind: 'error', error: err })
    }
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
}

async function tick() {
  if (!loopActive || !video) return
  if (!pipeline) {
    emitSample(null, null, 0, 0)
    return
  }

  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    emitSample(null, null, 0, 0)
    return
  }

  let faceKeypoints: Array<{ x: number; y: number; z?: number }> | null = null
  let poseKeypoints: Array<{ x: number; y: number; score?: number }> | null = null
  let detectErr: unknown = null

  try {
    const result = await pipeline.detect(video)
    // Human face.mesh: Array<[x, y, z]> of 468 points in pixel coordinates.
    const mesh = result?.face?.[0]?.mesh as Array<[number, number, number?]> | undefined
    if (mesh && mesh.length > 0) {
      faceKeypoints = mesh.map(([x, y, z]) => ({ x, y, z }))
    }
    // Human body.keypoints: { position: [x, y], score, part }. MoveNet has
    // 17 keypoints in COCO order — our scorePostureFromMoveNet expects that.
    const bodyKps = result?.body?.[0]?.keypoints as
      | Array<{ position: [number, number]; score: number; part: string }>
      | undefined
    if (bodyKps && bodyKps.length > 0) {
      poseKeypoints = bodyKps.map((kp) => ({ x: kp.position[0], y: kp.position[1], score: kp.score }))
    }
  } catch (err) {
    detectErr = err
  }

  if (detectErr) {
    status('Detection error', { kind: 'error', error: detectErr })
  }

  tickCount++
  if (faceKeypoints) faceHits++
  if (poseKeypoints) poseHits++

  const nowMs = Date.now()
  if (nowMs - lastDiagAt > 2500) {
    lastDiagAt = nowMs
    status(`face ${faceHits}/${tickCount} · pose ${poseHits}/${tickCount}`, { kind: 'info' })
    tickCount = 0
    faceHits = 0
    poseHits = 0
  }

  emitSample(faceKeypoints, poseKeypoints, video.videoWidth, video.videoHeight)
}

function emitSample(
  faceKeypoints: Array<{ x: number; y: number; z?: number }> | null,
  poseKeypoints: Array<{ x: number; y: number; score?: number }> | null,
  videoWidth: number,
  videoHeight: number,
) {
  // Normalize Facemesh keypoints (which are already in 0..1 normalized space
  // from the TFJS Facemesh runtime when no flip is set) — pass through.
  const sample: MirrorMetricSample = {
    t: Date.now() - sessionStart,
    eyeContact: scoreEyeContactFromLandmarks(
      faceKeypoints as any,
    ),
    posture: scorePostureFromMoveNet(poseKeypoints, videoWidth, videoHeight),
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

// Offscreen doc is only created when the user clicks Start Mirror.
start()
