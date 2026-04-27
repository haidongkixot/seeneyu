// Offscreen document — the ONLY surface that touches webcam/mic.
// TFJS WASM-based ML runtime (no WebGL, no GPU requirement) lets this run on
// any Chrome with WebAssembly support, i.e. every modern install. Scored
// numbers only are posted to the service worker; raw frames and audio stay
// inside this document and are discarded on stop.

import {
  PaceTracker,
  scoreEyeContactFromLandmarks,
  scorePostureFromMoveNet,
  type MirrorMetricSample,
} from '@seeneyu/scoring'
import { loadMirrorPipeline, type MirrorPipeline } from '../lib/mediapipe-loader'
import { CoachingEngine } from '../lib/coaching-rules'
import { PACE_WORKLET_NAME, paceWorkletBlobUrl } from '../lib/audio/pace-worklet'

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
let paceTracker: PaceTracker | null = null
let workletNode: AudioWorkletNode | null = null
let scriptProcessor: ScriptProcessorNode | null = null
let workletBlobUrl: string | null = null
const coach = new CoachingEngine()

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

    await startAudioAnalyser(stream)

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
  if (workletNode) {
    try { workletNode.disconnect() } catch {}
    try { workletNode.port.close() } catch {}
    workletNode = null
  }
  if (scriptProcessor) {
    try { scriptProcessor.disconnect() } catch {}
    scriptProcessor.onaudioprocess = null
    scriptProcessor = null
  }
  if (workletBlobUrl) {
    URL.revokeObjectURL(workletBlobUrl)
    workletBlobUrl = null
  }
  paceTracker?.reset()
  paceTracker = null
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
  tickCount = 0
  faceHits = 0
  poseHits = 0
  coach.reset()
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
  const sample: MirrorMetricSample = {
    t: Date.now() - sessionStart,
    eyeContact: scoreEyeContactFromLandmarks(faceKeypoints as any),
    posture: scorePostureFromMoveNet(poseKeypoints, videoWidth, videoHeight),
    vocalPaceWpm: paceTracker?.currentWpm() ?? null,
  }
  chrome.runtime.sendMessage({ type: 'mirror/sample', sample }).catch(() => {})

  // Run coaching rules against the rolling buffer; emit a nudge if any pattern fires.
  const nudge = coach.ingest(sample)
  if (nudge) {
    chrome.runtime.sendMessage({ type: 'mirror/nudge', nudge }).catch(() => {})
  }
}

// Vocal pace pipeline (M47):
//   AudioWorklet @ 50ms hops → {rms, zcr, t} per frame
//                            ↓
//   PaceTracker (VAD → SyllablePeakDetector → speaking-time-normalized WPM)
//
// AudioWorklet runs on the audio thread, so it isn't subject to main-thread
// rAF throttling that broke the previous estimator. PaceTracker normalizes
// WPM by ACTUAL speaking time, not wall-clock window — the user's bursty
// real-meeting cadence now reports honestly.
//
// Falls back to ScriptProcessorNode on browsers without AudioWorklet, with
// the same upstream contract (per-frame {rms, zcr, t}).
async function startAudioAnalyser(src: MediaStream) {
  const audioTracks = src.getAudioTracks()
  if (audioTracks.length === 0) {
    status('No audio track on the captured stream — pace can\'t be measured.', { kind: 'warn' })
    return
  }

  audioCtx = new AudioContext()
  await audioCtx.resume().catch(() => {})

  const sourceNode = audioCtx.createMediaStreamSource(src)
  paceTracker = new PaceTracker()

  let lastDiagAtAudio = Date.now()
  let framesSinceDiag = 0
  let speakingFramesSinceDiag = 0
  let peakRmsSinceDiag = 0

  const onFrame = (frame: { rms: number; zcr: number; t: number }) => {
    if (!loopActive || !paceTracker) return
    const wasSilent = paceTracker
      ? false // we only need the bool from VAD via PaceTracker
      : false
    paceTracker.push(frame)
    if (frame.rms > peakRmsSinceDiag) peakRmsSinceDiag = frame.rms
    framesSinceDiag++
    // We can't easily extract isSpeech from PaceTracker without exposing it;
    // approximate via "non-silent frame" using a low energy threshold for
    // the diagnostic line only.
    if (frame.rms > 0.005) speakingFramesSinceDiag++

    const now = Date.now()
    if (now - lastDiagAtAudio > 5000) {
      const wpm = paceTracker.currentWpm()
      const wpmText = wpm === null ? '—' : `${wpm} wpm`
      status(
        `mic peak ${peakRmsSinceDiag.toFixed(3)} · ${wpmText}`,
        { kind: 'info' },
      )
      lastDiagAtAudio = now
      framesSinceDiag = 0
      speakingFramesSinceDiag = 0
      peakRmsSinceDiag = 0
    }
    void wasSilent
  }

  if (audioCtx.audioWorklet) {
    try {
      workletBlobUrl = paceWorkletBlobUrl()
      await audioCtx.audioWorklet.addModule(workletBlobUrl)
      workletNode = new AudioWorkletNode(audioCtx, PACE_WORKLET_NAME)
      workletNode.port.onmessage = (e) => onFrame(e.data)
      sourceNode.connect(workletNode)
      // Connect to a muted destination so the graph runs (some browsers
      // optimize away unconnected processor chains). Use a zero-gain node so
      // we don't echo the mic to speakers.
      const sink = audioCtx.createGain()
      sink.gain.value = 0
      workletNode.connect(sink).connect(audioCtx.destination)
      return
    } catch (err) {
      status('AudioWorklet unavailable, falling back to ScriptProcessor.', {
        kind: 'warn',
        error: err,
      })
    }
  }

  // Fallback: ScriptProcessorNode at 4096-sample buffer (≈85ms @ 48kHz).
  const SP_BUF = 4096
  scriptProcessor = audioCtx.createScriptProcessor(SP_BUF, 1, 1)
  let elapsedMs = 0
  scriptProcessor.onaudioprocess = (e) => {
    const ch = e.inputBuffer.getChannelData(0)
    let sumSq = 0
    let zc = 0
    let prev = ch[0]
    for (let i = 0; i < ch.length; i++) {
      const v = ch[i]
      sumSq += v * v
      if ((prev >= 0 && v < 0) || (prev < 0 && v >= 0)) zc++
      prev = v
    }
    elapsedMs += (ch.length * 1000) / audioCtx!.sampleRate
    onFrame({
      rms: Math.sqrt(sumSq / ch.length),
      zcr: zc / ch.length,
      t: elapsedMs,
    })
  }
  sourceNode.connect(scriptProcessor)
  const sink = audioCtx.createGain()
  sink.gain.value = 0
  scriptProcessor.connect(sink).connect(audioCtx.destination)
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
