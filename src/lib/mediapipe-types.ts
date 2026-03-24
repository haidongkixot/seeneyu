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

/** A single analysis snapshot captured at a point in time */
export interface AnalysisSnapshot {
  /** Timestamp in milliseconds (performance.now()) */
  timestampMs: number
  /** 52 ARKit blendshape values (0.0 - 1.0) keyed by name */
  blendshapes: Record<string, number>
  /** Extracted pose landmarks, null if no body detected */
  poseLandmarks: PoseLandmarkData | null
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
