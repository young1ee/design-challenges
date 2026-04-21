"use client";

import { motion, useReducedMotion } from "framer-motion";
import Avatar from "./Avatar";

interface PromptCardProps {
  id: string;
  date: string;
  prompt: string;
  winner: string;
  winnerAvatarUrl?: string;
  entries?: { author: string; authorAvatarUrl?: string }[];
  onOpen: () => void;
}

export default function PromptCard({
  id,
  date,
  prompt,
  winner,
  winnerAvatarUrl,
  onOpen,
}: PromptCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layoutId={`card-${id}`}
      onClick={onOpen}
      className="group prompt-card flex flex-col gap-5 h-[220px] w-full p-5 rounded-2xl bg-surface cursor-pointer"
      style={{ boxShadow: "var(--shadow-default)" }}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={{
        layout: { type: "spring", duration: 0.4, bounce: reduceMotion ? 0 : 0.1 },
        scale: { type: "spring", duration: 0.2, bounce: 0 },
      }}
    >
      {/* Date + Prompt */}
      <div className="flex-1 flex flex-col gap-1 min-h-0">
        <p className="text-sm text-fg-muted">{date}</p>
        <p className="text-base text-fg-primary leading-6 line-clamp-4 text-pretty">
          {prompt}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-end gap-3">
        {/* Winner */}
        <div className="flex-1 flex flex-col gap-1">
          <p className="text-sm text-fg-muted">Winner</p>
          <div className="flex items-center gap-2">
            <Avatar name={winner} src={winnerAvatarUrl} className="w-8 h-8 text-[10px]" />
            <span className="text-sm text-fg-primary">{winner}</span>
          </div>
        </div>

        {/* See more button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="btn-see-more flex items-center px-4 py-2.5 rounded-lg text-fg-secondary group-hover:text-fg-primary transition-[transform,color,background-color] duration-150 active:scale-[0.97] cursor-pointer"
          style={{ boxShadow: "var(--shadow-btn)" }}
        >
          <span className="text-sm">Open</span>
        </button>
      </div>
    </motion.div>
  );
}
