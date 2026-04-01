"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        router.replace("/admin");
      }
    });

    // Also check if already signed in (e.g. hash already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        router.replace("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-fg-muted">Signing in…</p>
    </div>
  );
}
