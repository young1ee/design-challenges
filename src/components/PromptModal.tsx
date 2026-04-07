"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import EntryCard from "./EntryCard";

interface PodiumEntry {
  name: string;
  points: number;
  title?: string;
  thumbnailUrl?: string;
  prototypeUrl?: string;
  authorAvatarUrl?: string;
}

interface Entry {
  id: string;
  title: string;
  author: string;
  authorAvatarUrl?: string;
  thumbnailUrl?: string;
  prototypeUrl?: string;
}

interface Challenge {
  id: string;
  date: string;
  prompt: string;
  masterOfCeremony: string;
  masterOfCeremonyAvatarUrl?: string;
  podium: PodiumEntry[];
  entries: Entry[];
}

interface PromptModalProps {
  challenge: Challenge | null;
  onClose: () => void;
}

const PLACEMENTS = ["winner", "2nd", "3rd"] as const;

function GlassButton({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg bg-[var(--color-glass-subtle)] hover:bg-[var(--color-glass-hover)] text-fg-secondary hover:text-fg-primary transition-[transform,color,background-color] duration-150 active:scale-[0.97] cursor-pointer ${className}`}
      style={{ boxShadow: "var(--shadow-btn)" }}
    >
      {children}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function PromptModal({ challenge, onClose }: PromptModalProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (challenge) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [challenge]);

  const podiumAuthors = new Set(challenge?.podium.map((p) => p.name));
  const podiumCards = challenge?.podium.map((p) => {
    const entry = challenge.entries.find((e) => e.author === p.name);
    return { ...p, entry, authorAvatarUrl: p.authorAvatarUrl ?? entry?.authorAvatarUrl };
  });
  const otherEntries = challenge?.entries.filter((e) => !podiumAuthors.has(e.author));

  return (
    <AnimatePresence>
      {challenge && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-canvas/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={onClose}
          />

          {/* Modal — scrolls with browser */}
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex min-h-full items-start justify-center py-4 px-0 sm:py-20 sm:px-6 pointer-events-none">
              <motion.div
                layoutId={`card-${challenge.id}`}
                className="relative w-full max-w-[920px] bg-surface rounded-2xl p-4 sm:p-10 flex flex-col gap-5 sm:gap-10 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
                style={{ boxShadow: "var(--shadow-modal)" }}
                transition={{ type: "spring", duration: reduceMotion ? 0 : 0.4, bounce: reduceMotion ? 0 : 0.1 }}
              >
                {/* Close X button — top right */}
                <GlassButton onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center">
                  <CloseIcon />
                </GlassButton>

                {/* Header */}
                <div className="flex flex-col gap-5">
                  {/* Prompt info */}
                  <div className="flex flex-col gap-1 pr-10">
                    <p className="text-sm text-fg-muted">{challenge.date}</p>
                    <p className="text-xl text-fg-primary leading-7">{challenge.prompt}</p>
                  </div>

                  {/* Master of Ceremony pill */}
                  {challenge.masterOfCeremony && (
                    <div
                      className="flex items-center gap-4 px-4 py-2 rounded-full border-[0.5px] border-line w-fit"
                    >
                      <span className="text-sm text-fg-muted whitespace-nowrap">Master of Ceremony</span>
                      <div className="w-[0.5px] h-5 bg-line shrink-0" />
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-elevated flex items-center justify-center text-[10px] text-fg-muted font-medium shrink-0 overflow-hidden">
                          {challenge.masterOfCeremonyAvatarUrl
                            ? <img src={challenge.masterOfCeremonyAvatarUrl} alt={challenge.masterOfCeremony} className="w-full h-full object-cover" />
                            : challenge.masterOfCeremony.slice(0, 2).toUpperCase()
                          }
                        </div>
                        <span className="text-sm text-fg-primary whitespace-nowrap">
                          {challenge.masterOfCeremony}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Podium */}
                {podiumCards && podiumCards.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <p className="text-base text-fg-primary">Podium</p>

                    {/* Winner — full width */}
                    {podiumCards[0] && (
                      <EntryCard
                        title={podiumCards[0].entry?.title ?? ""}
                        author={podiumCards[0].name}
                        authorAvatarUrl={podiumCards[0].authorAvatarUrl}
                        thumbnailUrl={podiumCards[0].entry?.thumbnailUrl}
                        prototypeUrl={podiumCards[0].entry?.prototypeUrl}
                        placement="winner"
                      />
                    )}

                    {/* 2nd + 3rd — side by side */}
                    {podiumCards.slice(1, 3).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        {podiumCards.slice(1, 3).map((p, i) => (
                          <EntryCard
                            key={p.name}
                            title={p.entry?.title ?? ""}
                            author={p.name}
                            authorAvatarUrl={p.authorAvatarUrl}
                            thumbnailUrl={p.entry?.thumbnailUrl}
                            prototypeUrl={p.entry?.prototypeUrl}
                            placement={PLACEMENTS[i + 1]}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Other entries */}
                {otherEntries && otherEntries.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <p className="text-base text-fg-primary">Other entries</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {otherEntries.map((entry) => (
                        <EntryCard
                          key={entry.id}
                          title={entry.title}
                          author={entry.author}
                          authorAvatarUrl={entry.authorAvatarUrl}
                          thumbnailUrl={entry.thumbnailUrl}
                          prototypeUrl={entry.prototypeUrl}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom close button */}
                <div className="flex justify-center">
                  <GlassButton onClick={onClose} className="px-4 py-2.5 text-sm">
                    Close
                  </GlassButton>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
