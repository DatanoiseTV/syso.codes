/**
 * Build-time SEO injection.
 *
 * Runs after `vite build`. Reads the merged project data from
 * src/data/projects.ts + src/data/autoProjects.ts, then:
 *
 *   1. Generates an ItemList JSON-LD block of every project + a SoftwareSourceCode
 *      entry for each, and replaces the <!--SEO_ITEM_LIST--> placeholder in
 *      dist/index.html with it.
 *
 *   2. Generates a static <noscript> block listing every project as a real
 *      <a> link with name and description, and replaces the <!--SEO_NOSCRIPT-->
 *      placeholder. Crawlers that don't run JS still see the full project
 *      list with internal links to GitHub.
 *
 *   3. Writes dist/sitemap.xml listing the homepage + every section anchor.
 *
 * Run via `tsx scripts/seo-inject.ts` (added to the `build` script).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { projects as curated } from "../src/data/projects";
import { autoProjects, pushedDates } from "../src/data/autoProjects";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distHtml = resolve(root, "dist/index.html");
const SITE = "https://syso.codes";

// ─── Merge curated + auto ──────────────────────────────────────────────────
const seen = new Set(curated.map((p) => p.slug));
const merged = [...curated, ...autoProjects.filter((p) => !seen.has(p.slug))].map(
  (p) => ({
    ...p,
    pushedAt: pushedDates[p.slug] ?? p.pushedAt,
  })
);

// Sort by recency for both the JSON-LD and noscript output
const sorted = [...merged].sort((a, b) => {
  const aDate = a.pushedAt ?? "";
  const bDate = b.pushedAt ?? "";
  if (bDate !== aDate) return bDate.localeCompare(aDate);
  if (b.stars !== a.stars) return b.stars - a.stars;
  return a.name.localeCompare(b.name);
});

// ─── ItemList JSON-LD ──────────────────────────────────────────────────────
function escapeJson(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
}

const itemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": "https://syso.codes/#projects",
  name: "Open-source projects by Sylwester (DatanoiseTV)",
  description:
    "All featured open-source projects on syso.codes, sorted by most recent push.",
  numberOfItems: sorted.length,
  itemListOrder: "https://schema.org/ItemListOrderDescending",
  itemListElement: sorted.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "SoftwareSourceCode",
      "@id": p.url,
      name: p.name,
      description: p.description,
      codeRepository: p.url,
      programmingLanguage: p.language,
      url: p.url,
      author: { "@id": "https://syso.codes/#person" },
      ...(p.topics.length > 0 && { keywords: p.topics.join(", ") }),
      ...(p.stars > 0 && {
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: p.stars,
        },
      }),
      ...(p.pushedAt && { dateModified: p.pushedAt }),
      ...(p.image && { image: p.image }),
    },
  })),
};

const itemListScript = `<script type="application/ld+json">${JSON.stringify(itemList)}</script>`;

// ─── Static <noscript> with the full project list ──────────────────────────
const grouped: Record<string, typeof sorted> = {};
for (const p of sorted) {
  (grouped[p.category] ??= []).push(p);
}

const categoryOrder: { key: string; label: string }[] = [
  { key: "audio-server", label: "Audio servers" },
  { key: "audio-app", label: "Audio apps & plugins" },
  { key: "embedded", label: "Embedded & hardware" },
  { key: "fpga", label: "FPGA gateware" },
  { key: "linux-audio", label: "Linux audio" },
  { key: "ai-tools", label: "AI tools" },
  { key: "dev-tools", label: "Developer tools & libraries" },
];

const escHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const noscriptInner = `
<style>
  .seo-static { padding: 80px 32px; max-width: 1200px; margin: 0 auto; font-family: system-ui, sans-serif; color: #ffffff; background: #000000; line-height: 1.55; }
  .seo-static h1 { font-size: 48px; margin: 0 0 16px; font-weight: 800; letter-spacing: -0.04em; }
  .seo-static h1 a { color: #ff6b35; text-decoration: none; }
  .seo-static p.lede { font-size: 18px; color: #a3a3a3; max-width: 720px; margin: 0 0 48px; }
  .seo-static h2 { font-size: 24px; margin: 56px 0 16px; color: #ff6b35; font-weight: 700; letter-spacing: -0.02em; }
  .seo-static ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr; gap: 14px; }
  .seo-static li { padding: 16px 20px; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; background: #0d0d0d; }
  .seo-static li a { color: #ffffff; font-weight: 700; font-size: 16px; text-decoration: none; }
  .seo-static li a:hover { color: #ff6b35; }
  .seo-static li small { display: block; color: #a3a3a3; font-size: 13px; margin-top: 4px; }
  .seo-static li .meta { display: inline-block; color: #ff6b35; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-right: 12px; }
</style>
<main class="seo-static">
  <h1>syso.codes — <a href="https://github.com/DatanoiseTV">Sylwester / DatanoiseTV</a></h1>
  <p class="lede">
    Berlin-based engineer working on embedded audio firmware, FPGA gateware,
    DSP languages, low-latency network audio (AES67/RAVENNA/ADAT), native
    macOS apps and audio plugins. ${sorted.length} featured projects across
    245 public repositories on GitHub.
  </p>
${categoryOrder
  .filter((c) => grouped[c.key]?.length)
  .map(
    (c) => `  <h2>${escHtml(c.label)}</h2>
  <ul>
${grouped[c.key]!
  .map(
    (p) => `    <li>
      <a href="${escHtml(p.url)}" rel="noopener">${escHtml(p.name)}</a>
      <small><span class="meta">${escHtml(p.language)}${p.stars > 0 ? ` · ★ ${p.stars}` : ""}</span>${escHtml(p.tagline)} — ${escHtml(p.description)}</small>
    </li>`
  )
  .join("\n")}
  </ul>`
  )
  .join("\n")}
</main>
`;

const noscriptBlock = `<noscript>${noscriptInner}</noscript>`;

// ─── Read & patch dist/index.html ──────────────────────────────────────────
let html = readFileSync(distHtml, "utf8");
html = html.replace("<!--SEO_ITEM_LIST-->", itemListScript);
html = html.replace("<!--SEO_NOSCRIPT-->", noscriptBlock);
writeFileSync(distHtml, html);

// ─── sitemap.xml ───────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const sectionAnchors = [
  { loc: `${SITE}/`, priority: "1.0", changefreq: "weekly" },
  { loc: `${SITE}/#about`, priority: "0.8", changefreq: "monthly" },
  { loc: `${SITE}/#activity`, priority: "0.7", changefreq: "daily" },
  { loc: `${SITE}/#featured`, priority: "0.9", changefreq: "weekly" },
  { loc: `${SITE}/#projects`, priority: "0.9", changefreq: "weekly" },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sectionAnchors
  .map(
    (a) => `  <url>
    <loc>${a.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${a.changefreq}</changefreq>
    <priority>${a.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync(resolve(root, "dist/sitemap.xml"), sitemap);

console.log(
  `SEO inject: ${sorted.length} projects in ItemList, ${
    Object.keys(grouped).length
  } categories in noscript, ${sectionAnchors.length} URLs in sitemap.xml`
);
