// Copies the TFJS WebAssembly runtime into extension/public/wasm/tfjs-wasm/
// so Chrome can load it from the extension origin (needed before any model
// fetch can run). @vladmandic/human bundles the tfjs-backend-wasm binaries
// alongside its own code under node_modules/@vladmandic/human/dist/.
//
// ML model weights are NOT copied — they're fetched from cdn.jsdelivr.net on
// first use (public, stable, versioned CDN) and cached by Chrome. Models are
// static files containing zero user data; serving them from jsdelivr is the
// same trust model as importing any npm package.

import { mkdirSync, existsSync, readdirSync, cpSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'public', 'wasm')
const NODE_MODULES = resolve(__dirname, '..', 'node_modules')

function locateTfjsWasmDir() {
  // @vladmandic/human re-exports tfjs; its wasm binaries live inside the
  // package under dist/ or under the nested tfjs-backend-wasm dep.
  const candidates = [
    resolve(NODE_MODULES, '@vladmandic/human/dist'),
    resolve(NODE_MODULES, '@vladmandic/human/node_modules/@tensorflow/tfjs-backend-wasm/dist'),
    resolve(NODE_MODULES, '@tensorflow/tfjs-backend-wasm/dist'),
  ]
  for (const c of candidates) {
    if (!existsSync(c)) continue
    const hasWasm = readdirSync(c).some((f) => f.endsWith('.wasm'))
    if (hasWasm) return c
  }
  return null
}

function copyTfjsWasm() {
  const src = locateTfjsWasmDir()
  if (!src) {
    throw new Error(
      'Could not locate tfjs-backend-wasm .wasm files. Try: npm install @tensorflow/tfjs-backend-wasm',
    )
  }
  const dest = resolve(OUT, 'tfjs-wasm')
  mkdirSync(dest, { recursive: true })

  // Skip the threaded SIMD variant — it requires SharedArrayBuffer-backed
  // Worker threads, which need a blob:-URL importScripts() that MV3
  // extension CSP blocks. Without this file present, TFJS auto-detects
  // and falls back to the non-threaded SIMD build, which works fine in
  // extensions and is plenty fast for our 2 Hz sampling.
  const SKIP = new Set(['tfjs-backend-wasm-threaded-simd.wasm'])

  let count = 0
  for (const f of readdirSync(src)) {
    if (!f.endsWith('.wasm')) continue
    if (SKIP.has(f)) continue
    cpSync(resolve(src, f), resolve(dest, f))
    count++
  }
  if (count === 0) throw new Error(`No .wasm files found in ${src}`)
  const total = readdirSync(dest).reduce((s, f) => s + statSync(resolve(dest, f)).size, 0)
  console.log(`✓ TFJS WASM runtime (${count} files, ${(total / 1_048_576).toFixed(1)} MB, threaded variant skipped) → public/wasm/tfjs-wasm/`)
}

mkdirSync(OUT, { recursive: true })
copyTfjsWasm()
