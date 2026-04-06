import { useMemo } from "react";
import { projects as curated } from "./data/projects";
import { autoProjects, pushedDates } from "./data/autoProjects";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { CommitActivity } from "./components/CommitActivity";
import { FeaturedProject } from "./components/FeaturedProject";
import { ProjectGrid } from "./components/ProjectGrid";
import { Footer } from "./components/Footer";
import { BackgroundAnimations } from "./components/BackgroundAnimations";

// Live counts from `gh api users/DatanoiseTV` — refresh by re-running
// `node scripts/gen-auto-projects.mjs` (which logs them) or by calling
// `gh api users/DatanoiseTV` directly.
const GH_PUBLIC_REPOS = 245;
const GH_TOTAL_STARS = 1077;

export default function App() {
  const allProjects = useMemo(() => {
    // curated wins on slug collision; both sources get pushedAt from the
    // shared dates map so the grid can sort everything by recency uniformly.
    const seen = new Set(curated.map((p) => p.slug));
    const merged = [
      ...curated,
      ...autoProjects.filter((p) => !seen.has(p.slug)),
    ];
    return merged.map((p) => ({
      ...p,
      pushedAt: pushedDates[p.slug] ?? p.pushedAt,
    }));
  }, []);

  const featured = useMemo(
    () =>
      allProjects
        .filter((p) => p.featured)
        .sort((a, b) => (b.pushedAt ?? "").localeCompare(a.pushedAt ?? "")),
    [allProjects]
  );

  return (
    <div className="app">
      <BackgroundAnimations />
      <Nav />
      <Hero publicRepos={GH_PUBLIC_REPOS} totalStars={GH_TOTAL_STARS} />
      <About />
      <CommitActivity />

      <section id="featured" className="featured-section">
        <div className="section-head">
          <div>
            <p className="section-eyebrow">Highlights</p>
            <h2 className="section-title">Projects worth a closer look.</h2>
            <p className="section-blurb">
              A handful of recent builds — audio servers, native macOS tools,
              an AI-assisted DSP lab, hardware development boards, an analog-modeled
              VST plugin, and embedded systems where the firmware does most of
              the talking.
            </p>
          </div>
        </div>
        <div className="featured-list">
          {featured.map((p, i) => (
            <FeaturedProject key={p.slug} project={p} hero={i === 0} />
          ))}
        </div>
      </section>

      <ProjectGrid projects={allProjects} />

      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="nav">
      <a className="nav__brand" href="#top">
        <BrandMark />
        syso<span className="nav__brand-dot">.</span>codes
      </a>
      <div className="nav__links">
        <a href="#about">About</a>
        <a href="#activity">Activity</a>
        <a href="#featured">Featured</a>
        <a href="#projects">All projects</a>
        <a href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
          GitHub →
        </a>
      </div>
    </nav>
  );
}

/**
 * Brand mark — a stylised oscilloscope-style sine + square wave inside a
 * rounded square. Designed to read at 28px in the nav and 64px as a favicon.
 */
function BrandMark() {
  return (
    <svg
      className="nav__brand-mark"
      viewBox="0 0 32 32"
      width="30"
      height="30"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brand-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a0a0d" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="brand-wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff6b35" />
          <stop offset="1" stopColor="#ffa476" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        fill="url(#brand-bg)"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1"
      />
      {/* sine wave that crosses to a square wave — embedded audio in one mark */}
      <path
        d="M 5 16 Q 8 8, 11 16 T 17 16 L 17 11 L 21 11 L 21 21 L 25 21 L 25 16 L 27 16"
        fill="none"
        stroke="url(#brand-wave)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* power LED dot */}
      <circle cx="25" cy="7" r="1.6" fill="#ff8551" />
    </svg>
  );
}
