# syso.codes — project + update guide

A personal portfolio for **Sylwester / DatanoiseTV**, showcasing recent
open-source work in embedded audio, DSP, FPGA gateware, Linux audio and
native macOS apps.

> **Stack:** Vite + React 18 + TypeScript, hand-rolled CSS (no UI libs).
> Single source of truth for everything on the page is `src/data/projects.ts`.
> Hand-tuned SVG illustrations live in `src/components/ProjectArt.tsx`.

## Repo layout

```
syso.codes/
├── index.html
├── package.json
├── public/favicon.svg
├── src/
│   ├── main.tsx                 # React entry
│   ├── App.tsx                  # page composition + sticky nav
│   ├── index.css                # all styles, design tokens at the top
│   ├── types.ts                 # Project / Category / ArtType definitions
│   ├── data/
│   │   └── projects.ts          # ⭐ THE data file — every project lives here
│   └── components/
│       ├── Hero.tsx             # title block + stats + CTAs
│       ├── FeaturedProject.tsx  # large alternating-row layout
│       ├── ProjectGrid.tsx      # filterable card grid
│       ├── ProjectArt.tsx       # SVG illustrations (chip, fpga, optical, …)
│       └── Footer.tsx
└── CLAUDE.md                    # this file
```

## Local development

```bash
npm install
npm run dev      # vite dev server on http://localhost:5173
npm run build    # tsc -b && vite build → dist/
npm run preview  # preview the production build
```

## Update workflow — refreshing from GitHub

The user will frequently ask things like:

> "update the portfolio with my current repos and update text and specs from new commits"

Follow this exact workflow. **Every step matters** because the page is
built from `src/data/projects.ts` and from real READMEs — you must touch
both.

### 1. List recent activity

```bash
gh api "users/DatanoiseTV/repos?sort=pushed&per_page=40" \
  --jq '.[] | select(.fork == false) | {name, description, html_url, language, stargazers_count, pushed_at, topics}'
```

Filter out forks (`select(.fork == false)`) and the profile repo
(`DatanoiseTV.github.io`). Anything pushed since the last update is a
candidate for refresh.

### 2. For each repo to update or add, fetch its README

```bash
gh api repos/DatanoiseTV/<repo>/readme --jq '.content' | base64 -d
```

When skimming a README extract:

- **Tagline** — usually the first heading or pull-quote.
- **Description** — the first 1–2 paragraphs.
- **Story / motivation** — any "Why" or "How it works" section, condensed
  to one tight paragraph (avoid bullet-point dump).
- **Specs** — pull 5–7 of the most impressive concrete numbers, protocols,
  or feature names. Always specs that say *something*; avoid filler like
  "easy to use".
- **Image URL** — first `<img>` or `![]()` that points at a screenshot
  (typically `https://github.com/user-attachments/...` or
  `https://raw.githubusercontent.com/...`). Logos count, but real
  screenshots are preferred.

If there is no screenshot, set `art:` to one of the existing illustration
types (see below) and **omit `image`**.

### 3. Update `src/data/projects.ts`

Each project is a `Project` object with this shape:

```ts
{
  slug: "tinyice",                           // exact GitHub repo name
  name: "TinyIce",                           // display name
  tagline: "One binary. Pure audio.",
  description: "An Icecast2-compatible …",   // 1–2 sentence overview
  story: "Traditional streaming servers …",  // optional 1–2 paragraph narrative
  specs: ["Shared circular buffer …", …],    // 5–7 punchy bullets
  category: "audio-server",                  // see Category union in types.ts
  language: "Go",                            // primary language from gh
  stars: 316,                                // refresh from gh stargazers_count
  topics: ["audio", "icecast", …],
  url: "https://github.com/DatanoiseTV/tinyice",
  image: "https://raw.githubusercontent.com/…",  // OR omit + set art
  art: "chip",                                    // for repos without screenshots
  featured: true,                                 // featured projects render large
}
```

**Categories** (`src/types.ts`):
`audio-server` · `audio-app` · `embedded` · `fpga` · `linux-audio` ·
`ai-tools` · `dev-tools`. Add a new one only if absolutely necessary —
filter pills are listed in `ProjectGrid.tsx → FILTERS` and a label needs
to be added to `categoryLabel()` in `FeaturedProject.tsx`.

**Featured vs. grid:** Featured projects render in the large alternating
section *and* in the grid below. Promote 6–9 of the strongest builds —
preferably ones with real screenshots.

### 4. SVG illustration types

If a project has no screenshot, pick the `art:` value that fits its
domain. The types live in `src/components/ProjectArt.tsx`:

| `art` value | Use it for                                                |
| ----------- | --------------------------------------------------------- |
| `chip`      | ESP32 / MCU work, ROM emulators, dev kits                 |
| `fpga`      | FPGA/gateware projects (Colorlight, Lattice, ECP5, etc.)  |
| `optical`   | TOSLINK / ADAT / fibre / SPDIF                            |
| `clock`     | PLLs, clock generation, calibration                      |
| `bus`       | Multi-channel buses, daisy chains, parallel I/O           |
| `network`   | Network audio (AES67, RAVENNA, USB/IP, RTP)               |
| `terminal`  | Editors, language servers, code tools                     |
| `scope`     | Logic analyzers, debugging tools                          |
| `tdm`       | TDM / time-multiplexed audio                              |
| `logo`      | Generic fallback                                          |

If a *new* domain shows up (e.g. analog/RF), add a new `ArtType` value
to `types.ts` and a matching `*Art` component to `ProjectArt.tsx`. Keep
the visual style consistent: the `<Frame>` helper provides the dark grid
background; use `accent` (cyan) for primary lines, `amber` for
highlights, and `JetBrains Mono` for any embedded text.

### 5. Verify the build

```bash
npm run build
```

This must complete with **no TypeScript errors and no Vite warnings**.
TypeScript is strict — every project must satisfy the `Project`
interface, including `language`, `stars`, `topics`, `category`, etc.

If you only updated text/specs, also do a quick smoke check:

```bash
npm run dev   # then visit http://localhost:5173
```

### 6. Conventions

- **Tone:** technical, specific, mildly opinionated. No marketing fluff,
  no "revolutionary", no emoji in copy. Bullet points should *say*
  something — prefer concrete numbers and protocol names over adjectives.
- **Bullet length:** keep specs to a single line each. They are
  monospace and wrap badly when long.
- **Stars:** always pull the live count from `gh api`. If it's `0`, omit
  the star chip — that's handled automatically by the chip components,
  no special-casing needed in data.
- **Image URLs:** GitHub user-attachments work fine, but if a repo's
  primary screenshot is in `assets/` of the repo itself, prefer the
  `raw.githubusercontent.com/<user>/<repo>/main/assets/...` form so it
  survives upstream issue migrations.
- **Order:** within `projects.ts`, group by section header comment
  (`Featured`, `ESP32 / embedded`, `FPGA gateware`, `Linux audio`,
  `Dev tools`). Within each section, ordering is roughly by recency
  or relevance — most-impressive-first.

## Removing a stale project

Just delete the entry from `projects.ts`. There is no other place it is
referenced.

## Adding a brand-new section

1. Add the new value to the `Category` union in `src/types.ts`.
2. Add a label case in `categoryLabel()` (`FeaturedProject.tsx`).
3. Add the filter pill in `FILTERS` (`ProjectGrid.tsx`).
4. Tag projects with the new `category` in `projects.ts`.

## Not in scope (yet)

- A blog. There is no MDX/markdown rendering wired up; if the user
  asks for a blog, scaffold it under `src/content/` and add a route —
  do not graft it onto the existing single-page layout.
- An RSS feed. Same as above.
- Light mode. The whole palette is dark-only on purpose; do not add a
  toggle unless explicitly asked.

## House rules

- **Never** mention Claude, AI, or AI assistance in any committed text:
  not in commit messages, not in PR descriptions, not in code comments,
  not in copy on the page. (This is a global rule from
  `~/.claude/CLAUDE.md` — repeated here so it never gets missed.)
- Match the existing visual style. Don't introduce a UI library, a CSS
  framework, or CSS-in-JS — the design tokens at the top of `index.css`
  are the only theme system we need.
