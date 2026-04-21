"use client";

import { useState, useEffect } from "react";
import Avatar from "./Avatar";

export interface LeaderboardRow {
  name: string;
  avatarUrl?: string;
  entries: number;
  first: number;
  second: number;
  third: number;
  points: number;
}

export default function Leaderboard({ data, simplified = false }: { data: LeaderboardRow[]; simplified?: boolean }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const dataCol = isMobile ? "auto" : "minmax(72px, auto)";
  const cols = simplified
    ? `fit-content(100%) minmax(0,1fr) ${dataCol} ${dataCol} ${dataCol}`
    : `fit-content(100%) minmax(0,1fr) ${dataCol} ${dataCol} ${dataCol} ${dataCol} ${dataCol}`;
  const headers = simplified ? ["Entries", "1st", "Points"] : ["Entries", "1st", "2nd", "3rd", "Points"];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="w-full overflow-x-auto">
        <div style={{ display: "grid", gridTemplateColumns: cols, rowGap: "2px" }}>
          <div className="contents">
            <div className="pr-0 py-1.5 flex items-center" style={{ paddingLeft: "12px" }}>
              <span className="text-xs text-fg-muted">#</span>
            </div>
            <div className="px-2 sm:px-3 py-1.5 flex items-center">
              <span className="text-xs text-fg-muted">Designer</span>
            </div>
            {headers.map((label) => (
              <div key={label} className="px-2 sm:px-3 py-1.5 flex items-center justify-center">
                <span className="text-xs text-fg-muted">{label}</span>
              </div>
            ))}
          </div>

          {data.map((row, i) => {
            const cells = simplified ? [row.entries, row.first] : [row.entries, row.first, row.second, row.third];
            return (
              <div key={row.name} className="contents">
                <div
                  className="pr-0 py-2.5 flex items-center rounded-l-lg"
                  style={{ paddingLeft: "12px", background: "var(--color-line-faint)" }}
                >
                  <span className="text-xs text-fg-muted tabular-nums">{i + 1}.</span>
                </div>
                <div
                  className="px-2 sm:px-3 py-2.5 flex items-center gap-2"
                  style={{ background: "var(--color-line-faint)" }}
                >
                  <Avatar name={row.name} src={row.avatarUrl} className="w-5 h-5 text-[10px]" />
                  <span className="text-sm text-fg-primary">{row.name}</span>
                </div>
                {cells.map((val, j) => (
                  <div
                    key={j}
                    className="px-2 sm:px-3 py-2.5 flex items-center justify-center"
                    style={{ background: "var(--color-line-faint)" }}
                  >
                    <span className="text-sm text-fg-secondary tabular-nums">{val}</span>
                  </div>
                ))}
                <div
                  className="px-2 sm:px-3 py-2.5 flex items-center justify-center rounded-r-lg"
                  style={{ background: "var(--color-line-faint)" }}
                >
                  <span className="text-sm text-fg-primary tabular-nums">{row.points}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-fg-muted text-center w-full">
        {simplified
          ? <>1st · 10pts <span className="mx-1 sm:mx-2" style={{ color: "var(--color-line)" }}>/</span> Entry · 2pts</>
          : <>1st · 10pts <span className="mx-1 sm:mx-2" style={{ color: "var(--color-line)" }}>/</span> 2nd · 6pts <span className="mx-1 sm:mx-2" style={{ color: "var(--color-line)" }}>/</span> 3rd · 4pts <span className="mx-1 sm:mx-2" style={{ color: "var(--color-line)" }}>/</span> Entry · 2pts</>
        }
      </p>
    </div>
  );
}
