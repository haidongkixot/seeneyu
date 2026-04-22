// Mirror Mode — minimal, deterministic reducers for the three MVP metrics.
// Input is domain-neutral on purpose so the extension can feed whatever
// MediaPipe / WebAudio values it derives locally without importing heavy deps.

export interface FaceLandmarksInput {
  // Gaze direction vector, camera-relative. null if face not detected.
  gazeVector: { x: number; y: number; z: number } | null
}

export interface PoseLandmarksInput {
  // Normalized 0..1, MediaPipe pose landmark format.
  leftShoulder: { x: number; y: number } | null
  rightShoulder: { x: number; y: number } | null
  nose: { x: number; y: number } | null
}

export interface AudioFrameInput {
  // Syllable-peak count in the last 1s window (WebAudio energy-peak heuristic).
  // No transcript, no STT.
  syllablesLastSecond: number
}

export interface MirrorMetricSample {
  t: number // ms since session start
  eyeContact: boolean | null // true if gaze within threshold, null if no face
  posture: number | null // 0..100
  vocalPaceWpm: number | null // windowed WPM
}

export interface MirrorMetricAggregate {
  avgEyeContactPct: number | null
  avgPostureScore: number | null
  avgVocalPaceWpm: number | null
  sampleCount: number
  eyeContactSamples: number
  postureSamples: number
  paceSamples: number
}

const GAZE_THRESHOLD_COS = Math.cos((15 * Math.PI) / 180) // within 15° of camera axis

export function scoreEyeContact(face: FaceLandmarksInput): boolean | null {
  const v = face.gazeVector
  if (!v) return null
  const mag = Math.hypot(v.x, v.y, v.z)
  if (mag === 0) return null
  // Camera axis is (0, 0, -1). Dot product with normalized gaze gives cos(angle).
  const cos = -v.z / mag
  return cos >= GAZE_THRESHOLD_COS
}

export function scorePosture(pose: PoseLandmarksInput): number | null {
  const { leftShoulder, rightShoulder, nose } = pose
  if (!leftShoulder || !rightShoulder) return null

  // Shoulder levelness: smaller |dy| → higher score.
  const shoulderDy = Math.abs(leftShoulder.y - rightShoulder.y)
  const shoulderLevelness = Math.max(0, 1 - shoulderDy / 0.1) // 0.1 of frame height = flat 0

  // Forward head tilt: nose x should sit near the shoulder midpoint.
  let headAlignment = 1
  if (nose) {
    const midX = (leftShoulder.x + rightShoulder.x) / 2
    const offset = Math.abs(nose.x - midX)
    headAlignment = Math.max(0, 1 - offset / 0.15)
  }

  const score = (shoulderLevelness * 0.6 + headAlignment * 0.4) * 100
  return Math.round(Math.max(0, Math.min(100, score)))
}

// Rolling WPM estimator. Call once per ~1s bucket; pass the last ~30s window
// of syllable counts to smooth spiky detections. 1 syllable ≈ 0.6 word.
export function estimateVocalPaceWpm(syllableCountsLastWindow: number[]): number | null {
  if (syllableCountsLastWindow.length === 0) return null
  const syllables = syllableCountsLastWindow.reduce((a, b) => a + b, 0)
  const seconds = syllableCountsLastWindow.length
  if (seconds === 0) return null
  const words = syllables * 0.6
  const wpm = (words / seconds) * 60
  return Math.round(Math.max(0, Math.min(500, wpm)))
}

export function aggregateSamples(samples: MirrorMetricSample[]): MirrorMetricAggregate {
  if (samples.length === 0) {
    return {
      avgEyeContactPct: null,
      avgPostureScore: null,
      avgVocalPaceWpm: null,
      sampleCount: 0,
      eyeContactSamples: 0,
      postureSamples: 0,
      paceSamples: 0,
    }
  }

  let eyeYes = 0
  let eyeTotal = 0
  let postureSum = 0
  let postureN = 0
  let paceSum = 0
  let paceN = 0

  for (const s of samples) {
    if (s.eyeContact !== null) {
      eyeTotal++
      if (s.eyeContact) eyeYes++
    }
    if (typeof s.posture === 'number') {
      postureSum += s.posture
      postureN++
    }
    if (typeof s.vocalPaceWpm === 'number') {
      paceSum += s.vocalPaceWpm
      paceN++
    }
  }

  return {
    avgEyeContactPct: eyeTotal > 0 ? (eyeYes / eyeTotal) * 100 : null,
    avgPostureScore: postureN > 0 ? postureSum / postureN : null,
    avgVocalPaceWpm: paceN > 0 ? paceSum / paceN : null,
    sampleCount: samples.length,
    eyeContactSamples: eyeTotal,
    postureSamples: postureN,
    paceSamples: paceN,
  }
}
