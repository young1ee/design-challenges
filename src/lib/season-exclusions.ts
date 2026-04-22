// Designers excluded from specific seasons (by slug).
// Excluded designers don't appear in that season's leaderboard,
// don't count toward eligible-designer totals, and don't affect participation %.
export const SEASON_EXCLUSIONS: Record<number, ReadonlySet<string>> = {
  1: new Set(["derin", "anisa"]),
};
