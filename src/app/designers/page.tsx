import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import SectionLabel from "@/components/SectionLabel";
import { getSeasonLeaderboard } from "@/lib/db/queries";

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) return null;
  const colors: Record<number, string> = { 1: "text-warning", 2: "text-fg-secondary", 3: "text-fg-muted" };
  const labels: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
  return <span className={`text-xs font-medium ${colors[rank]}`}>{labels[rank]}</span>;
}

// ─── Designer card ────────────────────────────────────────────────────────────

function DesignerCard({ designer, rank }: {
  designer: { slug: string; name: string; role: string | null; total_points: number; total_entries: number; first_place: number; second_place: number };
  rank: number;
}) {
  return (
    <Link
      href={`/designers/${designer.slug}`}
      className="group flex flex-col gap-6 p-6 rounded-2xl bg-surface hover:bg-elevated transition-[transform,background-color] duration-150 active:scale-[0.99] cursor-pointer"
      style={{ boxShadow: "var(--shadow-default)" }}
    >
      <div className="flex items-start justify-between">
        <Avatar name={designer.name} className="w-12 h-12 text-sm" />
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-elevated">
          <span className="text-xs text-fg-muted tabular-nums">#{rank}</span>
          <RankBadge rank={rank} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-fg-primary">{designer.name}</p>
        <p className="text-sm text-fg-muted">{designer.role ?? "Designer"}</p>
      </div>

      <div className="h-[0.5px] bg-line" />

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Points",   value: designer.total_points },
          { label: "Entries",  value: designer.total_entries },
          { label: "1st",      value: designer.first_place },
          { label: "2nd",      value: designer.second_place },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <p className="text-xs text-fg-muted">{label}</p>
            <p className="text-sm font-medium text-fg-secondary tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DesignersPage() {
  // Show current season (4) leaderboard, only designers with at least one entry
  const leaderboard = await getSeasonLeaderboard(4);
  const active = leaderboard.filter((d) => Number(d.total_entries) > 0);

  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:gap-20 sm:py-20 min-h-screen">
      <Nav />

      <div
        className="flex flex-col gap-10 w-full max-w-[920px] mx-auto px-4 sm:px-6"
        style={{ animation: "content-reveal 0.7s var(--ease-out) both" }}
      >
        <div className="flex flex-col gap-6 items-center text-center">
          <SectionLabel>Season 4</SectionLabel>
          <h1 className="text-4xl font-medium text-fg-primary leading-10">
            {active.length} designers
          </h1>
          <p className="text-base text-fg-muted max-w-sm">
            The people behind every submission. Ranked by points earned this season.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {active.map((designer, i) => (
            <DesignerCard key={designer.slug} designer={designer} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
