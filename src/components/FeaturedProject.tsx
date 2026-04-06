import type { Project } from "../types";
import { ProjectArt } from "./ProjectArt";

interface Props {
  project: Project;
  /** if true, this card spans two columns and is taller (for tier-1 highlights) */
  hero?: boolean;
}

function detailUrl(slug: string): string {
  return `/projects/${slug}/`;
}

export function FeaturedProject({ project, hero }: Props) {
  const detail = detailUrl(project.slug);
  return (
    <article className={`featured-card${hero ? " featured-card--hero" : ""}`}>
      <a
        className="featured-card__media"
        href={detail}
        aria-label={`${project.name} — ${project.tagline}`}
      >
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
            language={project.language}
            topics={project.topics}
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
          <a href={detail}>{project.name}</a>
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
        <div className="featured-card__actions">
          <a className="featured-card__link" href={detail}>
            Read more →
          </a>
          <a
            className="featured-card__link featured-card__link--secondary"
            href={project.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${project.name} on GitHub (opens in new tab)`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
            GitHub
          </a>
        </div>
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
