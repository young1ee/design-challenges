"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useDragControls } from "framer-motion";
import EntryCard from "./EntryCard";
import GlassButton from "./GlassButton";
import Avatar from "./Avatar";
import { CloseIcon } from "./Icons";

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


export default function PromptModal({ challenge, onClose }: PromptModalProps) {
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const dragControls = useDragControls();
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // iOS-compatible scroll lock
  useEffect(() => {
    if (!challenge) return;
    if (isMobile) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    } else {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [challenge, isMobile]);

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
            className="fixed inset-0 z-40 bg-canvas/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={onClose}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-start sm:overflow-y-auto sm:pointer-events-auto justify-center sm:py-[100px] sm:px-6 pointer-events-none"
            onClick={onClose}
          >
            <motion.div
              layoutId={`card-${challenge.id}`}
              className="relative w-full sm:max-w-[920px] bg-surface rounded-t-2xl sm:rounded-2xl flex flex-col pointer-events-auto sm:max-h-none"
              style={{ ...(isMobile ? { maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 24px)' } : {}), boxShadow: "var(--shadow-modal)" }}
              onClick={(e) => e.stopPropagation()}
              drag={isMobile ? "y" : false}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (isMobile && (info.offset.y > 80 || info.velocity.y > 400)) onClose();
              }}
              transition={{ type: "spring", duration: reduceMotion ? 0 : 0.4, bounce: reduceMotion ? 0 : 0.1 }}
            >

              {/* Drag handle — mobile only, always starts drag */}
              <div
                className="sm:hidden shrink-0 sticky top-0 z-10 rounded-t-2xl relative"
                onPointerDown={isMobile ? (e) => dragControls.start(e) : undefined}
                style={{
                  touchAction: "none",
                  background: "linear-gradient(to bottom, var(--color-surface) 40%, transparent 100%)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <div className="flex justify-center py-3">
                  <svg width="32" height="4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="4" rx="2" fill="var(--color-elevated)" />
                  </svg>
                </div>
                {/* Gradient fade + blur extending below handle into content */}
                <div
                  className="absolute inset-x-0 top-full h-8 pointer-events-none"
                  style={{
                    background: "linear-gradient(to bottom, var(--color-surface), transparent)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                />
              </div>

              {/* Scrollable content — drag starts here only when scrolled to top */}
              <div
                ref={contentScrollRef}
                className="overflow-y-auto sm:overflow-visible flex-1"
                style={{ overscrollBehavior: "none" }}
                onPointerDown={isMobile ? (e) => {
                  const el = contentScrollRef.current;
                  if (el && el.scrollTop === 0) dragControls.start(e);
                } : undefined}
              >
                <div className="relative p-5 sm:p-10 flex flex-col gap-5 sm:gap-10">

                  {/* Close X button */}
                  <GlassButton onClick={onClose} className="absolute top-4 right-4 w-10 h-10">
                    <CloseIcon />
                  </GlassButton>

                  {/* Header */}
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1 pr-10">
                      <p className="text-sm text-fg-muted">{challenge.date}</p>
                      <p className="text-xl text-fg-primary leading-7">{challenge.prompt}</p>
                    </div>

                    {challenge.masterOfCeremony && (
                      <div className="flex items-center gap-4 px-4 py-2 rounded-full border-[0.5px] border-line w-fit">
                        <span className="text-sm text-fg-muted whitespace-nowrap">Master of Ceremony</span>
                        <div className="w-[0.5px] h-5 bg-line shrink-0" />
                        <div className="flex items-center gap-2">
                          <Avatar name={challenge.masterOfCeremony} src={challenge.masterOfCeremonyAvatarUrl} className="w-5 h-5 text-[10px]" />
                          <span className="text-sm text-fg-primary whitespace-nowrap">{challenge.masterOfCeremony}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Podium */}
                  {podiumCards && podiumCards.length > 0 && (
                    <div className="flex flex-col gap-5">
                      <p className="text-base text-fg-primary">Podium</p>

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

                      {podiumCards.slice(1, 3).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    <div className="flex flex-col gap-5">
                      <p className="text-base text-fg-primary">Other entries</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

                  {/* Bottom close button — desktop only */}
                  <div className="hidden sm:flex justify-center">
                    <GlassButton onClick={onClose} className="px-4 py-2.5 text-sm">
                      Close
                    </GlassButton>
                  </div>

                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
