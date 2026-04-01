import { redirect, notFound } from "next/navigation";
import { getSeason } from "@/lib/db/queries";

export default async function ArchiveSeasonRedirect({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const seasonNumber = Number(season);
  if (!seasonNumber) notFound();

  const seasonData = await getSeason(seasonNumber).catch(() => null);
  if (!seasonData) notFound();

  const year = new Date(seasonData.starts_at).getFullYear();
  redirect(`/${year}`);
}
