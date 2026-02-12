"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({ bar }: { bar?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, close]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const path = bar ? `/${bar}/search` : "/search";
    router.push(`${path}?query=${encodeURIComponent(query.trim())}`);
    close();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 transition-colors hover:opacity-70"
      >
        <img src="/search.svg" alt="Search" className="h-5 w-5" />
      </button>

      {open && (
        <div className="search-fade-in absolute inset-x-0 top-0 z-[70] flex h-28 items-center justify-center px-4">
          <form onSubmit={handleSubmit} className="flex w-full max-w-5xl items-center gap-4 bg-white px-6 py-3">
            <img src="/search.svg" alt="Search" className="h-6 w-6 brightness-0" />
            <div className="h-8 w-px bg-black" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent text-2xl font-medium text-black placeholder-zinc-400 outline-none"
            />
            <button
              type="button"
              onClick={close}
              className="p-1 hover:opacity-70"
            >
              <svg className="h-6 w-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
