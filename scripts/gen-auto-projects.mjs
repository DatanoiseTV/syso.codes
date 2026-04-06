// Reads /tmp/datanoise_repos.json (output of `gh api users/.../repos --paginate`)
// and generates src/data/autoProjects.ts with one Project entry per repo,
// excluding any repo whose slug is already in the curated `projects.ts`.
//
// Usage:
//   gh api "users/DatanoiseTV/repos?per_page=100&type=owner&sort=pushed" \
//     --paginate \
//     --jq '.[] | select(.fork == false) | {name, description, html_url, language, stars: .stargazers_count, topics, pushed_at, archived, size}' \
//     > /tmp/datanoise_repos.json
//   node scripts/gen-auto-projects.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ─── Read repos ────────────────────────────────────────────────────────────
const raw = readFileSync("/tmp/datanoise_repos.json", "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));

// ─── Read curated slugs from projects.ts ──────────────────────────────────
const curated = readFileSync(resolve(root, "src/data/projects.ts"), "utf8");
const curatedSlugs = new Set(
  Array.from(curated.matchAll(/^\s+slug:\s+"([^"]+)"/gm)).map((m) => m[1])
);

// ─── Filters: drop empty, archived, profile/portfolio repos ───────────────
const skipNames = new Set([
  "DatanoiseTV.github.io",
  "DatanoiseTV",
  "syso.name",
  "dotfiles-ng",
  "donna.bar",
  "silentsea",
  "rolandmuseum-web",
  "FabLabML",
  "NordModularPatches",
  "RaspberryPi-PL011-MIDI",
  "BeMicro-CV-Multicomp",
]);

const filtered = raw.filter((r) => {
  if (curatedSlugs.has(r.name)) return false;
  if (skipNames.has(r.name)) return false;
  if (r.size === 0) return false;
  // keep archived ones — they're history
  return true;
});

// ─── Heuristics ────────────────────────────────────────────────────────────
function categoryFor(r) {
  const t = (r.topics || []).join(" ").toLowerCase();
  const d = (r.description || "").toLowerCase();
  const lang = (r.language || "").toLowerCase();
  const all = `${r.name.toLowerCase()} ${t} ${d}`;

  if (/(fpga|ecp5|lattice|verilog|vhdl|migen|litex|gateware)/.test(all)) return "fpga";
  if (/(mcp|llm|gpt|gemini|whisper|ollama|claude|ai|agent)/.test(all)) return "ai-tools";
  if (/(esp32|esp8266|stm32|rp2040|rp2350|pico|arduino|teensy|firmware|embedded|microcontroller|hardware)/.test(all)) return "embedded";
  if (/(eurorack|synth|modular|cv|ssd1306|sigmadsp|sigma)/.test(all)) return "embedded";
  if (/(jack|alsa|linux-audio|pipewire|kernel|buildroot)/.test(all)) return "linux-audio";
  if (/(macos|swift|swiftui|au|vst|vst3|lv2|juce|audio-unit|plugin)/.test(all)) return "audio-app";
  if (/(icecast|streaming-server|broadcast|webrtc-server|http-server)/.test(all)) return "audio-server";
  if (/(audio|midi|dsp|wavetable|synthesizer|sampler)/.test(all)) {
    if (lang === "swift") return "audio-app";
    if (lang === "c++" || lang === "cpp" || lang === "c") return "embedded";
    return "dev-tools";
  }
  if (/(lsp|cli|library|template|tool|sdk|debugger)/.test(all)) return "dev-tools";
  return "dev-tools";
}

function artFor(_r) {
  // All auto entries use procedural art — generated deterministically per slug.
  // Curated entries pick a specific art type by hand in projects.ts.
  return "auto";
}

function tagline(r) {
  if (!r.description) return `${r.language || "Open source"} project.`;
  // first sentence, max ~120 chars, no trailing period
  const first = r.description.split(/(?<=[.!?])\s+/)[0] || r.description;
  return first.replace(/\s+$/, "").replace(/\.$/, "");
}

function description(r) {
  return (
    r.description ||
    `An open-source ${r.language || ""} project by DatanoiseTV.`.replace(/\s+/, " ")
  );
}

function displayName(r) {
  // prettier name from slug — kebab/snake to title case but keep acronyms
  return r.name
    .replace(/[-_]/g, " ")
    .replace(/\bdsp\b/gi, "DSP")
    .replace(/\busb\b/gi, "USB")
    .replace(/\bspi\b/gi, "SPI")
    .replace(/\bi2c\b/gi, "I²C")
    .replace(/\bi2s\b/gi, "I²S")
    .replace(/\bmidi\b/gi, "MIDI")
    .replace(/\besp(\d+)\b/gi, (_, n) => `ESP${n}`)
    .replace(/\brp(\d+)\b/gi, (_, n) => `RP${n}`)
    .replace(/\blkm\b/gi, "LKM")
    .replace(/\bmcp\b/gi, "MCP")
    .replace(/\bcli\b/gi, "CLI")
    .replace(/\blsp\b/gi, "LSP")
    .replace(/\bvst\b/gi, "VST");
}

// ─── Generate TS ───────────────────────────────────────────────────────────
const escape = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const entries = filtered.map((r) => {
  const cat = categoryFor(r);
  const art = artFor(r);
  const lang = r.language || "Other";
  const topics = (r.topics || []).slice(0, 6);
  return `  {
    slug: "${escape(r.name)}",
    name: "${escape(displayName(r))}",
    tagline: "${escape(tagline(r))}",
    description: "${escape(description(r))}",
    category: "${cat}",
    language: "${escape(lang)}",
    stars: ${r.stars || 0},
    topics: ${JSON.stringify(topics)},
    url: "${escape(r.html_url)}",
    art: "${art}",
    pushedAt: "${r.pushed_at}",
  }`;
});

// Build pushedAt map covering EVERY non-fork repo (curated AND auto), so the
// curated entries in projects.ts can also be sorted by recent push.
const pushedMap = {};
for (const r of raw) {
  if (r.pushed_at) pushedMap[r.name] = r.pushed_at;
}
const pushedEntries = Object.entries(pushedMap)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([slug, date]) => `  "${escape(slug)}": "${date}",`)
  .join("\n");

const out = `import type { Project } from "../types";

/**
 * AUTO-GENERATED entries from \`gh api users/DatanoiseTV/repos\`.
 * Do not hand-edit — re-run \`node scripts/gen-auto-projects.mjs\` instead.
 *
 * Curated entries with custom story / specs / images live in \`projects.ts\`.
 * App.tsx merges curated + auto, with curated winning on slug collision.
 */
export const autoProjects: Project[] = [
${entries.join(",\n")},
];

/**
 * AUTO-GENERATED — last pushed_at for every non-fork DatanoiseTV repo.
 * App.tsx merges this into curated projects so the grid can sort by recency.
 */
export const pushedDates: Record<string, string> = {
${pushedEntries}
};
`;

writeFileSync(resolve(root, "src/data/autoProjects.ts"), out);
console.log(`Generated ${entries.length} auto entries (filtered from ${raw.length} total).`);
console.log(`Skipped ${raw.length - filtered.length} repos (curated, archived, empty, or skipped by name).`);
console.log(`Wrote pushedDates map for ${Object.keys(pushedMap).length} repos.`);
