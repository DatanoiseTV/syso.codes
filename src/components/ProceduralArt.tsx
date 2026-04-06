import type { Category } from "../types";

interface Props {
  slug: string;
  category?: Category;
  language?: string;
  topics?: string[];
  className?: string;
}

/**
 * Deterministic procedural SVG art for projects without screenshots.
 *
 * The composition is picked based on the project's category, language and
 * topics — so an FPGA project always gets the FPGA grid, an MCU project the
 * chip outline, a network audio project the packet constellation, etc.
 * Only the colour palette and minor sizing parameters are hash-randomised
 * per slug, so the same project always renders the same image but each one
 * still feels visually distinct.
 */
export function ProceduralArt({ slug, category, language, topics = [], className }: Props) {
  const seed = hash(slug);
  const palette = PALETTES[seed % PALETTES.length];
  const composition = pickComposition({ slug, category, language, topics });
  const Composition = COMPOSITIONS[composition];
  const r = rng(seed);
  const tag = categoryTag(category);
  return (
    <svg
      viewBox="0 0 480 280"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`bg-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a0a0a" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <pattern id={`grid-${seed}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="480" height="280" fill={`url(#bg-${seed})`} />
      <rect width="480" height="280" fill={`url(#grid-${seed})`} />
      <Composition palette={palette} r={r} />
      {tag && (
        <text
          x="24"
          y="248"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontSize="10"
          fontWeight="600"
          fill="rgba(232, 234, 242, 0.32)"
          letterSpacing="0.08em"
        >
          {tag.toUpperCase()}
        </text>
      )}
      <text
        x="456"
        y="248"
        textAnchor="end"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontSize="10"
        fontWeight="500"
        fill="rgba(232, 234, 242, 0.32)"
      >
        {slug.length > 22 ? slug.slice(0, 22) + "…" : slug}
      </text>
    </svg>
  );
}

// ─── Composition picker ────────────────────────────────────────────────────
type CompName =
  | "sine"
  | "bars"
  | "concentric"
  | "fpga"
  | "chip"
  | "scope"
  | "constellation"
  | "spiral"
  | "waveStack"
  | "diagonalFlow"
  | "pulse"
  | "matrix"
  | "phone"
  | "code"
  | "chart"
  | "log"
  | "midi";

function pickComposition({
  slug,
  category,
  language,
  topics,
}: {
  slug: string;
  category?: Category;
  language?: string;
  topics: string[];
}): CompName {
  const all = [slug, language ?? "", category ?? "", ...topics, slug.replace(/-/g, " ")]
    .join(" ")
    .toLowerCase();

  // Order matters — most specific keywords first.

  // Mobile / cross-platform apps → phone outline
  if (
    language?.toLowerCase() === "dart" ||
    /(flutter|mobile|ios|android|iphone|ipad|tinyice-app)/.test(all)
  )
    return "phone";

  // FPGA / gateware → fabric grid
  if (/(fpga|ecp5|lattice|verilog|vhdl|gateware|litex|migen|colorlight|hdl)/.test(all))
    return "fpga";

  // Patchbay / matrix mixer / crosspoint → matrix grid with connections
  if (/(patchbay|matrix|crosspoint|mt8816|mixer|routing)/.test(all)) return "matrix";

  // Logic analyzer / debug probe → multi-trace scope
  if (/(logic-analyzer|sigrok|dslogic|debug|probe|debugomatic|sniff)/.test(all))
    return "scope";

  // RF / wireless / find3 / PTP / nRF24 → concentric pings
  if (/(find3|location|indoor|positioning|nrf24|rf|wireless|mesh|airplay)/.test(all))
    return "concentric";

  // MIDI / SysEx → DIN socket + piano roll
  if (/(midi|sysex|turbomidi|midiusb|usb-midi)/.test(all)) return "midi";

  // Metronome / arpeggiator / gate / clock-out → square pulse train
  if (/(metronome|clock-out|gate|arpeggi|click|tempo)/.test(all)) return "pulse";

  // Network audio / IP audio / streaming → node constellation
  if (/(aes67|ravenna|usbip|usb-ip|rtp|ptp|ieee.1588|jack-link|streaming|icecast|webrtc|tinyice|airplay|network-audio)/.test(all))
    return "constellation";

  // Wavetable / oscillator / synthesizer / saturation → stacked waveforms
  if (/(wavetable|akwf|oscillator|wavefolder|synthesizer|synth|spice|saturation|distort|filter|biquad|eq|effect)/.test(all))
    return "waveStack";

  // Level meter / VU / spectrum → vertical bars
  if (/(meter|level|spectrum|vu|fft|analy[sz]er|monitor)/.test(all)) return "bars";

  // Generic audio / DSP / clock / ADAT / I2S / SPDIF / TDM → big sine wave
  if (/(audio|dsp|signal|sample-rate|adat|i2s|spdif|tdm|toslink|optical|alsa|jack|pcm|codec|dac|adc|si5351|pll|clock|crystal)/.test(all))
    return "sine";

  // Eurorack / CV / modular → chip (closest visual)
  if (/(eurorack|modular|cv|gate|sequencer|trigger)/.test(all)) return "chip";

  // ESP32 / RP2040 / MCU / firmware / hardware → chip
  if (/(esp32|esp8266|stm32|rp2040|rp2350|pico|teensy|microcontroller|firmware|mcu|romemu|tinyusb|hardware|board|sdk)/.test(all))
    return "chip";

  // AI / LLM / MCP / whisper → scope (terminal-like read-out)
  if (/(ai|llm|gpt|gemini|claude|whisper|mcp|brainmcp|translator|agent|assistant)/.test(all))
    return "scope";

  // Linux kernel / driver / OS / build → pulse (heartbeat)
  if (/(linux|kernel|driver|alsa-lkm|buildroot|systemd|swupdate|splash|ssdsplash|os)/.test(all))
    return "pulse";

  // Metrics / Grafana / time-series / monitoring → line chart
  if (/(metric|grafana|prometheus|influx|time-series|monitoring|telemetry|stats)/.test(all))
    return "chart";

  // Logging / log libs → log lines
  if (/(log|logger|logging|xlog|tracing|journal)/.test(all)) return "log";

  // Config / settings / serializer / parser / xconfig → code snippet
  if (/(config|settings|serializ|parser|schema|yaml|toml|json|ini|kv|key-value|xconfig)/.test(all))
    return "code";

  // CLI / library / template / sdk / header-only / VS Code extension → code
  if (/(cli|library|template|sdk|header-only|headeronly|tool|webcomponent|vscode|extension)/.test(all))
    return "code";

  // Tier 2 — fall back by category
  switch (category) {
    case "fpga":
      return "fpga";
    case "embedded":
      return "chip";
    case "audio-app":
    case "audio-server":
      return "sine";
    case "linux-audio":
      return "pulse";
    case "ai-tools":
      return "scope";
    case "dev-tools":
      return "code";
  }

  // Tier 3 — last resort, hash-derived
  const seed = hash(slug);
  const order: CompName[] = ["sine", "chip", "fpga", "constellation", "matrix", "scope"];
  return order[seed % order.length]!;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function categoryTag(c?: Category): string | null {
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
    default:
      return null;
  }
}

interface Palette {
  primary: string;
  primaryDim: string;
  accent: string;
  dim: string;
}

// Mostly greyscale palettes with orange accent, varied just enough that
// each tile feels distinct. Roughly 5 greys + 3 orange variants.
const PALETTES: Palette[] = [
  { primary: "#ffffff", primaryDim: "rgba(255, 255, 255, 0.32)", accent: "#ff6b35", dim: "rgba(255,255,255,0.42)" },
  { primary: "#e5e5e5", primaryDim: "rgba(229, 229, 229, 0.32)", accent: "#ff6b35", dim: "rgba(255,255,255,0.42)" },
  { primary: "#d4d4d4", primaryDim: "rgba(212, 212, 212, 0.32)", accent: "#ff6b35", dim: "rgba(255,255,255,0.42)" },
  { primary: "#a3a3a3", primaryDim: "rgba(163, 163, 163, 0.32)", accent: "#ff8551", dim: "rgba(255,255,255,0.42)" },
  { primary: "#737373", primaryDim: "rgba(115, 115, 115, 0.32)", accent: "#ff8551", dim: "rgba(255,255,255,0.42)" },
  { primary: "#ff6b35", primaryDim: "rgba(255, 107, 53, 0.32)", accent: "#ffffff", dim: "rgba(255,255,255,0.42)" },
  { primary: "#ff8551", primaryDim: "rgba(255, 133, 81, 0.32)", accent: "#ffffff", dim: "rgba(255,255,255,0.42)" },
  { primary: "#ffa476", primaryDim: "rgba(255, 164, 118, 0.32)", accent: "#ffffff", dim: "rgba(255,255,255,0.42)" },
];

interface CompProps {
  palette: Palette;
  r: () => number;
}

// ─── Compositions ──────────────────────────────────────────────────────────
// Safe drawable area: y ∈ [40, 215], x ∈ [40, 440]
// (the corner labels live at y=240+ so compositions stay above them).

function CompSine({ palette, r }: CompProps) {
  const cycles = 2 + Math.floor(r() * 3); // 2..4
  const amp = 26 + r() * 18; // 26..44
  const yBase = 120;
  const points: string[] = [];
  for (let x = 40; x <= 440; x += 4) {
    const t = (x - 40) / 400;
    const y = yBase + Math.sin(t * Math.PI * cycles) * amp;
    points.push(`${x},${y.toFixed(1)}`);
  }
  return (
    <g>
      <path d={`M ${points.join(" L ")}`} stroke={palette.primary} strokeWidth="6" fill="none" opacity="0.18" strokeLinecap="round" />
      <path d={`M ${points.join(" L ")}`} stroke={palette.primary} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* peak markers */}
      {[0.16, 0.5, 0.84].map((t, i) => {
        const x = 40 + t * 400;
        const y = yBase + Math.sin(t * Math.PI * cycles) * amp;
        return <circle key={i} cx={x} cy={y} r="3" fill={palette.accent} />;
      })}
    </g>
  );
}

function CompBars({ palette, r }: CompProps) {
  // audio level meter — vertical bars of varying heights
  const count = 16;
  const w = 380 / count;
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const h = 30 + r() * 130;
        const x = 50 + i * w;
        const y = 200 - h;
        const peak = h > 130;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w - 4} height={h} fill={peak ? palette.accent : palette.primary} opacity={peak ? 0.95 : 0.7} rx="1" />
            {peak && <rect x={x} y={y - 6} width={w - 4} height="2" fill={palette.accent} />}
          </g>
        );
      })}
      <line x1="46" y1="202" x2="434" y2="202" stroke={palette.dim} strokeWidth="1" />
    </g>
  );
}

function CompConcentric({ palette, r }: CompProps) {
  // fixed centre to keep rings inside the safe area
  const cx = 240;
  const cy = 130;
  const rings = 5;
  const accent = Math.floor(r() * rings);
  return (
    <g>
      {Array.from({ length: rings }).map((_, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={18 + i * 16}
          fill="none"
          stroke={i === accent ? palette.accent : palette.primary}
          strokeWidth={i === 0 ? 2 : 1.2}
          opacity={1 - i * 0.13}
          strokeDasharray={i % 2 === 0 ? undefined : "3 4"}
        />
      ))}
      <circle cx={cx} cy={cy} r="4" fill={palette.accent} />
    </g>
  );
}

function CompFpgaGrid({ palette, r }: CompProps) {
  const cols = 8;
  const rows = 5;
  const cellW = 36;
  const cellH = 30;
  const ox = (480 - cols * cellW) / 2 + 4;
  const oy = 55;
  const hotR = Math.floor(r() * rows);
  const hotC = Math.floor(r() * cols);
  return (
    <g>
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const isHot = (row + col) % 4 === 0 || (row === hotR && col === hotC);
          return (
            <rect
              key={`${row}-${col}`}
              x={ox + col * cellW}
              y={oy + row * cellH}
              width={cellW - 6}
              height={cellH - 6}
              rx="2"
              fill={isHot ? palette.primaryDim : "rgba(255, 107, 53, 0.04)"}
              stroke={isHot ? palette.primary : "rgba(232, 234, 242, 0.18)"}
              strokeWidth="1"
            />
          );
        })
      )}
    </g>
  );
}

function CompChip({ palette, r }: CompProps) {
  const w = 160;
  const h = 100;
  const x = 240 - w / 2;
  const y = 130 - h / 2;
  const pinCount = 5 + Math.floor(r() * 3); // 5..7
  const pinSpacing = (h - 20) / (pinCount - 1);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill="#0c1221" stroke={palette.primary} strokeWidth="1.4" />
      <circle cx={x + 10} cy={y + 10} r="2.5" fill={palette.accent} />
      {Array.from({ length: pinCount }).map((_, i) => (
        <rect key={`l${i}`} x={x - 12} y={y + 10 + i * pinSpacing - 2} width="12" height="4" fill={palette.primary} opacity="0.7" />
      ))}
      {Array.from({ length: pinCount }).map((_, i) => (
        <rect key={`r${i}`} x={x + w} y={y + 10 + i * pinSpacing - 2} width="12" height="4" fill={palette.primary} opacity="0.7" />
      ))}
      <path d={`M 40 130 H ${x - 12} M ${x + w + 12} 130 H 440`} stroke={palette.primaryDim} strokeWidth="1.4" />
    </g>
  );
}

function CompScope({ palette, r }: CompProps) {
  // logic-analyzer style traces
  const trace = (yBase: number, color: string) => {
    const pts: string[] = [];
    let level = Math.floor(r() * 2);
    pts.push(`60,${yBase - level * 14}`);
    for (let i = 1; i < 18; i++) {
      const x = 60 + i * 22;
      const y0 = yBase - level * 14;
      pts.push(`${x},${y0}`);
      level = r() > 0.5 ? 1 : 0;
      pts.push(`${x},${yBase - level * 14}`);
    }
    pts.push(`${60 + 18 * 22},${yBase - level * 14}`);
    return <path d={`M ${pts.join(" L ")}`} stroke={color} strokeWidth="1.6" fill="none" />;
  };
  return (
    <g>
      {trace(80, palette.primary)}
      {trace(130, palette.accent)}
      {trace(180, palette.primary)}
      {trace(230, palette.accent)}
    </g>
  );
}

function CompConstellation({ palette, r }: CompProps) {
  // grid-snapped nodes with light jitter — never overlap, always inside bounds
  const cols = 5;
  const rows = 3;
  const cellW = 80;
  const cellH = 50;
  const ox = 60;
  const oy = 60;
  const cells: [number, number][] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) cells.push([row, col]);
  // pick 7 cells deterministically
  const picks: { x: number; y: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const idx = Math.floor(r() * cells.length);
    const [row, col] = cells.splice(idx, 1)[0]!;
    picks.push({
      x: ox + col * cellW + cellW / 2 + (r() - 0.5) * 16,
      y: oy + row * cellH + cellH / 2 + (r() - 0.5) * 12,
    });
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < picks.length - 1; i++) {
    edges.push([i, i + 1]);
  }
  edges.push([0, picks.length - 1]);
  return (
    <g>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={picks[a].x}
          y1={picks[a].y}
          x2={picks[b].x}
          y2={picks[b].y}
          stroke={palette.primaryDim}
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      ))}
      {picks.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={7} fill="#0a0a0a" stroke={i === 0 ? palette.accent : palette.primary} strokeWidth="1.5" />
          <circle cx={n.x} cy={n.y} r="2" fill={i === 0 ? palette.accent : palette.primary} />
        </g>
      ))}
    </g>
  );
}

function CompSpiral({ palette, r }: CompProps) {
  // archimedean spiral as a series of dots, fixed center to stay in bounds
  const cx = 240;
  const cy = 130;
  const turns = 3 + r() * 1.5;
  const points = 60;
  const segments: JSX.Element[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const angle = t * Math.PI * 2 * turns;
    const radius = t * 78;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    segments.push(
      <circle
        key={i}
        cx={x}
        cy={y}
        r={1 + t * 1.8}
        fill={i % 8 === 0 ? palette.accent : palette.primary}
        opacity={0.4 + t * 0.6}
      />
    );
  }
  return <g>{segments}</g>;
}

function CompWaveStack({ palette, r }: CompProps) {
  // multiple stacked single-cycle waveforms — different shapes
  const shapes: ((t: number) => number)[] = [
    (t) => Math.sin(t * Math.PI * 2),
    (t) => 1 - 2 * t,
    (t) => (t < 0.5 ? -1 : 1),
    (t) => Math.sign(Math.sin(t * Math.PI * 4)) * 0.8,
    (t) => Math.abs(2 * t - 1) * 2 - 1,
  ];
  const palette2 = [palette.primary, palette.accent, palette.primary, palette.accent];
  const start = Math.floor(r() * shapes.length);
  return (
    <g>
      {[64, 112, 160, 208].map((y, i) => {
        const fn = shapes[(start + i) % shapes.length];
        const pts: string[] = [];
        for (let p = 0; p <= 80; p++) {
          const t = p / 80;
          const x = 60 + t * 360;
          pts.push(`${x.toFixed(1)},${(y + fn(t) * 22).toFixed(1)}`);
        }
        return (
          <path key={y} d={`M ${pts.join(" L ")}`} stroke={palette2[i]} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
        );
      })}
    </g>
  );
}

function CompDiagonalFlow({ palette, r }: CompProps) {
  // parallel diagonal lines, evenly spaced
  const count = 10;
  const yStart = 50;
  const yEnd = 210;
  const step = (yEnd - yStart) / (count - 1);
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const y = yStart + i * step;
        // length stays inside [60, 420]
        const w = 220 + r() * 140; // 220..360
        const x = 60 + r() * (360 - w);
        const accent = i % 3 === 0;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x + w}
            y2={y + 14}
            stroke={accent ? palette.accent : palette.primary}
            strokeWidth={accent ? 2.4 : 1.4}
            opacity={accent ? 1 : 0.6}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

function CompPulse({ palette, r }: CompProps) {
  // a heartbeat / square pulse train, fully bounded
  const yBase = 150;
  const pts: [number, number][] = [];
  let x = 40;
  while (x < 440) {
    const stepW = 14 + r() * 14; // 14..28
    const peakH = 30 + r() * 40; // 30..70
    const high = r() > 0.5;
    pts.push([x, yBase]);
    pts.push([x, yBase - (high ? peakH : 6)]);
    pts.push([x + stepW, yBase - (high ? peakH : 6)]);
    pts.push([x + stepW, yBase]);
    x += stepW + 6;
  }
  const d = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px},${py.toFixed(1)}`).join(" ");
  return (
    <g>
      <line x1="40" y1={yBase} x2="440" y2={yBase} stroke={palette.dim} strokeDasharray="2 4" strokeWidth="0.8" />
      <path d={d} stroke={palette.primary} strokeWidth="2" fill="none" strokeLinejoin="miter" />
    </g>
  );
}

function CompMatrix({ palette, r }: CompProps) {
  // matrix mixer / patchbay grid with deterministic, deduped connections
  const cols = 8;
  const rows = 5;
  const cw = 40;
  const ch = 30;
  const ox = 80;
  const oy = 50;
  const seen = new Set<string>();
  const connections: [number, number][] = [];
  while (connections.length < 8) {
    const row = Math.floor(r() * rows);
    const col = Math.floor(r() * cols);
    const key = `${row}-${col}`;
    if (seen.has(key)) continue;
    seen.add(key);
    connections.push([row, col]);
  }
  return (
    <g>
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={ox + col * cw + cw / 2}
            cy={oy + row * ch + ch / 2}
            r="2.5"
            fill="rgba(232, 234, 242, 0.18)"
          />
        ))
      )}
      {connections.map(([row, col], i) => (
        <circle
          key={i}
          cx={ox + col * cw + cw / 2}
          cy={oy + row * ch + ch / 2}
          r="6"
          fill={palette.primary}
          stroke={palette.accent}
          strokeWidth="1.5"
        />
      ))}
      {/* rails */}
      {Array.from({ length: rows }).map((_, row) => (
        <line
          key={`hr${row}`}
          x1={ox + cw / 2}
          y1={oy + row * ch + ch / 2}
          x2={ox + (cols - 1) * cw + cw / 2}
          y2={oy + row * ch + ch / 2}
          stroke={palette.primaryDim}
          strokeWidth="0.8"
          strokeDasharray="2 3"
        />
      ))}
    </g>
  );
}

const COMPOSITIONS: Record<CompName, (p: CompProps) => JSX.Element> = {
  sine: CompSine,
  bars: CompBars,
  concentric: CompConcentric,
  fpga: CompFpgaGrid,
  chip: CompChip,
  scope: CompScope,
  constellation: CompConstellation,
  spiral: CompSpiral,
  waveStack: CompWaveStack,
  diagonalFlow: CompDiagonalFlow,
  pulse: CompPulse,
  matrix: CompMatrix,
  phone: CompPhone,
  code: CompCode,
  chart: CompChart,
  log: CompLog,
  midi: CompMidi,
};

function CompMidi({ palette, r }: CompProps) {
  // 5-pin DIN socket on the left, piano roll on the right
  const cx = 92;
  const cy = 130;
  const dinR = 40;

  // 5-pin DIN layout (looking at the front of the female socket):
  //          2 (top, shield)
  //   4              5
  //     1        3
  // angles measured from straight up
  const pinAngles = [
    { a: -Math.PI / 2, dist: 0.55 }, // pin 2 — top
    { a: -Math.PI / 2 - Math.PI * 0.4, dist: 0.6 }, // pin 4
    { a: -Math.PI / 2 + Math.PI * 0.4, dist: 0.6 }, // pin 5
    { a: -Math.PI / 2 - Math.PI * 0.72, dist: 0.55 }, // pin 1
    { a: -Math.PI / 2 + Math.PI * 0.72, dist: 0.55 }, // pin 3
  ];

  // piano roll grid
  const rollX = 168;
  const rollY = 56;
  const rollW = 272;
  const rollH = 148;
  const lanes = 10;
  const laneH = rollH / lanes;

  // notes — at least one per row, varied widths and positions
  const notes: { lane: number; x: number; w: number; accent: boolean }[] = [];
  for (let lane = 0; lane < lanes; lane++) {
    const noteCount = 1 + Math.floor(r() * 3); // 1..3 notes per lane
    let cursor = rollX + 4;
    for (let n = 0; n < noteCount; n++) {
      const w = 14 + r() * 38;
      const gap = 6 + r() * 24;
      if (cursor + w > rollX + rollW - 4) break;
      notes.push({
        lane,
        x: cursor,
        w,
        accent: r() > 0.78,
      });
      cursor += w + gap;
    }
  }

  return (
    <g>
      {/* ─── DIN socket ─── */}
      {/* outer body */}
      <circle cx={cx} cy={cy} r={dinR + 4} fill="#0a0a0a" stroke={palette.primary} strokeWidth="1.4" />
      {/* inner socket */}
      <circle cx={cx} cy={cy} r={dinR} fill="#000000" stroke={palette.primaryDim} strokeWidth="0.8" />
      {/* alignment notch */}
      <rect x={cx - 4} y={cy + dinR - 4} width="8" height="6" rx="1" fill="#0a0a0a" stroke={palette.primaryDim} strokeWidth="0.6" />

      {/* 5 pins */}
      {pinAngles.map((p, i) => {
        const px = cx + Math.cos(p.a) * dinR * p.dist;
        const py = cy + Math.sin(p.a) * dinR * p.dist;
        return (
          <g key={i}>
            <circle cx={px} cy={py} r="4.5" fill="#0a0a0a" stroke={palette.primary} strokeWidth="0.8" />
            <circle cx={px} cy={py} r="2" fill={palette.accent} />
            <text
              x={px}
              y={py + 14}
              textAnchor="middle"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="7"
              fontWeight="600"
              fill="rgba(255, 255, 255, 0.32)"
            >
              {[2, 4, 5, 1, 3][i]}
            </text>
          </g>
        );
      })}

      {/* DIN label */}
      <text
        x={cx}
        y={cy + dinR + 28}
        textAnchor="middle"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontSize="9"
        fontWeight="600"
        fill={palette.primary}
        opacity="0.85"
        letterSpacing="0.06em"
      >
        DIN-5
      </text>

      {/* ─── Piano roll ─── */}
      {/* roll background frame */}
      <rect
        x={rollX}
        y={rollY}
        width={rollW}
        height={rollH}
        rx="3"
        fill="#000000"
        stroke={palette.primaryDim}
        strokeWidth="0.8"
      />
      {/* horizontal lane lines */}
      {Array.from({ length: lanes - 1 }).map((_, i) => (
        <line
          key={`l${i}`}
          x1={rollX}
          y1={rollY + (i + 1) * laneH}
          x2={rollX + rollW}
          y2={rollY + (i + 1) * laneH}
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
        />
      ))}
      {/* black-key shading every other lane (rough piano feel) */}
      {[1, 3, 6, 8, 10].map((i) =>
        i < lanes ? (
          <rect
            key={`bk${i}`}
            x={rollX}
            y={rollY + i * laneH}
            width={rollW}
            height={laneH}
            fill="rgba(255, 255, 255, 0.025)"
          />
        ) : null
      )}
      {/* vertical bar lines (4 bars) */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line
          key={`v${i}`}
          x1={rollX + t * rollW}
          y1={rollY}
          x2={rollX + t * rollW}
          y2={rollY + rollH}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
        />
      ))}
      {/* notes */}
      {notes.map((n, i) => (
        <rect
          key={i}
          x={n.x}
          y={rollY + n.lane * laneH + 2}
          width={n.w}
          height={laneH - 4}
          rx="1.5"
          fill={n.accent ? palette.accent : palette.primary}
          opacity={n.accent ? 0.95 : 0.7}
        />
      ))}
      {/* playhead — vertical orange line */}
      <line
        x1={rollX + rollW * 0.42}
        y1={rollY - 2}
        x2={rollX + rollW * 0.42}
        y2={rollY + rollH + 2}
        stroke={palette.accent}
        strokeWidth="1.4"
      />
    </g>
  );
}

function CompCode({ palette, r }: CompProps) {
  // Stylised code editor — line numbers + 8 lines of varying indent and tokens
  const yStart = 56;
  const lineH = 22;
  const lineCount = 8;
  const gutterX = 60;

  // token colour vocabulary
  const KW = palette.accent;
  const ID = palette.primary;
  const STR = "rgba(255, 255, 255, 0.55)";
  const PUNCT = "rgba(255, 255, 255, 0.32)";
  const COMMENT = palette.primary;

  // a "language" of token sequences indexed by line type
  const lineTypes = [
    // function declaration
    () => [
      { w: 22, c: KW },
      { w: 6, c: PUNCT },
      { w: 38 + r() * 18, c: ID },
      { w: 6, c: PUNCT },
      { w: 16 + r() * 12, c: ID },
      { w: 6, c: PUNCT },
    ],
    // assignment
    () => [
      { w: 16, c: KW },
      { w: 30 + r() * 14, c: ID },
      { w: 8, c: PUNCT },
      { w: 40 + r() * 30, c: r() > 0.5 ? STR : ID },
      { w: 4, c: PUNCT },
    ],
    // function call
    () => [
      { w: 36 + r() * 20, c: ID },
      { w: 6, c: PUNCT },
      { w: 24 + r() * 18, c: ID },
      { w: 4, c: PUNCT },
      { w: 4, c: PUNCT },
    ],
    // return / control
    () => [
      { w: 22 + r() * 8, c: KW },
      { w: 36 + r() * 24, c: ID },
      { w: 4, c: PUNCT },
    ],
    // comment
    () => [
      { w: 6, c: COMMENT },
      { w: 60 + r() * 80, c: COMMENT, opacity: 0.5 },
    ],
    // import / using
    () => [
      { w: 28, c: KW },
      { w: 60 + r() * 30, c: STR },
      { w: 4, c: PUNCT },
    ],
  ];

  // each line: indent level + which line type
  const lineDefs = Array.from({ length: lineCount }).map((_, i) => {
    let indent = 0;
    if (i === 0) indent = 0;
    else if (i === lineCount - 1) indent = 0;
    else indent = Math.floor(r() * 3); // 0..2

    const typeIdx = i === 0 ? 0 : Math.floor(r() * lineTypes.length);
    return { indent, tokens: lineTypes[typeIdx]!() };
  });

  return (
    <g>
      {/* gutter */}
      <line
        x1={gutterX}
        y1="44"
        x2={gutterX}
        y2={yStart + lineCount * lineH - 8}
        stroke={palette.primaryDim}
        strokeWidth="0.8"
      />

      {lineDefs.map((ld, i) => {
        const baseX = gutterX + 14 + ld.indent * 14;
        const y = yStart + i * lineH;
        let cursor = baseX;
        // safety: total width budget
        const maxX = 440;
        return (
          <g key={i}>
            <text
              x={gutterX - 6}
              y={y + 4}
              textAnchor="end"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="9"
              fontWeight="500"
              fill="rgba(255, 255, 255, 0.22)"
            >
              {i + 1}
            </text>
            {ld.tokens.map((t, j) => {
              if (cursor + t.w > maxX) return null;
              const rect = (
                <rect
                  key={j}
                  x={cursor}
                  y={y - 5}
                  width={t.w}
                  height="6"
                  rx="1.5"
                  fill={t.c}
                  opacity={(t as { opacity?: number }).opacity ?? 0.85}
                />
              );
              cursor += t.w + 6;
              return rect;
            })}
          </g>
        );
      })}

      {/* caret on the last visible line */}
      <rect
        x={gutterX + 14}
        y={yStart + (lineCount - 1) * lineH - 6}
        width="2"
        height="9"
        fill={palette.accent}
      />
    </g>
  );
}

function CompChart({ palette, r }: CompProps) {
  // line chart / time-series — 2 lines on a grid with axis ticks
  const x0 = 60;
  const y0 = 60;
  const w = 360;
  const h = 150;

  // generate two smooth-ish series, deterministic from rng
  const series = (offset: number, points: number, amplitude: number) => {
    const pts: [number, number][] = [];
    let lastY = y0 + h / 2;
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      const target =
        y0 +
        h / 2 +
        Math.sin(t * Math.PI * 2 + offset) * amplitude * 0.4 +
        (r() - 0.5) * amplitude;
      lastY = lastY * 0.4 + target * 0.6;
      pts.push([x0 + t * w, lastY]);
    }
    return pts;
  };

  const a = series(r() * 6, 28, h * 0.4);
  const b = series(r() * 6 + 1.5, 28, h * 0.35);

  const toPath = (pts: [number, number][]) =>
    pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  // area under series A
  const areaA = `${toPath(a)} L ${x0 + w},${y0 + h} L ${x0},${y0 + h} Z`;

  return (
    <g>
      {/* horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={x0}
          y1={y0 + t * h}
          x2={x0 + w}
          y2={y0 + t * h}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
        />
      ))}
      {/* y-axis */}
      <line x1={x0} y1={y0} x2={x0} y2={y0 + h} stroke={palette.primaryDim} strokeWidth="0.8" />
      {/* axis labels */}
      {[0, 0.5, 1].map((t, i) => (
        <text
          key={`yl${i}`}
          x={x0 - 6}
          y={y0 + (1 - t) * h + 3}
          textAnchor="end"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontSize="8"
          fontWeight="500"
          fill="rgba(255, 255, 255, 0.32)"
        >
          {Math.round(t * 100)}
        </text>
      ))}
      {/* area under primary line */}
      <path d={areaA} fill={palette.primaryDim} opacity="0.5" />
      {/* secondary line */}
      <path d={toPath(b)} stroke={palette.primary} strokeWidth="1.4" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.55" />
      {/* primary line */}
      <path d={toPath(a)} stroke={palette.accent} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* data points on primary */}
      {a.filter((_, i) => i % 4 === 0).map(([x, y], i) => (
        <circle key={`p${i}`} cx={x} cy={y} r="2" fill={palette.accent} />
      ))}
    </g>
  );
}

function CompLog({ palette, r }: CompProps) {
  // log lines: timestamp + level chip + message
  const yStart = 60;
  const lineH = 18;
  const lineCount = 9;

  const LEVELS = [
    { label: "INF", color: palette.primary, opacity: 0.5 },
    { label: "WRN", color: palette.accent, opacity: 0.85 },
    { label: "ERR", color: palette.accent, opacity: 1 },
    { label: "DBG", color: "rgba(255, 255, 255, 0.4)", opacity: 0.7 },
  ];

  const lines = Array.from({ length: lineCount }).map((_, i) => {
    const lvl = LEVELS[Math.floor(r() * LEVELS.length)]!;
    return {
      ts: `${(i + 9).toString().padStart(2, "0")}:${Math.floor(r() * 60).toString().padStart(2, "0")}:${Math.floor(r() * 60).toString().padStart(2, "0")}`,
      level: lvl,
      msgWidth: 80 + r() * 180,
    };
  });

  return (
    <g>
      {lines.map((line, i) => {
        const y = yStart + i * lineH;
        return (
          <g key={i}>
            {/* timestamp */}
            <text
              x={56}
              y={y + 4}
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="9"
              fontWeight="500"
              fill="rgba(255, 255, 255, 0.32)"
              letterSpacing="0.04em"
            >
              {line.ts}
            </text>
            {/* level chip */}
            <rect
              x={108}
              y={y - 6}
              width="22"
              height="11"
              rx="2"
              fill="none"
              stroke={line.level.color}
              strokeWidth="0.8"
              opacity={line.level.opacity}
            />
            <text
              x={119}
              y={y + 2}
              textAnchor="middle"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="8"
              fontWeight="700"
              fill={line.level.color}
              opacity={line.level.opacity}
              letterSpacing="0.06em"
            >
              {line.level.label}
            </text>
            {/* message rectangle */}
            <rect
              x={138}
              y={y - 4}
              width={line.msgWidth}
              height="6"
              rx="1.5"
              fill={line.level.color}
              opacity={line.level.opacity * 0.6}
            />
          </g>
        );
      })}
    </g>
  );
}

function CompPhone({ palette, r }: CompProps) {
  // a stylised phone with a screen showing app UI elements
  const tilt = (r() - 0.5) * 8; // -4..4 deg
  // device geometry
  const w = 124;
  const h = 220;
  const cx = 240;
  const cy = 142;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return (
    <g transform={`rotate(${tilt.toFixed(1)} ${cx} ${cy})`}>
      {/* outer body */}
      <rect
        x={x - 2}
        y={y - 2}
        width={w + 4}
        height={h + 4}
        rx="22"
        fill="#0a0a0a"
        stroke={palette.primary}
        strokeWidth="1.4"
      />
      {/* inner bezel */}
      <rect
        x={x + 4}
        y={y + 4}
        width={w - 8}
        height={h - 8}
        rx="18"
        fill="#000000"
        stroke={palette.primaryDim}
        strokeWidth="0.8"
      />
      {/* notch */}
      <rect x={cx - 18} y={y + 6} width="36" height="6" rx="3" fill="#0a0a0a" />
      {/* status bar */}
      <rect x={x + 12} y={y + 18} width="20" height="3" rx="1.5" fill={palette.primary} opacity="0.6" />
      <circle cx={x + w - 18} cy={y + 19.5} r="2" fill={palette.accent} />
      {/* big "now playing" hero card */}
      <rect
        x={x + 12}
        y={y + 30}
        width={w - 24}
        height="50"
        rx="6"
        fill={palette.primaryDim}
        stroke={palette.primary}
        strokeWidth="0.8"
      />
      <circle cx={x + 26} cy={y + 55} r="9" fill={palette.accent} opacity="0.85" />
      <rect x={x + 40} y={y + 47} width="48" height="3" rx="1.5" fill={palette.primary} opacity="0.9" />
      <rect x={x + 40} y={y + 56} width="34" height="2" rx="1" fill={palette.primary} opacity="0.55" />
      {/* list rows */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect
            x={x + 12}
            y={y + 92 + i * 22}
            width="14"
            height="14"
            rx="2"
            fill={palette.primary}
            opacity={0.18 + i * 0.04}
          />
          <rect
            x={x + 32}
            y={y + 96 + i * 22}
            width={70 - i * 6}
            height="2.5"
            rx="1.25"
            fill={palette.primary}
            opacity="0.7"
          />
          <rect
            x={x + 32}
            y={y + 102 + i * 22}
            width={50 - i * 4}
            height="2"
            rx="1"
            fill={palette.primary}
            opacity="0.4"
          />
        </g>
      ))}
      {/* bottom transport bar */}
      <rect
        x={x + 12}
        y={y + h - 30}
        width={w - 24}
        height="18"
        rx="9"
        fill="#0a0a0a"
        stroke={palette.primaryDim}
        strokeWidth="0.8"
      />
      <circle cx={cx} cy={y + h - 21} r="5" fill={palette.accent} />
      <polygon
        points={`${cx - 1.5},${y + h - 23.5} ${cx + 2},${y + h - 21} ${cx - 1.5},${y + h - 18.5}`}
        fill="#0a0a0a"
      />
      <circle cx={cx - 22} cy={y + h - 21} r="2.5" fill={palette.primary} opacity="0.6" />
      <circle cx={cx + 22} cy={y + h - 21} r="2.5" fill={palette.primary} opacity="0.6" />
      {/* home indicator */}
      <rect x={cx - 18} y={y + h - 9} width="36" height="2" rx="1" fill={palette.primary} opacity="0.4" />
    </g>
  );
}
