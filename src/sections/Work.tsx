import type { Project } from "../types";
import { ProjectImage } from "../components/ProjectImage";

interface Props {
  projects: Project[];
}

export function Work({ projects }: Props) {
  const items = projects.slice(0, 6);
  return (
    <section className="section wide" id="work">
      <p className="section__label">Selected work</p>
      <h2 className="section__title">Things I&apos;ve made recently.</h2>
      <div className="work__list">
        {items.map((p, i) => (
          <Item key={p.slug} project={p} n={i + 1} />
        ))}
      </div>
    </section>
  );
}

function Item({ project, n }: { project: Project; n: number }) {
  const year = project.pushedAt?.slice(0, 4) ?? "—";
  const detailUrl = `/projects/${project.slug}/`;
  return (
    <article className="work__item">
      <div className="work__item-row">
        <span className="work__item-num">{String(n).padStart(2, "0")}</span>
        <h3 className="work__item-title">
          <a href={detailUrl}>{project.name}</a>
        </h3>
        <span className="work__item-meta">
          <span>{project.language}</span>
          {project.stars > 0 && <span>★ {project.stars}</span>}
          <span>{year}</span>
        </span>
      </div>
      <p className="work__item-desc">{project.description}</p>
      <div className="work__item-media">
        <a href={detailUrl} aria-label={`${project.name} detail`}>
          <ProjectImage project={project} />
        </a>
      </div>
      <div className="work__item-links">
        <a href={detailUrl}>Read more →</a>
        <a href={project.url} target="_blank" rel="noreferrer noopener">
          GitHub ↗
        </a>
      </div>
    </article>
  );
}
