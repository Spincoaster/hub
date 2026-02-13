"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SEARCH } from "@/lib/labels";

export function SearchBar({ bar, onOpen }: { bar?: string; onOpen?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const open = () => {
    setVisible(true);
    onOpen?.();
    // Next frame: trigger fade-in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShow(true));
    });
  };

  const close = useCallback(() => {
    setShow(false);
    setTimeout(() => {
      setVisible(false);
      setQuery("");
    }, 300);
  }, []);

  useEffect(() => {
    if (visible && show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible, show]);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, close]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const path = bar ? `/${bar}/search` : "/search";
    router.push(`${path}?query=${encodeURIComponent(query.trim())}`);
    setVisible(false);
    setShow(false);
    setQuery("");
  };

  return (
    <>
      <button
        onClick={open}
        className="p-1 transition-colors hover:opacity-70"
      >
        <img src="/search.svg" alt="Search" className="h-5 w-5" />
      </button>

      {visible && (
        <div
          className="absolute inset-x-0 top-0 z-[70] flex h-28 items-center justify-center px-4"
          style={{
            transition: "opacity 0.3s ease-out",
            opacity: show ? 1 : 0,
          }}
        >
          <form onSubmit={handleSubmit} className="flex w-full max-w-7xl items-center gap-4 bg-white py-3 pl-4 pr-6">
            <img src="/search.svg" alt="Search" className="h-6 w-6 brightness-0" />
            <div className="h-8 w-px bg-black" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={SEARCH.placeholder}
              className="min-w-0 flex-1 bg-transparent text-2xl font-medium text-black placeholder-zinc-400 outline-none"
            />
            <button
              type="button"
              onClick={close}
              className="shrink-0 p-1 hover:opacity-70"
            >
              <svg className="h-4 w-5" viewBox="0 0 52 39" fill="none">
                <line x1="0" y1="19.35" x2="52" y2="19.35" stroke="#000" strokeMiterlimit={10} strokeWidth={5} style={{ transformOrigin: "26px 19.35px", transform: "rotate(33deg)" }} />
                <line x1="0" y1="19.35" x2="52" y2="19.35" stroke="#000" strokeMiterlimit={10} strokeWidth={5} style={{ transformOrigin: "26px 19.35px", transform: "rotate(-33deg)" }} />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
