"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { animate, motion, useInView, useReducedMotion, useDragControls } from "framer-motion";
import {
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SectionLabel from "@/components/SectionLabel";
import Particles from "@/components/Particles";
import PageTransition from "@/components/PageTransition";
import Avatar from "@/components/Avatar";
import { Tooltip as Tip } from "@/components/Tooltip";
import GlassButton from "@/components/GlassButton";
import { CloseIcon } from "@/components/Icons";
import { AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: string;
  chart: "bar" | "area";
  trend: { s: string; v: number }[];
}

export interface DesignerItem {
  slug: string;
  name: string;
  subtitle: string;
  entries: number;
  wins: number;
  participation: string;
  isActive: boolean;
  championYears: number[];
  avatarUrl: string | null;
}

export interface PhotoItem { url: string; alt: string; }

export interface OverviewClientProps {
  stats: StatItem[];
  designers: DesignerItem[];
  photos: PhotoItem[];
  allPhotos: PhotoItem[];
}

// ─── Animated stat number ─────────────────────────────────────────────────────

function AnimatedStatValue({ value }: { value: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  const suffix = value.match(/[^0-9.]+$/)?.[0] ?? "";
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  const decimals = value.includes(".") ? value.split(".")[1]?.replace(/[^0-9]/g, "").length : 0;

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, num, {
      duration: 1.2,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals) + suffix),
    });
    return controls.stop;
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <p ref={ref} className="text-5xl text-fg-primary leading-none">
      {display}
    </p>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip(props: any) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2.5 py-1.5 rounded-lg bg-elevated text-xs text-fg-primary" style={{ boxShadow: "var(--shadow-default)" }}>
      {payload[0].value}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: StatItem }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true });
  const gradId = `grad-overview-${stat.label.replace(/[\s/%]/g, "-").toLowerCase()}`;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="h-[220px] p-5 rounded-2xl bg-surface flex flex-col justify-between cursor-default"
      style={{ boxShadow: "var(--shadow-default)" }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm text-fg-secondary">{stat.label}</p>
        <AnimatedStatValue value={stat.value} />
      </div>
      <div ref={chartRef} className="-mx-3">
        <div style={{ height: 64 }}>
          {chartInView && stat.chart === "bar" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stat.trend} margin={{ top: 0, right: 12, left: 12, bottom: 0 }} barSize={14}>
                <YAxis hide domain={[0, "dataMax"]} />
                <XAxis dataKey="s" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-fg-muted)" }} height={18} />
                <Tooltip content={(p) => <ChartTooltip {...p} />} cursor={false} />
                <Bar dataKey="v" fill="var(--color-accent)" fillOpacity={1} radius={4 as unknown as number} activeBar={{ fill: "var(--color-accent)", fillOpacity: 0.5, radius: 4 as unknown as number }} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {chartInView && stat.chart === "area" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stat.trend} margin={{ top: 4, right: 0, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[0, "dataMax"]} />
                <XAxis dataKey="s" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-fg-muted)" }} height={18} padding={{ left: 20, right: 20 }} />
                <Tooltip content={(p) => <ChartTooltip {...p} />} cursor={{ stroke: "rgba(148,163,184,0.1)" }} />
                <Area type="monotone" dataKey="v" stroke="var(--color-accent)" strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Designer card ────────────────────────────────────────────────────────────

function DesignerCard({ designer }: { designer: DesignerItem }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="relative p-5 rounded-2xl bg-surface flex flex-col gap-12 overflow-hidden cursor-default"
      style={{ boxShadow: "var(--shadow-default)" }}
    >
      {/* Header: avatar + name + champion badge(s) */}
      <div className="flex gap-3 items-center min-w-0">
        <Avatar name={designer.name} src={designer.avatarUrl} className="w-12 h-12 text-sm" />
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-base text-fg-primary">{designer.name}</p>
          <p className="text-sm text-fg-secondary">{designer.subtitle}</p>
        </div>
        {designer.championYears.length > 0 && (
          <Tip content={`${designer.name} – the star that guided ${designer.championYears.join(" & ")}`}>
            <motion.div
              whileHover={{ scale: 1.06, filter: "drop-shadow(0 4px 8px rgba(57,255,62,0.25))" }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute flex items-center gap-1 px-2 py-1 rounded-lg bg-elevated cursor-pointer"
              style={{ top: 8, right: 8 }}
            >
              <img src="/logo.svg" width="12" height="12" alt="" style={{ outline: "none" }} />
              <span className="text-xs tabular-nums" style={{ color: "var(--color-accent)" }}>
                {designer.championYears.join(", ")}
              </span>
            </motion.div>
          </Tip>
        )}
      </div>

      {/* Stats: Total Entries / Total Wins / Participation % */}
      <div className="flex items-start justify-between">
        {[
          { label: "Entries",       value: designer.entries },
          { label: "Wins",          value: designer.wins },
          { label: "Participation %", value: designer.participation },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <p className="text-sm text-fg-muted">{label}</p>
            <p className="text-3xl text-fg-primary leading-9">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewClient({ stats, designers, photos, allPhotos }: OverviewClientProps) {
  const active = designers.filter((d) => d.isActive);
  const former = designers.filter((d) => !d.isActive);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const dragControls = useDragControls();
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const startDragFromHandle = useCallback((e: React.PointerEvent) => {
    if (isMobile) dragControls.start(e);
  }, [isMobile, dragControls]);
  const startDragFromScroll = useCallback((e: React.PointerEvent) => {
    if (!isMobile) return;
    const el = contentScrollRef.current;
    if (el && el.scrollTop === 0) dragControls.start(e);
  }, [isMobile, dragControls]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useScrollLock(galleryOpen, isMobile);

  const dur = (ms: number) => prefersReducedMotion ? 0 : ms;
  const ease = [0.23, 1, 0.32, 1] as const;
  const galleryInitial = isMobile ? { y: "100%" } : { opacity: 0, scale: 0.97, y: 8 };
  const galleryAnimate = isMobile
    ? { y: 0, transition: { duration: dur(0.32), ease: [0.32, 0.72, 0, 1] } }
    : { opacity: 1, scale: 1, y: 0, transition: { duration: dur(0.22), ease } };
  const galleryExit = isMobile
    ? { y: "100%", transition: { duration: dur(0.2), ease } }
    : { opacity: 0, scale: 0.97, y: 8, transition: { duration: dur(0.16), ease } };

  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:gap-20 sm:py-20 min-h-screen">
      <Nav />

      <PageTransition>
      <div className="flex flex-col gap-20 w-full max-w-[920px] mx-auto px-4 sm:px-6">

        {/* Hero */}
        <section className="flex flex-col gap-6 items-center text-center">
          <SectionLabel>Overview</SectionLabel>
          <h1 className="text-4xl text-fg-primary leading-10">
            Numbers don&apos;t lie.{" "}
            <br />
            All the stats, all the designers, all in one place.
          </h1>
        </section>

        {/* Statistics */}
        <section className="flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </section>

        {/* Active designers */}
        {active.length > 0 && (
          <section className="flex flex-col gap-8 items-center">
            <SectionLabel>Active designers</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
              {active.map((d) => (
                <DesignerCard key={d.slug} designer={d} />
              ))}
            </div>
          </section>
        )}

        {/* Former designers */}
        {former.length > 0 && (
          <section className="flex flex-col gap-8 items-center">
            <SectionLabel>Former designers</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
              {former.map((d) => (
                <DesignerCard key={d.slug} designer={d} />
              ))}
            </div>
          </section>
        )}

        {/* Draggable photo collage */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-full h-[420px]">
            <div
              className="absolute pointer-events-none"
              style={{ top: 0, bottom: "-300px", left: "calc(50% - 50vw)", right: "calc(50% - 50vw)", zIndex: 0 }}
            >
              <Particles quantity={150} className="w-full h-full" />
            </div>

            {(isMobile ? [
              { left: "2%",  top: "2%",  rotate: -4, width: 155 },
              { left: "38%", top: "0%",  rotate:  3, width: 150 },
              { left: "58%", top: "10%", rotate: -2, width: 140 },
              { left: "4%",  top: "48%", rotate:  2, width: 155 },
              { left: "44%", top: "44%", rotate: -3, width: 145 },
            ] : [
              { left: "0%",  top: "10%", rotate: -4, width: 220 },
              { left: "18%", top: "0%",  rotate:  3, width: 240 },
              { left: "38%", top: "8%",  rotate: -2, width: 200 },
              { left: "56%", top: "2%",  rotate:  5, width: 230 },
              { left: "72%", top: "12%", rotate: -3, width: 210 },
            ]).map((photo, i) => (
              <motion.div
                key={i}
                drag={!prefersReducedMotion}
                dragMomentum={false}
                whileDrag={prefersReducedMotion ? {} : { scale: 1.08, zIndex: 10, filter: "brightness(1.08)", boxShadow: "0 20px 40px -8px rgb(0 0 0 / 0.4)" }}
                initial={{ rotate: photo.rotate }}
                style={{
                  position: "absolute",
                  left: photo.left,
                  top: photo.top,
                  width: photo.width,
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "grab",
                  zIndex: i + 1,
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                }}
              >
                {photos[i]
                  ? <img src={photos[i].url} alt={photos[i].alt} draggable={false} style={{ width: "100%", height: "auto", display: "block" }} />
                  : <div style={{ width: "100%", aspectRatio: "4/3", background: "var(--color-elevated)" }} />
                }
              </motion.div>
            ))}
          </div>

          {allPhotos.length > 5 && (
            <GlassButton className="relative z-10 px-4 py-2.5 text-sm" onClick={() => setGalleryOpen(true)}>
              Open Gallery
            </GlassButton>
          )}
        </div>

        {/* Gallery modal */}
        <AnimatePresence>
          {galleryOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-canvas/60 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.15, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => setGalleryOpen(false)}
              />
              <div
                className="fixed inset-0 z-50 flex items-end sm:items-start sm:overflow-y-auto justify-center sm:py-[100px] sm:px-6 pointer-events-none"
                onClick={() => setGalleryOpen(false)}
              >
                <motion.div
                  className="relative w-full sm:max-w-[920px] bg-surface rounded-t-2xl sm:rounded-2xl flex flex-col pointer-events-auto sm:max-h-none"
                  style={{ ...(isMobile ? { maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 24px)" } : {}), boxShadow: "var(--shadow-modal)" }}
                  initial={galleryInitial}
                  animate={galleryAnimate}
                  exit={galleryExit}
                  onClick={(e) => e.stopPropagation()}
                  drag={isMobile ? "y" : false}
                  dragControls={dragControls}
                  dragListener={false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.8 }}
                  dragMomentum={false}
                  onDragEnd={(_, info) => {
                    if (isMobile && (info.offset.y > 80 || info.velocity.y > 400)) setGalleryOpen(false);
                  }}
                >
                  <div
                    className="sm:hidden shrink-0 sticky top-0 z-10 rounded-t-2xl relative"
                    onPointerDown={startDragFromHandle}
                    style={{
                      touchAction: "none",
                      background: "linear-gradient(to bottom, var(--color-surface) 40%, transparent 100%)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                    }}
                  >
                    <div className="flex justify-center py-3">
                      <svg width="32" height="4" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="4" rx="2" fill="var(--color-elevated)" />
                      </svg>
                    </div>
                    <div
                      className="absolute inset-x-0 top-full h-8 pointer-events-none"
                      style={{
                        background: "linear-gradient(to bottom, var(--color-surface), transparent)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                      }}
                    />
                  </div>

                  <div
                    ref={contentScrollRef}
                    className="overflow-y-auto sm:overflow-visible flex-1"
                    style={{ overscrollBehavior: "none" }}
                    onPointerDown={startDragFromScroll}
                  >
                    <div className="relative p-5 sm:p-10 flex flex-col gap-5 sm:gap-10">
                      <GlassButton onClick={() => setGalleryOpen(false)} className="absolute top-4 right-4 w-10 h-10">
                        <CloseIcon />
                      </GlassButton>

                      <div className="flex flex-col gap-1 pr-14">
                        <p className="text-xl text-fg-primary">GPX Gallery</p>
                        <p className="text-sm text-fg-muted">{allPhotos.length} moments frozen in time</p>
                      </div>

                      <div className="columns-1 sm:columns-2 gap-3">
                        {allPhotos.map((photo, i) => (
                          <img
                            key={i}
                            src={photo.url}
                            alt={photo.alt}
                            className="w-full rounded-xl mb-3 break-inside-avoid"
                            style={{
                              display: "block",
                              animation: prefersReducedMotion ? undefined : "gallery-img-in 0.3s cubic-bezier(0.23,1,0.32,1) both",
                              animationDelay: prefersReducedMotion ? undefined : `${i * 30}ms`,
                            }}
                          />
                        ))}
                      </div>

                      <div className="hidden sm:flex justify-center">
                        <GlassButton onClick={() => setGalleryOpen(false)} className="px-4 py-2.5 text-sm">
                          Close
                        </GlassButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        <div className="relative" style={{ zIndex: 1 }}>
          <Footer />
        </div>
      </div>
      </PageTransition>
    </div>
  );
}
