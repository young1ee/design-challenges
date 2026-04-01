"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import createGlobe from "cobe";

const LOCATIONS = [
  { id: "finland",  text: "FINLAND",  location: [61.9241,  25.7482] as [number, number] },
  { id: "estonia",  text: "ESTONIA",  location: [58.5953,  25.0136] as [number, number] },
  { id: "germany",  text: "GERMANY",  location: [51.1657,  10.4515] as [number, number] },
  { id: "oman",     text: "OMAN",     location: [21.4735,  55.9754] as [number, number] },
];


export default function Globe({ size = 400 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersRef = useRef(
    LOCATIONS.map(({ id, location }) => ({
      location,
      size: 0.025,
      color: [0.22, 1, 0.24] as [number, number, number],
      id,
    }))
  );

  const rMotion = useMotionValue(0);
  const springR = useSpring(rMotion, { stiffness: 120, damping: 20, mass: 1 });
  const pointerInteracting = useRef<number | null>(null);
  const pointerMovement = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    let theta = 0.5;
    let prevY = 0;
    let prevX = 0;
    let velocity = 0;
    let rafId: number;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: 0,
      theta: 0,
      dark: 1.05,
      diffuse: 1.2,
      scale: 1.0,
      mapSamples: 14000,
      mapBrightness: 3.5,
      baseColor: [0.216, 0.129, 0.396],
      markerColor: [0.22, 1, 0.24],
      glowColor: [0.13, 0.08, 0.24],
      markers: markersRef.current,
    });

    // COBE creates one 1×1px div per marker (with id) inside canvas.parentElement.
    // Capture them right after createGlobe (before we append our own labels)
    // by filtering out the canvas — COBE creates them in markers array order.
    const wrapper = canvas.parentElement!;
    const cobeMarkerDivs = Array.from(wrapper.children)
      .filter((el) => el !== canvas)
      .slice(0, LOCATIONS.length) as HTMLElement[];

    const labelEls = LOCATIONS.map(({ id, text }) => {
      const el = document.createElement("div");
      Object.assign(el.style, {
        position: "absolute",
        positionAnchor: `--cobe-${id}`,
        top: "anchor(top)",
        left: "anchor(center)",
        transform: "translate(-50%, calc(-100% - 10px))",
        padding: "2px 4px",
        background: "var(--color-accent)",
        borderRadius: "3px",
        fontSize: "11px",
        fontFamily: "var(--font-geist-mono), monospace",
        fontWeight: "500",
        letterSpacing: "0em",
        color: "var(--color-canvas)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        opacity: `var(--cobe-visible-${id}, 0)`,
        filter: `blur(var(--cobe-visible-${id}, 8px))`,
        transition: "opacity 0.3s cubic-bezier(0.23, 1, 0.32, 1), filter 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        lineHeight: "1.2",
      });
      el.textContent = text;

      // Downward triangle arrow
      const arrow = document.createElement("div");
      Object.assign(arrow.style, {
        position: "absolute",
        bottom: "-5px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "0",
        height: "0",
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: "5px solid var(--color-accent)",
      });
      el.appendChild(arrow);

      wrapper.append(el);
      return el;
    });

    function animate() {
      if (pointerInteracting.current === null) {
        phi += 0.003;
        phi += velocity;
        velocity *= 0.99;
        const currentPhi = phi + springR.get();
        globe.update({ phi: currentPhi, theta, markers: markersRef.current });
      } else {
        globe.update({ phi, theta, markers: markersRef.current });
      }


      cobeMarkerDivs.forEach((div, i) => {
        const nx = (div.offsetLeft - size / 2) / (size * 0.4);
        const ny = (div.offsetTop  - size / 2) / (size * 0.4);
        const z  = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const id = LOCATIONS[i].id;
        if (z < 0.35) {
          labelEls[i].style.opacity = "0";
          labelEls[i].style.filter  = "blur(8px)";
        } else {
          labelEls[i].style.opacity = `var(--cobe-visible-${id}, 0)`;
          labelEls[i].style.filter  = `blur(var(--cobe-visible-${id}, 8px))`;
        }
      });

      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);

    function onPointerDown(e: PointerEvent) {
      pointerInteracting.current = e.clientX;
      prevY = e.clientY;
      prevX = e.clientX;
      velocity = 0;
      rMotion.set(0);
      canvas?.setPointerCapture(e.pointerId);
    }
    function onPointerUp() {
      pointerInteracting.current = null;
    }
    function onPointerMove(e: PointerEvent) {
      if (pointerInteracting.current === null) return;
      phi += (e.clientX - prevX) * 0.01;
      velocity = (e.clientX - prevX) * 0.005;
      prevX = e.clientX;
      theta += (e.clientY - prevY) * 0.005;
      theta = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, theta));
      prevY = e.clientY;
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);

    return () => {
      cancelAnimationFrame(rafId);
      globe.destroy();
      labelEls.forEach((el) => el.remove());
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, [springR, rMotion]);

  return (
    <div className="flex justify-center w-full">
      <div className="relative" style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          width={size * 2}
          height={size * 2}
          style={{ width: size, height: size }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, var(--color-canvas) 65%)",
          }}
        />
      </div>
    </div>
  );
}
