/**
 * Build-time SEO injection + static multi-page generator.
 *
 * Runs after `vite build`. Reads the merged project data from
 * src/data/projects.ts + src/data/autoProjects.ts, then:
 *
 *   1. Injects ItemList JSON-LD + a static <noscript> project list into
 *      dist/index.html (the SPA entry).
 *
 *   2. Writes one static HTML page per project at
 *      dist/projects/<slug>/index.html with full project meta + JSON-LD.
 *
 *   3. Writes one static HTML page per category at
 *      dist/categories/<category>/index.html listing every project in it.
 *
 *   4. Writes dist/projects/index.html and dist/categories/index.html as
 *      directory landing pages.
 *
 *   5. Writes dist/sitemap.xml covering every generated page.
 *
 * The static pages are standalone HTML — they don't load the React bundle.
 * That makes them small, fast, crawlable, and they degrade gracefully for
 * users with JS off. Each one links back to the SPA homepage and to GitHub.
 *
 * Run via `tsx scripts/seo-inject.ts` (added to the `build` script).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { projects as curated } from "../src/data/projects";
import { autoProjects, pushedDates } from "../src/data/autoProjects";
import type { Project } from "../src/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distRoot = resolve(root, "dist");
const distHtml = resolve(distRoot, "index.html");
const SITE = "https://syso.codes";

// ─── Merge curated + auto ──────────────────────────────────────────────────
const seen = new Set(curated.map((p) => p.slug));
const merged: Project[] = [
  ...curated,
  ...autoProjects.filter((p) => !seen.has(p.slug)),
].map((p) => ({
  ...p,
  pushedAt: pushedDates[p.slug] ?? p.pushedAt,
}));

const sorted = [...merged].sort((a, b) => {
  const aDate = a.pushedAt ?? "";
  const bDate = b.pushedAt ?? "";
  if (bDate !== aDate) return bDate.localeCompare(aDate);
  if (b.stars !== a.stars) return b.stars - a.stars;
  return a.name.localeCompare(b.name);
});

// ─── Helpers ───────────────────────────────────────────────────────────────
const escHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escAttr = escHtml;

const CATEGORIES: Record<string, { label: string; description: string }> = {
  "audio-server": {
    label: "Audio servers",
    description: "Streaming and audio server projects — Icecast-compatible, JACK-driven, network-audio-aware.",
  },
  "audio-app": {
    label: "Audio apps & plugins",
    description: "Native macOS audio apps, JUCE plugins (VST3 / AU / LV2), and music tooling.",
  },
  embedded: {
    label: "Embedded & hardware",
    description: "ESP32, RP2040 / RP2350 and STM32 firmware, plus open-hardware boards like the PicoADK.",
  },
  fpga: {
    label: "FPGA gateware",
    description: "Lattice ECP5 / Colorlight i9 gateware in Verilog and LiteX/Migen — AES67, Ableton Link in HW, etc.",
  },
  "linux-audio": {
    label: "Linux audio",
    description: "JACK tooling, ALSA drivers, real-time kernels and out-of-tree Linux audio modules.",
  },
  "ai-tools": {
    label: "AI tools",
    description: "MCP servers, agentic workflows, and AI-assisted DSP / transcription / translation tooling.",
  },
  "dev-tools": {
    label: "Developer tools & libraries",
    description: "Language servers, CLIs, header-only C++ libraries, MIDI helpers and other small utilities.",
  },
};

const grouped: Record<string, Project[]> = {};
for (const p of sorted) {
  (grouped[p.category] ??= []).push(p);
}

function categoryLabel(c: string) {
  return CATEGORIES[c]?.label ?? c;
}

function projectUrl(p: Project) {
  return `${SITE}/projects/${p.slug}/`;
}
function categoryUrl(c: string) {
  return `${SITE}/categories/${c}/`;
}

// Get the asset filenames Vite produced (so detail pages share the same favicon etc)
const distIndex = readFileSync(distHtml, "utf8");
function findAsset(pattern: RegExp): string | null {
  const m = distIndex.match(pattern);
  return m ? m[0] : null;
}
findAsset; // (no js/css needed on detail pages — they're standalone)

// ─── Static page CSS (inlined into every detail / category page) ──────────
const STATIC_CSS = `
  :root { color-scheme: dark; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #000; color: #fff; font-family: "Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.55; }
  a { color: inherit; text-decoration: none; }
  ::selection { background: #ff6b35; color: #1a0700; }

  body::before { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px); background-size: 64px 64px; }
  body > * { position: relative; z-index: 1; }

  .page { max-width: 1120px; margin: 0 auto; padding: 32px 32px 96px; }

  /* nav */
  .page-nav { position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; padding: 18px 32px; background: rgba(0,0,0,0.78); backdrop-filter: blur(18px); border-bottom: 1px solid rgba(255,255,255,0.07); }
  .page-nav__brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; font-size: 17px; letter-spacing: -0.02em; }
  .page-nav__brand-mark { width: 14px; height: 14px; border-radius: 4px; background: linear-gradient(135deg, #ff6b35, #ffa476); box-shadow: 0 0 16px rgba(255,107,53,0.4); }
  .page-nav__brand-dot { color: #ff6b35; }
  .page-nav__links { display: flex; gap: 24px; font-size: 14px; font-weight: 500; color: #b3b3b3; }
  .page-nav__links a { transition: color 0.18s ease; }
  .page-nav__links a:hover { color: #ff6b35; }

  /* breadcrumb */
  .crumbs { display: flex; gap: 8px; align-items: center; margin: 32px 0 24px; font-size: 13px; color: #888; }
  .crumbs a { color: #b3b3b3; transition: color 0.18s ease; }
  .crumbs a:hover { color: #ff6b35; }
  .crumbs span.sep { color: #444; }

  /* layout */
  .page-head { margin-bottom: 48px; }
  .page-head .eyebrow { display: inline-flex; align-items: center; gap: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #ff6b35; margin: 0 0 16px; }
  .page-head .eyebrow::before { content: ""; width: 28px; height: 1px; background: #ff6b35; }
  .page-head h1 { font-size: clamp(40px, 6vw, 72px); font-weight: 800; letter-spacing: -0.045em; line-height: 0.96; margin: 0 0 18px; }
  .page-head .tagline { font-size: 18px; font-weight: 600; color: #ff6b35; margin: 0 0 24px; }
  .page-head .desc { font-size: 17px; line-height: 1.65; color: #b3b3b3; margin: 0; max-width: 760px; }

  /* meta strip */
  .meta-strip { display: flex; gap: 24px; flex-wrap: wrap; padding: 24px 0; margin: 32px 0; border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); }
  .meta-strip .item { display: flex; flex-direction: column; gap: 4px; padding-right: 24px; border-right: 1px solid rgba(255,255,255,0.07); }
  .meta-strip .item:last-child { border-right: none; }
  .meta-strip .v { font-family: inherit; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.025em; }
  .meta-strip .l { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: #888; }

  /* CTA */
  .cta-row { display: flex; gap: 14px; flex-wrap: wrap; margin: 32px 0; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px; border-radius: 999px; font-size: 14px; font-weight: 600; border: 1px solid transparent; transition: all 0.18s ease; }
  .btn-primary { background: linear-gradient(135deg, #ff6b35, #ffa476); color: #1a0700; box-shadow: 0 12px 36px -10px rgba(255,107,53,0.5); }
  .btn-primary:hover { transform: translateY(-1px); }
  .btn-ghost { background: rgba(13,13,13,0.85); border-color: rgba(255,255,255,0.14); color: #fff; }
  .btn-ghost:hover { border-color: #ff6b35; color: #ff6b35; }

  /* media */
  .media { margin: 32px 0 48px; border: 1px solid rgba(255,255,255,0.07); border-radius: 22px; overflow: hidden; background: linear-gradient(180deg, #0a0a0a, #000); aspect-ratio: 16 / 10; }
  .media img { width: 100%; height: 100%; object-fit: contain; padding: 20px; display: block; }
  .media svg { width: 100%; height: 100%; display: block; }

  /* story / specs */
  .story { font-size: 16px; line-height: 1.75; color: #b3b3b3; max-width: 760px; margin: 0 0 32px; }
  .specs { list-style: none; padding: 0; margin: 0 0 48px; display: grid; gap: 12px; max-width: 820px; }
  .specs li { position: relative; padding: 14px 18px 14px 38px; background: rgba(13,13,13,0.5); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; font-size: 14.5px; color: #d8d8d8; line-height: 1.5; }
  .specs li::before { content: "▸"; position: absolute; left: 16px; top: 14px; color: #ff6b35; font-weight: 700; }

  /* topics */
  .topics { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0; }
  .topic { padding: 6px 12px; border-radius: 8px; background: rgba(13,13,13,0.7); border: 1px solid rgba(255,255,255,0.08); font-size: 12px; font-weight: 600; color: #b3b3b3; }

  /* category list */
  .project-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
  .project-list li { padding: 0; }
  .project-list a { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center; padding: 18px 22px; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; background: #0d0d0d; transition: all 0.2s ease; }
  .project-list a:hover { border-color: rgba(255,255,255,0.18); transform: translateX(4px); box-shadow: 0 18px 40px -16px rgba(0,0,0,0.7), 0 0 60px -24px rgba(255,107,53,0.25); }
  .project-list .name { font-weight: 800; font-size: 17px; letter-spacing: -0.02em; color: #fff; margin: 0; }
  .project-list .tag { color: #ff6b35; font-weight: 600; font-size: 13px; margin-left: 12px; }
  .project-list .desc { color: #b3b3b3; font-size: 13.5px; margin: 4px 0 0; line-height: 1.5; max-width: 680px; }
  .project-list .pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); font-size: 11.5px; font-weight: 600; color: #b3b3b3; }
  .project-list .pill.lang { color: #ff6b35; border-color: rgba(255,107,53,0.22); background: rgba(255,107,53,0.06); }
  .project-list .pill.stars { color: #ff8551; border-color: rgba(255,133,81,0.16); background: rgba(255,133,81,0.06); }
  .project-list .meta { display: flex; gap: 6px; flex-wrap: wrap; }

  /* category index grid */
  .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; margin: 32px 0 64px; }
  .cat-grid a { display: block; padding: 24px; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; background: #0d0d0d; transition: all 0.2s ease; }
  .cat-grid a:hover { border-color: rgba(255,255,255,0.18); transform: translateY(-3px); box-shadow: 0 18px 40px -16px rgba(0,0,0,0.7), 0 0 80px -24px rgba(255,107,53,0.25); }
  .cat-grid h3 { margin: 0 0 8px; font-size: 19px; font-weight: 800; letter-spacing: -0.02em; }
  .cat-grid p { margin: 0 0 14px; font-size: 13px; color: #b3b3b3; line-height: 1.55; }
  .cat-grid .count { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #ff6b35; }

  /* footer */
  .page-footer { max-width: 1120px; margin: 80px auto 0; padding: 48px 32px 32px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 24px; font-size: 13px; color: #888; }
  .page-footer a { color: #b3b3b3; transition: color 0.18s ease; }
  .page-footer a:hover { color: #ff6b35; }
  .page-footer .links { display: flex; gap: 24px; }

  @media (max-width: 720px) {
    .page { padding: 24px 20px 64px; }
    .page-nav { padding: 14px 20px; }
    .page-nav__links { gap: 16px; }
    .page-nav__links a:nth-child(1) { display: none; }
    .meta-strip { gap: 18px; }
    .meta-strip .item { padding-right: 18px; }
  }
`.trim();

// ─── HTML page templates ───────────────────────────────────────────────────
function pageNav() {
  return `<nav class="page-nav" aria-label="Main navigation">
  <a class="page-nav__brand" href="${SITE}/" aria-label="syso.codes home">
    <span class="page-nav__brand-mark"></span>
    syso<span class="page-nav__brand-dot">.</span>codes
  </a>
  <div class="page-nav__links">
    <a href="${SITE}/#about">About</a>
    <a href="${SITE}/#featured">Featured</a>
    <a href="${SITE}/projects/">All projects</a>
    <a href="${SITE}/categories/">Categories</a>
    <a href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer" aria-label="DatanoiseTV on GitHub">GitHub →</a>
  </div>
</nav>`;
}

function pageFooter() {
  return `<footer class="page-footer">
  <div>
    <strong>syso.codes</strong> — Sylwester · Berlin · open source since forever
  </div>
  <div class="links">
    <a href="${SITE}/">Home</a>
    <a href="${SITE}/projects/">Projects</a>
    <a href="${SITE}/categories/">Categories</a>
    <a href="https://github.com/DatanoiseTV" rel="noreferrer">GitHub</a>
  </div>
</footer>`;
}

function htmlShell({
  title,
  description,
  canonical,
  ogImage,
  jsonLd,
  body,
  breadcrumbs,
}: {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  jsonLd: object[];
  body: string;
  breadcrumbs?: { name: string; url: string }[];
}): string {
  const breadcrumbLd = breadcrumbs
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      }
    : null;
  const allLd = breadcrumbLd ? [...jsonLd, breadcrumbLd] : jsonLd;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#000000" />
  <meta name="color-scheme" content="dark" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />

  <title>${escHtml(title)}</title>
  <meta name="description" content="${escAttr(description)}" />
  <meta name="author" content="Sylwester (DatanoiseTV)" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="${escAttr(canonical)}" />
  <link rel="icon" type="image/svg+xml" href="${SITE}/favicon.svg" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="syso.codes" />
  <meta property="og:title" content="${escAttr(title)}" />
  <meta property="og:description" content="${escAttr(description)}" />
  <meta property="og:url" content="${escAttr(canonical)}" />
  <meta property="og:image" content="${escAttr(ogImage ?? `${SITE}/og.svg`)}" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(title)}" />
  <meta name="twitter:description" content="${escAttr(description)}" />
  <meta name="twitter:image" content="${escAttr(ogImage ?? `${SITE}/og.svg`)}" />

${allLd
    .map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join("\n")}

  <style>${STATIC_CSS}</style>
</head>
<body>
  ${pageNav()}
  ${body}
  ${pageFooter()}
</body>
</html>
`;
}

// ─── Per-project pages ─────────────────────────────────────────────────────
function projectPage(p: Project): string {
  const title = `${p.name} — ${p.tagline} · syso.codes`;
  const description = `${p.tagline} ${p.description}`.slice(0, 280);
  const canonical = projectUrl(p);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      "@id": canonical,
      name: p.name,
      description: p.description,
      codeRepository: p.url,
      programmingLanguage: p.language,
      url: canonical,
      author: { "@id": "https://syso.codes/#person" },
      keywords: p.topics.join(", "),
      ...(p.pushedAt && { dateModified: p.pushedAt }),
      ...(p.image && { image: p.image }),
      ...(p.stars > 0 && {
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: p.stars,
        },
      }),
    },
  ];

  const breadcrumbs = [
    { name: "Home", url: `${SITE}/` },
    { name: "Projects", url: `${SITE}/projects/` },
    { name: categoryLabel(p.category), url: categoryUrl(p.category) },
    { name: p.name, url: canonical },
  ];

  // related projects from same category
  const related = (grouped[p.category] ?? [])
    .filter((q) => q.slug !== p.slug)
    .slice(0, 6);

  const body = `<main class="page" id="main">
  <div class="crumbs" aria-label="Breadcrumb">
    <a href="${SITE}/">syso.codes</a>
    <span class="sep">/</span>
    <a href="${SITE}/projects/">projects</a>
    <span class="sep">/</span>
    <a href="${categoryUrl(p.category)}">${escHtml(categoryLabel(p.category))}</a>
    <span class="sep">/</span>
    <span>${escHtml(p.name)}</span>
  </div>

  <header class="page-head">
    <p class="eyebrow">${escHtml(categoryLabel(p.category))}</p>
    <h1>${escHtml(p.name)}</h1>
    <p class="tagline">${escHtml(p.tagline)}</p>
    <p class="desc">${escHtml(p.description)}</p>
  </header>

  <div class="meta-strip" role="list">
    <div class="item" role="listitem"><span class="v">${escHtml(p.language)}</span><span class="l">Language</span></div>
    ${p.stars > 0 ? `<div class="item" role="listitem"><span class="v">★ ${p.stars}</span><span class="l">GitHub stars</span></div>` : ""}
    ${p.pushedAt ? `<div class="item" role="listitem"><span class="v">${escHtml(p.pushedAt.slice(0, 10))}</span><span class="l">Last pushed</span></div>` : ""}
    <div class="item" role="listitem"><span class="v">${escHtml(categoryLabel(p.category))}</span><span class="l">Category</span></div>
  </div>

  <div class="cta-row">
    <a class="btn btn-primary" href="${escAttr(p.url)}" target="_blank" rel="noreferrer noopener" aria-label="Open ${escAttr(p.name)} on GitHub">
      View on GitHub →
    </a>
    <a class="btn btn-ghost" href="${categoryUrl(p.category)}">
      More ${escHtml(categoryLabel(p.category)).toLowerCase()}
    </a>
  </div>

  ${
    p.image
      ? `<div class="media"><img src="${escAttr(p.image)}" alt="${escAttr(p.name)} screenshot" loading="lazy" /></div>`
      : ""
  }

  ${
    p.story
      ? `<section aria-labelledby="story-${p.slug}">
        <h2 class="sr-only" id="story-${p.slug}">Background</h2>
        <p class="story">${escHtml(p.story)}</p>
      </section>`
      : ""
  }

  ${
    p.specs && p.specs.length > 0
      ? `<section aria-labelledby="specs-${p.slug}">
        <h2 class="sr-only" id="specs-${p.slug}">Specifications</h2>
        <ul class="specs">
${p.specs.map((s) => `          <li>${escHtml(s)}</li>`).join("\n")}
        </ul>
      </section>`
      : ""
  }

  ${
    p.topics.length > 0
      ? `<div class="topics" aria-label="Topics">
${p.topics.map((t) => `        <span class="topic">#${escHtml(t)}</span>`).join("\n")}
      </div>`
      : ""
  }

  ${
    related.length > 0
      ? `<section aria-labelledby="related-${p.slug}">
        <h2 id="related-${p.slug}" style="font-size: 22px; font-weight: 800; margin: 64px 0 24px; letter-spacing: -0.025em;">More from ${escHtml(categoryLabel(p.category))}</h2>
        <ul class="project-list">
${related
  .map(
    (q) => `          <li>
            <a href="${projectUrl(q)}">
              <div>
                <h3 class="name">${escHtml(q.name)}<span class="tag">${escHtml(q.tagline)}</span></h3>
                <p class="desc">${escHtml(q.description)}</p>
              </div>
              <div class="meta">
                <span class="pill lang">${escHtml(q.language)}</span>
                ${q.stars > 0 ? `<span class="pill stars">★ ${q.stars}</span>` : ""}
              </div>
            </a>
          </li>`
  )
  .join("\n")}
        </ul>
      </section>`
      : ""
  }
</main>`;

  return htmlShell({
    title,
    description,
    canonical,
    ogImage: p.image,
    jsonLd,
    breadcrumbs,
    body,
  });
}

// ─── Per-category pages ────────────────────────────────────────────────────
function categoryPage(category: string): string {
  const meta = CATEGORIES[category] ?? { label: category, description: "" };
  const list = grouped[category] ?? [];
  const title = `${meta.label} · syso.codes — open-source projects by DatanoiseTV`;
  const description = `${meta.description} ${list.length} open-source projects by Sylwester (DatanoiseTV).`;
  const canonical = categoryUrl(category);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": canonical,
      url: canonical,
      name: meta.label,
      description: meta.description,
      isPartOf: { "@id": "https://syso.codes/#website" },
      author: { "@id": "https://syso.codes/#person" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${canonical}#list`,
      name: meta.label,
      numberOfItems: list.length,
      itemListElement: list.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: projectUrl(p),
        name: p.name,
      })),
    },
  ];

  const breadcrumbs = [
    { name: "Home", url: `${SITE}/` },
    { name: "Categories", url: `${SITE}/categories/` },
    { name: meta.label, url: canonical },
  ];

  const body = `<main class="page" id="main">
  <div class="crumbs" aria-label="Breadcrumb">
    <a href="${SITE}/">syso.codes</a>
    <span class="sep">/</span>
    <a href="${SITE}/categories/">categories</a>
    <span class="sep">/</span>
    <span>${escHtml(meta.label)}</span>
  </div>

  <header class="page-head">
    <p class="eyebrow">Category · ${list.length} project${list.length === 1 ? "" : "s"}</p>
    <h1>${escHtml(meta.label)}</h1>
    <p class="desc">${escHtml(meta.description)}</p>
  </header>

  <ul class="project-list" aria-label="${escAttr(meta.label)} projects">
${list
  .map(
    (p) => `    <li>
      <a href="${projectUrl(p)}">
        <div>
          <h2 class="name">${escHtml(p.name)}<span class="tag">${escHtml(p.tagline)}</span></h2>
          <p class="desc">${escHtml(p.description)}</p>
        </div>
        <div class="meta">
          <span class="pill lang">${escHtml(p.language)}</span>
          ${p.stars > 0 ? `<span class="pill stars">★ ${p.stars}</span>` : ""}
        </div>
      </a>
    </li>`
  )
  .join("\n")}
  </ul>
</main>`;

  return htmlShell({
    title,
    description,
    canonical,
    jsonLd,
    breadcrumbs,
    body,
  });
}

// ─── Categories index page ────────────────────────────────────────────────
function categoriesIndexPage(): string {
  const title = "All categories · syso.codes — by DatanoiseTV";
  const description = "Browse the open-source projects on syso.codes by category — embedded, FPGA, audio apps, audio servers, Linux audio, AI tools and developer libraries.";
  const canonical = `${SITE}/categories/`;
  const cats = Object.entries(grouped).filter(([k]) => CATEGORIES[k]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": canonical,
      url: canonical,
      name: "All project categories",
      description,
      isPartOf: { "@id": "https://syso.codes/#website" },
    },
  ];

  const breadcrumbs = [
    { name: "Home", url: `${SITE}/` },
    { name: "Categories", url: canonical },
  ];

  const body = `<main class="page" id="main">
  <div class="crumbs" aria-label="Breadcrumb">
    <a href="${SITE}/">syso.codes</a>
    <span class="sep">/</span>
    <span>categories</span>
  </div>

  <header class="page-head">
    <p class="eyebrow">${cats.length} categories</p>
    <h1>Browse by category.</h1>
    <p class="desc">Every open-source project on syso.codes, grouped by what it does.</p>
  </header>

  <div class="cat-grid">
${cats
  .map(
    ([key, list]) => `    <a href="${categoryUrl(key)}">
      <span class="count">${list.length} project${list.length === 1 ? "" : "s"}</span>
      <h3>${escHtml(CATEGORIES[key]!.label)}</h3>
      <p>${escHtml(CATEGORIES[key]!.description)}</p>
    </a>`
  )
  .join("\n")}
  </div>
</main>`;

  return htmlShell({ title, description, canonical, jsonLd, breadcrumbs, body });
}

// ─── Projects index (alphabetical / paginated all) ────────────────────────
function projectsIndexPage(): string {
  const title = `All projects · ${sorted.length} open-source repos by DatanoiseTV · syso.codes`;
  const description = `Complete list of ${sorted.length} open-source projects by Sylwester (DatanoiseTV) — embedded firmware, FPGA gateware, audio apps, DSP languages, network audio, native macOS, AI tooling and more.`;
  const canonical = `${SITE}/projects/`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": canonical,
      url: canonical,
      name: "All projects",
      description,
      isPartOf: { "@id": "https://syso.codes/#website" },
    },
  ];

  const breadcrumbs = [
    { name: "Home", url: `${SITE}/` },
    { name: "Projects", url: canonical },
  ];

  const body = `<main class="page" id="main">
  <div class="crumbs" aria-label="Breadcrumb">
    <a href="${SITE}/">syso.codes</a>
    <span class="sep">/</span>
    <span>projects</span>
  </div>

  <header class="page-head">
    <p class="eyebrow">${sorted.length} projects · sorted by recent activity</p>
    <h1>All projects.</h1>
    <p class="desc">Every featured open-source repo on syso.codes, sorted by most recent push. Click any project for the full story, specs and a link to the GitHub repo.</p>
  </header>

  <ul class="project-list" aria-label="All projects">
${sorted
  .map(
    (p) => `    <li>
      <a href="${projectUrl(p)}">
        <div>
          <h2 class="name">${escHtml(p.name)}<span class="tag">${escHtml(p.tagline)}</span></h2>
          <p class="desc">${escHtml(p.description)}</p>
        </div>
        <div class="meta">
          <span class="pill lang">${escHtml(p.language)}</span>
          ${p.stars > 0 ? `<span class="pill stars">★ ${p.stars}</span>` : ""}
          <span class="pill">${escHtml(categoryLabel(p.category))}</span>
        </div>
      </a>
    </li>`
  )
  .join("\n")}
  </ul>
</main>`;

  return htmlShell({ title, description, canonical, jsonLd, breadcrumbs, body });
}

// ─── Inject SPA homepage with JSON-LD + noscript ──────────────────────────
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
    url: projectUrl(p),
    item: {
      "@type": "SoftwareSourceCode",
      "@id": projectUrl(p),
      name: p.name,
      description: p.description,
      codeRepository: p.url,
      programmingLanguage: p.language,
      url: projectUrl(p),
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

const noscriptInner = `
<style>
  .seo-static { padding: 80px 32px; max-width: 1200px; margin: 0 auto; font-family: system-ui, sans-serif; color: #ffffff; background: #000000; line-height: 1.55; }
  .seo-static h1 { font-size: 48px; margin: 0 0 16px; font-weight: 800; letter-spacing: -0.04em; }
  .seo-static h1 a { color: #ff6b35; text-decoration: none; }
  .seo-static p.lede { font-size: 18px; color: #b3b3b3; max-width: 720px; margin: 0 0 48px; }
  .seo-static h2 { font-size: 24px; margin: 56px 0 16px; color: #ff6b35; font-weight: 700; letter-spacing: -0.02em; }
  .seo-static ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr; gap: 14px; }
  .seo-static li { padding: 16px 20px; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; background: #0d0d0d; }
  .seo-static li a { color: #ffffff; font-weight: 700; font-size: 16px; text-decoration: none; }
  .seo-static li a:hover { color: #ff6b35; }
  .seo-static li small { display: block; color: #b3b3b3; font-size: 13px; margin-top: 4px; }
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
${Object.entries(grouped)
  .filter(([k]) => CATEGORIES[k])
  .map(
    ([k, list]) => `  <h2>${escHtml(CATEGORIES[k]!.label)}</h2>
  <ul>
${list
  .map(
    (p) => `    <li>
      <a href="${projectUrl(p)}" rel="noopener">${escHtml(p.name)}</a>
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

let html = readFileSync(distHtml, "utf8");
html = html.replace("<!--SEO_ITEM_LIST-->", itemListScript);
html = html.replace("<!--SEO_NOSCRIPT-->", noscriptBlock);
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
  if (!CATEGORIES[cat]) continue;
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
const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: `${SITE}/`, priority: "1.0", changefreq: "weekly" },
  { loc: `${SITE}/projects/`, priority: "0.9", changefreq: "weekly" },
  { loc: `${SITE}/categories/`, priority: "0.8", changefreq: "weekly" },
  { loc: `${SITE}/#about`, priority: "0.7", changefreq: "monthly" },
  { loc: `${SITE}/#activity`, priority: "0.7", changefreq: "daily" },
  { loc: `${SITE}/#featured`, priority: "0.8", changefreq: "weekly" },
  ...Object.keys(grouped)
    .filter((k) => CATEGORIES[k])
    .map((k) => ({
      loc: categoryUrl(k),
      priority: "0.7",
      changefreq: "weekly" as const,
    })),
  ...sorted.map((p) => ({
    loc: projectUrl(p),
    priority: p.featured ? "0.9" : "0.6",
    changefreq: "monthly" as const,
    lastmod: p.pushedAt?.slice(0, 10),
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (a) => `  <url>
    <loc>${a.loc}</loc>
    <lastmod>${(a as { lastmod?: string }).lastmod ?? today}</lastmod>
    <changefreq>${a.changefreq}</changefreq>
    <priority>${a.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync(resolve(distRoot, "sitemap.xml"), sitemap);

console.log(
  `SEO inject:\n  ${sorted.length} projects in ItemList\n  ${projectCount} per-project pages\n  ${categoryCount} per-category pages\n  2 index pages (projects, categories)\n  ${urls.length} URLs in sitemap.xml`
);
