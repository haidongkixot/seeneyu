/**
 * MediaPipe Singleton Loader — lazy-loads FaceLandmarker + PoseLandmarker.
 *
 * IMPORTANT: This module must only be imported dynamically from client components.
 * It depends on WASM + WebGL browser APIs and will fail in SSR/Node.
 *
 * Models are loaded from Google CDN and cached by the browser after first download.
 * FaceLandmarker: ~5MB, PoseLandmarker (lite): ~3MB
 */

import {
  FaceLandmarker,
  PoseLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision'

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

let faceLandmarker: FaceLandmarker | null = null
let poseLandmarker: PoseLandmarker | null = null
let initPromise: Promise<void> | null = null

async function init() {
  const vision = await FilesetResolver.forVisionTasks(WASM_CDN)

  const [face, pose] = await Promise.all([
    FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }),
    PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }),
  ])

  faceLandmarker = face
  poseLandmarker = pose
}

export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!initPromise) initPromise = init()
  await initPromise
  return faceLandmarker!
}

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!initPromise) initPromise = init()
  await initPromise
  return poseLandmarker!
}

export async function getAll(): Promise<{ face: FaceLandmarker; pose: PoseLandmarker }> {
  if (!initPromise) initPromise = init()
  await initPromise
  return { face: faceLandmarker!, pose: poseLandmarker! }
}
