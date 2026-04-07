"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import confetti from "canvas-confetti";
import {
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import Nav from "@/components/Nav";
import SectionLabel from "@/components/SectionLabel";
import Footer from "@/components/Footer";
import PromptCard from "@/components/PromptCard";
import PromptModal from "@/components/PromptModal";
import PageTransition from "@/components/PageTransition";
import Particles from "@/components/Particles";
import DotGrid from "@/components/DotGrid";

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

export interface SeasonClientProps {
  name: string;
  seasonNumber: number;
  year: number;
  dateRange: string;
  challenges: Challenge[];
  leaderboard: LeaderboardRow[];
  champion: LeaderboardRow | null;
  heroImageUrl: string | null;
  eligibleDesignerCount: number;
  note: string | null;
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
    <div className="px-2.5 py-1.5 rounded-lg bg-elevated text-xs text-fg-primary" style={{ boxShadow: "var(--shadow-default)" }}>
      {format ? format(payload[0].value) : payload[0].value}
    </div>
  );
}

// ─── Leaderboard table ────────────────────────────────────────────────────────

function Leaderboard({ data, seasonNumber }: { data: LeaderboardRow[]; seasonNumber: number }) {
  const simplified = seasonNumber >= 3;

  const cols = simplified
    ? "fit-content(100%) minmax(0,1fr) minmax(0,0.2fr) minmax(0,0.2fr) minmax(0,0.2fr)"
    : "fit-content(100%) minmax(0,1fr) minmax(0,0.2fr) minmax(0,0.2fr) minmax(0,0.2fr) minmax(0,0.2fr) minmax(0,0.2fr)";

  const headers = simplified ? ["Entries", "1st", "Points"] : ["Entries", "1st", "2nd", "3rd", "Points"];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="w-full overflow-x-auto">
        <div style={{ display: "grid", gridTemplateColumns: cols, rowGap: "2px", minWidth: simplified ? 320 : 420 }}>
          <div className="contents">
            <div className="px-3 py-1.5"><span className="text-xs text-fg-muted">#</span></div>
            <div className="px-3 py-1.5"><span className="text-xs text-fg-muted">Designer</span></div>
            {headers.map((l) => (
              <div key={l} className="px-3 py-1.5 flex justify-center">
                <span className="text-xs text-fg-muted">{l}</span>
              </div>
            ))}
          </div>

          {data.map((row, i) => {
            const cells = simplified
              ? [row.entries, row.first]
              : [row.entries, row.first, row.second, row.third];
            return (
              <div key={row.name} className="contents">
                <div className="px-3 py-2.5 flex items-center rounded-l-lg" style={{ background: "rgba(180,188,208,0.04)" }}>
                  <span className="text-xs text-fg-muted tabular-nums">{i + 1}.</span>
                </div>
                <div className="px-3 py-2.5 flex items-center gap-2" style={{ background: "rgba(180,188,208,0.04)" }}>
                  <div className="w-5 h-5 rounded-full bg-elevated flex items-center justify-center text-[10px] text-fg-muted font-medium shrink-0 overflow-hidden">
                    {row.avatarUrl
                      ? <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                      : row.name.slice(0, 2).toUpperCase()
                    }
                  </div>
                  <span className="text-sm text-fg-primary">{row.name}</span>
                </div>
                {cells.map((val, j) => (
                  <div key={j} className="px-3 py-2.5 flex items-center justify-center" style={{ background: "rgba(180,188,208,0.04)" }}>
                    <span className="text-sm text-fg-secondary tabular-nums">{val}</span>
                  </div>
                ))}
                <div className="px-3 py-2.5 flex items-center justify-center rounded-r-lg" style={{ background: "rgba(180,188,208,0.04)" }}>
                  <span className="text-sm text-fg-primary tabular-nums">{row.points}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-fg-muted text-center">
        {simplified ? (
          <>1st · 10pts <span className="mx-2" style={{ color: "var(--color-line)" }}>/</span> Entry · 2pts</>
        ) : (
          <>1st · 10pts <span className="mx-2" style={{ color: "var(--color-line)" }}>/</span> 2nd · 6pts <span className="mx-2" style={{ color: "var(--color-line)" }}>/</span> 3rd · 4pts <span className="mx-2" style={{ color: "var(--color-line)" }}>/</span> Entry · 2pts</>
        )}
      </p>
    </div>
  );
}

// ─── Completion rate label ─────────────────────────────────────────────────────

function completionRateText(rate: number): { headline: string; sub: string } {
  if (rate === 100) return { headline: "Perfect", sub: "Everyone showed up every time." };
  if (rate >= 80)   return { headline: "Great", sub: "Almost everyone is participating." };
  if (rate >= 60)   return { headline: "Good", sub: "Most people are showing up." };
  if (rate >= 40)   return { headline: "Average", sub: "Some people should get off the bench." };
  return             { headline: "Poor", sub: "Someone needs a pep talk." };
}

// ─── Season 3+ layout ─────────────────────────────────────────────────────────

function Season3Layout({
  name, year, dateRange, challenges, leaderboard, champion, heroImageUrl, eligibleDesignerCount, seasonNumber, note,
  selectedId, setSelectedId,
}: SeasonClientProps & { selectedId: string | null; setSelectedId: (id: string | null) => void }) {
  const barRef = useRef<HTMLDivElement>(null);
  const barInView = useInView(barRef, { once: true });
  const challengeBarRef = useRef<HTMLDivElement>(null);
  const challengeBarInView = useInView(challengeBarRef, { once: true });
  const areaRef = useRef<HTMLDivElement>(null);
  const areaInView = useInView(areaRef, { once: true });
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (!heroInView || !champion) return;
    const fire = () => {
      const opts = {
        particleCount: 60,
        spread: 55,
        startVelocity: 45,
        colors: ["#39ff3e", "#372165", "#fbbf24"],
        ticks: 200,
        gravity: 0.9,
        scalar: 0.9,
      };
      confetti({ ...opts, origin: { x: 0.2, y: 0.6 }, angle: 60 });
      confetti({ ...opts, origin: { x: 0.8, y: 0.6 }, angle: 120 });
    };
    const t1 = setTimeout(fire, 3000);
    return () => clearTimeout(t1);
  }, [heroInView, champion]);

  const totalPoints = leaderboard.reduce((sum, d) => sum + d.points, 0);
  const totalEntries = leaderboard.reduce((sum, d) => sum + d.entries, 0);

  // Aggregate chart data by month (oldest → newest)
  const monthEntries: Record<string, number> = {};
  const monthPoints: Record<string, number> = {};
  const monthChallenges: Record<string, number> = {};
  const monthOrder: string[] = [];

  for (const c of [...challenges].reverse()) {
    const { month } = c;
    if (!monthOrder.includes(month)) monthOrder.push(month);
    monthEntries[month] = (monthEntries[month] ?? 0) + c.entries.length;
    monthPoints[month] = (monthPoints[month] ?? 0) +
      c.podium.reduce((sum, p) => sum + p.points, 0) +
      Math.max(0, c.entries.length - c.podium.length) * 2;
    monthChallenges[month] = (monthChallenges[month] ?? 0) + 1;
  }

  const entriesPerMonth    = monthOrder.map((month) => ({ month, value: monthEntries[month] }));
  const pointsPerMonth     = monthOrder.map((month) => ({ month, value: monthPoints[month] }));
  const challengesPerMonth = monthOrder.map((month) => ({ month, value: monthChallenges[month] }));

  const completionTrend = challenges.map((c) => ({
    value: Math.round((c.entries.length / Math.max(eligibleDesignerCount, 1)) * 100),
  }));
  const avgCompletion = completionTrend.length > 0
    ? Math.round(completionTrend.reduce((sum, d) => sum + d.value, 0) / completionTrend.length)
    : 0;

  return (
    <div className="flex flex-col gap-20 w-full max-w-[920px] mx-auto px-4 sm:px-6">

      {/* Hero — champion */}
      {champion && (
        <section ref={heroRef} className="relative flex flex-col items-center gap-6 text-center">
          <div className="absolute pointer-events-none" style={{ top: "-120px", bottom: "-120px", left: "calc(50% - 50vw)", right: "calc(50% - 50vw)", zIndex: -1 }}>
            <DotGrid repelRadius={120} repelStrength={8} gap={20} dotSize={1} restColor="#39ff3e" color="#9333ea" className="w-full h-full" />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, transparent 20%, var(--color-canvas) 80%)" }} />
          </div>
          <div
            className="relative z-10 inline-flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ border: "0.5px solid var(--color-line)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-fg-muted">
              <path d="M8 21h8M12 17v4M7 4H4v4a5 5 0 0 0 3 4.58M17 4h3v4a5 5 0 0 1-3 4.58M12 17a5 5 0 0 1-5-5V4h10v8a5 5 0 0 1-5 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm text-fg-muted">{year} Champion</span>
          </div>
          <div className="relative z-10 w-[120px] h-[120px] rounded-full bg-elevated flex items-center justify-center text-2xl text-fg-muted font-medium overflow-hidden">
            {champion.avatarUrl
              ? <img src={champion.avatarUrl} alt={champion.name} className="w-full h-full object-cover" />
              : champion.name.slice(0, 2).toUpperCase()
            }
          </div>
          <p className="text-[36px] text-fg-primary leading-10 tracking-[-0.8px]">{champion.name}</p>
          <div className="flex items-start justify-center gap-12">
            {[
              { label: "Points",  value: champion.points },
              { label: "Entries", value: champion.entries },
              { label: "Wins",    value: champion.first },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <p className="text-sm text-fg-muted">{label}</p>
                <p className="text-[30px] text-fg-primary leading-9 tracking-[-0.8px]">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Challenges */}
      {challenges.length > 0 && (
        <section className="flex flex-col gap-8 items-center">
          <SectionLabel>{year} Challenges</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
            {challenges.map((challenge) => (
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
            <div className="w-full p-5 rounded-2xl bg-surface flex flex-col gap-4" style={{ boxShadow: "var(--shadow-default)" }}>
              <p className="text-base text-fg-secondary">Leaderboard</p>
              <Leaderboard data={leaderboard} seasonNumber={seasonNumber} />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

              {/* Total challenges */}
              <div className="h-[220px] p-5 rounded-2xl bg-surface flex flex-col justify-between" style={{ boxShadow: "var(--shadow-default)" }}>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-fg-secondary">Total challenges</p>
                  <AnimatedStatValue value={String(challenges.length)} />
                </div>
                <div ref={challengeBarRef} className="-mx-3">
                  <div style={{ height: 72 }}>
                    {challengeBarInView && challengesPerMonth.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={challengesPerMonth} margin={{ top: 0, right: 12, left: 12, bottom: 0 }} barSize={16}>
                          <YAxis hide domain={[0, "dataMax"]} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#687991" }} height={18} />
                          <Tooltip content={(p) => <ChartTooltip {...p} format={(v: number) => `${v} challenge${v !== 1 ? "s" : ""}`} />} cursor={false} />
                          <Bar dataKey="value" fill="var(--color-accent)" fillOpacity={1} radius={4 as unknown as number} activeBar={{ fill: "#39ff3e", fillOpacity: 0.5, radius: 4 as unknown as number }} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Total points */}
              <div className="h-[220px] p-5 rounded-2xl bg-surface flex flex-col justify-between" style={{ boxShadow: "var(--shadow-default)" }}>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-fg-secondary">Total points</p>
                  <AnimatedStatValue value={String(totalPoints)} />
                </div>
                <div ref={barRef} className="-mx-3">
                  <div style={{ height: 72 }}>
                    {barInView && pointsPerMonth.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pointsPerMonth} margin={{ top: 0, right: 12, left: 12, bottom: 0 }} barSize={16}>
                          <YAxis hide domain={[0, "dataMax"]} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#687991" }} height={18} />
                          <Tooltip content={(p) => <ChartTooltip {...p} format={(v: number) => `${v} pts`} />} cursor={false} />
                          <Bar dataKey="value" fill="var(--color-accent)" fillOpacity={1} radius={4 as unknown as number} activeBar={{ fill: "#39ff3e", fillOpacity: 0.5, radius: 4 as unknown as number }} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Total entries */}
              <div className="h-[220px] p-5 rounded-2xl bg-surface flex flex-col justify-between" style={{ boxShadow: "var(--shadow-default)" }}>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-fg-secondary">Total entries</p>
                  <AnimatedStatValue value={String(totalEntries)} />
                </div>
                <div ref={areaRef}>
                  <div style={{ height: 72 }}>
                    {areaInView && entriesPerMonth.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={entriesPerMonth} margin={{ top: 4, right: 0, left: 0, bottom: 8 }}>
                          <defs>
                            <linearGradient id="grad-season-entries" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.12} />
                              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <YAxis hide domain={[0, "dataMax"]} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#687991" }} height={18} padding={{ left: 20, right: 20 }} />
                          <Tooltip content={(p) => <ChartTooltip {...p} />} cursor={{ stroke: "rgba(148,163,184,0.1)" }} />
                          <Area type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={1.5} fill="url(#grad-season-entries)" dot={false} />
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

      {note && <p className="text-sm text-fg-muted text-center">{note}</p>}

      <div className="relative w-full" style={{ height: 80 }}>
        <div className="absolute pointer-events-none" style={{ top: "-80px", bottom: "-120px", left: "calc(50% - 50vw)", right: "calc(50% - 50vw)", zIndex: 0 }}>
          <Particles quantity={150} color="#39ff3e" className="w-full h-full" />
        </div>
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <Footer />
      </div>
    </div>
  );
}

// ─── Seasons 1–2 layout ───────────────────────────────────────────────────────

function OldSeasonLayout({
  year, challenges, leaderboard, champion, eligibleDesignerCount, seasonNumber, note,
  selectedId, setSelectedId,
}: SeasonClientProps & { selectedId: string | null; setSelectedId: (id: string | null) => void }) {
  const featuredChallenge = challenges[0] ?? null; // most recent
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (!heroInView || !champion) return;
    const fire = () => {
      const opts = {
        particleCount: 60,
        spread: 55,
        startVelocity: 45,
        colors: ["#39ff3e", "#372165", "#fbbf24"],
        ticks: 200,
        gravity: 0.9,
        scalar: 0.9,
      };
      confetti({ ...opts, origin: { x: 0.2, y: 0.6 }, angle: 60 });
      confetti({ ...opts, origin: { x: 0.8, y: 0.6 }, angle: 120 });
    };
    const t1 = setTimeout(fire, 3000);
    return () => clearTimeout(t1);
  }, [heroInView, champion]);

  const completionTrend = challenges.map((c) => ({
    value: Math.round((c.entries.length / Math.max(eligibleDesignerCount, 1)) * 100),
  }));
  const avgCompletion = completionTrend.length > 0
    ? Math.round(completionTrend.reduce((sum, d) => sum + d.value, 0) / completionTrend.length)
    : 0;

  // Simplified leaderboard: # | Designer | Points only
  const oldCols = "fit-content(100%) minmax(0,1fr) minmax(0,0.2fr)";

  return (
    <div className="flex flex-col gap-20 w-full max-w-[920px] mx-auto px-4 sm:px-6">

      {/* Hero */}
      {champion && (
        <section ref={heroRef} className="relative flex flex-col items-center gap-6 text-center">
          <div className="absolute pointer-events-none" style={{ top: "-120px", bottom: "-120px", left: "calc(50% - 50vw)", right: "calc(50% - 50vw)", zIndex: -1 }}>
            <DotGrid repelRadius={120} repelStrength={8} gap={20} dotSize={1} restColor="#39ff3e" color="#9333ea" className="w-full h-full" />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, transparent 20%, var(--color-canvas) 80%)" }} />
          </div>
          <div
            className="relative z-10 inline-flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ border: "0.5px solid var(--color-line)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-fg-muted">
              <path d="M8 21h8M12 17v4M7 4H4v4a5 5 0 0 0 3 4.58M17 4h3v4a5 5 0 0 1-3 4.58M12 17a5 5 0 0 1-5-5V4h10v8a5 5 0 0 1-5 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm text-fg-muted">{year} Champion</span>
          </div>
          <div className="relative z-10 w-[120px] h-[120px] rounded-full bg-elevated flex items-center justify-center text-2xl text-fg-muted font-medium overflow-hidden">
            {champion.avatarUrl
              ? <img src={champion.avatarUrl} alt={champion.name} className="w-full h-full object-cover" />
              : champion.name.slice(0, 2).toUpperCase()
            }
          </div>
          <p className="text-[36px] text-fg-primary leading-10 tracking-[-0.8px]">{champion.name}</p>
        </section>
      )}

      {/* Stats */}
      <section className="flex flex-col gap-4">

        {/* Featured challenge + completion rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Featured challenge */}
          {featuredChallenge && (
            <PromptCard
              id={featuredChallenge.id}
              date={featuredChallenge.date}
              prompt={featuredChallenge.prompt}
              winner={featuredChallenge.winner}
              winnerAvatarUrl={featuredChallenge.winnerAvatarUrl}
              entries={featuredChallenge.entries}
              onOpen={() => setSelectedId(featuredChallenge.id)}
            />
          )}

          {/* Completion rate */}
          <div
            className="h-[220px] p-5 rounded-2xl bg-surface flex flex-col gap-5"
            style={{ boxShadow: "var(--shadow-default)" }}
          >
            <p className="text-sm text-fg-secondary">Challenge completion rate</p>
            <div className="flex items-center gap-5 flex-1">
              <CircleProgress value={avgCompletion} size={120} />
              <div className="flex flex-col gap-2">
                <p className="text-2xl text-fg-primary leading-none">{completionRateText(avgCompletion).headline}</p>
                <p className="text-xs text-fg-muted leading-5">{completionRateText(avgCompletion).sub}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="w-full p-5 rounded-2xl bg-surface flex flex-col gap-4" style={{ boxShadow: "var(--shadow-default)" }}>
            <p className="text-base text-fg-secondary">Leaderboard</p>
            <div className="w-full overflow-x-auto">
              <div style={{ display: "grid", gridTemplateColumns: oldCols, rowGap: "2px", minWidth: 280 }}>
                {/* Header */}
                <div className="contents">
                  <div className="px-3 py-1.5"><span className="text-xs text-fg-muted">#</span></div>
                  <div className="px-3 py-1.5"><span className="text-xs text-fg-muted">Designer</span></div>
                  <div className="px-3 py-1.5 flex justify-center"><span className="text-xs text-fg-muted">Points</span></div>
                </div>
                {/* Rows */}
                {leaderboard.map((row, i) => (
                  <div key={row.name} className="contents">
                    <div className="px-3 py-2.5 flex items-center rounded-l-lg" style={{ background: "rgba(180,188,208,0.04)" }}>
                      <span className="text-xs text-fg-muted tabular-nums">{i + 1}.</span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center gap-2" style={{ background: "rgba(180,188,208,0.04)" }}>
                      <div className="w-5 h-5 rounded-full bg-elevated flex items-center justify-center text-[10px] text-fg-muted font-medium shrink-0 overflow-hidden">
                        {row.avatarUrl
                          ? <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                          : row.name.slice(0, 2).toUpperCase()
                        }
                      </div>
                      <span className="text-sm text-fg-primary">{row.name}</span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-center rounded-r-lg" style={{ background: "rgba(180,188,208,0.04)" }}>
                      <span className="text-sm text-fg-primary tabular-nums">{row.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-fg-muted text-center">
              1st · 10pts <span className="mx-2" style={{ color: "var(--color-line)" }}>/</span> 2nd · 6pts <span className="mx-2" style={{ color: "var(--color-line)" }}>/</span> 3rd · 4pts <span className="mx-2" style={{ color: "var(--color-line)" }}>/</span> Entry · 2pts
            </p>
          </div>
        )}
      </section>

      {note && <p className="text-sm text-fg-muted text-center">{note}</p>}

      <div className="relative w-full" style={{ height: 80 }}>
        <div className="absolute pointer-events-none" style={{ top: "-80px", bottom: "-120px", left: "calc(50% - 50vw)", right: "calc(50% - 50vw)", zIndex: 0 }}>
          <Particles quantity={150} color="#39ff3e" className="w-full h-full" />
        </div>
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <Footer />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeasonClient(props: SeasonClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedChallenge = props.challenges.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:gap-20 sm:py-20 min-h-screen">
      <Nav />

      <PageTransition>
        {props.seasonNumber >= 3 ? (
          <Season3Layout {...props} selectedId={selectedId} setSelectedId={setSelectedId} />
        ) : (
          <OldSeasonLayout {...props} selectedId={selectedId} setSelectedId={setSelectedId} />
        )}
      </PageTransition>

      <PromptModal
        challenge={selectedChallenge}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
