interface Props {
  items: string[];
  /** duration of one full loop in seconds */
  duration?: number;
}

/**
 * Full-width infinite marquee. Duplicates the items once so the
 * content can translate 50% and seam-loop. Hover pauses.
 */
export function MarqueeBand({ items, duration = 80 }: Props) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div
        className="marquee__track"
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="marquee__item">
            <span>{item}</span>
            <span className="marquee__sep">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
