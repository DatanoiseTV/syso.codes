import { useEffect } from "react";

/**
 * The trick: draw a 32×32 <canvas> that repaints an oscilloscope
 * sine + square wave a few times a second, then pipe the result into
 * the favicon via toDataURL() + link.href.
 *
 * - No render, returns null — just a side effect on the document head.
 * - Runs at ~12.5 fps (80 ms tick) — enough to feel alive, low enough
 *   to barely touch the CPU; browser already freezes rAF on hidden
 *   tabs so the setInterval pauses effectively there too.
 * - Respects prefers-reduced-motion: renders a single static frame
 *   and never starts the interval.
 * - If the user re-mounts (hot-reload during dev) the old interval
 *   is cleaned up so we don't leak.
 */
export function AnimatedFavicon() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    // Retina-friendly: draw at 2x and let the browser downscale
    const SIZE = 32;
    const scale = 2;
    canvas.width = SIZE * scale;
    canvas.height = SIZE * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    // Find (or create) a png favicon link. Leave the SVG one in place
    // as a fallback for browsers that prefer it — we just override with
    // PNG when the canvas version is ready.
    let link =
      document.querySelector<HTMLLinkElement>(
        'link[rel~="icon"][data-animated="1"]'
      ) ?? null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.dataset.animated = "1";
      // Insert before the static one so it wins the "last one wins" rule
      // for matching type.
      document.head.appendChild(link);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phase = 0;

    function draw() {
      ctx!.clearRect(0, 0, SIZE, SIZE);

      // Rounded-square background with the same gradient as the brand mark
      const bg = ctx!.createLinearGradient(0, 0, SIZE, SIZE);
      bg.addColorStop(0, "#10122a");
      bg.addColorStop(1, "#000000");
      ctx!.fillStyle = bg;
      roundRect(ctx!, 1, 1, 30, 30, 9);
      ctx!.fill();
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.14)";
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // Subtle scope grid (faint crosshair)
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(5, 16);
      ctx!.lineTo(27, 16);
      ctx!.moveTo(16, 5);
      ctx!.lineTo(16, 27);
      ctx!.stroke();

      // Animated sine → square trace
      // Moves left-to-right at phase speed; amplitude gently modulated
      const grad = ctx!.createLinearGradient(5, 0, 27, 0);
      grad.addColorStop(0, "#ff6b35");
      grad.addColorStop(1, "#ffa476");
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 2.2;
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";

      ctx!.beginPath();
      const amp = 4 + Math.sin(phase * 0.35) * 1.5;
      for (let x = 5; x <= 27; x += 0.5) {
        const t = (x - 5) / 22;
        // first half: sine, second half: square-ish (signum of sin)
        let y: number;
        if (t < 0.55) {
          y = 16 + Math.sin(t * Math.PI * 4 + phase) * amp;
        } else {
          const s = Math.sin((t - 0.55) * Math.PI * 6 + phase * 0.6);
          y = 16 + Math.sign(s) * (amp - 0.2);
        }
        if (x === 5) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // Soft glow — redraw the path with a shadow
      ctx!.shadowColor = "#ff6b35";
      ctx!.shadowBlur = 3;
      ctx!.stroke();
      ctx!.shadowBlur = 0;

      // Power LED dot (coral, top-right)
      ctx!.fillStyle = "#ff8551";
      ctx!.beginPath();
      ctx!.arc(25, 7, 1.6, 0, Math.PI * 2);
      ctx!.fill();

      // Push to favicon
      try {
        link!.href = canvas.toDataURL("image/png");
      } catch {
        // ignore — some browsers may throw on rare conditions
      }
    }

    // Initial frame
    draw();
    if (reduced) return; // static frame only

    // ~12.5 fps — slow enough to be cheap, fast enough to look alive
    const id = window.setInterval(() => {
      phase += 0.28;
      draw();
    }, 80);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  return null;
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
