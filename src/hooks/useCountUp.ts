import { useEffect, useRef, useState } from "react";

/**
 * Animate a number from 0 to `target` when the host element enters the
 * viewport. Uses IntersectionObserver to fire once, then a rAF loop
 * with ease-out quint for a satisfying "settle" at the end.
 *
 * Returns the current value and a ref to attach to any element that
 * should trigger the animation when scrolled into view.
 */
export function useCountUp(
  target: number,
  opts: { duration?: number; startOnMount?: boolean } = {}
): [number, React.RefObject<HTMLElement>] {
  const { duration = 1600, startOnMount = false } = opts;
  const [value, setValue] = useState(startOnMount ? 0 : target);
  const ref = useRef<HTMLElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }

    const start = () => {
      if (started.current) return;
      started.current = true;
      const begin = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - begin) / duration);
        // ease-out quint — overshoots feeling, lands smooth
        const eased = 1 - Math.pow(1 - t, 5);
        setValue(Math.floor(eased * target));
        if (t < 1) raf = requestAnimationFrame(tick);
        else setValue(target);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    };

    if (startOnMount) {
      setValue(0);
      return start();
    }

    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setValue(0);
          start();
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration, startOnMount]);

  return [value, ref];
}
