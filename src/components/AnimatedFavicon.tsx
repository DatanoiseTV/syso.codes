import { useEffect } from "react";

/**
 * High-visibility animated favicon.
 *
 * Trick: draw a 32×32 @2x canvas and pipe toDataURL() into a <link
 * rel="icon">. Every 80 ms (~12.5 fps) we repaint with a new phase so
 * the tab icon animates live.
 *
 * Design goals (after v1 was too subtle in a crowded tab bar):
 * - Solid bright orange background — most favicons in the wild are
 *   dark/blue/grey, so a warm orange square is easy to pick out in
 *   peripheral vision.
 * - Thick black waveform (3.5 px) with big amplitude — readable even
 *   when the OS scales the icon down to 16 px.
 * - Bright white playhead dot that travels along the waveform so the
 *   motion is focal, not incidental.
 * - Subtle "heartbeat" brightness pulse on the whole square every
 *   couple of seconds to pull the eye back.
 * - prefers-reduced-motion: paints one static frame and never starts
 *   the interval.
 */
export function AnimatedFavicon() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const SIZE = 32;
    const DPR = 2; // render at 2× for crisp retina
    canvas.width = SIZE * DPR;
    canvas.height = SIZE * DPR;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(DPR, DPR);

    // Inject a dedicated PNG favicon link — leave the SVG fallback in place
    let link =
      document.querySelector<HTMLLinkElement>(
        'link[rel~="icon"][data-animated="1"]'
      ) ?? null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.dataset.animated = "1";
      document.head.appendChild(link);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phase = 0;

    function draw() {
      ctx!.clearRect(0, 0, SIZE, SIZE);

      // Heartbeat: 0.88 → 1.08 brightness multiplier, slow pulse
      const beat = 0.98 + Math.sin(phase * 0.22) * 0.06;

      // Bold orange gradient background, rounded square filling whole canvas
      const bg = ctx!.createLinearGradient(0, 0, SIZE, SIZE);
      bg.addColorStop(0, shade("#ff6b35", beat));
      bg.addColorStop(1, shade("#ffa476", beat + 0.04));
      ctx!.fillStyle = bg;
      roundRect(ctx!, 0, 0, SIZE, SIZE, 7);
      ctx!.fill();

      // Inner glow ring on the edge for a touch of depth
      ctx!.strokeStyle = "rgba(0, 0, 0, 0.28)";
      ctx!.lineWidth = 1;
      roundRect(ctx!, 0.5, 0.5, SIZE - 1, SIZE - 1, 7);
      ctx!.stroke();

      // Compute the waveform points (sine with phase drift)
      const pts: Array<[number, number]> = [];
      const left = 4;
      const right = 28;
      const mid = 16;
      for (let x = left; x <= right; x += 0.4) {
        const t = (x - left) / (right - left);
        const y = mid + Math.sin(t * Math.PI * 2 + phase * 0.5) * 7;
        pts.push([x, y]);
      }

      // Thick black wave
      ctx!.strokeStyle = "#0a0a0d";
      ctx!.lineWidth = 3.5;
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      ctx!.beginPath();
      pts.forEach(([x, y], i) => {
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      });
      ctx!.stroke();

      // White playhead dot travelling along the wave
      const pt = pts[Math.floor(((phase * 0.03) % 1) * (pts.length - 1))]!;
      ctx!.shadowColor = "rgba(255, 255, 255, 0.9)";
      ctx!.shadowBlur = 5;
      ctx!.fillStyle = "#ffffff";
      ctx!.beginPath();
      ctx!.arc(pt[0], pt[1], 2.8, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;

      // Black ring to separate the dot from the wave
      ctx!.strokeStyle = "#0a0a0d";
      ctx!.lineWidth = 0.8;
      ctx!.beginPath();
      ctx!.arc(pt[0], pt[1], 2.8, 0, Math.PI * 2);
      ctx!.stroke();

      try {
        link!.href = canvas.toDataURL("image/png");
      } catch {
        // ignore
      }
    }

    draw();
    if (reduced) return;

    const id = window.setInterval(() => {
      phase += 0.45;
      draw();
    }, 80);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  return null;
}

/** Multiply each rgb channel of a hex colour by k (clamped to 0-255). */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 0xff) * k)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 0xff) * k)));
  const b = Math.max(0, Math.min(255, Math.round((n & 0xff) * k)));
  return `rgb(${r}, ${g}, ${b})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
