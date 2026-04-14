import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Project } from "../types";
import { ProjectImage } from "./ProjectImage";

interface Props {
  projects: Project[];
}

const FILTERS: { label: string; value: Category | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Embedded", value: "embedded" },
  { label: "FPGA", value: "fpga" },
  { label: "Audio apps", value: "audio-app" },
  { label: "Audio servers", value: "audio-server" },
  { label: "Linux audio", value: "linux-audio" },
  { label: "AI tools", value: "ai-tools" },
  { label: "Dev tools", value: "dev-tools" },
];

const PAGE_SIZE = 40;

export function ProjectGrid({ projects }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const counts = useMemo<Record<string, number>>(() => {
    const c: Record<string, number> = { all: projects.length };
    for (const p of projects) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [projects]);

  const filtered = useMemo(() => {
    const list =
      filter === "all" ? projects : projects.filter((p) => p.category === filter);
    return [...list].sort((a, b) => {
      const aDate = a.pushedAt ?? "";
      const bDate = b.pushedAt ?? "";
      if (bDate !== aDate) return bDate.localeCompare(aDate);
      if (b.stars !== a.stars) return b.stars - a.stars;
      return a.name.localeCompare(b.name);
    });
  }, [projects, filter]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [filter]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - shown.length;

  return (
    <section id="projects" className="index-section">
      <div className="index-head">
        <div>
          <p className="section-eyebrow">Index</p>
          <h2 className="section-title">
            {filtered.length.toLocaleString()}{" "}
            <span className="index-head__muted">projects.</span>
          </h2>
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
              <span className="filter-pill__count">{counts[f.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="index"
        onMouseLeave={() => setHoveredProject(null)}
      >
        {shown.map((p, i) => (
          <IndexRow
            key={p.slug}
            project={p}
            index={i}
            onHover={setHoveredProject}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="index-sentinel" aria-hidden="true">
        {remaining > 0 ? (
          <span>Loading {Math.min(PAGE_SIZE, remaining)} more —</span>
        ) : (
          <span>— end of index, {filtered.length} total.</span>
        )}
      </div>

      <FloatingPreview project={hoveredProject} />
    </section>
  );
}

function IndexRow({
  project,
  index,
  onHover,
}: {
  project: Project;
  index: number;
  onHover: (p: Project | null) => void;
}) {
  const year = project.pushedAt?.slice(0, 4) ?? "—";
  return (
    <a
      className="row-link"
      href={`/projects/${project.slug}/`}
      aria-label={`${project.name} — ${project.tagline}`}
      onMouseEnter={() => onHover(project)}
      onFocus={() => onHover(project)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="row-link__num">{String(index + 1).padStart(3, "0")}</span>
      <span className="row-link__name">{project.name}</span>
      <span className="row-link__tagline">{project.tagline}</span>
      <span className="row-link__meta">
        <span>{project.language}</span>
        {project.stars > 0 && <span>★ {project.stars}</span>}
        <span>{year}</span>
      </span>
    </a>
  );
}

function FloatingPreview({ project }: { project: Project | null }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let targetX = -1000;
    let targetY = -1000;
    let currentX = targetX;
    let currentY = targetY;
    let raf = 0;

    const move = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    const animate = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      el.style.transform = `translate3d(${currentX + 28}px, ${currentY - 110}px, 0)`;
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`preview${project ? " preview--visible" : ""}`}
      aria-hidden="true"
    >
      {project && <ProjectImage project={project} alt="" className="preview__media" />}
    </div>
  );
}
