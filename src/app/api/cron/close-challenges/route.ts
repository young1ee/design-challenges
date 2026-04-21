import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getChallengeDeadline(challengeDate: string): Date {
  // Deadline is 15:00 Europe/Helsinki on the challenge_date
  // Compute the UTC equivalent by detecting Helsinki offset at noon that day
  const date = challengeDate.slice(0, 10);
  const ref = new Date(`${date}T12:00:00Z`);
  const helsinkiHour = Number(
    ref.toLocaleString("en-US", { timeZone: "Europe/Helsinki", hour: "numeric", hour12: false })
  );
  const offsetH = helsinkiHour - 12;
  return new Date(`${date}T${String(15 - offsetH).padStart(2, "0")}:00:00Z`);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: openChallenges, error } = await supabase
    .from("challenges")
    .select("id, challenge_date")
    .eq("status", "open");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!openChallenges?.length) return NextResponse.json({ closed: 0 });

  const now = new Date();
  const expired = openChallenges.filter((c) => getChallengeDeadline(c.challenge_date) < now);

  if (!expired.length) return NextResponse.json({ closed: 0 });

  const { error: updateError } = await supabase
    .from("challenges")
    .update({ status: "closed" })
    .in("id", expired.map((c) => c.id));

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ closed: expired.length });
}
