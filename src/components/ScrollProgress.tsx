import { useEffect, useState } from "react";

/**
 * 2px progress bar pinned to the top of the viewport. Reflects document
 * scroll position as a gradient bar. Adds a subtle "techy" signature
 * without stealing attention. Passively listens, no rAF loop.
 */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let ticking = false;
    const compute = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? (window.scrollY / max) * 100 : 0;
      setPct(Math.min(100, Math.max(0, p)));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(compute);
        ticking = true;
      }
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
