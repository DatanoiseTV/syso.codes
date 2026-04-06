/**
 * Build-time SEO injection + static multi-page generator.
 *
 * Runs after `vite build`. Reads the merged project data via the shared
 * `lib/page-templates` module, then:
 *
 *   1. Injects ItemList JSON-LD + a static <noscript> project list into
 *      dist/index.html (the SPA entry).
 *
 *   2. Writes one static HTML page per project at
 *      dist/projects/<slug>/index.html.
 *
 *   3. Writes one static HTML page per category at
 *      dist/categories/<category>/index.html.
 *
 *   4. Writes dist/projects/index.html and dist/categories/index.html.
 *
 *   5. Writes dist/sitemap.xml covering every generated page.
 *
 * The same templates are reused at dev time by `dev-pages-plugin.ts`
 * (a Vite plugin loaded in vite.config.ts), so the same URLs work in
 * `npm run dev` without needing a build.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES, categoriesIndexPage, categoryPage, grouped, homepageItemListJsonLd, homepageNoscript, projectPage, projectsIndexPage, sitemapXml, sorted, } from "./lib/page-templates";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distRoot = resolve(root, "dist");
const distHtml = resolve(distRoot, "index.html");
// ─── Inject SPA homepage with JSON-LD + noscript ──────────────────────────
let html = readFileSync(distHtml, "utf8");
html = html.replace("<!--SEO_ITEM_LIST-->", homepageItemListJsonLd());
html = html.replace("<!--SEO_NOSCRIPT-->", homepageNoscript());
writeFileSync(distHtml, html);
// ─── Write per-project pages ──────────────────────────────────────────────
let projectCount = 0;
for (const p of sorted) {
    const dir = resolve(distRoot, "projects", p.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, "index.html"), projectPage(p));
    projectCount++;
}
// ─── Write per-category pages ─────────────────────────────────────────────
let categoryCount = 0;
for (const cat of Object.keys(grouped)) {
    if (!CATEGORIES[cat])
        continue;
    const dir = resolve(distRoot, "categories", cat);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, "index.html"), categoryPage(cat));
    categoryCount++;
}
// ─── Write index pages ────────────────────────────────────────────────────
mkdirSync(resolve(distRoot, "categories"), { recursive: true });
writeFileSync(resolve(distRoot, "categories/index.html"), categoriesIndexPage());
mkdirSync(resolve(distRoot, "projects"), { recursive: true });
writeFileSync(resolve(distRoot, "projects/index.html"), projectsIndexPage());
// ─── sitemap.xml ───────────────────────────────────────────────────────────
writeFileSync(resolve(distRoot, "sitemap.xml"), sitemapXml());
console.log(`SEO inject:\n  ${sorted.length} projects in ItemList\n  ${projectCount} per-project pages\n  ${categoryCount} per-category pages\n  2 index pages (projects, categories)\n  + sitemap.xml`);
