import { useEffect, useRef } from "react";

/**
 * Animated canvas background.
 *
 * Renders the entire ambient layer in a single 60fps canvas:
 *  - 80+ floating nodes (mix of dots, "chips" with pin marks, "waves")
 *  - Dynamic connection lines that fade with distance (≤ 170px)
 *  - Mouse-interactive — nodes are gently repelled by the cursor
 *    and the cursor itself becomes a hub that connects to nearby
 *    nodes with brighter lines
 *  - Random "data pulses" travel along existing connections every
 *    few frames, with a glowing head, to evoke packets / signals
 *  - Two slow drifting sine waves at the top and bottom for the
 *    audio/DSP vibe
 *  - All rendered with the orange phosphor palette, on transparent
 *    canvas so the body grid still shows through
 *  - High-DPI aware (window.devicePixelRatio scaling)
 *  - Respects prefers-reduced-motion by drawing one static frame
 *    and never starting the rAF loop
 */
export function CanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ─── Sizing + DPR ─────────────────────────────────────────────
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(1, 0, 0, 1, 0, 0); // reset before rescaling
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    // ─── Nodes ────────────────────────────────────────────────────
    type NodeType = "dot" | "chip" | "wave";
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      type: NodeType;
      glow: boolean;
      // for chips: rotation
      rot: number;
    }

    // density: roughly one node per ~17000px²
    const density = Math.max(60, Math.min(120, Math.floor((width * height) / 17000)));
    const nodes: Node[] = [];
    for (let i = 0; i < density; i++) {
      const r = Math.random();
      const type: NodeType = r < 0.06 ? "chip" : r < 0.12 ? "wave" : "dot";
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: type === "dot" ? 0.8 + Math.random() * 1.6 : 4 + Math.random() * 2,
        type,
        glow: Math.random() < 0.18,
        rot: Math.random() * Math.PI * 2,
      });
    }

    // ─── Pulses (data packets travelling along connections) ──────
    interface Pulse {
      from: number;
      to: number;
      progress: number;
      speed: number;
    }
    const pulses: Pulse[] = [];
    const MAX_PULSES = 12;

    function spawnPulse() {
      if (pulses.length >= MAX_PULSES) return;
      const i = Math.floor(Math.random() * nodes.length);
      // pick a neighbour within range
      const candidates: number[] = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i]!.x - nodes[j]!.x;
        const dy = nodes[i]!.y - nodes[j]!.y;
        if (dx * dx + dy * dy < CONNECT_DIST * CONNECT_DIST) {
          candidates.push(j);
        }
      }
      if (candidates.length === 0) return;
      const j = candidates[Math.floor(Math.random() * candidates.length)]!;
      pulses.push({ from: i, to: j, progress: 0, speed: 0.005 + Math.random() * 0.01 });
    }

    // ─── Mouse ───────────────────────────────────────────────────
    const mouse = { x: -10000, y: -10000, active: false };
    const MOUSE_RADIUS = 220;
    const CONNECT_DIST = 170;

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
    function onLeave() {
      mouse.active = false;
      mouse.x = -10000;
      mouse.y = -10000;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);

    // ─── Sine wave background traces ──────────────────────────────
    let phase = 0;

    // ─── Render loop ──────────────────────────────────────────────
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let frame = 0;

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      frame++;
      phase += 0.002;

      // ── Background drifting sine waves ────────────────────────
      ctx!.save();
      // Top wave
      ctx!.beginPath();
      ctx!.strokeStyle = "rgba(255, 107, 53, 0.18)";
      ctx!.lineWidth = 1.2;
      const topY = height * 0.18;
      const topAmp = Math.min(40, height * 0.04);
      const topFreq = 0.005;
      for (let x = -10; x <= width + 10; x += 6) {
        const y = topY + Math.sin(x * topFreq + phase * 1.5) * topAmp;
        if (x === -10) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();
      // Bottom wave (opposite direction)
      ctx!.beginPath();
      ctx!.strokeStyle = "rgba(255, 164, 118, 0.12)";
      ctx!.lineWidth = 1.2;
      const botY = height * 0.85;
      const botAmp = Math.min(28, height * 0.03);
      const botFreq = 0.006;
      for (let x = -10; x <= width + 10; x += 6) {
        const y = botY + Math.sin(x * botFreq - phase * 1.0) * botAmp;
        if (x === -10) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();
      ctx!.restore();

      // ── Update nodes ──────────────────────────────────────────
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.rot += 0.002;
        // wrap edges with a small buffer
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;

        // mouse repulsion (gentle)
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 1) {
            const d = Math.sqrt(d2);
            const force = (1 - d / MOUSE_RADIUS) * 0.6;
            n.x += (dx / d) * force;
            n.y += (dy / d) * force;
          }
        }
      }

      // ── Draw connections (O(n²) but n ≤ 120) ─────────────────
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CONNECT_DIST * CONNECT_DIST) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / CONNECT_DIST) * 0.32;
            ctx!.beginPath();
            ctx!.strokeStyle = `rgba(255, 107, 53, ${alpha})`;
            ctx!.lineWidth = 0.7;
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }

        // connect to mouse
        if (mouse.active) {
          const a = nodes[i]!;
          const dx = a.x - mouse.x;
          const dy = a.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / MOUSE_RADIUS) * 0.55;
            ctx!.beginPath();
            ctx!.strokeStyle = `rgba(255, 164, 118, ${alpha})`;
            ctx!.lineWidth = 1;
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(mouse.x, mouse.y);
            ctx!.stroke();
          }
        }
      }

      // ── Spawn pulses occasionally ─────────────────────────────
      if (frame % 20 === 0 && Math.random() < 0.6) spawnPulse();

      // ── Update + draw pulses ──────────────────────────────────
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]!;
        p.progress += p.speed;
        if (p.progress >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        const a = nodes[p.from];
        const b = nodes[p.to];
        if (!a || !b) {
          pulses.splice(i, 1);
          continue;
        }
        const x = a.x + (b.x - a.x) * p.progress;
        const y = a.y + (b.y - a.y) * p.progress;
        // glow
        ctx!.beginPath();
        ctx!.fillStyle = "rgba(255, 107, 53, 0.35)";
        ctx!.arc(x, y, 6, 0, Math.PI * 2);
        ctx!.fill();
        // core
        ctx!.beginPath();
        ctx!.fillStyle = "rgba(255, 220, 180, 0.95)";
        ctx!.arc(x, y, 2, 0, Math.PI * 2);
        ctx!.fill();
      }

      // ── Draw nodes ────────────────────────────────────────────
      for (const n of nodes) {
        if (n.type === "chip") {
          ctx!.save();
          ctx!.translate(n.x, n.y);
          ctx!.rotate(n.rot);
          // body
          ctx!.fillStyle = "rgba(13, 13, 13, 0.95)";
          ctx!.strokeStyle = "rgba(255, 107, 53, 0.85)";
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.rect(-5, -5, 10, 10);
          ctx!.fill();
          ctx!.stroke();
          // pin marks
          ctx!.strokeStyle = "rgba(255, 107, 53, 0.7)";
          ctx!.lineWidth = 1;
          for (const p of [-3, 0, 3]) {
            ctx!.beginPath();
            ctx!.moveTo(-5, p);
            ctx!.lineTo(-7, p);
            ctx!.stroke();
            ctx!.beginPath();
            ctx!.moveTo(5, p);
            ctx!.lineTo(7, p);
            ctx!.stroke();
            ctx!.beginPath();
            ctx!.moveTo(p, -5);
            ctx!.lineTo(p, -7);
            ctx!.stroke();
            ctx!.beginPath();
            ctx!.moveTo(p, 5);
            ctx!.lineTo(p, 7);
            ctx!.stroke();
          }
          // pin-1 dot
          ctx!.fillStyle = "rgba(255, 164, 118, 1)";
          ctx!.beginPath();
          ctx!.arc(-3, -3, 0.9, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        } else if (n.type === "wave") {
          // tiny inline waveform
          ctx!.save();
          ctx!.strokeStyle = "rgba(255, 107, 53, 0.85)";
          ctx!.lineWidth = 1.2;
          ctx!.beginPath();
          for (let x = -8; x <= 8; x += 1) {
            const y = Math.sin((x / 8) * Math.PI * 2 + n.rot * 4) * 3;
            if (x === -8) ctx!.moveTo(n.x + x, n.y + y);
            else ctx!.lineTo(n.x + x, n.y + y);
          }
          ctx!.stroke();
          ctx!.restore();
        } else {
          // dot
          if (n.glow) {
            ctx!.beginPath();
            ctx!.fillStyle = "rgba(255, 107, 53, 0.18)";
            ctx!.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
            ctx!.fill();
          }
          ctx!.beginPath();
          ctx!.fillStyle = n.glow
            ? "rgba(255, 200, 150, 0.95)"
            : "rgba(255, 107, 53, 0.7)";
          ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
    }

    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }

    if (reduced) {
      draw(); // single static frame
    } else {
      loop();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="canvas-bg" aria-hidden="true" />;
}
