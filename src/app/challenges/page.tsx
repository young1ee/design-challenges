import { getAllChallenges, getSeasons } from "@/lib/db/queries";
import ChallengesClient from "./ChallengesClient";

export default async function ChallengesPage() {
  const [challenges, seasons] = await Promise.all([
    getAllChallenges(),
    getSeasons(),
  ]);

  const seasonList = seasons
    .map((s) => ({ number: s.number, name: s.name }))
    .sort((a, b) => b.number - a.number);

  return <ChallengesClient challenges={challenges as never} seasons={seasonList} />;
}
