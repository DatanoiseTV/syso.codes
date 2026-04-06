import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Project } from "../types";
import { ProjectImage } from "./ProjectImage";
import { categoryLabel } from "./FeaturedProject";

interface Props {
  projects: Project[];
}

const FILTERS: { label: string; value: Category | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Embedded", value: "embedded" },
  { label: "FPGA", value: "fpga" },
  { label: "Audio Apps", value: "audio-app" },
  { label: "Audio Servers", value: "audio-server" },
  { label: "Linux Audio", value: "linux-audio" },
  { label: "AI Tools", value: "ai-tools" },
  { label: "Dev Tools", value: "dev-tools" },
];

const PAGE_SIZE = 24;
type ViewMode = "grid" | "list";

export function ProjectGrid({ projects }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("syso.view") as ViewMode) || "grid";
  });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // persist view preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("syso.view", view);
    }
  }, [view]);

  const filtered = useMemo(() => {
    const list =
      filter === "all" ? projects : projects.filter((p) => p.category === filter);
    return [...list].sort((a, b) => {
      // primary: most recent push first (ISO date strings sort lexically)
      const aDate = a.pushedAt ?? "";
      const bDate = b.pushedAt ?? "";
      if (bDate !== aDate) return bDate.localeCompare(aDate);
      // tiebreaker: more stars first, then name
      if (b.stars !== a.stars) return b.stars - a.stars;
      return a.name.localeCompare(b.name);
    });
  }, [projects, filter]);

  // reset visible count when filter changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [filter]);

  // infinite scroll via IntersectionObserver
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - shown.length;

  return (
    <section id="projects" className="grid-section">
      <div className="section-head">
        <div>
          <p className="section-eyebrow">All projects</p>
          <h2 className="section-title">The full lab.</h2>
          <p className="section-blurb">
            {projects.length} open-source projects across embedded, audio-over-IP,
            FPGA gateware, DSP languages, native macOS apps and the occasional
            AI-assisted weirdness. Scroll to load more.
          </p>
        </div>
        <div className="grid-controls">
          <ViewToggle view={view} onChange={setView} />
          <div className="filter-bar">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`filter-pill${filter === f.value ? " filter-pill--active" : ""}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid">
          {shown.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      ) : (
        <div className="list">
          {shown.map((p) => (
            <ProjectRow key={p.slug} project={p} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="grid-sentinel" aria-hidden="true">
        {remaining > 0 ? (
          <span className="grid-sentinel__label">Loading {Math.min(PAGE_SIZE, remaining)} more…</span>
        ) : (
          <span className="grid-sentinel__label grid-sentinel__label--done">
            That&apos;s all {filtered.length}.
          </span>
        )}
      </div>
    </section>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="view-toggle" role="radiogroup" aria-label="View mode">
      <button
        type="button"
        className={`view-toggle__btn${view === "grid" ? " view-toggle__btn--active" : ""}`}
        onClick={() => onChange("grid")}
        role="radio"
        aria-checked={view === "grid"}
        aria-label="Grid view"
        title="Grid view"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span>Grid</span>
      </button>
      <button
        type="button"
        className={`view-toggle__btn${view === "list" ? " view-toggle__btn--active" : ""}`}
        onClick={() => onChange("list")}
        role="radio"
        aria-checked={view === "list"}
        aria-label="List view"
        title="List view"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="3" height="3" rx="0.6" fill="currentColor" />
          <rect x="6" y="2.5" width="7" height="2" rx="1" fill="currentColor" />
          <rect x="1" y="7" width="3" height="3" rx="0.6" fill="currentColor" />
          <rect x="6" y="7.5" width="7" height="2" rx="1" fill="currentColor" />
        </svg>
        <span>List</span>
      </button>
    </div>
  );
}

function detailUrl(slug: string): string {
  return `/projects/${slug}/`;
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="card-wrap">
      <a className="card" href={detailUrl(project.slug)} aria-label={`${project.name} — ${project.tagline}`}>
        <div className="card__media">
          <ProjectImage
            project={project}
            className={project.image ? undefined : "card__svg"}
          />
        </div>
        <div className="card__body">
          <div className="card__meta">
            <span className="chip chip--lang">{project.language}</span>
            {project.stars > 0 && <span className="chip chip--stars">★ {project.stars}</span>}
          </div>
          <h3 className="card__name">{project.name}</h3>
          <p className="card__tagline">{project.tagline}</p>
          <p className="card__desc">{project.description}</p>
          <div className="card__topics">
            {project.topics.slice(0, 4).map((t) => (
              <span key={t} className="topic">
                #{t}
              </span>
            ))}
          </div>
          <div className="card__footer">
            <span className="card__category">{categoryLabel(project.category)}</span>
            <span className="card__arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </a>
      <a
        className="card__github"
        href={project.url}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${project.name} on GitHub (opens in new tab)`}
        title="View on GitHub"
        onClick={(e) => e.stopPropagation()}
      >
        <GitHubIcon />
      </a>
    </article>
  );
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <div className="row-wrap">
      <a className="row" href={detailUrl(project.slug)} aria-label={`${project.name} — ${project.tagline}`}>
        <div className="row__media">
          <ProjectImage
            project={project}
            alt=""
            className={project.image ? undefined : "row__svg"}
          />
        </div>
        <div className="row__main">
          <div className="row__top">
            <h3 className="row__name">{project.name}</h3>
            <span className="row__tagline">{project.tagline}</span>
          </div>
          <p className="row__desc">{project.description}</p>
        </div>
        <div className="row__meta">
          <span className="chip chip--lang">{project.language}</span>
          {project.stars > 0 && <span className="chip chip--stars">★ {project.stars}</span>}
          <span className="chip">{categoryLabel(project.category)}</span>
        </div>
        <span className="row__arrow" aria-hidden="true">
          →
        </span>
      </a>
      <a
        className="row__github"
        href={project.url}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${project.name} on GitHub (opens in new tab)`}
        title="View on GitHub"
      >
        <GitHubIcon />
      </a>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}
