import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The site is deployed at the custom domain `syso.codes` (see public/CNAME).
// If you ever serve it from `datanoisetv.github.io/syso.codes/` instead,
// change `base` to `/syso.codes/` (or pass `--base=/syso.codes/`).
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
