// TFJS WASM-based detector pipeline. Replaces the previous MediaPipe tasks-
// vision loader. Runs 100% on CPU + WebAssembly (SIMD when available) — no
// WebGL, no GPU, no chrome://flags tweaks needed. Works on every browser that
// supports WebAssembly, which is every modern browser.
//
// File name kept as mediapipe-loader.ts to minimize churn in offscreen.ts
// imports. The underlying runtime is pure TFJS.

import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-converter'
import '@tensorflow/tfjs-backend-wasm'
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import * as poseDetection from '@tensorflow-models/pose-detection'

export interface MirrorPipeline {
  face: faceLandmarksDetection.FaceLandmarksDetector
  pose: poseDetection.PoseDetector
  close: () => void
}

let tfInited = false

async function ensureTfBackend() {
  if (tfInited) return
  // Point the WASM backend at files shipped inside the extension — no CDN hits.
  setWasmPaths(chrome.runtime.getURL('public/wasm/tfjs-wasm/'))
  await tf.setBackend('wasm')
  await tf.ready()
  tfInited = true
}

export async function loadMirrorPipeline(): Promise<MirrorPipeline> {
  await ensureTfBackend()

  // Default model URLs (tfhub.dev) are used — models are static files with
  // no user data. Chrome caches the first download so subsequent session
  // starts are instant and offline-capable.
  const face = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    {
      runtime: 'tfjs',
      maxFaces: 1,
      refineLandmarks: false,
    },
  )

  const pose = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    },
  )

  return {
    face,
    pose,
    close() {
      try { face.dispose() } catch {}
      try { pose.dispose() } catch {}
    },
  }
}
