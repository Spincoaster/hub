"use client";

import Link from "next/link";
import { useRef } from "react";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export default function InitialLetterPagination({
  basePath,
  currentPrefix,
}: {
  basePath: string;
  currentPrefix?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-400">[ Artist ]</p>
      <div className="flex items-center overflow-hidden bg-white py-2">
        <button
          onClick={() => scroll("left")}
          className="shrink-0 px-3 text-2xl font-bold text-black"
          aria-label="Scroll left"
        >
          &lsaquo;
        </button>
        <div
          ref={scrollRef}
          className="flex items-center overflow-x-auto scrollbar-hide"
        >
          {LETTERS.map((letter) => (
            <Link
              key={letter}
              href={`${basePath}?has_prefix=${letter}`}
              className={`flex h-10 w-10 shrink-0 items-center justify-center text-2xl font-bold text-black ${
                currentPrefix === letter
                  ? "rounded-full border-2 border-black"
                  : ""
              }`}
            >
              {letter.toUpperCase()}
            </Link>
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="shrink-0 px-3 text-2xl font-bold text-black"
          aria-label="Scroll right"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
}
