/**
 * Shared types for MediaPipe analysis data — used by both client and server.
 */

/** Extracted pose landmark positions (normalized 0-1 coordinates) */
export interface PoseLandmarkData {
  nose: { x: number; y: number; z: number }
  leftEar: { x: number; y: number; z: number }
  rightEar: { x: number; y: number; z: number }
  leftShoulder: { x: number; y: number; z: number }
  rightShoulder: { x: number; y: number; z: number }
  leftElbow: { x: number; y: number; z: number }
  rightElbow: { x: number; y: number; z: number }
  leftWrist: { x: number; y: number; z: number }
  rightWrist: { x: number; y: number; z: number }
  leftHip: { x: number; y: number; z: number }
  rightHip: { x: number; y: number; z: number }
}

/** 3D coordinate point */
export type Point3D = { x: number; y: number; z: number }

/** Hand landmark positions (21 landmarks per hand, normalized 0-1) */
export interface HandLandmarkData {
  wrist: Point3D
  thumbCmc: Point3D
  thumbMcp: Point3D
  thumbIp: Point3D
  thumbTip: Point3D
  indexMcp: Point3D
  indexPip: Point3D
  indexDip: Point3D
  indexTip: Point3D
  middleMcp: Point3D
  middlePip: Point3D
  middleDip: Point3D
  middleTip: Point3D
  ringMcp: Point3D
  ringPip: Point3D
  ringDip: Point3D
  ringTip: Point3D
  pinkyMcp: Point3D
  pinkyPip: Point3D
  pinkyDip: Point3D
  pinkyTip: Point3D
}

/** Temporal analysis of expression transitions across snapshots */
export interface TransitionEvent {
  fromState: string
  toState: string
  atMs: number
  transitionDurationMs: number
  smoothnessScore: number // 0-100
}

export interface TemporalAnalysis {
  transitions: TransitionEvent[]
  holdDurations: { expression: string; durationMs: number }[]
  avgTransitionSmoothness: number // 0-100
  recoverySpeedMs: number | null
  rhythmScore: number // 0-100
  expressionVariety: number
}

/** A single analysis snapshot captured at a point in time */
export interface AnalysisSnapshot {
  /** Timestamp in milliseconds (performance.now()) */
  timestampMs: number
  /** 52 ARKit blendshape values (0.0 - 1.0) keyed by name */
  blendshapes: Record<string, number>
  /** Extracted pose landmarks, null if no body detected */
  poseLandmarks: PoseLandmarkData | null
  /** Hand landmarks, null if no hands detected */
  handLandmarks?: { left: HandLandmarkData | null; right: HandLandmarkData | null }
  /** Whether a face was detected in this frame */
  faceDetected: boolean
}

/** Payload sent from client to server for Arcade attempts */
export interface ArcadeAnalysisPayload {
  challengeId: string
  snapshots: AnalysisSnapshot[]
  peakSnapshot: AnalysisSnapshot
}

/** Payload sent from client to server for Micro-Practice */
export interface MicroAnalysisPayload {
  snapshots: AnalysisSnapshot[]
}
