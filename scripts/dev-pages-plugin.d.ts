/**
 * Vite plugin: serve the static detail / category pages in dev mode.
 *
 * In production, `scripts/seo-inject.ts` writes static HTML files to
 * `dist/projects/<slug>/index.html` and `dist/categories/<cat>/index.html`.
 * The dev server has no idea about these — it falls back to index.html
 * (the SPA) for everything except JS/CSS modules.
 *
 * This plugin intercepts those URLs in dev and renders the same templates
 * on the fly, so /projects/tinyice/ etc. work in `npm run dev` too.
 */
import type { Plugin } from "vite";
export declare function devPagesPlugin(): Plugin;
