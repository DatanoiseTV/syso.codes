import type { Project } from "../types";
import { ProjectArt } from "./ProjectArt";

interface Props {
  project: Project;
  /** if true, this card spans two columns and is taller (for tier-1 highlights) */
  hero?: boolean;
}

export function FeaturedProject({ project, hero }: Props) {
  return (
    <article className={`featured-card${hero ? " featured-card--hero" : ""}`}>
      <a className="featured-card__media" href={project.url} target="_blank" rel="noreferrer">
        {project.image ? (
          <img
            src={project.image}
            alt={`${project.name} screenshot`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <ProjectArt
            type={project.art ?? "auto"}
            slug={project.slug}
            category={project.category}
            className="featured-card__svg"
          />
        )}
        <div className="featured-card__media-frame" />
      </a>
      <div className="featured-card__body">
        <div className="featured-card__meta">
          <span className="chip chip--lang">{project.language}</span>
          {project.stars > 0 && (
            <span className="chip chip--stars">★ {project.stars}</span>
          )}
          <span className="chip">{categoryLabel(project.category)}</span>
        </div>
        <h3 className="featured-card__name">
          <a href={project.url} target="_blank" rel="noreferrer">
            {project.name}
          </a>
        </h3>
        <p className="featured-card__tagline">{project.tagline}</p>
        <p className="featured-card__desc">{project.description}</p>
        {hero && project.story && (
          <p className="featured-card__story">{project.story}</p>
        )}
        {project.specs && project.specs.length > 0 && (
          <ul className="featured-card__specs">
            {project.specs.slice(0, hero ? 7 : 4).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        <a
          className="featured-card__link"
          href={project.url}
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub →
        </a>
      </div>
    </article>
  );
}

export function categoryLabel(c: Project["category"]): string {
  switch (c) {
    case "audio-server":
      return "Audio · Server";
    case "audio-app":
      return "Audio · App";
    case "embedded":
      return "Embedded";
    case "fpga":
      return "FPGA";
    case "linux-audio":
      return "Linux Audio";
    case "ai-tools":
      return "AI Tools";
    case "dev-tools":
      return "Dev Tools";
  }
}
