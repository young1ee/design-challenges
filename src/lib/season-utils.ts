import { SEASON_EXCLUSIONS } from "./season-exclusions";

export function isEligibleForSeason(
  slug: string,
  joinedAt: string,
  leftAt: string | null | undefined,
  seasonNumber: number,
  seasonStart: Date,
  seasonEnd: Date
): boolean {
  if (SEASON_EXCLUSIONS[seasonNumber]?.has(slug)) return false;
  const joined = new Date(joinedAt);
  const left = leftAt ? new Date(leftAt) : null;
  return joined <= seasonEnd && (!left || left >= seasonStart);
}
