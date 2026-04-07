import { createClient } from "@/lib/supabase/server";

// ─── Seasons ──────────────────────────────────────────────────────────────────

export async function getSeasons() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasons")
    .select(`
      id, number, name, starts_at, ends_at, format, point_system, note,
      challenges (
        id, status, challenge_date,
        entries ( designer_id )
      )
    `)
    .order("number", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSeason(number: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasons")
    .select(`
      id, number, name, starts_at, ends_at, format, point_system, note, hero_image_url,
      challenges (
        id, challenge_date, prompt, status,
        master_of_ceremony:master_of_ceremony_id ( slug, name ),
        entries (
          id, title, figma_url, thumbnail_url,
          designer:designer_id ( id, slug, name )
        ),
        results (
          position, points_awarded,
          entry:entry_id ( designer:designer_id ( slug, name ) )
        )
      )
    `)
    .eq("number", number)
    .single();

  if (error) throw error;
  return data;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getSeasonLeaderboard(seasonNumber: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("season_leaderboard")
    .select("*")
    .eq("season_number", seasonNumber)
    .order("total_points", { ascending: false });

  if (error) throw error;
  return data;
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export async function getChallengesBySeason(seasonNumber: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select(`
      id, challenge_date, prompt, status,
      season:season_id ( number, name ),
      master_of_ceremony:master_of_ceremony_id ( slug, name ),
      entries (
        id, title, figma_url, thumbnail_url,
        designer:designer_id ( id, slug, name )
      ),
      results (
        position, points_awarded,
        entry:entry_id ( designer:designer_id ( slug, name ) )
      )
    `)
    .eq("season.number", seasonNumber)
    .order("challenge_date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSeasonChallenges(seasonNumber: number, statusFilter?: "open" | "closed") {
  const supabase = await createClient();
  let query = supabase
    .from("challenges")
    .select(`
      id, challenge_date, prompt, status,
      season:season_id!inner ( number, name ),
      master_of_ceremony:master_of_ceremony_id ( slug, name ),
      entries (
        id, title, figma_url, thumbnail_url,
        designer:designer_id ( id, slug, name )
      ),
      results (
        position, points_awarded,
        entry:entry_id ( designer:designer_id ( slug, name ) )
      )
    `)
    .eq("season.number", seasonNumber)
    .order("challenge_date", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getMostRecentChallenge() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select(`
      id, challenge_date, prompt, status,
      master_of_ceremony:master_of_ceremony_id ( slug, name ),
      entries (
        id, title, figma_url, thumbnail_url,
        designer:designer_id ( id, slug, name )
      ),
      results (
        position, points_awarded,
        entry:entry_id ( designer:designer_id ( slug, name ) )
      )
    `)
    .order("challenge_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPreviousChallenges(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select(`
      id, challenge_date, prompt, status,
      master_of_ceremony:master_of_ceremony_id ( slug, name ),
      entries (
        id, title, figma_url, thumbnail_url,
        designer:designer_id ( id, slug, name )
      ),
      results (
        position, points_awarded,
        entry:entry_id ( designer:designer_id ( slug, name ) )
      )
    `)
    .eq("status", "closed")
    .order("challenge_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getAllChallenges() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select(`
      id, challenge_date, prompt, status,
      season:season_id ( id, number, name ),
      results (
        position,
        entry:entry_id ( designer:designer_id ( slug, name ) )
      )
    `)
    .order("challenge_date", { ascending: false });

  if (error) throw error;
  return data;
}

// ─── Designers ────────────────────────────────────────────────────────────────

export async function getActiveDesigners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("designers")
    .select("id, slug, name, role, location, joined_at, is_active, left_at, avatar_url")
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getDesigner(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("designers")
    .select("id, slug, name, role, location, joined_at, is_active, left_at")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

export async function getDesignerHistory(designerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select(`
      id, title, figma_url, thumbnail_url,
      challenge:challenge_id (
        id, challenge_date, prompt,
        season:season_id ( number, name )
      )
    `)
    .eq("designer_id", designerId);

  if (error) throw error;

  // Sort by challenge date descending in JS
  return (data ?? []).sort((a, b) => {
    const da = (a.challenge as unknown as { challenge_date: string } | null)?.challenge_date ?? "";
    const db = (b.challenge as unknown as { challenge_date: string } | null)?.challenge_date ?? "";
    return db.localeCompare(da);
  });
}

// ─── Overview stats ───────────────────────────────────────────────────────────

export async function getOverviewStats() {
  const supabase = await createClient();

  const [seasons, challenges, entries, designers] = await Promise.all([
    supabase.from("seasons").select("id", { count: "exact", head: true }),
    supabase.from("challenges").select("id", { count: "exact", head: true }),
    supabase.from("entries").select("id", { count: "exact", head: true }),
    supabase.from("designers").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return {
    totalSeasons:    seasons.count    ?? 0,
    totalChallenges: challenges.count ?? 0,
    totalEntries:    entries.count    ?? 0,
    activeDesigners: designers.count  ?? 0,
  };
}
