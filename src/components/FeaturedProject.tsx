import type { Project } from "../types";
import { ProjectImage } from "./ProjectImage";

interface Props {
  project: Project;
  index: number;
}

/**
 * Editorial "feature" — no card chrome, just typography + a bled image.
 * Layout alternates: odd-indexed features flip the image + body columns
 * for a magazine-spread rhythm.
 */
export function FeaturedProject({ project, index }: Props) {
  const reverse = index % 2 === 1;
  const num = String(index + 1).padStart(2, "0");
  return (
    <article className={`feature${reverse ? " feature--reverse" : ""}`}>
      <a className="feature__media" href={`/projects/${project.slug}/`}>
        <ProjectImage project={project} />
      </a>
      <div className="feature__body">
        <div className="feature__meta">
          <span className="feature__num">{num} / Featured</span>
          <span>{categoryLabel(project.category)}</span>
        </div>
        <h3 className="feature__name">
          <a href={`/projects/${project.slug}/`}>{project.name}</a>
        </h3>
        <p className="feature__tagline">{project.tagline}</p>
        <p className="feature__desc">{project.description}</p>
        <div className="feature__row">
          <a className="feature__link" href={`/projects/${project.slug}/`}>
            Read more <span aria-hidden="true">→</span>
          </a>
          <a
            className="feature__github"
            href={project.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub ↗
          </a>
          <span className="feature__lang">{project.language}</span>
          {project.stars > 0 && <span className="feature__stars">★ {project.stars}</span>}
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
