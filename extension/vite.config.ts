import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { copyFileSync, cpSync, existsSync } from 'node:fs'

function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json'),
      )

      // Everything in public/wasm/ (TFJS WASM runtime + downloaded models)
      // is copied wholesale into dist/public/wasm/ so chrome.runtime.getURL
      // resolves correctly at runtime.
      const publicWasm = resolve(__dirname, 'public/wasm')
      if (existsSync(publicWasm)) {
        cpSync(publicWasm, resolve(__dirname, 'dist/public/wasm'), { recursive: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyStaticAssets()],
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
