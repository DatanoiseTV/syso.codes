import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Project } from "../types";
import { ProjectArt } from "./ProjectArt";
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

export function ProjectGrid({ projects }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
      <div className="grid">
        {shown.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
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

function ProjectCard({ project }: { project: Project }) {
  return (
    <a className="card" href={project.url} target="_blank" rel="noreferrer">
      <div className="card__media">
        {project.image ? (
          <img src={project.image} alt={`${project.name} preview`} loading="lazy" decoding="async" />
        ) : (
          <ProjectArt
            type={project.art ?? "auto"}
            slug={project.slug}
            category={project.category}
            className="card__svg"
          />
        )}
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
  );
}
