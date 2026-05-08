"use client";

import { useEffect, useRef, useState } from "react";
import { ShareModal } from "./ShareModal";
import { FloatingConfessions } from "./FloatingConfessions";

type Phase = "idle" | "loading" | "result";

const ATTEMPT_BUTTON_LABELS = [
  "BE HONEST…",
  "TRY AGAIN",
  "REALLY?",
  "YOU'RE STALLING.",
];

interface Verdict {
  question: string;
  percentage: number;
  roast: string;
  verdict: string;
  attempt: number;
}

export function Judge() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [question, setQuestion] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const buttonLabel =
    ATTEMPT_BUTTON_LABELS[Math.min(attempt, ATTEMPT_BUTTON_LABELS.length - 1)];

  // Auto-submit if landing with ?q= (shared link)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && q.trim().length > 0 && q.length <= 240) {
      setQuestion(q);
      // Strip the param so refresh doesn't re-fire
      const url = new URL(window.location.href);
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.toString());
      // Submit on next tick after state settles
      setTimeout(() => submitWith(q, 1), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitWith(q: string, nextAttempt: number) {
    setError(null);
    setPhase("loading");
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, attempt: nextAttempt }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Judgment failed.");
      }
      const data = (await res.json()) as Omit<Verdict, "question" | "attempt">;
      setVerdict({
        question: q,
        percentage: data.percentage,
        roast: data.roast,
        verdict: data.verdict,
        attempt: nextAttempt,
      });
      setAttempt(nextAttempt);
      setPhase("result");
    } catch (e) {
      setPhase("idle");
      setError(e instanceof Error ? e.message : "Something broke.");
    }
  }

  // Counter animation when verdict lands
  useEffect(() => {
    if (!verdict) return;
    setDisplayPercent(0);
    const target = verdict.percentage;
    const duration = 600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPercent(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [verdict]);

  async function submit() {
    const q = question.trim();
    if (!q || phase === "loading") return;
    const nextAttempt = verdict && verdict.question === q ? attempt + 1 : 1;
    await submitWith(q, nextAttempt);
  }

  function reset() {
    setPhase("idle");
    setVerdict(null);
    setAttempt(0);
    setQuestion("");
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const showInput = phase !== "result";

  return (
    <>
      {showInput && (
        <section className="relative w-full min-h-[calc(100dvh-160px)] flex flex-col items-center text-center px-6 md:px-10 py-20 md:py-24 overflow-hidden">
          <FloatingConfessions />
          <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-headline md:text-display uppercase tracking-tight font-display">
            <span className="md:hidden">CONFESS.</span>
            <span className="hidden md:inline">SHOULD I DO IT</span>
          </h1>

          <form
            className="w-full max-w-2xl mt-12"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="oracle-input text-roast"
              placeholder="What are you about to do?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              autoFocus
              disabled={phase === "loading"}
            />

            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={phase === "loading" || !question.trim()}
                className="bg-lime text-black text-roast px-10 md:px-12 py-5 md:py-6 border-2 border-lime hover:bg-bg hover:text-lime transition-none uppercase tracking-tight disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {phase === "loading" ? "ANALYZING…" : buttonLabel}
              </button>
              {attempt > 0 && phase !== "loading" && (
                <div className="text-label-xs text-error">
                  ATTEMPT #{attempt + 1}
                </div>
              )}
              {error && (
                <div className="text-label-xs text-error mt-2">{error}</div>
              )}
            </div>
          </form>

          <div className="mt-16 text-label-xs text-outline">
            NO ACCOUNTS. NO DATA SAVED. JUST JUDGMENT.
          </div>
          </div>
        </section>
      )}

      {phase === "result" && verdict && (
        <section className="relative w-full max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-24 flex flex-col items-center text-center">
          <div className="mt-8 mb-6">
            <div className="text-label-xs text-outline mb-3">
              QUERY SUBMITTED:
            </div>
            <div className="text-roast text-fg max-w-2xl mx-auto">
              &ldquo;{verdict.question}&rdquo;
            </div>
          </div>

          <div
            key={`${verdict.question}-${verdict.attempt}`}
            className="text-super text-lime flicker-in mt-4"
          >
            {displayPercent}%
          </div>

          <div className="text-label text-lime mt-2 underline underline-offset-4">
            SURVIVAL RATE
          </div>

          <div className="border-2 border-white bg-black p-8 md:p-10 w-full mt-8 max-w-2xl fade-up">
            <p className="text-roast text-white uppercase tracking-wider">
              {verdict.roast}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full justify-center max-w-2xl">
            <button
              onClick={submit}
              className="bg-lime text-black text-roast px-6 py-4 border-2 border-lime hover:bg-bg hover:text-lime transition-none uppercase tracking-tight flex-1"
            >
              Try another bad decision
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="bg-transparent text-white text-roast px-6 py-4 border-2 border-white hover:bg-white hover:text-black transition-none uppercase tracking-tight flex-1 flex items-center justify-center gap-3"
            >
              <ShareIcon />
              Share this
            </button>
          </div>

          <button
            onClick={reset}
            className="mt-8 text-label-xs text-outline hover:text-lime underline underline-offset-4"
          >
            ← ASK A DIFFERENT QUESTION
          </button>
        </section>
      )}

      {shareOpen && verdict && (
        <ShareModal
          verdict={verdict}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}

function ShareIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
