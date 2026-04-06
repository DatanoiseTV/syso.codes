import { useState } from "react";
import type { Project } from "../types";
import { ProjectArt } from "./ProjectArt";

interface Props {
  project: Project;
  className?: string;
  /** alt text override; defaults to "<name> screenshot" */
  alt?: string;
}

/**
 * Renders the project's screenshot if it has one. If the image fails to
 * load (404, expired signed URL, blocked by CSP, etc.) it falls back to
 * the procedural SVG art for that project so the card never looks broken.
 */
export function ProjectImage({ project, className, alt }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed || !project.image) {
    return (
      <ProjectArt
        type={project.art ?? "auto"}
        slug={project.slug}
        category={project.category}
        language={project.language}
        topics={project.topics}
        className={className}
      />
    );
  }

  return (
    <img
      src={project.image}
      alt={alt ?? `${project.name} screenshot`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
