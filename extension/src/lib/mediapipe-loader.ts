// @vladmandic/human-based detector pipeline. Uses TFJS WASM backend so no
// WebGL or GPU is required. Models are fetched from cdn.jsdelivr.net on
// first use and cached by Chrome.
//
// All long-running steps emit progress to the side panel via the optional
// onProgress callback so the UI never silently hangs, and each await is
// wrapped in a hard timeout so a stuck network or backend init surfaces
// as a real error instead of an infinite spinner.

import { Human, type Config } from '@vladmandic/human'

export interface MirrorPipeline {
  detect: (video: HTMLVideoElement) => Promise<any>
  close: () => void
  backend: string
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
    mesh: { enabled: true },
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

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

export async function loadMirrorPipeline(opts: {
  onProgress?: (msg: string) => void
} = {}): Promise<MirrorPipeline> {
  const log = opts.onProgress ?? (() => {})
  if (!instance) {
    log('Initializing Human runtime…')
    instance = new Human(CONFIG as Config)

    log('Setting WASM backend…')
    // Force WASM explicitly. If we don't, Human silently falls back to its
    // 'humangl' (WebGL) backend, which then hangs forever on machines with
    // no WebGL. Setting it before load() ensures we fail fast if WASM is
    // somehow unavailable.
    await withTimeout(
      instance.tf.setBackend('wasm') as Promise<unknown>,
      15_000,
      'tf.setBackend(wasm)',
    )
    await withTimeout(instance.tf.ready() as Promise<unknown>, 15_000, 'tf.ready()')
    const activeBackend = instance.tf.getBackend()
    if (activeBackend !== 'wasm') {
      throw new Error(`TFJS backend is '${activeBackend}', expected 'wasm'`)
    }

    log('Downloading models from jsdelivr (first run only — ~3 MB)…')
    await withTimeout(instance.load(), 60_000, 'human.load()')

    log('Warming up models…')
    await withTimeout(instance.warmup() as Promise<unknown>, 30_000, 'human.warmup()')
  }
  const human = instance
  return {
    detect: (video) => human.detect(video),
    close: () => {
      /* keep the warm Human instance alive across stop/start */
    },
    backend: human.tf.getBackend(),
  }
}
