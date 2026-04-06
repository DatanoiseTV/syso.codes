/**
 * Site-wide ambient background — fixed, full viewport, non-interactive.
 *
 * Layers, all subtle (opacity ~0.1–0.3), all themed to the audio/embedded
 * universe of the site:
 *   - Two sine waves drifting horizontally at different speeds
 *   - PTP-style "ping" rings emanating from two corners
 *   - A pulse train scrolling across the bottom edge
 *   - Slowly floating particles
 *   - A drifting oscilloscope scan line
 *
 * All animation is CSS keyframes — no SMIL, no JS rAF — so it costs nothing
 * on the main thread and respects prefers-reduced-motion.
 */
export function BackgroundAnimations() {
  return (
    <div className="bg-anim" aria-hidden="true">
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bg-glow-1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 107, 53, 0.14)" />
            <stop offset="100%" stopColor="rgba(255, 107, 53, 0)" />
          </radialGradient>
          <radialGradient id="bg-glow-2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 133, 81, 0.06)" />
            <stop offset="100%" stopColor="rgba(255, 133, 81, 0)" />
          </radialGradient>
          <linearGradient id="wave-grad-1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255, 107, 53, 0)" />
            <stop offset="50%" stopColor="rgba(255, 107, 53, 0.45)" />
            <stop offset="100%" stopColor="rgba(255, 107, 53, 0)" />
          </linearGradient>
          <linearGradient id="wave-grad-2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255, 133, 81, 0)" />
            <stop offset="50%" stopColor="rgba(255, 133, 81, 0.3)" />
            <stop offset="100%" stopColor="rgba(255, 133, 81, 0)" />
          </linearGradient>
        </defs>

        {/* radial glows */}
        <rect width="1440" height="900" fill="url(#bg-glow-1)" transform="translate(900, -300)" />
        <rect width="1440" height="900" fill="url(#bg-glow-2)" transform="translate(-300, 400)" />

        {/* sine wave 1 — drifts left to right slowly */}
        <g className="bg-anim__wave bg-anim__wave--1">
          <SineWavePath y={180} amp={28} cycles={6} stroke="url(#wave-grad-1)" />
          <SineWavePath y={180} amp={28} cycles={6} stroke="url(#wave-grad-1)" offsetX={1440} />
        </g>

        {/* sine wave 2 — drifts right to left, lower */}
        <g className="bg-anim__wave bg-anim__wave--2">
          <SineWavePath y={760} amp={22} cycles={5} stroke="url(#wave-grad-2)" />
          <SineWavePath y={760} amp={22} cycles={5} stroke="url(#wave-grad-2)" offsetX={1440} />
        </g>

        {/* PTP pings, top-right corner */}
        <g className="bg-anim__pings" transform="translate(1240, 160)">
          <circle r="60" fill="none" stroke="rgba(255, 107, 53, 0.55)" strokeWidth="1" className="bg-anim__ping bg-anim__ping--1" />
          <circle r="60" fill="none" stroke="rgba(255, 107, 53, 0.55)" strokeWidth="1" className="bg-anim__ping bg-anim__ping--2" />
          <circle r="60" fill="none" stroke="rgba(255, 107, 53, 0.55)" strokeWidth="1" className="bg-anim__ping bg-anim__ping--3" />
          <circle r="3" fill="rgba(255, 107, 53, 0.85)" />
        </g>

        {/* PTP pings, bottom-left corner */}
        <g className="bg-anim__pings" transform="translate(220, 720)">
          <circle r="50" fill="none" stroke="rgba(255, 133, 81, 0.4)" strokeWidth="1" className="bg-anim__ping bg-anim__ping--1" />
          <circle r="50" fill="none" stroke="rgba(255, 133, 81, 0.4)" strokeWidth="1" className="bg-anim__ping bg-anim__ping--2" />
          <circle r="50" fill="none" stroke="rgba(255, 133, 81, 0.4)" strokeWidth="1" className="bg-anim__ping bg-anim__ping--3" />
          <circle r="3" fill="rgba(255, 133, 81, 0.85)" />
        </g>

        {/* floating particles */}
        <g className="bg-anim__particles">
          {PARTICLES.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={p.coral ? "rgba(255, 133, 81, 0.6)" : "rgba(255, 107, 53, 0.6)"}
              className="bg-anim__particle"
              style={{
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </g>

        {/* scan line traveling top to bottom */}
        <g className="bg-anim__scan">
          <line
            x1="0"
            y1="0"
            x2="1440"
            y2="0"
            stroke="url(#wave-grad-1)"
            strokeWidth="1"
            opacity="0.3"
          />
        </g>
      </svg>
    </div>
  );
}

function SineWavePath({
  y,
  amp,
  cycles,
  stroke,
  offsetX = 0,
}: {
  y: number;
  amp: number;
  cycles: number;
  stroke: string;
  offsetX?: number;
}) {
  const points: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const x = offsetX + t * 1440;
    const py = y + Math.sin(t * Math.PI * cycles) * amp;
    points.push(`${x.toFixed(1)},${py.toFixed(1)}`);
  }
  return (
    <path
      d={`M ${points.join(" L ")}`}
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  );
}

interface Particle {
  x: number;
  y: number;
  r: number;
  delay: number;
  duration: number;
  coral?: boolean;
}

const PARTICLES: Particle[] = [
  { x: 120, y: 200, r: 2, delay: 0, duration: 14 },
  { x: 280, y: 90, r: 1.5, delay: 2, duration: 18 },
  { x: 460, y: 280, r: 2.5, delay: 4, duration: 12, coral: true },
  { x: 620, y: 130, r: 1.5, delay: 1, duration: 16 },
  { x: 780, y: 240, r: 2, delay: 3, duration: 15 },
  { x: 940, y: 80, r: 1.5, delay: 5, duration: 13 },
  { x: 1100, y: 320, r: 2, delay: 0, duration: 17, coral: true },
  { x: 1300, y: 180, r: 2.5, delay: 4, duration: 14 },
  { x: 80, y: 480, r: 1.5, delay: 6, duration: 16 },
  { x: 340, y: 580, r: 2, delay: 2, duration: 13 },
  { x: 580, y: 460, r: 2, delay: 5, duration: 15, coral: true },
  { x: 820, y: 600, r: 1.5, delay: 1, duration: 18 },
  { x: 1060, y: 540, r: 2.5, delay: 3, duration: 14 },
  { x: 1280, y: 460, r: 1.5, delay: 0, duration: 17 },
  { x: 200, y: 800, r: 2, delay: 4, duration: 13 },
  { x: 480, y: 760, r: 2, delay: 2, duration: 15, coral: true },
  { x: 760, y: 820, r: 1.5, delay: 5, duration: 16 },
  { x: 1040, y: 780, r: 2, delay: 1, duration: 14 },
  { x: 1320, y: 700, r: 2.5, delay: 3, duration: 17 },
];
