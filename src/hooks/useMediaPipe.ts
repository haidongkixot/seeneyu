'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AnalysisSnapshot, PoseLandmarkData, HandLandmarkData, Point3D } from '@/lib/mediapipe-types'

type FaceLandmarkerResult = {
  faceBlendshapes?: Array<{ categories: Array<{ categoryName: string; score: number }> }>
  faceLandmarks?: Array<Array<{ x: number; y: number; z: number }>>
}

type PoseLandmarkerResult = {
  landmarks?: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>
}

type HandLandmarkerResult = {
  landmarks?: Array<Array<{ x: number; y: number; z: number }>>
  handedness?: Array<Array<{ categoryName: string; score: number }>>
}

// Pose landmark indices (MediaPipe standard)
const POSE_IDX = {
  nose: 0, leftEar: 7, rightEar: 8,
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
} as const

function extractPoseLandmarks(
  landmarks: Array<{ x: number; y: number; z: number }>
): PoseLandmarkData {
  const get = (idx: number) => {
    const lm = landmarks[idx]
    return { x: lm.x, y: lm.y, z: lm.z }
  }
  return {
    nose: get(POSE_IDX.nose),
    leftEar: get(POSE_IDX.leftEar),
    rightEar: get(POSE_IDX.rightEar),
    leftShoulder: get(POSE_IDX.leftShoulder),
    rightShoulder: get(POSE_IDX.rightShoulder),
    leftElbow: get(POSE_IDX.leftElbow),
    rightElbow: get(POSE_IDX.rightElbow),
    leftWrist: get(POSE_IDX.leftWrist),
    rightWrist: get(POSE_IDX.rightWrist),
    leftHip: get(POSE_IDX.leftHip),
    rightHip: get(POSE_IDX.rightHip),
  }
}

// Hand landmark indices (MediaPipe standard — 21 per hand)
const HAND_NAMES: (keyof HandLandmarkData)[] = [
  'wrist', 'thumbCmc', 'thumbMcp', 'thumbIp', 'thumbTip',
  'indexMcp', 'indexPip', 'indexDip', 'indexTip',
  'middleMcp', 'middlePip', 'middleDip', 'middleTip',
  'ringMcp', 'ringPip', 'ringDip', 'ringTip',
  'pinkyMcp', 'pinkyPip', 'pinkyDip', 'pinkyTip',
]

function extractHandLandmarks(
  landmarks: Array<{ x: number; y: number; z: number }>,
): HandLandmarkData {
  const data: Record<string, Point3D> = {}
  for (let i = 0; i < HAND_NAMES.length; i++) {
    const lm = landmarks[i]
    data[HAND_NAMES[i]] = { x: lm.x, y: lm.y, z: lm.z }
  }
  return data as unknown as HandLandmarkData
}

export type DetectAllFn = (
  video: HTMLVideoElement,
  timestampMs: number
) => AnalysisSnapshot | null

export function useMediaPipe() {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const faceRef = useRef<any>(null)
  const poseRef = useRef<any>(null)
  const handRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { getAll } = await import('@/lib/mediapipe-init')
        const { face, pose, hand } = await getAll()
        if (!cancelled) {
          faceRef.current = face
          poseRef.current = pose
          handRef.current = hand
          setIsReady(true)
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('MediaPipe load error:', e)
          setError(
            'Failed to load analysis models. Please use a modern browser with WebGL support.'
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const detectAll: DetectAllFn = useCallback(
    (video: HTMLVideoElement, timestampMs: number) => {
      if (!faceRef.current || !poseRef.current) return null
      if (video.readyState < 2) return null

      // Face analysis
      let blendshapes: Record<string, number> = {}
      let faceDetected = false
      try {
        const faceResult: FaceLandmarkerResult = faceRef.current.detectForVideo(
          video,
          timestampMs
        )
        if (faceResult.faceBlendshapes?.[0]) {
          faceDetected = true
          for (const cat of faceResult.faceBlendshapes[0].categories) {
            blendshapes[cat.categoryName] = cat.score
          }
        }
      } catch {
        // Face detection can fail on some frames — skip
      }

      // Pose analysis
      let poseLandmarks: PoseLandmarkData | null = null
      try {
        const poseResult: PoseLandmarkerResult = poseRef.current.detectForVideo(
          video,
          timestampMs
        )
        if (poseResult.landmarks?.[0] && poseResult.landmarks[0].length >= 25) {
          poseLandmarks = extractPoseLandmarks(poseResult.landmarks[0])
        }
      } catch {
        // Pose detection can fail — skip
      }

      // Hand analysis
      let handLandmarks: { left: HandLandmarkData | null; right: HandLandmarkData | null } | undefined
      try {
        if (handRef.current) {
          const handResult: HandLandmarkerResult = handRef.current.detectForVideo(video, timestampMs)
          if (handResult.landmarks && handResult.landmarks.length > 0) {
            let left: HandLandmarkData | null = null
            let right: HandLandmarkData | null = null
            for (let i = 0; i < handResult.landmarks.length; i++) {
              const lm = handResult.landmarks[i]
              if (lm.length < 21) continue
              const label = handResult.handedness?.[i]?.[0]?.categoryName?.toLowerCase() ?? ''
              // MediaPipe mirrors: "Left" in result = user's right hand (camera mirror)
              if (label === 'left' && !right) right = extractHandLandmarks(lm)
              else if (label === 'right' && !left) left = extractHandLandmarks(lm)
              else if (!left) left = extractHandLandmarks(lm)
              else if (!right) right = extractHandLandmarks(lm)
            }
            if (left || right) handLandmarks = { left, right }
          }
        }
      } catch {
        // Hand detection can fail — skip
      }

      return {
        timestampMs,
        blendshapes,
        poseLandmarks,
        ...(handLandmarks ? { handLandmarks } : {}),
        faceDetected,
      }
    },
    []
  )

  return { isReady, isLoading, error, detectAll }
}
