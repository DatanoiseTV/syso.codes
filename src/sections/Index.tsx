import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Project } from "../types";
import { ProjectImage } from "../components/ProjectImage";

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

const PAGE = 50;

export function ProjectsIndex({ projects }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [visible, setVisible] = useState(PAGE);
  const [hovered, setHovered] = useState<Project | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length };
    for (const p of projects) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [projects]);

  const filtered = useMemo(() => {
    const list =
      filter === "all" ? projects : projects.filter((p) => p.category === filter);
    return [...list].sort((a, b) => {
      const aD = a.pushedAt ?? "";
      const bD = b.pushedAt ?? "";
      if (bD !== aD) return bD.localeCompare(aD);
      if (b.stars !== a.stars) return b.stars - a.stars;
      return a.name.localeCompare(b.name);
    });
  }, [projects, filter]);

  useEffect(() => setVisible(PAGE), [filter]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE, filtered.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);

  return (
    <section className="section wide" id="index" onMouseLeave={() => setHovered(null)}>
      <p className="section__label">Index</p>
      <h2 className="section__title">
        All {projects.length} projects.
      </h2>

      <div className="index__controls">
        <div className="filters" role="group" aria-label="Category filter">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="count">{counts[f.value] ?? 0}</span>
            </button>
          ))}
        </div>
        <span className="index__count">
          showing <strong>{shown.length}</strong> of{" "}
          <strong>{filtered.length}</strong>
        </span>
      </div>

      <div className="index__list">
        {shown.map((p, i) => {
          const year = p.pushedAt?.slice(0, 7) ?? "—";
          return (
            <a
              key={p.slug}
              className="index__row"
              href={`/projects/${p.slug}/`}
              onMouseEnter={() => setHovered(p)}
              onFocus={() => setHovered(p)}
            >
              <span className="index__row-num">
                {String(i + 1).padStart(3, "0")}
              </span>
              <span className="index__row-name">{p.name}</span>
              <span className="index__row-tagline">{p.tagline}</span>
              <span className="index__row-meta">
                <span>{p.language}</span>
                {p.stars > 0 && <span>★ {p.stars}</span>}
                <span>{year}</span>
              </span>
            </a>
          );
        })}
      </div>
      <div ref={sentinelRef} className="index__more" aria-hidden="true">
        {shown.length < filtered.length
          ? `loading more — ${filtered.length - shown.length} left`
          : `— end · ${filtered.length} total —`}
      </div>

      <Preview project={hovered} />
    </section>
  );
}

function Preview({ project }: { project: Project | null }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let tx = -1000;
    let ty = -1000;
    let cx = tx;
    let cy = ty;
    let raf = 0;
    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const anim = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate3d(${cx + 28}px, ${cy - 100}px, 0)`;
      raf = requestAnimationFrame(anim);
    };
    window.addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(anim);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`preview${project ? " preview--on" : ""}`}
      aria-hidden="true"
    >
      {project && <ProjectImage project={project} alt="" />}
    </div>
  );
}
