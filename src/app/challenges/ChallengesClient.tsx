"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import SectionLabel from "@/components/SectionLabel";
import PromptCard from "@/components/PromptCard";
import PromptModal from "@/components/PromptModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Entry {
  id: string;
  title: string | null;
  figma_url: string | null;
  thumbnail_url: string | null;
  designer: { id: string; slug: string; name: string } | null;
}

interface Result {
  position: number;
  points_awarded: number;
  entry: { designer: { slug: string; name: string } | null } | null;
}

interface Challenge {
  id: string;
  challenge_date: string;
  prompt: string;
  status: string;
  season: { id: string; number: number; name: string } | null;
  entries: Entry[];
  results: Result[];
}

interface Props {
  challenges: Challenge[];
  seasons: { number: number; name: string }[];
}

// ─── Season pill ──────────────────────────────────────────────────────────────

function SeasonPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition-[transform,color,background-color] duration-150 active:scale-[0.95] cursor-pointer ${
        active ? "bg-elevated text-fg-primary" : "text-fg-muted hover:text-fg-secondary"
      }`}
      style={active ? { boxShadow: "var(--shadow-btn)" } : undefined}
    >
      {label}
    </button>
  );
}

// ─── Client view ─────────────────────────────────────────────────────────────

export default function ChallengesClient({ challenges, seasons }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState(seasons[0]?.number ?? null);

  const filtered = activeSeason
    ? challenges.filter((c) => c.season?.number === activeSeason)
    : challenges;

  const winner = (c: Challenge) => {
    const first = c.results.find((r) => r.position === 1);
    return first?.entry?.designer?.name ?? null;
  };

  const selectedChallenge = challenges.find((c) => c.id === selectedId) ?? null;

  // Map to PromptModal shape
  const modalChallenge = selectedChallenge
    ? {
        id: selectedChallenge.id,
        date: new Date(selectedChallenge.challenge_date).toLocaleDateString("en-US", {
          month: "long", day: "numeric", year: "numeric",
        }),
        prompt: selectedChallenge.prompt,
        masterOfCeremony: "",
        winner: winner(selectedChallenge) ?? "",
        podium: selectedChallenge.results
          .sort((a, b) => a.position - b.position)
          .map((r) => ({ name: r.entry?.designer?.name ?? "", points: r.points_awarded })),
        entries: selectedChallenge.entries.map((e) => ({
          id: e.id,
          title: e.title ?? "",
          author: e.designer?.name ?? "",
        })),
      }
    : null;

  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:gap-20 sm:py-20 min-h-screen">
      <Nav />

      <div
        className="flex flex-col gap-10 w-full max-w-[920px] mx-auto px-4 sm:px-6"
        style={{ animation: "content-reveal 0.7s var(--ease-out) both" }}
      >
        <div className="flex flex-col gap-6 items-center text-center">
          <SectionLabel>All challenges</SectionLabel>
          <h1 className="text-4xl font-medium text-fg-primary leading-10">
            {challenges.length} challenges completed
          </h1>
          <p className="text-base text-fg-muted max-w-sm">
            Every prompt, every entry, every podium — the full archive of GPX design challenges.
          </p>
        </div>

        {/* Season filter */}
        <div className="flex items-center justify-center gap-1 p-1 rounded-full bg-surface w-fit mx-auto" style={{ boxShadow: "var(--shadow-default)" }}>
          {seasons.map((s) => (
            <SeasonPill
              key={s.number}
              label={s.name}
              active={activeSeason === s.number}
              onClick={() => setActiveSeason(s.number)}
            />
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Challenges",    value: filtered.length },
            { label: "Total entries", value: filtered.reduce((s, c) => s + c.entries.length, 0) },
            { label: "Designers",     value: new Set(filtered.flatMap((c) => c.entries.map((e) => e.designer?.slug))).size },
          ].map(({ label, value }) => (
            <div key={label} className="p-5 rounded-2xl bg-surface flex flex-col gap-1" style={{ boxShadow: "var(--shadow-default)" }}>
              <p className="text-sm text-fg-muted">{label}</p>
              <p className="text-3xl font-medium text-fg-primary leading-9">{value}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-6">
          {filtered.map((challenge) => (
            <PromptCard
              key={challenge.id}
              id={challenge.id}
              date={new Date(challenge.challenge_date).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
              prompt={challenge.prompt}
              winner={winner(challenge) ?? ""}
              onOpen={() => setSelectedId(challenge.id)}
            />
          ))}
        </div>
      </div>

      <PromptModal challenge={modalChallenge} onClose={() => setSelectedId(null)} />
    </div>
  );
}
