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
const syllableBuckets: number[] = [] // rolling 30s of per-second syllable counts

async function start() {
  if (loopActive) return
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, frameRate: 15 },
      audio: true,
    })
    sessionStart = Date.now()
    loopActive = true

    video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    video.playsInline = true
    await video.play()

    startAudioAnalyser(stream)
    pipeline = await loadMirrorPipeline()

    chrome.runtime.sendMessage({ type: 'mirror/status', running: true })
    tick()
  } catch (err) {
    loopActive = false
    chrome.runtime.sendMessage({
      type: 'mirror/status',
      running: false,
      error: String((err as Error)?.message || err),
    })
  }
}

function stop() {
  loopActive = false
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  if (video) {
    video.pause()
    video.srcObject = null
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

  const now = performance.now()
  let faceLandmarks: Array<{ x: number; y: number; z?: number }> | null = null
  let poseLandmarks: Array<{ x: number; y: number; z?: number }> | null = null

  try {
    const faceResult = pipeline.face.detectForVideo(video, now)
    faceLandmarks = faceResult.faceLandmarks?.[0] ?? null
  } catch {
    faceLandmarks = null
  }
  try {
    const poseResult = pipeline.pose.detectForVideo(video, now)
    poseLandmarks = poseResult.landmarks?.[0] ?? null
  } catch {
    poseLandmarks = null
  }

  const sample: MirrorMetricSample = {
    t: Date.now() - sessionStart,
    eyeContact: scoreEyeContactFromLandmarks(faceLandmarks),
    posture: scorePostureFromLandmarks(poseLandmarks),
    vocalPaceWpm: estimateVocalPaceWpm(syllableBuckets.slice(-30)),
  }

  chrome.runtime.sendMessage({ type: 'mirror/sample', sample })

  // Throttle to ~2 Hz to stay light on the main thread.
  setTimeout(() => {
    if (loopActive) requestAnimationFrame(tick)
  }, 500)
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

// The offscreen doc is only created by the service worker when the user
// clicks Start Mirror, so running as soon as this script loads is safe.
start()
