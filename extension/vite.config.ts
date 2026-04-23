import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'

const WASM_RUNTIME_SRC = resolve(__dirname, 'node_modules/@mediapipe/tasks-vision/wasm')

function copyManifestAndAssets() {
  return {
    name: 'copy-manifest-and-assets',
    closeBundle() {
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json'),
      )

      const wasmOut = resolve(__dirname, 'dist/public/wasm')
      mkdirSync(wasmOut, { recursive: true })

      // MediaPipe Vision WASM runtime (vision_wasm_internal.{js,wasm}, etc.)
      if (existsSync(WASM_RUNTIME_SRC)) {
        for (const f of readdirSync(WASM_RUNTIME_SRC)) {
          copyFileSync(resolve(WASM_RUNTIME_SRC, f), resolve(wasmOut, f))
        }
      }

      // .task model files downloaded by scripts/download-models.mjs
      const modelSrc = resolve(__dirname, 'public/wasm')
      if (existsSync(modelSrc)) {
        for (const f of readdirSync(modelSrc)) {
          if (f.endsWith('.task')) {
            copyFileSync(resolve(modelSrc, f), resolve(wasmOut, f))
          }
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyManifestAndAssets()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        offscreen: resolve(__dirname, 'src/offscreen/offscreen.html'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'service-worker') return 'src/background/service-worker.js'
          return 'src/[name]/[name].js'
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@seeneyu/scoring': resolve(__dirname, '../packages/scoring/src/index.ts'),
    },
  },
})
