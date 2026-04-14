import { useMemo } from "react";
import { projects as curated } from "./data/projects";
import { autoProjects, pushedDates } from "./data/autoProjects";
import { Intro } from "./sections/Intro";
import { Work } from "./sections/Work";
import { Activity } from "./sections/Activity";
import { ProjectsIndex } from "./sections/Index";
import { Footer } from "./sections/Footer";

// Keep these in sync with `gh api users/DatanoiseTV` (the auto-generator
// script prints the latest counts — copy them here on refresh).
const GH_PUBLIC_REPOS = 252;
const GH_TOTAL_STARS = 1079;

export default function App() {
  const allProjects = useMemo(() => {
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
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Intro repos={GH_PUBLIC_REPOS} stars={GH_TOTAL_STARS} />
        <Work projects={featured} />
        <Activity />
        <ProjectsIndex projects={allProjects} />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav__inner">
        <a className="nav__brand" href="#top">
          syso<span>.</span>codes
        </a>
        <ul className="nav__links" role="list">
          <li>
            <a href="#work">Work</a>
          </li>
          <li>
            <a href="#activity">Activity</a>
          </li>
          <li>
            <a href="#index">Index</a>
          </li>
          <li>
            <a
              href="https://github.com/DatanoiseTV"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
