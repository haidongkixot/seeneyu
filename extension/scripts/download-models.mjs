// Downloads MediaPipe .task model files into extension/public/wasm/ so they
// ship inside the extension bundle (loaded at runtime from
// chrome-extension:// URLs — no network calls during coaching, preserves the
// T1 privacy invariant). Idempotent: skips files that already exist.

import { mkdirSync, existsSync, createWriteStream, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'public', 'wasm')

const MODELS = [
  {
    name: 'face_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    expectedMinBytes: 3_000_000,
  },
  {
    name: 'pose_landmarker_lite.task',
    url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    expectedMinBytes: 4_000_000,
  },
]

async function download(url, destPath) {
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Download failed for ${url}: ${res.status}`)
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath))
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  for (const m of MODELS) {
    const dest = resolve(OUT_DIR, m.name)
    if (existsSync(dest) && statSync(dest).size >= m.expectedMinBytes) {
      console.log(`✓ ${m.name} (cached)`)
      continue
    }
    process.stdout.write(`↓ ${m.name} ... `)
    await download(m.url, dest)
    const size = statSync(dest).size
    if (size < m.expectedMinBytes) {
      throw new Error(`${m.name} too small (${size} bytes) — download corrupt?`)
    }
    console.log(`done (${(size / 1_048_576).toFixed(1)} MB)`)
  }
}

main().catch((err) => {
  console.error('Model download failed:', err)
  process.exit(1)
})
