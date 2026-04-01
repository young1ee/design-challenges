"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Particles from "@/components/Particles";
import PageTransition from "@/components/PageTransition";

export default function ConfirmPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => { window.location.href = "/admin"; }, 1500);
  }

  const inputBase = "w-full h-[41px] px-4 rounded-lg bg-canvas text-sm text-fg-primary placeholder:text-fg-muted outline-none";
  const inputStyle = { boxShadow: "none", transition: "box-shadow 150ms ease-out" };

  function onHoverIn(e: React.MouseEvent<HTMLInputElement>) {
    if (document.activeElement !== e.currentTarget)
      e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--color-line)";
  }
  function onHoverOut(e: React.MouseEvent<HTMLInputElement>) {
    if (document.activeElement !== e.currentTarget)
      e.currentTarget.style.boxShadow = "none";
  }

  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:gap-20 sm:py-20 min-h-screen">
      <Nav />
      <div className="flex w-full max-w-[920px] px-4 sm:px-6 justify-center">
        <PageTransition>
          <div className="relative w-full flex justify-center">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ left: "calc(50% - 50vw)", right: "calc(50% - 50vw)", zIndex: 0 }}
            >
              <Particles quantity={150} color="#39ff3e" className="w-full h-full" />
            </div>

            <div
              className="relative w-full max-w-[480px] bg-surface rounded-2xl p-5 flex flex-col gap-5"
              style={{ boxShadow: "var(--shadow-default)", zIndex: 1 }}
            >
              <div className="flex flex-col gap-1">
                <p className="text-base text-fg-primary">{done ? "All set!" : "Set your password"}</p>
                <p className="text-sm text-fg-muted leading-5">
                  {done
                    ? "Redirecting you to the dashboard…"
                    : "Choose a password to secure your account."}
                </p>
              </div>

              {!done && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    required
                    className={inputBase}
                    style={inputStyle}
                    onMouseEnter={onHoverIn}
                    onMouseLeave={onHoverOut}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--color-accent)"; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm password"
                    required
                    className={inputBase}
                    style={inputStyle}
                    onMouseEnter={onHoverIn}
                    onMouseLeave={onHoverOut}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--color-accent)"; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                  />
                  {error && <p className="text-xs text-danger">{error}</p>}
                  <button
                    type="submit"
                    disabled={!password || !confirm || loading}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-glass-subtle)] enabled:hover:bg-[var(--color-glass-hover)] text-sm text-fg-secondary enabled:hover:text-fg-primary transition-[transform,color,background-color] duration-150 enabled:active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    style={{ boxShadow: "var(--shadow-btn)" }}
                  >
                    {loading ? "Setting password…" : "Set password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
