"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function inviteDesigner(email: string, redirectTo: string, role: "admin" | "member" = "member") {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Send invite email
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (error) return { error: error.message, userId: null };

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    data.user.id,
    { app_metadata: { role } }
  );

  if (updateError) return { error: updateError.message, userId: null };

  return { error: null, userId: data.user.id };
}
