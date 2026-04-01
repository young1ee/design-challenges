import { notFound } from "next/navigation";
import { getSeason, getSeasons, getSeasonLeaderboard, getActiveDesigners } from "@/lib/db/queries";
import SeasonClient from "../archive/[season]/SeasonClient";

// Map year string → season number by fetching all seasons
async function seasonNumberFromYear(year: string): Promise<number | null> {
  const y = Number(year);
  if (!y || y < 2000 || y > 2099) return null;
  const seasons = await getSeasons();
  const match = seasons.find((s) => new Date(s.starts_at).getFullYear() === y);
  return match?.number ?? null;
}

export default async function YearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const seasonNumber = await seasonNumberFromYear(year);
  if (!seasonNumber) notFound();

  const [seasonData, leaderboard, allDesigners] = await Promise.all([
    getSeason(seasonNumber).catch(() => null),
    getSeasonLeaderboard(seasonNumber),
    getActiveDesigners(),
  ]);

  if (!seasonData) notFound();

  // ─── Date range ───────────────────────────────────────────────────────────
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  const dateRange = seasonData.starts_at
    ? `${fmt(seasonData.starts_at)}${seasonData.ends_at ? ` – ${fmt(seasonData.ends_at)}` : " – present"}`
    : "";

  // ─── Map challenges ───────────────────────────────────────────────────────
  type DbEntry = {
    id: string;
    title: string | null;
    figma_url: string | null;
    thumbnail_url: string | null;
    designer: { id: string; slug: string; name: string } | null;
  };
  type DbResult = {
    position: number;
    points_awarded: number;
    entry: { designer: { slug: string; name: string } | null } | null;
  };

  const avatarByName = new Map(
    allDesigners.map((d) => [d.name, (d as { avatar_url?: string | null }).avatar_url ?? null])
  );

  const challenges = (seasonData.challenges ?? [])
    .sort((a, b) => new Date(b.challenge_date).getTime() - new Date(a.challenge_date).getTime())
    .map((c) => {
      const date = seasonNumber < 3
        ? String(new Date(c.challenge_date).getFullYear())
        : new Date(c.challenge_date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });
      const moc = seasonNumber < 3
        ? ""
        : (c.master_of_ceremony as unknown as { name: string } | null)?.name ?? "Unknown";

      const entries = ((c.entries ?? []) as unknown as DbEntry[]).map((e) => ({
        id: e.id,
        title: e.title ?? "",
        author: e.designer?.name ?? "",
        authorAvatarUrl: avatarByName.get(e.designer?.name ?? "") ?? undefined,
        thumbnailUrl: e.thumbnail_url ?? undefined,
        prototypeUrl: e.figma_url ?? undefined,
      }));

      const results = ((c.results ?? []) as unknown as DbResult[]).sort(
        (a, b) => a.position - b.position
      );

      const podium = results.slice(0, 3).map((r) => {
        const designerName = r.entry?.designer?.name ?? "";
        const matchingEntry = entries.find((e) => e.author === designerName);
        return {
          name: designerName,
          points: r.points_awarded,
          title: matchingEntry?.title,
          thumbnailUrl: matchingEntry?.thumbnailUrl,
          prototypeUrl: matchingEntry?.prototypeUrl,
          authorAvatarUrl: avatarByName.get(designerName) ?? undefined,
        };
      });

      const month = new Date(c.challenge_date).toLocaleString("en", { month: "short" });

      return {
        id: c.id,
        date,
        month,
        prompt: c.prompt ?? "",
        masterOfCeremony: moc,
        masterOfCeremonyAvatarUrl: avatarByName.get(moc) ?? undefined,
        winner: podium[0]?.name ?? "",
        winnerAvatarUrl: avatarByName.get(podium[0]?.name ?? "") ?? undefined,
        podium,
        entries,
      };
    });

  // ─── Filter leaderboard to designers active during this season ────────────
  const seasonStart = new Date(seasonData.starts_at);
  const seasonEnd = seasonData.ends_at ? new Date(seasonData.ends_at) : new Date("2099-01-01");

  const designerMeta = new Map(allDesigners.map((d) => [d.name, d]));

  const filteredLeaderboard = leaderboard.filter((d) => {
    const meta = designerMeta.get(d.name);
    if (!meta) return true;
    const joined = new Date(meta.joined_at);
    const left = (meta as { left_at?: string | null }).left_at
      ? new Date((meta as { left_at: string }).left_at)
      : null;
    return joined <= seasonEnd && (!left || left >= seasonStart);
  });

  // ─── Map leaderboard ──────────────────────────────────────────────────────
  const mappedLeaderboard = filteredLeaderboard.map((d) => ({
    name: d.name,
    avatarUrl: avatarByName.get(d.name) ?? undefined,
    entries: Number(d.total_entries),
    first: Number(d.first_place),
    second: Number(d.second_place),
    third: Number(d.third_place),
    points: Number(d.total_points),
  }));

  // ─── Eligible designers for completion rate ────────────────────────────────
  const eligibleDesignerCount = allDesigners.filter((d) => {
    const joined = new Date(d.joined_at);
    const left = (d as { left_at?: string | null }).left_at
      ? new Date((d as { left_at: string }).left_at)
      : null;
    return joined <= seasonEnd && (!left || left >= seasonStart);
  }).length;

  // Champion = top of sorted leaderboard
  const champion = mappedLeaderboard[0] ?? null;

  return (
    <SeasonClient
      name={seasonData.name}
      seasonNumber={seasonNumber}
      year={Number(year)}
      dateRange={dateRange}
      challenges={challenges}
      leaderboard={mappedLeaderboard}
      champion={champion}
      heroImageUrl={(seasonData as { hero_image_url?: string | null }).hero_image_url ?? null}
      eligibleDesignerCount={eligibleDesignerCount}
      note={seasonData.note ?? null}
    />
  );
}
