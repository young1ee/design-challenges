"use client";

import { motion, useReducedMotion } from "framer-motion";
import Avatar from "./Avatar";
import { ArrowUpRightIcon } from "./Icons";
import { useHoverSupported } from "@/hooks/useHoverSupported";

interface EntryCardProps {
  title: string;
  author: string;
  authorAvatarUrl?: string;
  thumbnailUrl?: string;
  prototypeUrl?: string;
  placement?: "winner" | "2nd" | "3rd";
}

const placementLabel: Record<NonNullable<EntryCardProps["placement"]>, string> = {
  winner: "Winner",
  "2nd": "2nd place",
  "3rd": "3rd place",
};

export default function EntryCard({
  title,
  author,
  authorAvatarUrl,
  thumbnailUrl,
  prototypeUrl,
  placement,
}: EntryCardProps) {
  const reduceMotion = useReducedMotion();
  const hoverSupported = useHoverSupported();

  return (
    <div className="flex flex-col gap-2 rounded-xl w-full">
      <motion.div
        className={`relative aspect-[264/160] rounded-xl bg-canvas overflow-hidden${prototypeUrl ? " group cursor-pointer" : ""}`}
        onClick={prototypeUrl ? () => window.open(prototypeUrl, "_blank", "noopener,noreferrer") : undefined}
        whileHover={prototypeUrl && hoverSupported && !reduceMotion ? { scale: 1.02 } : undefined}
        whileTap={prototypeUrl && !reduceMotion ? { scale: 0.98 } : undefined}
        transition={{ scale: { type: "spring", duration: 0.2, bounce: 0 } }}
      >
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-canvas" />
        )}

        {prototypeUrl && (
          <div
            className="entry-thumbnail-overlay absolute inset-0 rounded-xl pointer-events-none"
            style={{
              padding: "1px",
              background: "radial-gradient(ellipse at 0% 0%, var(--color-accent) 0%, transparent 60%)",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "destination-out",
              maskComposite: "exclude",
            }}
          />
        )}

        {placement && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-canvas border-[0.5px] border-line">
            <span className={`text-sm ${placement === "winner" ? "text-success" : "text-fg-secondary"}`}>
              {placementLabel[placement]}
            </span>
          </div>
        )}

        {prototypeUrl && (
          <a
            href={prototypeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="entry-proto-btn absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded transition-[transform,color,background-color] duration-150 active:scale-[0.97]"
            style={{ boxShadow: "var(--shadow-btn)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowUpRightIcon />
          </a>
        )}
      </motion.div>

      <div className="flex items-start gap-3 px-2">
        <p className="flex-1 text-sm text-fg-secondary min-w-0">{title}</p>
        <div className="flex items-center gap-2 shrink-0">
          <Avatar name={author} src={authorAvatarUrl} className="w-5 h-5 text-[10px]" />
          <span className="text-sm text-fg-primary whitespace-nowrap">{author}</span>
        </div>
      </div>
    </div>
  );
}
