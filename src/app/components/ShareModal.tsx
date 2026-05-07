"use client";

import { useEffect, useState } from "react";

interface Props {
  verdict: {
    question: string;
    percentage: number;
    roast: string;
    verdict: string;
  };
  onClose: () => void;
}

export function ShareModal({ verdict, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const params = new URLSearchParams({
    q: verdict.question,
    p: String(verdict.percentage),
    r: verdict.roast,
    v: verdict.verdict,
  });
  const imageUrl = `/api/og?${params.toString()}`;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?q=${encodeURIComponent(verdict.question)}`
      : "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `should-i-do-it-${verdict.percentage}.png`;
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-bg/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-2 border-lime p-1 bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Share card"
            className="w-full h-auto block"
            width={1080}
            height={1080}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            className="bg-lime text-black text-roast px-6 py-4 border-2 border-lime hover:bg-bg hover:text-lime transition-none uppercase tracking-tight flex-1 flex items-center justify-center gap-3"
          >
            <DownloadIcon />
            Download Image
          </button>
          <button
            onClick={handleCopyLink}
            className="bg-transparent text-white text-roast px-6 py-4 border-2 border-white hover:bg-white hover:text-black transition-none uppercase tracking-tight flex-1 flex items-center justify-center gap-3"
          >
            <LinkIcon />
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-label-xs text-outline hover:text-lime mt-2"
        >
          × DISMISS
        </button>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
