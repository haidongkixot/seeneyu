// @vladmandic/human-based detector pipeline. Tries TFJS WASM backend first
// (fast, ~50ms/frame) and falls back to CPU backend (slower, ~200ms/frame
// but still functional) if WASM init fails — extension always works.
//
// All long-running steps emit progress to the side panel so the UI never
// hangs silently, and each await is wrapped in a hard timeout.

import { Human, type Config } from '@vladmandic/human'

export interface MirrorPipeline {
  detect: (video: HTMLVideoElement) => Promise<any>
  close: () => void
  backend: string
}

let instance: Human | null = null

const BASE_CONFIG: Partial<Config> = {
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
  body: { enabled: true, maxDetected: 1, modelPath: 'movenet-lightning.json' },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  segmentation: { enabled: false },
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    p.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}

async function probeWasmFile(wasmBase: string, log: (m: string) => void) {
  const url = wasmBase + 'tfjs-backend-wasm-simd.wasm'
  try {
    const r = await fetch(url, { method: 'HEAD' })
    log(`WASM file probe: ${r.status} ${r.headers.get('content-type') || ''}`)
    return r.ok
  } catch (err) {
    log(`WASM file probe failed: ${(err as Error).message}`)
    return false
  }
}

export async function loadMirrorPipeline(opts: {
  onProgress?: (msg: string) => void
} = {}): Promise<MirrorPipeline> {
  const log = opts.onProgress ?? (() => {})
  if (instance) {
    return {
      detect: (v) => instance!.detect(v),
      close: () => {},
      backend: instance.tf.getBackend(),
    }
  }

  const wasmBase = chrome.runtime.getURL('public/wasm/tfjs-wasm/')
  log('Verifying local WASM runtime…')
  const wasmReachable = await probeWasmFile(wasmBase, log)

  const config: Partial<Config> = {
    ...BASE_CONFIG,
    backend: wasmReachable ? 'wasm' : 'cpu',
    wasmPath: wasmBase,
    wasmPlatformFetch: true,
  }

  log(`Initializing Human runtime (preferred backend: ${config.backend})…`)
  instance = new Human(config as Config)

  // Explicitly disable the threaded WASM build: it spawns a Worker that
  // imports a blob: URL via importScripts(), which MV3 extension CSP blocks.
  // Even when the threaded .wasm file is absent, TFJS detects multi-thread
  // capability and tries to fetch it. Setting this flag forces the SIMD
  // (non-threaded) build.
  try {
    const env = (instance.tf as any).env?.()
    if (env?.set) {
      env.set('WASM_HAS_MULTITHREAD_SUPPORT', false)
      env.set('WASM_HAS_SIMD_SUPPORT', true)
    }
  } catch {
    /* not fatal */
  }

  log('Downloading models from jsdelivr (first run only — ~3 MB)…')
  await withTimeout(instance.load(), 90_000, 'human.load()')

  const activeBackend = instance.tf.getBackend()
  log(`TFJS active backend: ${activeBackend}`)

  // If we asked for WASM and got something else, try one explicit retry —
  // sometimes Human registers backends in load() and the explicit setBackend
  // afterwards picks them up.
  if (config.backend === 'wasm' && activeBackend !== 'wasm') {
    log('Forcing WASM backend after load…')
    try {
      await withTimeout(instance.tf.setBackend('wasm') as Promise<unknown>, 15_000, 'setBackend(wasm)')
      await withTimeout(instance.tf.ready() as Promise<unknown>, 15_000, 'tf.ready()')
    } catch (err) {
      log(`WASM activation failed: ${(err as Error).message} — staying on '${activeBackend}'`)
    }
  }

  const finalBackend = instance.tf.getBackend()
  if (finalBackend !== 'wasm' && finalBackend !== 'cpu') {
    throw new Error(`TFJS landed on unexpected backend '${finalBackend}'`)
  }
  if (finalBackend === 'cpu') {
    log("Using CPU backend — detection works but will be slower (~5 fps).")
  }

  log('Warming up models…')
  await withTimeout(instance.warmup() as Promise<unknown>, 60_000, 'human.warmup()')

  const human = instance
  return {
    detect: (video) => human.detect(video),
    close: () => {},
    backend: finalBackend,
  }
}
