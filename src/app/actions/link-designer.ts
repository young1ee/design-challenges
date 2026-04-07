"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function linkDesignerAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return;

  const slug = user.email.split("@")[0].split(".")[0].toLowerCase();

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await service
    .from("designers")
    .update({ auth_user_id: user.id })
    .eq("slug", slug)
    .is("auth_user_id", null);
}
