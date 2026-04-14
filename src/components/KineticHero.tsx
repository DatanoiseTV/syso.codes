import { useEffect, useRef, useState } from "react";

interface Props {
  repos: number;
  stars: number;
}

const CYCLE = ["boards", "silicon", "chips", "eurorack", "hardware"];

/**
 * Kinetic editorial hero — fits exactly one viewport.
 *
 * The headline asserts "Most of my code runs on [X]. Not servers."
 * where [X] cycles through synonyms. The rotating word sits in its
 * own slot so nothing else reflows. Blur+slide animation on each
 * change. Meta strip at the top (brand · live Berlin clock · status),
 * stats strip at the bottom (repos / stars / year), and a subtle
 * scroll cue.
 */
export function KineticHero({ repos, stars }: Props) {
  const [wi, setWi] = useState(0);
  const clockRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setWi((i) => (i + 1) % CYCLE.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () => {
      const el = clockRef.current;
      if (!el) return;
      el.textContent = new Date().toLocaleTimeString("en-GB", {
        timeZone: "Europe/Berlin",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="kh" id="top" aria-label="Hero">
      <div className="kh__meta kh__meta--top">
        <span className="kh__tag">Sylwester / DatanoiseTV</span>
        <span className="kh__divider" aria-hidden="true" />
        <span>
          Berlin · <span ref={clockRef}>—</span>
        </span>
        <span className="kh__divider" aria-hidden="true" />
        <span className="kh__status">
          <span className="kh__status-dot" aria-hidden="true" />
          Available for collab
        </span>
      </div>

      <h1 className="kh__title">
        <span className="kh__line">Most of my code runs on</span>
        <span className="kh__slot" aria-live="polite">
          <span className="kh__word" key={wi}>
            {CYCLE[wi]}
          </span>
          <span className="kh__punct">.</span>
        </span>
        <span className="kh__line kh__line--coda">Not servers.</span>
      </h1>

      <div className="kh__meta kh__meta--bottom">
        <div className="kh__cta">
          <a className="kh__cta-primary" href="#projects">
            Browse projects
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M 3 11 L 11 3 M 5 3 L 11 3 L 11 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a
            className="kh__cta-ghost"
            href="https://github.com/DatanoiseTV"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
        <dl className="kh__stats" aria-label="Overview">
          <div>
            <dt>REPOS</dt>
            <dd>{repos}</dd>
          </div>
          <div>
            <dt>STARS</dt>
            <dd>{stars.toLocaleString()}</dd>
          </div>
          <div>
            <dt>SINCE</dt>
            <dd>2014</dd>
          </div>
        </dl>
      </div>

      <span className="kh__cue" aria-hidden="true">
        <span>Scroll to see the work</span>
        <span className="kh__cue-arrow">↓</span>
      </span>
    </section>
  );
}
