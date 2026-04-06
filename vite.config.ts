import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { devPagesPlugin } from "./scripts/dev-pages-plugin";

// The site is deployed at the custom domain `syso.codes` (see public/CNAME).
// If you ever serve it from `datanoisetv.github.io/syso.codes/` instead,
// change `base` to `/syso.codes/` (or pass `--base=/syso.codes/`).
export default defineConfig({
  plugins: [react(), devPagesPlugin()],
  base: "/",
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
