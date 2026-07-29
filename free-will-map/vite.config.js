import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* Relative base so the build works wherever it is mounted — locally, and at
   https://<user>.github.io/<repo>/free-will-map/ once the deploy workflow
   has collected it alongside the other visualizations. */
export default defineConfig({
  plugins: [react()],
  base: "./",
});
