"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function Cursor() {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -1000, y: -1000 });
  const pos = useRef({ x: -1000, y: -1000 });
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    const move = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) cursorRef.current.style.opacity = "1";
    };
    const hide = () => { if (cursorRef.current) cursorRef.current.style.opacity = "0"; };
    const show = () => { if (cursorRef.current) cursorRef.current.style.opacity = "1"; };

    window.addEventListener("mousemove", move);
    document.documentElement.addEventListener("mouseleave", hide);
    document.documentElement.addEventListener("mouseenter", show);

    let rafId: number;
    function loop() {
      const isDragging = document.body.classList.contains("globe-dragging");
      const lerp = isDragging ? 1 : 0.6;
      pos.current.x += (mouse.current.x - pos.current.x) * lerp;
      pos.current.y += (mouse.current.y - pos.current.y) * lerp;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x - 6}px, ${pos.current.y - 6}px)`;
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.removeEventListener("mouseleave", hide);
      document.documentElement.removeEventListener("mouseenter", show);
      cancelAnimationFrame(rafId);
    };
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "var(--color-accent)",
        mixBlendMode: "exclusion",
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
        opacity: 0,
        transition: "opacity 0.2s ease",
      }}
    />
  );
}
