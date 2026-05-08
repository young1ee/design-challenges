"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Particles from "@/components/Particles";
import PageTransition from "@/components/PageTransition";
import { createClient } from "@/lib/supabase/client";
import FormInput from "@/components/FormInput";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:gap-20 sm:py-20 min-h-screen">
      <Nav />

      <div className="flex w-full max-w-[920px] px-4 sm:px-6 justify-center">
        <PageTransition>
          <div className="relative w-full flex justify-center">
            <div
              className="absolute pointer-events-none"
              style={{ left: "calc(50% - 50vw)", right: "calc(50% - 50vw)", top: 0, height: "400px", zIndex: 0 }}
            >
              <Particles quantity={150} className="w-full h-full" />
            </div>

            <div
              className="relative w-full max-w-[480px] bg-surface rounded-2xl p-5 flex flex-col gap-5"
              style={{ boxShadow: "var(--shadow-default)", zIndex: 1 }}
            >
              {sent ? (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-base text-fg-primary">Check your inbox</p>
                    <p className="text-sm text-fg-muted leading-5">
                      Reset link sent to <span className="text-fg-secondary">{email}</span>.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="text-sm text-fg-secondary hover:text-fg-primary underline underline-offset-2 transition-colors duration-150 w-fit"
                  >
                    Back to log in
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-base text-fg-primary">Reset password</p>
                    <p className="text-sm text-fg-muted leading-5">
                      Enter your email and we'll send you a reset link.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <FormInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@nortal.com"
                      required
                    />
                    <button
                      type="submit"
                      disabled={!email || loading}
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-glass-subtle)] enabled:hover:bg-[var(--color-glass-hover)] text-sm text-fg-secondary enabled:hover:text-fg-primary transition-[transform,color,background-color] duration-150 enabled:active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      style={{ boxShadow: "var(--shadow-btn)" }}
                    >
                      {loading ? "Sending…" : "Send reset link"}
                    </button>
                    <Link
                      href="/login"
                      className="text-sm text-fg-secondary hover:text-fg-primary underline underline-offset-2 transition-colors duration-150 w-fit"
                    >
                      Back to log in
                    </Link>
                  </form>
                </>
              )}
            </div>
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
