// Offscreen document — the ONLY surface that touches webcam/mic.
// MediaPipe + WebAudio run here. We emit scored numbers (not frames) to the
// service worker via chrome.runtime.sendMessage. Raw media never leaves this
// document and is discarded on stop.

import {
  estimateVocalPaceWpm,
  scoreEyeContact,
  scorePosture,
  type MirrorMetricSample,
} from '@seeneyu/scoring'

let stream: MediaStream | null = null
let audioCtx: AudioContext | null = null
let rafId: number | null = null
let loopActive = false
let sessionStart = 0
const syllableBuckets: number[] = [] // rolling 30s of per-second syllable counts

async function start() {
  if (loopActive) return
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    sessionStart = Date.now()
    loopActive = true
    startAudioAnalyser(stream)
    tick()
  } catch (err) {
    chrome.runtime.sendMessage({
      type: 'mirror/status',
      running: false,
      error: String((err as Error)?.message || err),
    })
  }
}

function stop() {
  loopActive = false
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  audioCtx?.close().catch(() => {})
  audioCtx = null
  syllableBuckets.length = 0
}

function tick() {
  if (!loopActive) return
  // NOTE: This is the integration seam for MediaPipe. On the first production
  // build, initialize the Holistic model here and pull face + pose landmarks
  // from the latest frame. For now, emit null-valued samples at 2 Hz so the
  // HUD wiring and aggregation buffer can be validated end-to-end before the
  // heavy ML bundle is wired in.
  const face = { gazeVector: null as null | { x: number; y: number; z: number } }
  const pose = {
    leftShoulder: null as null | { x: number; y: number },
    rightShoulder: null as null | { x: number; y: number },
    nose: null as null | { x: number; y: number },
  }

  const sample: MirrorMetricSample = {
    t: Date.now() - sessionStart,
    eyeContact: scoreEyeContact(face),
    posture: scorePosture(pose),
    vocalPaceWpm: estimateVocalPaceWpm(syllableBuckets.slice(-30)),
  }

  chrome.runtime.sendMessage({ type: 'mirror/sample', sample })

  setTimeout(() => {
    rafId = requestAnimationFrame(tick)
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

// Auto-start on load — the service worker opens the offscreen doc only when
// the user clicks Start, so by the time we run here the user has already
// consented to engage.
start()
