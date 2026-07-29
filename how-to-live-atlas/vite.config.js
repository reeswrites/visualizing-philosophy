import { defineConfig } from 'vite'

/* Relative base so the build works wherever it is mounted — locally, and at
   https://<user>.github.io/<repo>/how-to-live-atlas/ once the deploy workflow
   has collected it alongside the other visualizations. */
export default defineConfig({
  base: './',
  build: { outDir: 'dist', sourcemap: false },
})
