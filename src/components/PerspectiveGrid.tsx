"use client";

import { useEffect, useRef } from "react";

interface PerspectiveGridProps {
  color?: string;
  speed?: number;
  className?: string;
}

export default function PerspectiveGrid({
  color = "#7c3aed",
  speed = 0.5,
  className,
}: PerspectiveGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    let offset = 0;
    let rafId: number;

    const GRID_SIZE = 80;
    const HORIZON = 0.48; // horizon as fraction of height
    const COLS = 12;
    const ROWS = 14;
    const FOV = 280;

    function project(x: number, z: number): [number, number] {
      const scale = FOV / (FOV + z);
      const px = w / 2 + x * scale;
      const py = h * HORIZON + (h * 0.55) * scale;
      return [px, py];
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      offset = (offset + speed) % GRID_SIZE;

      const halfCols = COLS / 2;

      // Vertical lines (receding)
      for (let i = -halfCols; i <= halfCols; i++) {
        const x = i * GRID_SIZE;
        const [x1, y1] = project(x, 0);
        const [x2, y2] = project(x, GRID_SIZE * ROWS);

        const grad = ctx!.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `${color}00`);
        grad.addColorStop(0.3, `${color}22`);
        grad.addColorStop(1, `${color}55`);

        ctx!.beginPath();
        ctx!.moveTo(x1, y1);
        ctx!.lineTo(x2, y2);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 0.8;
        ctx!.stroke();
      }

      // Horizontal lines (moving toward viewer)
      for (let j = 0; j <= ROWS; j++) {
        const z = j * GRID_SIZE - offset;
        if (z < 0) continue;

        const [x1, y] = project(-halfCols * GRID_SIZE, z);
        const [x2] = project(halfCols * GRID_SIZE, z);

        const t = j / ROWS;
        const alpha = Math.floor(t * 80).toString(16).padStart(2, "0");

        ctx!.beginPath();
        ctx!.moveTo(x1, y);
        ctx!.lineTo(x2, y);
        ctx!.strokeStyle = `${color}${alpha}`;
        ctx!.lineWidth = 0.8;
        ctx!.stroke();
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    const onResize = () => {
      w = canvas!.offsetWidth;
      h = canvas!.offsetHeight;
      canvas!.width = w;
      canvas!.height = h;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [color, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
