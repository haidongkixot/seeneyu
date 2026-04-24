// Copies the TFJS WebAssembly runtime (from node_modules) into
// extension/public/wasm/tfjs-wasm/ so Chrome can load it from the extension
// origin. The actual ML model weights are fetched from Google's public TFJS
// CDN on first use by @tensorflow-models/* and cached by Chrome; they are
// static files containing zero user data.
//
// Reasons for this split:
//   • TFJS WASM runtime is a few small .wasm files (1–3 MB total) — trivial
//     to bundle and required BEFORE any network I/O can happen.
//   • Model weights (~20 MB) are better served from Google's CDN, which
//     handles versioning, compression, and range-caching. Bundling them
//     would balloon the extension's unpacked size and duplicate what
//     Chrome's HTTP cache already does well.

import { mkdirSync, existsSync, readdirSync, cpSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'public', 'wasm')
const NODE_MODULES = resolve(__dirname, '..', 'node_modules')

function copyTfjsWasm() {
  const src = resolve(NODE_MODULES, '@tensorflow/tfjs-backend-wasm/dist')
  const dest = resolve(OUT, 'tfjs-wasm')
  mkdirSync(dest, { recursive: true })
  if (!existsSync(src)) {
    throw new Error('@tensorflow/tfjs-backend-wasm not found — run npm install first.')
  }
  for (const f of readdirSync(src)) {
    if (f.endsWith('.wasm')) cpSync(resolve(src, f), resolve(dest, f))
  }
  const files = readdirSync(dest).filter((f) => f.endsWith('.wasm'))
  if (files.length === 0) throw new Error('No tfjs-backend-wasm .wasm files found to copy.')
  console.log(`✓ TFJS WASM runtime (${files.length} files) → public/wasm/tfjs-wasm/`)
}

mkdirSync(OUT, { recursive: true })
copyTfjsWasm()
