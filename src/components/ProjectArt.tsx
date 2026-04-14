import type { ArtType, Category } from "../types";
import { ProceduralArt } from "./ProceduralArt";

interface Props {
  type: ArtType;
  slug?: string;
  category?: Category;
  language?: string;
  topics?: string[];
  className?: string;
}

/**
 * Hand-tuned SVG illustrations for projects without screenshots.
 * Each one tries to evoke the project domain (chip, optical, FPGA, etc.)
 * while staying coherent with the site's cyan/amber palette.
 */
export function ProjectArt({ type, slug, category, language, topics, className }: Props) {
  if (type === "auto") {
    return (
      <ProceduralArt
        slug={slug ?? "default"}
        category={category}
        language={language}
        topics={topics}
        className={className}
      />
    );
  }
  switch (type) {
    case "chip":
      return <ChipArt className={className} />;
    case "fpga":
      return <FpgaArt className={className} />;
    case "optical":
      return <OpticalArt className={className} />;
    case "clock":
      return <ClockArt className={className} />;
    case "bus":
      return <BusArt className={className} />;
    case "network":
      return <NetworkArt className={className} />;
    case "terminal":
      return <TerminalArt className={className} />;
    case "scope":
      return <ScopeArt className={className} />;
    case "tdm":
      return <TdmArt className={className} />;
    case "eurorack":
      return <EurorackArt className={className} />;
    case "wavetable":
      return <WavetableArt className={className} />;
    case "location":
      return <LocationArt className={className} />;
    case "midi":
      return <MidiArt className={className} />;
    case "visual":
      return <VisualArt className={className} />;
    case "logo":
      return <LogoArt className={className} />;
  }
}

const accent = "#1e3a5f";
const accentDim = "rgba(30, 58, 95, 0.28)";
const amber = "#9c5a20"; // warm accent secondary
const grid = "rgba(20, 26, 44, 0.05)";
const stroke = "rgba(20, 26, 44, 0.18)";

function Frame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 480 280"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a0a0a" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={grid} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="480" height="280" fill="url(#bg)" />
      <rect width="480" height="280" fill="url(#grid)" />
      {children}
    </svg>
  );
}

function ChipArt({ className }: { className?: string }) {
  // top-down IC with pins, traces, decoupling cap
  return (
    <Frame className={className}>
      {/* PCB traces */}
      <path
        d="M 40 140 H 160 M 320 140 H 440 M 240 40 V 80 M 240 200 V 240"
        stroke={accentDim}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 60 80 H 160 M 60 200 H 160 M 320 80 H 420 M 320 200 H 420"
        stroke={accentDim}
        strokeWidth="1.5"
        fill="none"
      />
      {/* package */}
      <rect x="160" y="80" width="160" height="120" rx="6" fill="#0d0d0d" stroke={accent} strokeWidth="1.5" />
      {/* pin 1 dot */}
      <circle cx="170" cy="90" r="3" fill={amber} />
      {/* pins left */}
      {[100, 120, 140, 160, 180].map((y, i) => (
        <rect key={`l${i}`} x="148" y={y - 4} width="14" height="6" fill={accent} opacity="0.7" />
      ))}
      {[100, 120, 140, 160, 180].map((y, i) => (
        <rect key={`r${i}`} x="318" y={y - 4} width="14" height="6" fill={accent} opacity="0.7" />
      ))}
      {/* etched die marks */}
      <text x="240" y="140" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="14" fill={accent}>
        ESP32-P4
      </text>
      <text x="240" y="160" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fill={accentDim}>
        N16R32
      </text>
      {/* decoupling caps */}
      <rect x="80" y="60" width="14" height="8" fill={amber} opacity="0.85" />
      <rect x="386" y="212" width="14" height="8" fill={amber} opacity="0.85" />
    </Frame>
  );
}

function FpgaArt({ className }: { className?: string }) {
  // grid of LUTs with routing
  const cells: JSX.Element[] = [];
  const cols = 8;
  const rows = 5;
  const cellW = 36;
  const cellH = 32;
  const ox = 96;
  const oy = 56;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * cellW;
      const y = oy + r * cellH;
      const hot = (r + c) % 5 === 0;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={x}
          y={y}
          width={cellW - 6}
          height={cellH - 6}
          rx="2"
          fill={hot ? "rgba(94, 234, 212, 0.2)" : "rgba(94, 234, 212, 0.05)"}
          stroke={hot ? accent : stroke}
          strokeWidth="1"
        />
      );
    }
  }
  // routing tracks
  const tracks: JSX.Element[] = [];
  for (let r = 0; r < rows; r++) {
    tracks.push(
      <line
        key={`th${r}`}
        x1={ox - 8}
        y1={oy + r * cellH + (cellH - 6) / 2}
        x2={ox + cols * cellW - 6}
        y2={oy + r * cellH + (cellH - 6) / 2}
        stroke={accentDim}
        strokeWidth="0.8"
        strokeDasharray="2 4"
      />
    );
  }
  for (let c = 0; c < cols; c++) {
    tracks.push(
      <line
        key={`tv${c}`}
        x1={ox + c * cellW + (cellW - 6) / 2}
        y1={oy - 8}
        x2={ox + c * cellW + (cellW - 6) / 2}
        y2={oy + rows * cellH - 6}
        stroke={accentDim}
        strokeWidth="0.8"
        strokeDasharray="2 4"
      />
    );
  }
  return (
    <Frame className={className}>
      {tracks}
      {cells}
      <text x="240" y="244" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={accent}>
        Lattice ECP5 · LFE5U-45F
      </text>
    </Frame>
  );
}

function OpticalArt({ className }: { className?: string }) {
  // TOSLINK-style modules with a glowing fiber between them
  return (
    <Frame className={className}>
      {/* TX module */}
      <rect x="60" y="100" width="80" height="80" rx="6" fill="#0d0d0d" stroke={accent} strokeWidth="1.5" />
      <circle cx="140" cy="140" r="14" fill="#000000" stroke={amber} strokeWidth="2" />
      <circle cx="140" cy="140" r="6" fill={amber} />
      <text x="100" y="92" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fill={accentDim}>
        TOTX173
      </text>
      {/* RX module */}
      <rect x="340" y="100" width="80" height="80" rx="6" fill="#0d0d0d" stroke={accent} strokeWidth="1.5" />
      <circle cx="340" cy="140" r="14" fill="#000000" stroke={accent} strokeWidth="2" />
      <circle cx="340" cy="140" r="6" fill={accent} />
      <text x="380" y="92" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fill={accentDim}>
        TORX173
      </text>
      {/* fiber with photons */}
      <line x1="154" y1="140" x2="326" y2="140" stroke={amber} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="154" y1="140" x2="326" y2="140" stroke={amber} strokeWidth="1" strokeLinecap="round" />
      {[180, 210, 240, 270, 300].map((x) => (
        <circle key={x} cx={x} cy="140" r="3" fill={amber} />
      ))}
      {/* ADAT framing pattern under the fiber */}
      <text x="240" y="200" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accent}>
        1 0 1 1 0 1 1 1 0 1 1 0 0 1 0 1
      </text>
      <text x="240" y="220" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fill={accentDim}>
        ADAT · 8ch · 24bit · 48kHz · NRZI
      </text>
    </Frame>
  );
}

function ClockArt({ className }: { className?: string }) {
  // sine + square waveforms with PLL feedback ring
  const sine = (() => {
    const pts: string[] = [];
    for (let x = 40; x <= 440; x += 4) {
      const t = (x - 40) / 400;
      const y = 100 + Math.sin(t * Math.PI * 6) * 28;
      pts.push(`${x},${y.toFixed(1)}`);
    }
    return `M ${pts.join(" L ")}`;
  })();
  const square = (() => {
    const pts: string[] = [];
    let level = 0;
    for (let i = 0; i <= 24; i++) {
      const x = 40 + i * (400 / 24);
      const y = level === 0 ? 200 : 160;
      pts.push(`${x},${y}`);
      const x2 = 40 + (i + 0.5) * (400 / 24);
      pts.push(`${x2},${y}`);
      level = level === 0 ? 1 : 0;
      const y2 = level === 0 ? 200 : 160;
      pts.push(`${x2},${y2}`);
    }
    return `M ${pts.join(" L ")}`;
  })();
  return (
    <Frame className={className}>
      <path d={sine} stroke={accent} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={square} stroke={amber} strokeWidth="2" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
      <text x="40" y="64" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={accent}>
        12.288 MHz
      </text>
      <text x="40" y="240" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={amber}>
        BCLK · 1.024 MHz
      </text>
      <text x="368" y="64" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accentDim}>
        ±1 ppm
      </text>
    </Frame>
  );
}

function BusArt({ className }: { className?: string }) {
  // daisy-chain of nodes connected by a single twisted-pair line
  const nodes = [
    { x: 70, label: "MASTER" },
    { x: 175, label: "NODE 1" },
    { x: 280, label: "NODE 2" },
    { x: 385, label: "NODE 3" },
  ];
  return (
    <Frame className={className}>
      {/* twisted pair (two intertwined sine paths) */}
      {nodes.slice(0, -1).map((n, i) => {
        const start = n.x + 40;
        const end = nodes[i + 1].x;
        const segs: { d: string; color: string }[] = [];
        const buildSine = (offset: number, color: string) => {
          const pts: string[] = [];
          const samples = 18;
          for (let s = 0; s <= samples; s++) {
            const t = s / samples;
            const x = start + (end - start) * t;
            const y = 140 + Math.sin(t * Math.PI * 4 + offset) * 5;
            pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
          }
          segs.push({ d: `M ${pts.join(" L ")}`, color });
        };
        buildSine(0, accent);
        buildSine(Math.PI, accentDim);
        return (
          <g key={i}>
            {segs.map((s, j) => (
              <path key={j} d={s.d} stroke={s.color} strokeWidth="1.5" fill="none" />
            ))}
          </g>
        );
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x} y="116" width="40" height="48" rx="4" fill="#0d0d0d" stroke={accent} strokeWidth="1.2" />
          <circle cx={n.x + 8} cy="124" r="2" fill={amber} />
          <text
            x={n.x + 20}
            y="146"
            textAnchor="middle"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontSize="8"
            fill={accent}
          >
            {n.label}
          </text>
        </g>
      ))}
      <text x="240" y="80" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={accent}>
        98.3 Mbps · 8b10b · half-duplex
      </text>
      <text x="240" y="208" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accentDim}>
        single Cat5 pair · 25 ch / dir @ 48kHz
      </text>
    </Frame>
  );
}

function NetworkArt({ className }: { className?: string }) {
  // packets travelling between two endpoints with a PTP timestamp box
  return (
    <Frame className={className}>
      {/* endpoints */}
      <rect x="40" y="110" width="80" height="60" rx="4" fill="#0d0d0d" stroke={accent} strokeWidth="1.5" />
      <text x="80" y="146" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={accent}>
        ESP32-P4
      </text>
      <rect x="360" y="110" width="80" height="60" rx="4" fill="#0d0d0d" stroke={accent} strokeWidth="1.5" />
      <text x="400" y="146" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={accent}>
        DAW / GM
      </text>
      {/* link */}
      <line x1="120" y1="140" x2="360" y2="140" stroke={accentDim} strokeWidth="1.5" strokeDasharray="2 4" />
      {/* packets */}
      {[160, 200, 240, 280, 320].map((x, i) => (
        <rect
          key={x}
          x={x}
          y={i % 2 === 0 ? 120 : 152}
          width="14"
          height="10"
          rx="1.5"
          fill={i === 2 ? amber : accent}
          opacity={0.8}
        />
      ))}
      <text x="240" y="80" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={accent}>
        AES67 · L24 · ptime 0.125 ms
      </text>
      <text x="240" y="208" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accentDim}>
        IEEE 1588 PTP · t1 t2 t3 t4 · ~0.7 ms e2e
      </text>
    </Frame>
  );
}

function TerminalArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="60" y="48" width="360" height="184" rx="8" fill="#000000" stroke={accent} strokeWidth="1.2" />
      <rect x="60" y="48" width="360" height="22" rx="8" fill="#0d0d0d" />
      <circle cx="76" cy="59" r="4" fill="#ff6259" />
      <circle cx="90" cy="59" r="4" fill={amber} />
      <circle cx="104" cy="59" r="4" fill={accent} />
      <text x="220" y="62" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fill={accentDim}>
        filter.vult — Vult LSP
      </text>
      {[
        { y: 90, t: "fun", k: " process", v: "(input, cutoff) {", color: accent },
        { y: 108, t: "  mem", k: " state;", v: "", color: amber },
        { y: 126, t: "  state", k: " = state +", v: " (input - state) * cutoff;", color: "#e8eaf2" },
        { y: 144, t: "  return", k: " state", v: ";", color: accent },
        { y: 162, t: "}", k: "", v: "", color: "#e8eaf2" },
      ].map((line, i) => (
        <text key={i} x="80" y={line.y} fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11">
          <tspan fill={line.color}>{line.t}</tspan>
          <tspan fill="#e8eaf2">{line.k}</tspan>
          <tspan fill="#8a94a8">{line.v}</tspan>
        </text>
      ))}
      <rect x="80" y="186" width="6" height="14" fill={accent} />
      <text x="92" y="198" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accentDim}>
        ~ go-to-def · hover · F2 rename
      </text>
    </Frame>
  );
}

function ScopeArt({ className }: { className?: string }) {
  // logic analyzer traces
  const trace = (y: number, pattern: number[], color: string) => {
    const pts: string[] = [];
    let level = pattern[0];
    pts.push(`60,${y - level * 14}`);
    for (let i = 1; i < pattern.length; i++) {
      const x = 60 + i * 22;
      const yLevel = y - level * 14;
      pts.push(`${x},${yLevel}`);
      level = pattern[i];
      pts.push(`${x},${y - level * 14}`);
    }
    pts.push(`${60 + pattern.length * 22},${y - level * 14}`);
    return <path d={`M ${pts.join(" L ")}`} stroke={color} strokeWidth="1.6" fill="none" strokeLinejoin="miter" />;
  };
  return (
    <Frame className={className}>
      {trace(80, [0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1], accent)}
      {trace(130, [1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0], amber)}
      {trace(180, [0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1], accent)}
      {trace(230, [1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0], amber)}
      {["SDA", "SCL", "MOSI", "SCK"].map((label, i) => (
        <text key={label} x="48" y={86 + i * 50} textAnchor="end" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accentDim}>
          {label}
        </text>
      ))}
    </Frame>
  );
}

function TdmArt({ className }: { className?: string }) {
  // stacked time slots
  const slots = 8;
  const slotW = 40;
  const ox = 80;
  return (
    <Frame className={className}>
      {Array.from({ length: slots }).map((_, i) => (
        <g key={i}>
          <rect
            x={ox + i * slotW}
            y="100"
            width={slotW - 4}
            height="80"
            fill={i % 2 === 0 ? "rgba(94, 234, 212, 0.18)" : "rgba(255, 185, 92, 0.16)"}
            stroke={i % 2 === 0 ? accent : amber}
            strokeWidth="1"
          />
          <text
            x={ox + i * slotW + (slotW - 4) / 2}
            y="146"
            textAnchor="middle"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontSize="11"
            fill="#e8eaf2"
          >
            CH {i}
          </text>
        </g>
      ))}
      {/* LRCLK arrow */}
      <line x1="80" y1="200" x2="396" y2="200" stroke={accentDim} strokeWidth="1" strokeDasharray="2 3" />
      <text x="240" y="80" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={accent}>
        TDM-8 · 32-bit slot · 48 kHz
      </text>
      <text x="240" y="220" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accentDim}>
        LRCLK 48 kHz · BCLK 12.288 MHz
      </text>
    </Frame>
  );
}

function EurorackArt({ className }: { className?: string }) {
  // Eurorack-style front panel: knobs, jacks, an OLED
  return (
    <Frame className={className}>
      {/* panel */}
      <rect x="120" y="32" width="240" height="216" rx="6" fill="#0c1221" stroke={accent} strokeWidth="1.4" />
      {/* mounting screws */}
      {[
        [128, 40],
        [352, 40],
        [128, 240],
        [352, 240],
      ].map(([x, y]) => (
        <circle key={`s${x}-${y}`} cx={x} cy={y} r="3" fill="#1f2638" stroke={accentDim} strokeWidth="0.8" />
      ))}
      {/* OLED */}
      <rect x="146" y="56" width="188" height="34" rx="2" fill="#000510" stroke={accent} strokeWidth="0.8" />
      <text x="240" y="78" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={accent}>
        OSC ▸ SAW · 220 Hz
      </text>
      {/* knobs row */}
      {[170, 215, 260, 305].map((x, i) => (
        <g key={`k${x}`}>
          <circle cx={x} cy="120" r="14" fill="#0d0d0d" stroke={accent} strokeWidth="1.2" />
          <line
            x1={x}
            y1="120"
            x2={x + Math.cos((-2.4 + i * 0.6) * Math.PI) * 10}
            y2={120 + Math.sin((-2.4 + i * 0.6) * Math.PI) * 10}
            stroke={amber}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* sliders */}
      <line x1="170" y1="148" x2="170" y2="180" stroke={accentDim} strokeWidth="2" />
      <line x1="215" y1="148" x2="215" y2="180" stroke={accentDim} strokeWidth="2" />
      <rect x="166" y="160" width="8" height="6" fill={accent} />
      <rect x="211" y="170" width="8" height="6" fill={accent} />
      {/* CV jacks */}
      {[170, 215, 260, 305].map((x) => (
        <g key={`j${x}`}>
          <circle cx={x} cy="206" r="9" fill="#000000" stroke={accent} strokeWidth="1" />
          <circle cx={x} cy="206" r="3" fill={amber} />
        </g>
      ))}
      <text x="240" y="232" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fill={accentDim}>
        CV1   CV2   CV3   OUT
      </text>
    </Frame>
  );
}

function WavetableArt({ className }: { className?: string }) {
  // multiple stacked single-cycle waveforms — sine, saw, square, pulse
  const cycle = (yBase: number, fn: (t: number) => number, color: string) => {
    const pts: string[] = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const x = 60 + t * 360;
      const y = yBase + fn(t) * 22;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return <path d={`M ${pts.join(" L ")}`} stroke={color} strokeWidth="1.6" fill="none" strokeLinejoin="round" />;
  };
  return (
    <Frame className={className}>
      {cycle(64, (t) => Math.sin(t * Math.PI * 2), accent)}
      {cycle(112, (t) => 1 - 2 * t, amber)}
      {cycle(160, (t) => (t < 0.5 ? -1 : 1), accent)}
      {cycle(208, (t) => Math.sign(Math.sin(t * Math.PI * 4)) * 0.85, amber)}
      <text x="240" y="248" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accentDim}>
        single-cycle waveforms · 256+1 samples · int16
      </text>
    </Frame>
  );
}

function LocationArt({ className }: { className?: string }) {
  // a chip emitting concentric "ping" waves with an x marker
  return (
    <Frame className={className}>
      {/* concentric pings */}
      {[30, 60, 92, 126].map((r, i) => (
        <circle
          key={r}
          cx="160"
          cy="148"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="1"
          opacity={0.7 - i * 0.15}
          strokeDasharray="2 4"
        />
      ))}
      {/* tiny ESP module */}
      <rect x="146" y="134" width="28" height="28" rx="2" fill="#0d0d0d" stroke={accent} strokeWidth="1.2" />
      <text x="160" y="153" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="8" fill={accent}>
        ESP
      </text>
      {/* known location markers */}
      {[
        { x: 320, y: 80, label: "AP1" },
        { x: 380, y: 150, label: "AP2" },
        { x: 340, y: 210, label: "AP3" },
      ].map((m) => (
        <g key={m.label}>
          <line x1="160" y1="148" x2={m.x} y2={m.y} stroke={accentDim} strokeWidth="0.8" strokeDasharray="2 3" />
          <circle cx={m.x} cy={m.y} r="6" fill={amber} />
          <text x={m.x + 12} y={m.y + 4} fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fill={amber}>
            {m.label}
          </text>
        </g>
      ))}
      <text x="240" y="248" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accentDim}>
        WiFi RSSI fingerprint · Find3 indoor positioning
      </text>
    </Frame>
  );
}

function MidiArt({ className }: { className?: string }) {
  // 5-pin DIN MIDI socket + a piano roll pattern
  const notes = [
    [80, 180, 16],
    [110, 160, 14],
    [140, 170, 18],
    [170, 150, 12],
    [200, 165, 16],
    [230, 145, 20],
    [260, 175, 12],
    [290, 155, 16],
    [320, 165, 14],
  ];
  return (
    <Frame className={className}>
      {/* DIN socket */}
      <circle cx="380" cy="140" r="42" fill="#0a0a0a" stroke={accent} strokeWidth="1.6" />
      <circle cx="380" cy="140" r="32" fill="none" stroke={accentDim} strokeWidth="1" />
      {[
        [380, 110],
        [410, 130],
        [400, 165],
        [360, 165],
        [350, 130],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={amber} />
      ))}
      {/* note grid */}
      {notes.map(([x, y, w], i) => (
        <rect key={`n${i}`} x={x} y={y} width={w} height="6" rx="1" fill={i % 3 === 0 ? amber : accent} />
      ))}
      <line x1="60" y1="200" x2="340" y2="200" stroke={accentDim} strokeWidth="0.8" />
      <text x="200" y="80" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fill={accent} fontWeight="600">
        MIDI · 31.25 kbit/s
      </text>
      <text x="200" y="222" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fill={accentDim}>
        note on · note off · sysex · clock
      </text>
    </Frame>
  );
}

function VisualArt({ className }: { className?: string }) {
  // overlapping geometric shapes — VJ aesthetic
  return (
    <Frame className={className}>
      <circle cx="180" cy="140" r="60" fill="rgba(255, 107, 53, 0.18)" stroke={accent} strokeWidth="1.4" />
      <rect x="220" y="80" width="120" height="120" fill="rgba(255, 133, 81, 0.12)" stroke={amber} strokeWidth="1.4" transform="rotate(15 280 140)" />
      <polygon points="120,200 200,80 280,200" fill="none" stroke={accent} strokeWidth="1.4" opacity="0.8" />
      {/* particles */}
      {[
        [80, 80],
        [120, 60],
        [400, 90],
        [420, 200],
        [60, 220],
        [340, 50],
        [380, 240],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 3 : 2} fill={i % 2 === 0 ? accent : amber} />
      ))}
      <text x="240" y="252" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fill={accentDim}>
        WebMIDI · Three.js · live VJ visuals
      </text>
    </Frame>
  );
}

function LogoArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <text x="240" y="160" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="44" fill={accent} fontWeight="800">
        syso
      </text>
    </Frame>
  );
}
