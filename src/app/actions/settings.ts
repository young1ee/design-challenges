"use server";

import { createClient } from "@supabase/supabase-js";

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getPhotoOrder(): Promise<string[]> {
  const { data } = await service().from("settings").select("photo_order").single();
  return data?.photo_order ?? [];
}

export async function updatePhotoOrder(order: string[]) {
  await service().from("settings").upsert({ id: true, photo_order: order });
}
