"use client";

import { useEffect, useMemo, useState } from "react";

interface Confession {
  q: string;
  p: number;
}

const POOL: Confession[] = [
  { q: "should I text my ex", p: 4 },
  { q: "should I quit my job", p: 22 },
  { q: "should I get bangs", p: 41 },
  { q: "should I order takeout again", p: 88 },
  { q: "should I confess to my crush", p: 19 },
  { q: "should I dye my hair pink", p: 65 },
  { q: "should I cancel plans tonight", p: 73 },
  { q: "should I buy this $200 hoodie", p: 12 },
  { q: "should I delete my dating apps", p: 91 },
  { q: "should I call my mom", p: 99 },
  { q: "should I shave my head", p: 38 },
  { q: "should I respond to that email", p: 8 },
  { q: "should I send the voice memo", p: 6 },
  { q: "should I get a tattoo tonight", p: 14 },
  { q: "should I post the thirst trap", p: 27 },
  { q: "should I move to lisbon", p: 52 },
  { q: "should I unfollow my situationship", p: 84 },
  { q: "should I eat the leftover sushi", p: 11 },
  { q: "should I tell him how i feel", p: 33 },
  { q: "should I block my ex's mom", p: 79 },
  { q: "should I lie on my resume", p: 9 },
  { q: "should I skip the gym", p: 16 },
  { q: "should I reply to the recruiter", p: 81 },
  { q: "should I post the cringe selfie", p: 23 },
  { q: "should I argue in the group chat", p: 7 },
  { q: "should I screenshot the convo", p: 44 },
];

// Slots in % of viewport — anchor edges/corners so they don't crowd the input.
// [top, left, side ('l'|'r')]
const SLOTS: Array<{ top: string; side: "l" | "r"; offset: string }> = [
  { top: "8%", side: "l", offset: "2%" },
  { top: "22%", side: "r", offset: "3%" },
  { top: "38%", side: "l", offset: "5%" },
  { top: "55%", side: "r", offset: "4%" },
  { top: "70%", side: "l", offset: "3%" },
  { top: "82%", side: "r", offset: "6%" },
];

function pick<T>(arr: T[], n: number, seed: number): T[] {
  // Deterministic shuffle so it doesn't twitch on hydration mismatch.
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, n);
}

export function FloatingConfessions() {
  const [seed, setSeed] = useState(1);

  // Pick a fresh seed only after mount to avoid SSR/CSR mismatch.
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1_000_000) + 1);
  }, []);

  const items = useMemo(() => pick(POOL, SLOTS.length, seed), [seed]);

  return (
    <div
      aria-hidden
      className="hidden lg:block pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
    >
      {items.map((c, i) => {
        const slot = SLOTS[i];
        const positionStyle: React.CSSProperties = {
          top: slot.top,
          [slot.side === "l" ? "left" : "right"]: slot.offset,
          animationDelay: `${i * 0.7}s`,
        };
        return (
          <div
            key={`${c.q}-${i}-${seed}`}
            style={positionStyle}
            className="confession-card absolute max-w-[260px] xl:max-w-[300px] border border-outline/40 bg-bg/60 backdrop-blur-[2px] px-3 py-2 flex flex-col gap-1"
          >
            <div className="text-[13px] leading-snug text-fg/70 truncate">
              &ldquo;{c.q}&rdquo;
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lime font-display text-[28px] leading-none tracking-tight">
                {c.p}%
              </span>
              <span className="text-label-xs text-outline/60 truncate">
                {verdictFor(c.p)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function verdictFor(p: number) {
  if (p <= 15) return "ABSOLUTELY NOT.";
  if (p <= 35) return "NO.";
  if (p <= 55) return "RISKY.";
  if (p <= 75) return "PROBABLY.";
  return "DO IT.";
}
