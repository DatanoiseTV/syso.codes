import { useEffect, useRef, useState } from "react";
import { useCountUp } from "../hooks/useCountUp";

interface Props {
  publicRepos: number;
  totalStars: number;
}

const ROLES = [
  "embedded audio engineer",
  "dsp / fpga enthusiast",
  "macOS native developer",
  "network-audio hacker",
  "open-source maintainer",
];

export function Hero({ publicRepos, totalStars }: Props) {
  // rotating "whoami" role under the lede
  const [roleIdx, setRoleIdx] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setRoleIdx((i) => (i + 1) % ROLES.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, []);

  // mouse-parallax on the title
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      // clamp + small magnitude so text stays readable
      const rx = Math.max(-1, Math.min(1, -dy)) * 2.4;
      const ry = Math.max(-1, Math.min(1, dx)) * 2.4;
      el.style.setProperty("--tilt-x", `${rx}deg`);
      el.style.setProperty("--tilt-y", `${ry}deg`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <header className="hero">
      <div className="hero__inner">
        <div className="hero__eyebrow">
          <span className="hero__dot" /> Berlin · open source · since forever
        </div>
        <h1 className="hero__title" ref={titleRef}>
          <span className="hero__title-line">I build tools where</span>
          <br />
          <span className="hero__title-accent">audio meets silicon.</span>
        </h1>
        <p className="hero__lede">
          Hi, I&apos;m <strong>Sylwester</strong> — also known as{" "}
          <a className="hero__handle" href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
            DatanoiseTV
          </a>
          . I write embedded firmware, FPGA gateware, DSP languages,
          low-latency network audio and native macOS apps. Most of it lives
          on GitHub, and most of it is open source.
        </p>

        {/* Terminal-style rotating role line */}
        <div className="hero__terminal" aria-hidden="true">
          <span className="hero__terminal-prompt">$ whoami</span>
          <span className="hero__terminal-arrow">→</span>
          <span className="hero__terminal-role" key={roleIdx}>
            {ROLES[roleIdx]}
          </span>
          <span className="hero__terminal-cursor" />
        </div>

        <div className="hero__cta">
          <a className="btn btn--primary" href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
            github.com/DatanoiseTV →
          </a>
          <a className="btn btn--ghost" href="#projects">
            Explore the Projects ↓
          </a>
        </div>

        <div className="hero__stats">
          <CountingStat label="Public repos" value={publicRepos} />
          <CountingStat label="Stars across them" value={totalStars} />
          <Stat label="Languages I ship in" value="C · C++ · Go · Swift · Verilog · Asm" wide />
        </div>
      </div>
      <HeroBackground />
    </header>
  );
}

function CountingStat({ label, value }: { label: string; value: number }) {
  const [n, ref] = useCountUp(value, { duration: 1800 });
  return (
    <div className="stat" ref={ref as React.RefObject<HTMLDivElement>}>
      <div className="stat__value">{n.toLocaleString()}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`stat${wide ? " stat--wide" : ""}`}>
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function HeroBackground() {
  return (
    <svg className="hero__bg" viewBox="0 0 1440 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="glow1" cx="80%" cy="0%" r="60%">
          <stop offset="0%" stopColor="rgba(255, 107, 53, 0.18)" />
          <stop offset="100%" stopColor="rgba(255, 107, 53, 0)" />
        </radialGradient>
        <radialGradient id="glow2" cx="0%" cy="100%" r="55%">
          <stop offset="0%" stopColor="rgba(255, 107, 53, 0.04)" />
          <stop offset="100%" stopColor="rgba(255, 107, 53, 0)" />
        </radialGradient>
      </defs>
      <rect width="1440" height="800" fill="url(#glow1)" />
      <rect width="1440" height="800" fill="url(#glow2)" />
    </svg>
  );
}
