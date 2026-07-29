import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * Relative base so the build works wherever it is mounted — locally, and at
 * https://<user>.github.io/<repo>/thinking-about-thinking/ once the deploy
 * workflow has collected it alongside the other visualizations. Set
 * VITE_BASE to override, for example when serving from a custom domain.
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        timeline: at('./index.html'),
        cladogram: at('./cladogram.html'),
      },
    },
  },
})
