"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { createClient } from "@/lib/supabase/client";

const seasons = [
  { label: "2026", href: "/" },
  { label: "2025", href: "/2025" },
  { label: "2024", href: "/2024" },
  { label: "2023", href: "/2023" },
];

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [hoveredSeason, setHoveredSeason] = useState<string | null>(null);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; initials: string; avatarUrl: string | null } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function applySession(email: string | undefined) {
      if (!email) { setUser(null); return; }
      const slug = email.split("@")[0].split(".")[0];
      const name = slug.replace(/\b\w/g, (c) => c.toUpperCase());
      const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
      const { data } = await supabase.from("designers").select("avatar_url").eq("slug", slug).maybeSingle();
      setUser({ name, initials, avatarUrl: data?.avatar_url ?? null });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session?.user?.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const activeSeason =
    seasons.find((s) => s.href === pathname) ??
    (pathname === "/" ? seasons[0] : null);

  const activeSeasonLabel = activeSeason?.label ?? "2026";
  function navLinkClass(href: string) {
    const active = pathname.startsWith(href);
    return `transition-colors duration-150 whitespace-nowrap ${active ? "text-fg-primary" : "text-fg-secondary hover:text-fg-primary"}`;
  }

  return (
    <div className="sticky top-4 sm:top-6 z-40 flex justify-center px-2 sm:px-6">
      <nav
        className="flex items-center gap-3 sm:gap-6 px-3 sm:px-6 py-3 rounded-full bg-surface/60 backdrop-blur-md"
        style={{ boxShadow: "var(--shadow-default)" }}
      >
        {/* Logo + season */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ pointerEvents: "none" }}>
              <path d="M16 0L16.4177 12.8274L20.1411 0.545187L17.2246 13.0436L24 2.14359L17.948 13.4613L27.3137 4.68629L18.5387 14.052L29.8564 8L18.9564 14.7754L31.4548 11.8589L19.1726 15.5823L32 16L19.1726 16.4177L31.4548 20.1411L18.9564 17.2246L29.8564 24L18.5387 17.948L27.3137 27.3137L17.948 18.5387L24 29.8564L17.2246 18.9564L20.1411 31.4548L16.4177 19.1726L16 32L15.5823 19.1726L11.8589 31.4548L14.7754 18.9564L8 29.8564L14.052 18.5387L4.68629 27.3137L13.4613 17.948L2.14359 24L13.0436 17.2246L0.545187 20.1411L12.8274 16.4177L0 16L12.8274 15.5823L0.545187 11.8589L13.0436 14.7754L2.14359 8L13.4613 14.052L4.68629 4.68629L14.052 13.4613L8 2.14359L14.7754 13.0436L11.8589 0.545187L15.5823 12.8274L16 0Z" fill="#39FF3E"/>
            </svg>
            <span className="text-sm text-fg-primary">GPX Challenges</span>
          </Link>

          <DropdownMenu.Root onOpenChange={(open) => { if (!open) setHoveredSeason(null); }}>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-1 text-sm text-fg-secondary hover:text-fg-primary transition-[transform,color] duration-150 active:scale-[0.97] cursor-pointer whitespace-nowrap">
                {activeSeasonLabel}
                <ChevronDown />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={8}
                align="start"
                className="z-50 min-w-[140px] rounded-xl p-1 outline-none"
                style={{
                  background: "var(--color-surface)",
                  boxShadow: "var(--shadow-modal)",
                  border: "0.5px solid var(--color-glass-hover)",
                }}
                onMouseLeave={() => setHoveredSeason(null)}
              >
                {seasons.map((s) => (
                  <DropdownMenu.Item key={s.label} asChild>
                    <Link
                      href={s.href}
                      className={`relative flex items-center justify-between gap-6 px-3 py-2 rounded-lg text-sm outline-none cursor-pointer transition-colors duration-150 ${
                        hoveredSeason === s.label || (!hoveredSeason && s.href === activeSeason?.href)
                          ? "text-fg-primary"
                          : "text-fg-secondary"
                      }`}
                      onMouseEnter={() => setHoveredSeason(s.label)}
                    >
                      {hoveredSeason === s.label && (
                        <motion.span
                          layoutId="season-highlight"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: "var(--color-glass-subtle)" }}
                          transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                        />
                      )}
                      <span className="relative">{s.label}</span>
                      {s.href === activeSeason?.href && (
                        <span className="relative text-accent">
                          <CheckIcon />
                        </span>
                      )}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-[0.5px] h-6 bg-line" />

        {/* Nav links */}
        <div className="flex items-center gap-3 sm:gap-4 text-sm">
          <Link href="/overview" className={navLinkClass("/overview")}>
            Overview
          </Link>

          {/* User dropdown or Log in */}
          {user ? (
            <DropdownMenu.Root onOpenChange={(open) => { if (!open) setHoveredUser(null); }}>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 text-sm text-fg-secondary hover:text-fg-primary transition-[transform,color] duration-150 active:scale-[0.97] cursor-pointer outline-none">
                  <div className="w-5 h-5 rounded-full bg-elevated flex items-center justify-center text-[10px] text-fg-muted font-medium shrink-0 overflow-hidden">
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      : user.initials
                    }
                  </div>
                  <span className="hidden sm:inline">{user.name}</span>
                  <ChevronDown />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={8}
                  align="end"
                  className="z-50 min-w-[140px] rounded-xl p-1 outline-none"
                  style={{
                    background: "var(--color-surface)",
                    boxShadow: "var(--shadow-modal)",
                    border: "0.5px solid var(--color-glass-hover)",
                  }}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/admin"
                      className={`relative flex items-center justify-between gap-6 px-3 py-2 rounded-lg text-sm outline-none cursor-pointer ${
                        hoveredUser === "dashboard" || (!hoveredUser && pathname === "/admin") ? "text-fg-primary" : "text-fg-secondary"
                      }`}
                      onMouseEnter={() => setHoveredUser("dashboard")}
                    >
                      {hoveredUser === "dashboard" && (
                        <motion.span
                          layoutId="user-menu-highlight"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: "var(--color-glass-subtle)" }}
                          transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                        />
                      )}
                      <span className="relative">Dashboard</span>
                      {pathname === "/admin" && (
                        <span className="relative text-accent">
                          <CheckIcon />
                        </span>
                      )}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <button
                      onClick={handleLogout}
                      className={`relative w-full flex items-center px-3 py-2 rounded-lg text-sm outline-none cursor-pointer ${
                        hoveredUser === "logout" ? "text-fg-primary" : "text-fg-secondary"
                      }`}
                      onMouseEnter={() => setHoveredUser("logout")}
                    >
                      {hoveredUser === "logout" && (
                        <motion.span
                          layoutId="user-menu-highlight"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: "var(--color-glass-subtle)" }}
                          transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                        />
                      )}
                      <span className="relative">Log out</span>
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <Link href="/login" className="text-sm text-fg-secondary hover:text-fg-primary transition-colors duration-150">
              Log in
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
