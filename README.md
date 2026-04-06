# syso.codes

Personal portfolio for Sylwester / DatanoiseTV — embedded audio, DSP,
FPGA gateware, Linux audio, and native macOS apps.

Live at **[syso.codes](https://syso.codes)**.

## Stack

- **Vite + React 18 + TypeScript** — single-page static site, no SSR
- **Plus Jakarta Sans** for type, hand-tuned CSS for everything else
- **Procedural SVG art** — every project without a screenshot gets a unique
  generative graphic deterministically derived from its slug
- **Animated background** — drifting sine waves, PTP-style pings, floating
  particles, scan line — all CSS-only and respect `prefers-reduced-motion`
- **GitHub Actions** deploys to GitHub Pages on every push to `main`

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build → dist/
npm run preview  # preview the production bundle
```

## Updating from GitHub

The single source of truth for projects is `src/data/projects.ts`
(curated entries with custom story/specs/screenshots) and
`src/data/autoProjects.ts` (auto-generated from `gh api` for everything else).

To refresh the auto-generated entries when new repos appear:

```bash
gh api "users/DatanoiseTV/repos?per_page=100&type=owner&sort=pushed" \
  --paginate \
  --jq '.[] | select(.fork == false) | {name, description, html_url, language, stars: .stargazers_count, topics, pushed_at, archived, size}' \
  > /tmp/datanoise_repos.json

node scripts/gen-auto-projects.mjs
```

Curated entries always win on slug collision, so handcrafted descriptions
stay intact.

For full project conventions, naming, art types, and update workflow, see
`CLAUDE.md` at the repo root.

## Layout

```
syso.codes/
├── .github/workflows/deploy.yml   # GitHub Pages CI/CD
├── public/
│   ├── CNAME                      # custom domain — syso.codes
│   └── favicon.svg
├── scripts/
│   └── gen-auto-projects.mjs      # refresh autoProjects.ts from gh
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css                  # all design tokens at the top
│   ├── types.ts                   # Project / Category / ArtType
│   ├── data/
│   │   ├── projects.ts            # ⭐ curated entries
│   │   └── autoProjects.ts        # auto-generated from gh
│   └── components/
│       ├── Hero.tsx
│       ├── About.tsx
│       ├── BackgroundAnimations.tsx
│       ├── FeaturedProject.tsx
│       ├── ProjectGrid.tsx        # filter + infinite scroll
│       ├── ProjectArt.tsx         # 14 hand-tuned SVG illustrations
│       ├── ProceduralArt.tsx      # 12 generative compositions
│       └── Footer.tsx
└── CLAUDE.md                      # update workflow + conventions
```
