import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "top", label: "Intro", num: "00" },
  { id: "about", label: "About", num: "01" },
  { id: "activity", label: "Activity", num: "02" },
  { id: "featured", label: "Featured", num: "03" },
  { id: "projects", label: "Projects", num: "04" },
];

/**
 * A thin vertical rail pinned to the right edge of the viewport,
 * showing a dot per section with the current section highlighted.
 * Each dot is clickable (smooth-scrolls to that section) and reveals
 * a mono label on hover.
 */
export function SectionRail() {
  const [active, setActive] = useState("top");

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el != null
    );
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        // pick the entry closest to the top that's currently intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="section-rail" aria-label="Section navigation">
      <ul role="list">
        {SECTIONS.map((s) => (
          <li key={s.id} className={active === s.id ? "is-active" : ""}>
            <a
              href={`#${s.id}`}
              aria-label={`Jump to ${s.label}`}
              aria-current={active === s.id ? "location" : undefined}
            >
              <span className="section-rail__dot" aria-hidden="true" />
              <span className="section-rail__label">
                <span className="section-rail__num">{s.num}</span>
                {s.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
