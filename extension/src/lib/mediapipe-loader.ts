// @vladmandic/human-based detector pipeline. Replaces the @tensorflow-models
// stack because the tfhub.dev URLs they rely on were deprecated by Google in
// 2024 and the TFJS model storage bucket returns 403 for anonymous reads.
// Human hosts its models on JSDelivr (a stable, proven, always-on public
// CDN) and maintains them actively. Internally Human uses TFJS; we configure
// it to use the WASM backend so no WebGL / GPU is required at any point.

import { Human, type Config } from '@vladmandic/human'

export interface MirrorPipeline {
  detect: (video: HTMLVideoElement) => Promise<any>
  close: () => void
}

let instance: Human | null = null

const CONFIG: Partial<Config> = {
  backend: 'wasm',
  wasmPath: chrome.runtime.getURL('public/wasm/tfjs-wasm/'),
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  cacheSensitivity: 0.7,
  filter: { enabled: false },
  face: {
    enabled: true,
    detector: { rotation: false, maxDetected: 1, return: false },
    mesh: { enabled: true }, // 468-point mesh
    iris: { enabled: false },
    description: { enabled: false },
    emotion: { enabled: false },
    antispoof: { enabled: false },
    liveness: { enabled: false },
  },
  body: {
    enabled: true,
    maxDetected: 1,
    modelPath: 'movenet-lightning.json',
  },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  segmentation: { enabled: false },
}

export async function loadMirrorPipeline(): Promise<MirrorPipeline> {
  if (!instance) {
    instance = new Human(CONFIG as Config)
    await instance.load()
    await instance.warmup()
  }
  const human = instance
  return {
    detect: (video) => human.detect(video),
    close: () => {
      /* Human instances are reused across sessions — warmup is expensive.
         We keep the instance alive across stop/start to avoid the ~3s reload. */
    },
  }
}
