"use client";

import { useState, useEffect, useRef } from "react";
import { animate, motion, useInView } from "framer-motion";
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import Nav from "@/components/Nav";
import Badge from "@/components/Badge";
import Footer from "@/components/Footer";
import SectionLabel from "@/components/SectionLabel";
import PromptCard from "@/components/PromptCard";
import PromptModal from "@/components/PromptModal";
import PageTransition from "@/components/PageTransition";
import Globe from "@/components/Globe";
import DotGrid from "@/components/DotGrid";
import Particles from "@/components/Particles";
import Countdown from "@/components/Countdown";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PodiumEntry {
  name: string;
  points: number;
  title?: string;
  thumbnailUrl?: string;
  prototypeUrl?: string;
  authorAvatarUrl?: string;
}

interface ChallengeEntry {
  id: string;
  title: string;
  author: string;
  authorAvatarUrl?: string;
  thumbnailUrl?: string;
  prototypeUrl?: string;
}

interface Challenge {
  id: string;
  date: string;
  month: string;
  prompt: string;
  masterOfCeremony: string;
  masterOfCeremonyAvatarUrl?: string;
  winner: string;
  winnerAvatarUrl?: string;
  podium: PodiumEntry[];
  entries: ChallengeEntry[];
}

interface LeaderboardRow {
  name: string;
  avatarUrl?: string;
  entries: number;
  first: number;
  second: number;
  third: number;
  points: number;
}

export interface HomeClientProps {
  currentChallenge: { prompt: string; challengeDate: string; isOpen: boolean } | null;
  previousChallenges: Challenge[];
  leaderboard: LeaderboardRow[];
  eligibleDesignerCount: number;
}

// ─── Animated stat number ─────────────────────────────────────────────────────

function AnimatedStatValue({ value, className = "text-5xl text-fg-primary leading-none" }: { value: string; className?: string }) {
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

  return <p ref={ref} className={className}>{display}</p>;
}

// ─── Circle progress ──────────────────────────────────────────────────────────

function CircleProgress({ value, size = 96 }: { value: number; size?: number }) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcRef = useRef<SVGCircleElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        setDisplayValue(Math.round(v));
        if (arcRef.current) {
          arcRef.current.style.strokeDashoffset = String(circumference - (v / 100) * circumference);
        }
      },
    });
    return controls.stop;
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrapRef} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle ref={arcRef} cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="var(--color-accent)" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference}
          strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl text-fg-primary leading-none">{displayValue}%</span>
      </div>
    </div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip(props: any) {
  const { active, payload, format } = props;
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-2.5 py-1.5 rounded-lg bg-elevated text-xs text-fg-primary"
      style={{ boxShadow: "var(--shadow-default)" }}
    >
      {format ? format(payload[0].value) : payload[0].value}
    </div>
  );
}

// ─── Leaderboard table ────────────────────────────────────────────────────────

function Leaderboard({ data }: { data: LeaderboardRow[] }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const dataCol = isMobile ? "auto" : "minmax(80px, auto)";
  const cols = isMobile
    ? `fit-content(100%) minmax(0,1fr) ${dataCol} ${dataCol} ${dataCol}`
    : `fit-content(100%) minmax(0,1fr) ${dataCol} ${dataCol} ${dataCol} ${dataCol} ${dataCol}`;
  const headers = isMobile ? ["Entries", "1st", "Points"] : ["Entries", "1st", "2nd", "3rd", "Points"];

  return (
    <div className="flex flex-col gap-4 w-full">
    <div className="w-full overflow-x-auto">
    <div style={{ display: "grid", gridTemplateColumns: cols, rowGap: "2px" }}>
      {/* Header row */}
      <div className="contents">
        <div className="pr-0 py-1.5 flex items-center" style={{ paddingLeft: "12px" }}>
          <span className="text-xs text-fg-muted">#</span>
        </div>
        <div className="px-2 sm:px-3 py-1.5 flex items-center">
          <span className="text-xs text-fg-muted">Designer</span>
        </div>
        {headers.map((label) => (
          <div key={label} className="px-2 sm:px-3 py-1.5 flex items-center justify-center">
            <span className="text-xs text-fg-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Data rows */}
      {data.map((row, i) => {
        const cells = isMobile ? [row.entries, row.first] : [row.entries, row.first, row.second, row.third];
        return (
          <div key={row.name} className="contents">
            <div
              className="pr-0 py-2.5 flex items-center rounded-l-lg"
              style={{ paddingLeft: "12px", background: "rgba(180,188,208,0.04)" }}
            >
              <span className="text-xs text-fg-muted tabular-nums">{i + 1}.</span>
            </div>
            <div
              className="px-2 sm:px-3 py-2.5 flex items-center gap-2"
              style={{ background: "rgba(180,188,208,0.04)" }}
            >
              <div className="w-5 h-5 rounded-full bg-elevated flex items-center justify-center text-[10px] text-fg-muted font-medium shrink-0 overflow-hidden">
                {row.avatarUrl
                  ? <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                  : row.name.slice(0, 2).toUpperCase()
                }
              </div>
              <span className="text-sm text-fg-primary">{row.name}</span>
            </div>
            {cells.map((val, j) => (
              <div
                key={j}
                className="px-2 sm:px-3 py-2.5 flex items-center justify-center"
                style={{ background: "rgba(180,188,208,0.04)" }}
              >
                <span className="text-sm text-fg-secondary tabular-nums">{val}</span>
              </div>
            ))}
            <div
              className="px-2 sm:px-3 py-2.5 flex items-center justify-center rounded-r-lg"
              style={{ background: "rgba(180,188,208,0.04)" }}
            >
              <span className="text-sm text-fg-primary tabular-nums">{row.points}</span>
            </div>
          </div>
        );
      })}
    </div>
    </div>
    <p className="text-xs text-fg-muted text-center w-full">
      1st · 10pts <span className="mx-1 sm:mx-2" style={{ color: "var(--color-line)" }}>/</span> 2nd · 6pts <span className="mx-1 sm:mx-2" style={{ color: "var(--color-line)" }}>/</span> 3rd · 4pts <span className="mx-1 sm:mx-2" style={{ color: "var(--color-line)" }}>/</span> Entry · 2pts
    </p>
    </div>
  );
}

// ─── Completion rate label ────────────────────────────────────────────────────

function completionRateText(rate: number): { headline: string; sub: string } {
  if (rate === 100) return { headline: "Perfect", sub: "Everyone showed up every time." };
  if (rate >= 80)   return { headline: "Great", sub: "Almost everyone is participating." };
  if (rate >= 60)   return { headline: "Good", sub: "Most people are showing up. The Germans are still conducting a thorough investigation." };
  if (rate >= 40)   return { headline: "Average", sub: "Some people should get off the bench." };
  return             { headline: "Poor", sub: "Someone needs a pep talk." };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomeClient({ currentChallenge, previousChallenges, leaderboard, eligibleDesignerCount }: HomeClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [challengeExpired, setChallengeExpired] = useState(false);
  const globeWrapRef = useRef<HTMLDivElement>(null);
  const [globeScale, setGlobeScale] = useState(1);

  const progressRef = useRef<HTMLDivElement>(null);
  const progressInView = useInView(progressRef, { once: true });
  const barRef = useRef<HTMLDivElement>(null);
  const barInView = useInView(barRef, { once: true });
  const areaRef = useRef<HTMLDivElement>(null);
  const areaInView = useInView(areaRef, { once: true });

  useEffect(() => {
    const el = globeWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setGlobeScale(Math.min(1, el.offsetWidth / 520));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const selectedChallenge = previousChallenges.find((c) => c.id === selectedId) ?? null;

  // ─── Derived stats ────────────────────────────────────────────────────────
  const totalPoints = leaderboard.reduce((sum, d) => sum + d.points, 0);
  const totalEntries = leaderboard.reduce((sum, d) => sum + d.entries, 0);

  const completionTrend = previousChallenges.map((c, i) => ({
    label: `#${i + 1}`,
    value: Math.round((c.entries.length / Math.max(eligibleDesignerCount, 1)) * 100),
  }));

  // Aggregate by month (oldest → newest) for charts
  const monthEntries: Record<string, number> = {};
  const monthPoints: Record<string, number> = {};
  const monthOrder: string[] = [];

  for (const c of [...previousChallenges].reverse()) {
    const { month } = c;
    if (!monthOrder.includes(month)) monthOrder.push(month);
    monthEntries[month] = (monthEntries[month] ?? 0) + c.entries.length;
    monthPoints[month] = (monthPoints[month] ?? 0) +
      c.podium.reduce((sum, p) => sum + p.points, 0) +
      Math.max(0, c.entries.length - c.podium.length) * 2;
  }

  const entriesPerChallenge = monthOrder.map((month) => ({ month, value: monthEntries[month] }));
  const pointsPerChallenge  = monthOrder.map((month) => ({ month, value: monthPoints[month] }));

  const avgCompletion = completionTrend.length > 0
    ? Math.round(completionTrend.reduce((sum, d) => sum + d.value, 0) / completionTrend.length)
    : 0;

  const lastSeasonChallenges = 10;


  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:gap-20 sm:py-20 min-h-screen">
      <Nav />

      <PageTransition>
      <div className="flex flex-col gap-20 w-full max-w-[920px] mx-auto px-4 sm:px-6">
        {/* Hero — current challenge */}
        <section className="relative flex flex-col gap-6 items-center text-center">
          <div className="absolute pointer-events-none" style={{ top: "-200px", bottom: "-120px", left: "calc(50% - 50vw)", right: "calc(50% - 50vw)" }}>
            <DotGrid repelRadius={120} repelStrength={8} gap={20} dotSize={1} restColor="#39ff3e" color="#9333ea" className="w-full h-full" />
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse 60% 60% at 50% 55%, transparent 20%, var(--color-canvas) 65%)",
              }}
            />
          </div>
          <div style={{ animation: "hero-item-reveal 0.7s cubic-bezier(0.23, 1, 0.32, 1) both" }}>
            <SectionLabel right={currentChallenge?.isOpen && !challengeExpired ? <Badge variant="positive" label="Active" /> : <Badge variant="negative" label="Closed" />}>Current challenge</SectionLabel>
          </div>

          {currentChallenge ? (
            <>
              <h1 className="text-4xl text-fg-primary leading-10">
                {currentChallenge.prompt.split(" ").map((word, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      marginRight: "0.3em",
                      animation: "blur-word-reveal 0.6s cubic-bezier(0.23, 1, 0.32, 1) both",
                      animationDelay: `${0.15 + i * 0.08}s`,
                    }}
                  >
                    {word}
                  </span>
                ))}
              </h1>
              <div className="relative z-10">
              <Countdown onExpire={() => setChallengeExpired(true)} endDate={(() => {
                // Compute 15:00 Europe/Helsinki as UTC
                const date = currentChallenge.challengeDate.slice(0, 10);
                const ref = new Date(`${date}T12:00:00Z`);
                const helsinkiHour = Number(ref.toLocaleString("en-US", { timeZone: "Europe/Helsinki", hour: "numeric", hour12: false }));
                const offsetH = helsinkiHour - 12; // Helsinki offset vs UTC at noon
                return new Date(`${date}T${String(15 - offsetH).padStart(2, "0")}:00:00Z`);
              })()}
              />
              </div>
            </>
          ) : (
            <p
              className="text-2xl text-fg-muted"
              style={{ animation: "hero-item-reveal 0.7s cubic-bezier(0.23, 1, 0.32, 1) both", animationDelay: "0.2s" }}
            >
              No active challenge right now.
            </p>
          )}
        </section>

        {/* Everything below the hero reveals after the hero animation completes */}
        <div className="flex flex-col gap-20" style={{ animation: "content-reveal 1s cubic-bezier(0.23, 1, 0.32, 1) both", animationDelay: "1.8s" }}>

        {/* Previous challenges */}
        {previousChallenges.length > 0 && (
          <section className="flex flex-col gap-8 items-center">
            <SectionLabel>Previous challenges</SectionLabel>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
              {previousChallenges.map((challenge) => (
                <PromptCard
                  key={challenge.id}
                  id={challenge.id}
                  date={challenge.date}
                  prompt={challenge.prompt}
                  winner={challenge.winner}
                  winnerAvatarUrl={challenge.winnerAvatarUrl}
                  entries={challenge.entries}
                  onOpen={() => setSelectedId(challenge.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Statistics */}
        {leaderboard.length > 0 && (
          <section className="flex flex-col gap-8 items-center">
            <SectionLabel>Statistics</SectionLabel>

            <div className="flex flex-col gap-5 w-full">
              {/* Leaderboard */}
              <div
                className="w-full p-5 rounded-2xl bg-surface flex flex-col gap-4"
                style={{ boxShadow: "var(--shadow-default)" }}
              >
                <p className="text-base text-fg-secondary">Leaderboard</p>
                <Leaderboard data={leaderboard} />
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

                {/* Total challenges */}
                <div className="h-[220px] p-5 rounded-2xl bg-surface flex flex-col justify-between" style={{ boxShadow: "var(--shadow-default)" }}>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-fg-secondary">Total challenges</p>
                    <AnimatedStatValue value={String(previousChallenges.length)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div ref={progressRef} className="h-[9px] w-full rounded-full overflow-hidden" style={{ background: "var(--color-glass-faint)" }}>
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }}
                        animate={progressInView ? { width: `${(previousChallenges.length / lastSeasonChallenges) * 100}%` } : { width: 0 }}
                        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-fg-muted">{Math.round((previousChallenges.length / lastSeasonChallenges) * 100)}% completed</p>
                      <p className="text-xs text-fg-muted">Target {lastSeasonChallenges} challenges</p>
                    </div>
                  </div>
                </div>

                {/* Points breakdown */}
                <div className="h-[220px] p-5 rounded-2xl bg-surface flex flex-col justify-between" style={{ boxShadow: "var(--shadow-default)" }}>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-fg-secondary">Total points</p>
                    <AnimatedStatValue value={String(totalPoints)} />
                  </div>
                  <div ref={barRef} className="-mx-3">
                    <div style={{ height: 72 }}>
                      {barInView && pointsPerChallenge.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pointsPerChallenge} margin={{ top: 0, right: 12, left: 12, bottom: 0 }} barSize={16}>
                            <YAxis hide domain={[0, 'dataMax']} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#687991' }} height={18} />
                            <Tooltip content={(p) => <ChartTooltip {...p} format={(v: number) => `${v} pts`} />} cursor={false} />
                            <Bar dataKey="value" fill="var(--color-accent)" fillOpacity={1} radius={4 as unknown as number} activeBar={{ fill: "#39ff3e", fillOpacity: 0.5, radius: 4 as unknown as number }} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Entries */}
                <div className="h-[220px] p-5 rounded-2xl bg-surface flex flex-col justify-between" style={{ boxShadow: "var(--shadow-default)" }}>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-fg-secondary">Total entries</p>
                    <AnimatedStatValue value={String(totalEntries)} />
                  </div>
                  <div ref={areaRef}>
                    <div style={{ height: 72 }}>
                      {areaInView && entriesPerChallenge.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={entriesPerChallenge} margin={{ top: 4, right: 0, left: 0, bottom: 8 }}>
                            <defs>
                              <linearGradient id="grad-entries" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.12} />
                                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <YAxis hide domain={[0, 'dataMax']} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#687991' }} height={18} padding={{ left: 20, right: 20 }} />
                            <Tooltip content={(p) => <ChartTooltip {...p} />} cursor={{ stroke: "rgba(148,163,184,0.1)" }} />
                            <Area type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={1.5} fill="url(#grad-entries)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Completion rate */}
                <div className="h-[220px] p-5 rounded-2xl bg-surface flex flex-col gap-5" style={{ boxShadow: "var(--shadow-default)" }}>
                  <p className="text-sm text-fg-secondary">Challenge completion rate</p>
                  <div className="flex items-center gap-5">
                    <CircleProgress value={avgCompletion} size={120} />
                    <div className="flex flex-col gap-2">
                      <p className="text-2xl text-fg-primary leading-none">{completionRateText(avgCompletion).headline}</p>
                      <p className="text-xs text-fg-muted leading-5">{completionRateText(avgCompletion).sub}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        <div className="relative w-full" style={{ height: 520 * globeScale }}>
          <div className="absolute pointer-events-none" style={{ top: 0, bottom: "-300px", left: "calc(50% - 50vw)", right: "calc(50% - 50vw)", zIndex: 0 }}>
            <Particles quantity={150} color="#39ff3e" className="w-full h-full" />
          </div>

          <div
            ref={globeWrapRef}
            className="relative w-full max-w-[520px] mx-auto overflow-hidden h-full"
          >
          <div style={{ width: 520, height: 520, transform: `scale(${globeScale})`, transformOrigin: "top center", position: "relative", zIndex: 1, left: "50%", marginLeft: -260 }}>
            <Globe size={520} />

            <div
              className="absolute pointer-events-none"
              aria-hidden="true"
              style={{
                inset: "-2%",
                maskImage: "linear-gradient(rgba(0,0,0,0.1) 40%, #000 48% 100%)",
              }}
            >
              <svg
                viewBox="0 0 300 300"
                style={{
                  width: "100%",
                  height: "100%",
                  animation: "orbit-spin 30s linear infinite",
                }}
              >
                <defs>
                  <path id="orbitPath" d="M 150,150 m -130,0 a 130,130 0 1,0 260,0 a 130,130 0 1,0 -260,0" />
                </defs>
                <text style={{ fontFamily: "var(--font-geist-mono), monospace", fill: "var(--color-accent)", letterSpacing: "0.11em", fontSize: "6px" }}>
                  <textPath href="#orbitPath">
                    {Array(6).fill("GLOBAL PRODUCT EXPERIENCE TEAM · ").join("")}
                  </textPath>
                </text>
              </svg>
            </div>
          </div>
          </div>
        </div>

        <div className="relative" style={{ zIndex: 1 }}>
          <Footer />
        </div>

        </div>
      </div>
      </PageTransition>

      <PromptModal
        challenge={selectedChallenge}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
