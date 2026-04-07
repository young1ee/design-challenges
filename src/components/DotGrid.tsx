"use client";

import { useEffect, useRef } from "react";

interface DotGridProps {
  gap?: number;
  dotSize?: number;
  color?: string;
  restColor?: string;
  repelRadius?: number;
  repelStrength?: number;
  className?: string;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function DotGrid({
  gap = 28,
  dotSize = 1.5,
  color = "#9333ea",
  restColor = "var(--color-accent)",
  repelRadius = 80,
  repelStrength = 5,
  className,
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    type Dot = { ox: number; oy: number; x: number; y: number; vx: number; vy: number };
    let dots: Dot[] = [];

    function buildGrid() {
      w = canvas!.offsetWidth;
      h = canvas!.offsetHeight;
      canvas!.width = w;
      canvas!.height = h;
      dots = [];
      for (let x = gap; x < w; x += gap) {
        for (let y = gap; y < h; y += gap) {
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
        }
      }
    }

    buildGrid();

    const resolveColor = (c: string) =>
      c.startsWith("var(--")
        ? getComputedStyle(document.documentElement).getPropertyValue(c.slice(4, -1)).trim()
        : c;
    const resolvedRestColor = resolveColor(restColor);
    const resolvedColor = resolveColor(color);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => { mouse.current = { x: -1000, y: -1000 }; };
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    let rafId: number;
    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const d of dots) {
        const dx = d.x - mouse.current.x;
        const dy = d.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repelRadius) {
          const force = (1 - dist / repelRadius) * repelStrength;
          d.vx += (dx / dist) * force;
          d.vy += (dy / dist) * force;
        }

        // Spring back to origin
        d.vx += (d.ox - d.x) * 0.12;
        d.vy += (d.oy - d.y) * 0.12;

        // Damping
        d.vx *= 0.82;
        d.vy *= 0.82;

        d.x += d.vx;
        d.y += d.vy;

        const distFromOrigin = Math.sqrt((d.x - d.ox) ** 2 + (d.y - d.oy) ** 2);
        const t = Math.min(distFromOrigin / 20, 1);
        const opacity = 0.22 + t * 0.45;
        const radius = dotSize + t * 0.6;

        const [r1, g1, b1] = hexToRgb(resolvedRestColor);
        const [r2, g2, b2] = hexToRgb(resolvedColor);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        ctx!.beginPath();
        ctx!.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgb(${r},${g},${b})`;
        ctx!.globalAlpha = opacity;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);

    const onResize = () => buildGrid();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [gap, dotSize, color, restColor, repelRadius, repelStrength]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
