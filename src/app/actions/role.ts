"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function setAuthRole(authUserId: string, role: "admin" | "member") {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.auth.admin.updateUserById(authUserId, {
    app_metadata: { role },
  });

  return { error: error?.message ?? null };
}
