import OverviewClient from "./OverviewClient";
import { getSeasons, getActiveDesigners, getSeasonLeaderboard } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { getPhotoOrder, getPhotoDescriptions } from "@/app/actions/settings";

export default async function OverviewPage() {
  const supabase = await createClient();
  const [seasons, allDesigners] = await Promise.all([
    getSeasons(),
    getActiveDesigners(),
  ]);

  // Fetch all overview collage photos from storage, ordered by saved photo_order
  const [{ data: photoFiles }, photoOrder, photoDescriptions] = await Promise.all([
    supabase.storage.from("photos").list("overview"),
    getPhotoOrder(),
    getPhotoDescriptions(),
  ]);
  const files = photoFiles ?? [];
  const ordered = [
    ...photoOrder.map((name) => files.find((f) => f.name === name)).filter(Boolean),
    ...files.filter((f) => !photoOrder.includes(f.name)),
  ] as typeof files;
  const allPhotos = ordered.map((f) => {
    const url = supabase.storage.from("photos").getPublicUrl(`overview/${f.name}`).data.publicUrl;
    return { url: `${url}?t=${f.updated_at ?? f.created_at ?? ""}`, alt: photoDescriptions[f.name] ?? "" };
  });
  const photos = allPhotos.slice(0, 5);
  const sortedSeasons = [...seasons].sort((a, b) => a.number - b.number); // oldest → newest for charts

  // Fetch leaderboard for each season in parallel
  const leaderboards = await Promise.all(
    sortedSeasons.map((s) => getSeasonLeaderboard(s.number))
  );

  // ─── Helper: resolve season end date ─────────────────────────────────────
  // Use ends_at if set; otherwise use the next season's starts_at; fallback to today
  function seasonEndDate(i: number): Date {
    const s = sortedSeasons[i];
    if (s.ends_at) return new Date(s.ends_at);
    const next = sortedSeasons[i + 1];
    if (next) return new Date(next.starts_at);
    return new Date();
  }

  function isEligible(designer: typeof allDesigners[0], seasonIdx: number): boolean {
    const s = sortedSeasons[seasonIdx];
    const seasonStart = new Date(s.starts_at);
    const seasonEnd = seasonEndDate(seasonIdx);
    const joined = new Date(designer.joined_at);
    const left = (designer as { left_at?: string | null }).left_at
      ? new Date((designer as { left_at: string }).left_at)
      : null;
    return joined <= seasonEnd && (!left || left >= seasonStart);
  }

  // ─── Per-season trend data ────────────────────────────────────────────────
  const trend = sortedSeasons.map((s, i) => {
    const lb = leaderboards[i];
    const allChallenges = s.challenges ?? [];
    const challenges = allChallenges.filter((c) => c.status !== "open");
    const entries = challenges.flatMap((c) => c.entries ?? []);
    const challengeCount = allChallenges.length;
    const entryCount = entries.length;
    const designerCount = allDesigners.filter((d) => isEligible(d, i)).length;
    const uniqueWinners = lb.filter((d) => Number(d.first_place) > 0).length;
    const avgEntries = challengeCount > 0 ? +(entryCount / challengeCount).toFixed(1) : 0;

    const eligibleCount = designerCount;
    const participation =
      eligibleCount > 0 && challengeCount > 0
        ? Math.round((entryCount / (challengeCount * eligibleCount)) * 100)
        : 0;

    const year = new Date(s.starts_at).getFullYear().toString();
    return { year, challengeCount, entryCount, designerCount, uniqueWinners, avgEntries, participation };
  });

  // ─── Current totals ───────────────────────────────────────────────────────
  const totalChallenges = trend.reduce((s, t) => s + t.challengeCount, 0);
  const totalEntries    = trend.reduce((s, t) => s + t.entryCount, 0);
  const totalDesigners  = allDesigners.filter((d) => d.is_active).length;
  const uniqueWinners   = new Set(
    leaderboards.flatMap((lb) =>
      lb.filter((d) => Number(d.first_place) > 0).map((d) => d.slug)
    )
  ).size;
  const participation   = trend.length > 0
    ? Math.round(trend.reduce((s, t) => s + t.participation, 0) / trend.length)
    : 0;
  const avgEntries      = totalChallenges > 0 ? +(totalEntries / totalChallenges).toFixed(1) : 0;

  const stats = [
    {
      label: "Total challenges",
      value: String(totalChallenges),
      chart: "bar" as const,
      trend: trend.map((t) => ({ s: t.year, v: t.challengeCount })),
    },
    {
      label: "Total entries",
      value: String(totalEntries),
      chart: "area" as const,
      trend: trend.map((t) => ({ s: t.year, v: t.entryCount })),
    },
    {
      label: "Active designers",
      value: String(totalDesigners),
      chart: "bar" as const,
      trend: trend.map((t) => ({ s: t.year, v: t.designerCount })),
    },
    {
      label: "Participation %",
      value: `${participation}%`,
      chart: "area" as const,
      trend: trend.map((t) => ({ s: t.year, v: t.participation })),
    },
    {
      label: "Avg entries / challenge",
      value: String(avgEntries),
      chart: "area" as const,
      trend: trend.map((t) => ({ s: t.year, v: t.avgEntries })),
    },
    {
      label: "Unique winners",
      value: String(uniqueWinners),
      chart: "bar" as const,
      trend: trend.map((t) => ({ s: t.year, v: t.uniqueWinners })),
    },
  ];

  // ─── Champion years per designer ─────────────────────────────────────────
  // For each completed season, find the slug with the highest total_points
  const championYearsBySlug = new Map<string, number[]>();
  sortedSeasons.forEach((s, i) => {
    if (!s.ends_at) return; // skip ongoing season
    const lb = leaderboards[i];
    if (!lb.length) return;
    const winner = lb.reduce((best, d) =>
      Number(d.total_points) > Number(best.total_points) ? d : best
    );
    const year = new Date(s.starts_at).getFullYear();
    const existing = championYearsBySlug.get(winner.slug) ?? [];
    championYearsBySlug.set(winner.slug, [...existing, year]);
  });

  // ─── All-time per-designer stats ─────────────────────────────────────────
  const allTimeStats = new Map<string, { entries: number; wins: number }>();
  leaderboards.forEach((lb) => {
    lb.forEach((d) => {
      const prev = allTimeStats.get(d.slug) ?? { entries: 0, wins: 0 };
      allTimeStats.set(d.slug, {
        entries: prev.entries + Number(d.total_entries),
        wins: prev.wins + Number(d.first_place),
      });
    });
  });

  // ─── Per-designer participation % ────────────────────────────────────────
  // Total eligible challenges = sum of challenges in seasons the designer was part of
  const eligibleChallengesBySlug = new Map<string, number>();
  allDesigners.forEach((d) => {
    const joinedDate = d.joined_at.slice(0, 10); // "YYYY-MM-DD"
    const leftDate = (d as { left_at?: string | null }).left_at
      ? (d as { left_at: string }).left_at.slice(0, 10)
      : null;
    let eligible = 0;
    sortedSeasons.forEach((s, i) => {
      if (isEligible(d, i)) {
        eligible += (s.challenges ?? []).filter((c) => {
          if (c.status === "open") return false;
          if (c.challenge_date < joinedDate) return false;
          if (leftDate && c.challenge_date > leftDate) return false;
          return true;
        }).length;
      }
    });
    eligibleChallengesBySlug.set(d.slug, eligible);
  });

  // ─── Designers ─────────────────────────────────────────────────────────────
  const mappedDesigners = allDesigners.map((d) => {
    const leftAt = (d as { left_at?: string | null }).left_at;
    const dateLabel = leftAt
      ? `Last seen ${new Date(leftAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`
      : `Since ${new Date(d.joined_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
    const subtitle = [d.location, dateLabel].filter(Boolean).join(" · ");
    const stats = allTimeStats.get(d.slug) ?? { entries: 0, wins: 0 };
    const eligible = eligibleChallengesBySlug.get(d.slug) ?? 0;
    const participationPct = eligible > 0
      ? `${Math.round((stats.entries / eligible) * 100)}%`
      : "0%";

    return {
      slug: d.slug,
      name: d.name,
      subtitle,
      entries: stats.entries,
      wins: stats.wins,
      participation: participationPct,
      isActive: d.is_active,
      championYears: championYearsBySlug.get(d.slug) ?? [],
      avatarUrl: (d as { avatar_url?: string | null }).avatar_url ?? null,
    };
  });

  return <OverviewClient stats={stats} designers={mappedDesigners} photos={photos} allPhotos={allPhotos} />;
}
