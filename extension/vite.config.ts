import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { copyFileSync } from 'node:fs'

function copyManifest() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json'),
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), copyManifest()],
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
