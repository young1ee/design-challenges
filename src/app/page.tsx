import HomeClient from "./HomeClient";
import {
  getMostRecentChallenge,
  getSeasonChallenges,
  getSeasonLeaderboard,
  getActiveDesigners,
} from "@/lib/db/queries";

export default async function HomePage() {
  const [mostRecentChallenge, previousChallenges, leaderboard, allDesigners] = await Promise.all([
    getMostRecentChallenge(),
    getSeasonChallenges(4, "closed"),
    getSeasonLeaderboard(4),
    getActiveDesigners(),
  ]);

  // ─── Map current challenge (most recent, open or closed) ──────────────────
  const currentChallenge = mostRecentChallenge
    ? {
        prompt: mostRecentChallenge.prompt ?? "",
        challengeDate: mostRecentChallenge.challenge_date,
        isOpen: mostRecentChallenge.status === "open",
      }
    : null;

  // ─── Map previous challenges (exclude the one shown in hero) ──────────────
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

  const mappedChallenges = previousChallenges
    .map((c) => {
      const date = new Date(c.challenge_date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const month = new Date(c.challenge_date).toLocaleString("en", { month: "short" });
    const moc =
      (c.master_of_ceremony as unknown as { name: string } | null)?.name ?? "Unknown";

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

  // ─── Filter leaderboard to designers active in season 4 (2026) ────────────
  const season4Start = new Date("2026-01-01");
  const designerMeta = new Map(allDesigners.map((d) => [d.name, d]));

  const filteredLeaderboard = leaderboard.filter((d) => {
    const meta = designerMeta.get(d.name);
    if (!meta) return true;
    const left = (meta as { left_at?: string | null }).left_at
      ? new Date((meta as { left_at: string }).left_at)
      : null;
    return !left || left >= season4Start;
  });

  // Eligible = all designers who were part of the group at season start
  const eligibleDesignerCount = allDesigners.filter((d) => {
    const left = (d as { left_at?: string | null }).left_at
      ? new Date((d as { left_at: string }).left_at)
      : null;
    return !left || left >= season4Start;
  }).length;

  // ─── Map leaderboard ───────────────────────────────────────────────────────
  const mappedLeaderboard = filteredLeaderboard.map((d) => ({
    name: d.name,
    avatarUrl: avatarByName.get(d.name) ?? undefined,
    entries: Number(d.total_entries),
    first: Number(d.first_place),
    second: Number(d.second_place),
    third: Number(d.third_place),
    points: Number(d.total_points),
  }));

  return (
    <HomeClient
      currentChallenge={currentChallenge}
      previousChallenges={mappedChallenges}
      leaderboard={mappedLeaderboard}
      eligibleDesignerCount={eligibleDesignerCount}
    />
  );
}
