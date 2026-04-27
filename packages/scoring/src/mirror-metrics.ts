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

// MediaPipe FaceLandmarker emits 478 normalized landmarks. Key indices used here:
// - Left iris center: 468 (landmarks 468-472 are the left iris ring)
// - Right iris center: 473
// - Left eye inner corner: 133 — outer corner: 33
// - Right eye inner corner: 362 — outer corner: 263
// Iris-centering is a robust "looking at camera" proxy: both irises centered
// between inner and outer corners means gaze is aimed at the camera.
export interface FaceLandmark {
  x: number
  y: number
  z?: number
}

const LEFT_IRIS = 468
const RIGHT_IRIS = 473
const LEFT_EYE_INNER = 133
const LEFT_EYE_OUTER = 33
const RIGHT_EYE_INNER = 362
const RIGHT_EYE_OUTER = 263
const IRIS_CENTER_TOLERANCE = 0.22 // fraction of half-eye-width

function irisCentered(
  iris: FaceLandmark | undefined,
  inner: FaceLandmark | undefined,
  outer: FaceLandmark | undefined,
): boolean | null {
  if (!iris || !inner || !outer) return null
  const eyeWidth = Math.abs(outer.x - inner.x)
  if (eyeWidth < 0.01) return null
  const mid = (inner.x + outer.x) / 2
  const offsetNorm = Math.abs(iris.x - mid) / (eyeWidth / 2)
  return offsetNorm <= IRIS_CENTER_TOLERANCE
}

export function scoreEyeContactFromLandmarks(landmarks: FaceLandmark[] | null): boolean | null {
  if (!landmarks || landmarks.length === 0) return null
  // Prefer iris-centering when iris landmarks are present (478-point model).
  if (landmarks.length >= 478 && landmarks[LEFT_IRIS] && landmarks[RIGHT_IRIS]) {
    const left = irisCentered(
      landmarks[LEFT_IRIS], landmarks[LEFT_EYE_INNER], landmarks[LEFT_EYE_OUTER],
    )
    const right = irisCentered(
      landmarks[RIGHT_IRIS], landmarks[RIGHT_EYE_INNER], landmarks[RIGHT_EYE_OUTER],
    )
    if (left !== null && right !== null) return left && right
  }
  // Fallback for 468-point model without iris: a face that is present and
  // oriented toward the camera (eyes roughly level) counts as eye contact.
  // This is coarser than iris tracking but non-null is better than silent "—".
  const leftEyeInner = landmarks[LEFT_EYE_INNER]
  const rightEyeInner = landmarks[RIGHT_EYE_INNER]
  if (!leftEyeInner || !rightEyeInner) return null
  const dy = Math.abs(leftEyeInner.y - rightEyeInner.y)
  const dx = Math.abs(leftEyeInner.x - rightEyeInner.x) + 1e-6
  const tilt = dy / dx
  return tilt < 0.25
}

// Convenience wrapper around scorePosture for MediaPipe PoseLandmarker output.
// PoseLandmarker emits 33 landmarks. Key indices:
// - 0: nose, 11: left shoulder, 12: right shoulder
export function scorePostureFromLandmarks(landmarks: FaceLandmark[] | null): number | null {
  if (!landmarks || landmarks.length === 0) return null
  return scorePosture({
    leftShoulder: landmarks[11] ?? null,
    rightShoulder: landmarks[12] ?? null,
    nose: landmarks[0] ?? null,
  })
}

// MoveNet emits 17 COCO-format keypoints. Different indices and — importantly
// for MoveNet — the returned x/y are in PIXEL coordinates rather than
// normalized 0..1, so the caller must pass videoWidth/videoHeight to convert.
// MoveNet indices: 0: nose, 5: left shoulder, 6: right shoulder.
export function scorePostureFromMoveNet(
  keypoints: Array<{ x: number; y: number; score?: number }> | null,
  videoWidth: number,
  videoHeight: number,
  minConfidence = 0.3,
): number | null {
  if (!keypoints || keypoints.length < 7 || videoWidth <= 0 || videoHeight <= 0) return null
  const norm = (kp: { x: number; y: number; score?: number } | undefined) => {
    if (!kp) return null
    if (typeof kp.score === 'number' && kp.score < minConfidence) return null
    return { x: kp.x / videoWidth, y: kp.y / videoHeight }
  }
  return scorePosture({
    leftShoulder: norm(keypoints[5]),
    rightShoulder: norm(keypoints[6]),
    nose: norm(keypoints[0]),
  })
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

// Rolling WPM estimator. Pass the last ~30s window of per-second syllable
// counts (peak onsets, NOT raw frame hits). English averages ~1.5 syllables
// per word, so words = syllables / 1.5. Returns null when the window is
// empty OR when the user has been silent the entire window (no signal at all
// is different from "speaking 0 wpm" — null reads as "—" in the HUD instead
// of a misleading zero).
export function estimateVocalPaceWpm(syllableCountsLastWindow: number[]): number | null {
  if (syllableCountsLastWindow.length === 0) return null
  const syllables = syllableCountsLastWindow.reduce((a, b) => a + b, 0)
  if (syllables === 0) return null
  const seconds = syllableCountsLastWindow.length
  const words = syllables / 1.5
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
