"use client";

import Link from "next/link";
import { useRef, useEffect, useCallback } from "react";
import { SEARCH } from "@/lib/labels";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export default function InitialLetterPagination({
  basePath,
  currentPrefix,
  showAll = false,
}: {
  basePath: string;
  currentPrefix?: string;
  showAll?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    const thumb = thumbRef.current;
    const track = trackRef.current;
    if (!el || !thumb || !track) return;

    const ratio = el.clientWidth / el.scrollWidth;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const scrollPos = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    if (ratio >= 1) {
      track.style.display = "none";
    } else {
      track.style.display = "";
      thumb.style.width = `${ratio * 100}%`;
      thumb.style.transform = `translate3d(${scrollPos * (1 / ratio - 1) * 100}%, 0, 0)`;
    }
  }, []);

  const scrollToRatio = useCallback((clientX: number) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollLeft = ratio * maxScroll;
    updateThumb();
  }, [updateThumb]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !currentPrefix) return;
    const idx = LETTERS.indexOf(currentPrefix.toLowerCase());
    if (idx >= 0) {
      const child = el.children[idx] as HTMLElement;
      if (child) {
        child.scrollIntoView({ inline: "center", block: "nearest" });
      }
    }
  }, [currentPrefix]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (dragging.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateThumb);
    };

    updateThumb();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateThumb);

    // Drag handlers
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      scrollToRatio(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      scrollToRatio(e.touches[0].clientX);
    };
    const onEnd = () => { dragging.current = false; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onEnd);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateThumb);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [updateThumb, scrollToRatio]);

  const onTrackStart = useCallback((clientX: number) => {
    dragging.current = true;
    scrollToRatio(clientX);
  }, [scrollToRatio]);

  return (
    <div>
      <div className="overflow-hidden bg-white">
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
        >
          {showAll && (
            <Link
              href={basePath}
              className={`flex h-10 shrink-0 items-center justify-center px-3 text-lg font-semibold ${
                !currentPrefix
                  ? "rounded-full bg-black text-white"
                  : "text-black"
              }`}
            >
              {SEARCH.all}
            </Link>
          )}
          {LETTERS.map((letter) => (
            <Link
              key={letter}
              href={`${basePath}?has_prefix=${letter}`}
              className={`flex h-10 w-10 shrink-0 items-center justify-center text-3xl font-normal ${
                currentPrefix === letter
                  ? "rounded-full bg-black text-white"
                  : "text-black"
              }`}
            >
              {letter.toUpperCase()}
            </Link>
          ))}
          <Link
            href={`${basePath}?has_prefix=%23`}
            className={`flex h-10 w-10 shrink-0 items-center justify-center text-3xl font-normal ${
              currentPrefix === "#"
                ? "rounded-full bg-black text-white"
                : "text-black"
            }`}
          >
            #
          </Link>
        </div>
      </div>
      <div
        ref={trackRef}
        className="mx-auto mt-3 h-4 w-1/3 cursor-pointer rounded-full"
        onMouseDown={(e) => onTrackStart(e.clientX)}
        onTouchStart={(e) => onTrackStart(e.touches[0].clientX)}
      >
        <div className="flex h-full items-center">
          <div className="h-px w-full rounded-full bg-zinc-700">
            <div ref={thumbRef} className="h-full rounded-full bg-white will-change-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
