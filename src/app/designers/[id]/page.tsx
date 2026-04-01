import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import SectionLabel from "@/components/SectionLabel";
import EntryCard from "@/components/EntryCard";
import { getDesigner, getDesignerHistory, getSeasonLeaderboard } from "@/lib/db/queries";

// ─── Placement badge ──────────────────────────────────────────────────────────

function PlacementBadge({ placement }: { placement: number | null }) {
  if (placement === null) return <span className="text-xs text-fg-muted">Participated</span>;
  const labels: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
  const colors: Record<number, string> = { 1: "text-warning", 2: "text-fg-secondary", 3: "text-fg-muted" };
  return (
    <span className={`text-xs font-medium ${colors[placement] ?? "text-fg-muted"}`}>
      {labels[placement] ?? `${placement}th`}
    </span>
  );
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DesignerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [designer, history, leaderboard] = await Promise.all([
    getDesigner(id),
    getDesignerHistory(id).catch(() => []),
    getSeasonLeaderboard(4),
  ]);

  if (!designer) notFound();

  const stats = leaderboard.find((d) => d.slug === id);
  const rank = leaderboard.findIndex((d) => d.slug === id) + 1;

  // Build history entries with placement from results
  const historyRows = (history as never[]).map((e: {
    id: string;
    title: string | null;
    challenge: { id: string; challenge_date: string; prompt: string; season: { number: number; name: string } } | null;
  }) => {
    return {
      entryId:     e.id,
      challengeId: e.challenge?.id ?? "",
      date: e.challenge
        ? new Date(e.challenge.challenge_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "",
      prompt:      e.challenge?.prompt ?? "",
      entryTitle:  e.title ?? "",
      season:      e.challenge?.season?.name ?? "",
    };
  });

  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:gap-20 sm:py-20 min-h-screen">
      <Nav />

      <div
        className="flex flex-col gap-12 w-full max-w-[920px] mx-auto px-4 sm:px-6"
        style={{ animation: "content-reveal 0.7s cubic-bezier(0.23, 1, 0.32, 1) both" }}
      >
        <Link
          href="/designers"
          className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg-secondary transition-[transform,color] duration-150 active:scale-[0.97] w-fit"
        >
          <BackArrow />
          All designers
        </Link>

        {/* Profile header */}
        <div className="p-8 rounded-2xl bg-surface flex gap-8 items-start" style={{ boxShadow: "var(--shadow-default)" }}>
          <div className="w-20 h-20 rounded-full bg-elevated flex items-center justify-center text-xl text-fg-secondary font-medium shrink-0">
            {designer.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-medium text-fg-primary leading-9">{designer.name}</h1>
              {rank > 0 && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-elevated">
                  <span className="text-xs text-fg-muted">#{rank} this season</span>
                </div>
              )}
            </div>
            <p className="text-sm text-fg-muted">{designer.role ?? "Designer"}</p>
            {designer.location && (
              <p className="text-sm text-fg-muted">{designer.location}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Points",    value: stats ? Number(stats.total_points)  : 0 },
            { label: "Entries",   value: stats ? Number(stats.total_entries) : 0 },
            { label: "1st place", value: stats ? Number(stats.first_place)   : 0 },
            { label: "2nd place", value: stats ? Number(stats.second_place)  : 0 },
            { label: "3rd place", value: stats ? Number(stats.third_place)   : 0 },
          ].map(({ label, value }) => (
            <div key={label} className="p-5 rounded-2xl bg-surface flex flex-col gap-1" style={{ boxShadow: "var(--shadow-default)" }}>
              <p className="text-xs text-fg-muted">{label}</p>
              <p className="text-2xl font-medium text-fg-primary tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Entries */}
        {historyRows.length > 0 && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <SectionLabel>Entries</SectionLabel>
              <span className="text-sm text-fg-muted">{historyRows.length} total</span>
            </div>
            <div className="flex flex-wrap gap-6">
              {historyRows.map((entry) => (
                <EntryCard key={entry.entryId} title={entry.entryTitle} author={designer.name} />
              ))}
            </div>
          </section>
        )}

        {/* Challenge history */}
        {historyRows.length > 0 && (
          <section className="flex flex-col gap-6">
            <SectionLabel>Challenge history</SectionLabel>
            <div className="w-full rounded-2xl bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-default)" }}>
              {historyRows.map((entry, i) => (
                <div key={entry.entryId}>
                  <div className="flex items-center gap-4 px-6 py-4">
                    <p className="text-xs text-fg-muted w-20 shrink-0 tabular-nums">{entry.date}</p>
                    <p className="text-xs text-fg-muted shrink-0">{entry.season}</p>
                    <p className="text-sm text-fg-secondary flex-1 line-clamp-1">{entry.prompt}</p>
                    <p className="text-sm text-fg-muted shrink-0">{entry.entryTitle}</p>
                  </div>
                  {i < historyRows.length - 1 && <div className="h-[0.5px] bg-line mx-6" />}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
