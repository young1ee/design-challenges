"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function inviteDesigner(email: string, redirectTo: string) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Send invite email
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (error) return { error: error.message };

  // Grant admin role in app_metadata so middleware allows /admin access
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    data.user.id,
    { app_metadata: { role: "admin" } }
  );

  if (updateError) return { error: updateError.message };

  return { error: null };
}
