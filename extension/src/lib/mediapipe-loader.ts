import {
  FaceLandmarker,
  FilesetResolver,
  PoseLandmarker,
} from '@mediapipe/tasks-vision'

export interface MirrorPipeline {
  face: FaceLandmarker
  pose: PoseLandmarker
  close: () => void
}

// Loads the MediaPipe vision runtime and models from the extension's own
// chrome-extension:// origin. No external network at runtime — required for
// the T1 privacy invariant.
export async function loadMirrorPipeline(): Promise<MirrorPipeline> {
  const base = chrome.runtime.getURL('public/wasm')

  const vision = await FilesetResolver.forVisionTasks(base)

  const face = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `${base}/face_landmarker.task`,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  })

  const pose = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `${base}/pose_landmarker_lite.task`,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  })

  return {
    face,
    pose,
    close() {
      try { face.close() } catch {}
      try { pose.close() } catch {}
    },
  }
}
