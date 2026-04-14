import { useEffect, useRef } from "react";

interface Props {
  repos: number;
  stars: number;
}

/**
 * Full-viewport animated oscilloscope hero.
 *
 * A live CRT-style scope trace morphs between sine / square / saw /
 * triangle on a ~9s loop, with a phosphor persistence trail (each
 * frame fades the previous by ~22%). The graticule, centre crosshair
 * and glowing trace are all drawn in real time. Four corner readouts
 * style the nameplate + real GitHub stats as scope metadata.
 *
 * Respects prefers-reduced-motion by stopping the rAF loop after one
 * frame.
 */
export function HeroScope({ repos, stars }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      // paint the scope background once
      ctx.fillStyle = "#0d0a07";
      ctx.fillRect(0, 0, width, height);
    };
    resize();
    window.addEventListener("resize", resize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 4 waveshapes: input x in cycles (x=0..1 is one period)
    const SHAPES = [
      (x: number) => Math.sin(x * Math.PI * 2),
      (x: number) => {
        const s = Math.sign(Math.sin(x * Math.PI * 2));
        return s === 0 ? 1 : s;
      },
      (x: number) => 2 * ((x + 0.5) - Math.floor(x + 0.5)) - 1,
      (x: number) => {
        const k = x + 0.25 - Math.floor(x + 0.75);
        return 2 * Math.abs(2 * k) - 1;
      },
    ];
    const PERIOD = 2.2; // seconds per shape
    const MORPH = 0.55;

    const wave = (t: number, x: number): number => {
      const cycle = t / PERIOD;
      const idx = Math.floor(cycle) % SHAPES.length;
      const next = (idx + 1) % SHAPES.length;
      const within = cycle - Math.floor(cycle);
      const morphStart = (PERIOD - MORPH) / PERIOD;
      const a = SHAPES[idx]!(x);
      if (within < morphStart) return a;
      const b = SHAPES[next]!(x);
      const k = (within - morphStart) / (1 - morphStart);
      // ease the morph slightly
      const ke = k * k * (3 - 2 * k);
      return a * (1 - ke) + b * ke;
    };

    const start = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const t = (now - start) / 1000;

      // phosphor persistence: fade previous frame slightly
      ctx.fillStyle = "rgba(13, 10, 7, 0.24)";
      ctx.fillRect(0, 0, width, height);

      // graticule — minor grid
      ctx.strokeStyle = "rgba(255, 107, 53, 0.06)";
      ctx.lineWidth = 1;
      const cols = 12;
      const rows = 8;
      ctx.beginPath();
      for (let i = 1; i < cols; i++) {
        const x = Math.round((i * width) / cols) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let i = 1; i < rows; i++) {
        const y = Math.round((i * height) / rows) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // central crosshair (a touch brighter)
      ctx.strokeStyle = "rgba(255, 107, 53, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const cx = Math.round(width / 2) + 0.5;
      const cy = Math.round(height / 2) + 0.5;
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      // tick marks on the centre crosshair
      ctx.strokeStyle = "rgba(255, 107, 53, 0.24)";
      for (let i = 1; i < cols * 5; i++) {
        const x = (i * width) / (cols * 5);
        ctx.beginPath();
        ctx.moveTo(x, cy - 3);
        ctx.lineTo(x, cy + 3);
        ctx.stroke();
      }
      for (let i = 1; i < rows * 5; i++) {
        const y = (i * height) / (rows * 5);
        ctx.beginPath();
        ctx.moveTo(cx - 3, y);
        ctx.lineTo(cx + 3, y);
        ctx.stroke();
      }

      // the trace — glowing phosphor
      ctx.save();
      ctx.shadowColor = "#ff6b35";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "#ff8551";
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const numCycles = 3.5;
      const amp = height * 0.28;
      const drift = t * 0.32;
      const step = Math.max(1.5, width / 600);
      for (let x = 0; x <= width; x += step) {
        const phase = (x / width) * numCycles + drift;
        const y = cy + wave(t, phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // brighter inner stroke for the hot core
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255, 240, 220, 0.9)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="heroscope" id="top" aria-label="Hero">
      <canvas ref={canvasRef} className="heroscope__canvas" aria-hidden="true" />

      <div className="heroscope__chrome" aria-hidden="true">
        <div className="heroscope__corner heroscope__corner--tl">
          <span>CH1</span>
          <span className="heroscope__dim">· 1.00V/DIV</span>
        </div>
        <div className="heroscope__corner heroscope__corner--tr">
          <span>REPOS {repos}</span>
          <span className="heroscope__sep">·</span>
          <span>★ {stars.toLocaleString()}</span>
          <span className="heroscope__led" />
        </div>
        <div className="heroscope__corner heroscope__corner--bl">
          <span>T/DIV</span>
          <span className="heroscope__dim">· 500μS · AUTO</span>
        </div>
        <div className="heroscope__corner heroscope__corner--br">
          <span>SYSO.CODES</span>
          <span className="heroscope__dim">v2.4</span>
        </div>
      </div>

      <div className="heroscope__content">
        <p className="heroscope__eyebrow">Sylwester · Berlin · DatanoiseTV</p>
        <h1 className="heroscope__title">
          Audio <em>meets</em> silicon.
        </h1>
        <p className="heroscope__lede">
          Hi, I&apos;m <strong>Sylwester</strong>. I write embedded firmware,
          FPGA gateware, DSP languages, low-latency network audio and native
          macOS apps. Most of it lives on{" "}
          <a
            href="https://github.com/DatanoiseTV"
            target="_blank"
            rel="noreferrer"
            className="heroscope__handle"
          >
            github.com/DatanoiseTV
          </a>
          , and most of it is open source.
        </p>
        <div className="heroscope__cta">
          <a
            className="btn btn--primary"
            href="https://github.com/DatanoiseTV"
            target="_blank"
            rel="noreferrer"
          >
            github.com/DatanoiseTV →
          </a>
          <a className="btn btn--ghost" href="#projects">
            Browse projects
          </a>
        </div>
      </div>

      <div className="heroscope__scroll-cue" aria-hidden="true">
        <span>SCROLL</span>
        <span className="heroscope__scroll-arrow">↓</span>
      </div>
    </section>
  );
}
