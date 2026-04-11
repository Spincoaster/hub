"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { RecordPopup, type PopupData } from "@/components/RecordPopup";

type RecordItem = {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  number: number | null;
  type: "Record" | "Hi-Res";
  ownerName?: string;
  location?: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export function RecordCarousel({
  items,
  likeMap: initialLikeMap,
  likeCounts: initialLikeCounts,
  singleColumn,
  columns,
}: {
  items: RecordItem[];
  likeMap?: Record<string, string>;
  likeCounts?: Record<string, number>;
  singleColumn?: boolean;
  columns?: string[];
}) {
  const [popupItemId, setPopupItemId] = useState<string | null>(null);
  const [likeMap, setLikeMap] = useState<Record<string, string>>(
    initialLikeMap ?? {},
  );
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    initialLikeCounts ?? {},
  );
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [padLeft, setPadLeft] = useState(16);
  const [pageWidth, setPageWidth] = useState(0);

  const measured = pageWidth > 0;
  const likeable = initialLikeMap !== undefined;
  const pages = chunk(items, 5);

  // Measure alignment with max-w-7xl px-4 container
  useEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPadLeft(rect.left);
      setPageWidth(rect.width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Track active page from scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (pageWidth === 0) return;
      const gap = 16;
      const page = Math.round(el.scrollLeft / (pageWidth + gap));
      setActivePage(Math.min(page, pages.length - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [pages.length, pageWidth]);

  const goToPage = (page: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const children = el.children;
    if (children.length === 0) return;
    const target = children[page] as HTMLElement | undefined;
    if (target) {
      el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: "smooth" });
    }
  };

  const toggleLike = useCallback(
    async (itemId: string, type: "Record" | "Hi-Res") => {
      const likeId = likeMap[itemId];
      const isLiked = !!likeId;

      if (isLiked) {
        setLikeMap((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [itemId]: Math.max((prev[itemId] ?? 0) - 1, 0),
        }));
      } else {
        setLikeMap((prev) => ({ ...prev, [itemId]: "pending" }));
        setLikeCounts((prev) => ({
          ...prev,
          [itemId]: (prev[itemId] ?? 0) + 1,
        }));
      }

      try {
        if (isLiked) {
          const res = await fetch(`/api/likes/${likeId}`, { method: "DELETE" });
          if (!res.ok) throw new Error("delete failed");
        } else {
          const body =
            type === "Record"
              ? { recordId: itemId }
              : { trackId: itemId };
          const res = await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error("create failed");
          const data = await res.json();
          setLikeMap((prev) => ({ ...prev, [itemId]: String(data.id) }));
        }
      } catch {
        if (isLiked) {
          setLikeMap((prev) => ({ ...prev, [itemId]: likeId }));
          setLikeCounts((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] ?? 0) + 1,
          }));
        } else {
          setLikeMap((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
          });
          setLikeCounts((prev) => ({
            ...prev,
            [itemId]: Math.max((prev[itemId] ?? 0) - 1, 0),
          }));
        }
      }
    },
    [likeMap],
  );

  const popupItem = popupItemId
    ? items.find((i) => i.id === popupItemId)
    : null;
  const popupData: PopupData | null = popupItem
    ? {
        id: popupItem.id,
        name: popupItem.name,
        artistName: popupItem.artistName,
        albumName: popupItem.albumName,
        number: popupItem.number,
        likeCount: likeCounts[popupItem.id] ?? 0,
        type: popupItem.type,
        ownerName: popupItem.ownerName,
        location: popupItem.location,
        isLiked: likeable ? !!likeMap[popupItem.id] : undefined,
        likeId: likeMap[popupItem.id],
      }
    : null;

  return (
    <>
      {/* Hidden measurement div to align with max-w-7xl px-4 */}
      <div className="pointer-events-none mx-auto max-w-7xl px-4" aria-hidden>
        <div ref={measureRef} />
      </div>

      <div
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto snap-x snap-mandatory transition-opacity duration-500 ${measured ? "opacity-100" : "opacity-0"}`}
        style={{
          scrollbarWidth: "none",
          scrollPaddingInlineStart: padLeft,
          paddingLeft: padLeft,
          paddingRight: padLeft,
        }}
      >
        {pages.map((page, pageIdx) => (
          <div key={pageIdx} className="shrink-0 snap-start snap-always" style={{ width: pageWidth || "100%" }}>
            <div className="hidden items-stretch border-b border-zinc-600 text-xs font-semibold text-white md:flex">
              <span className="flex w-4/5 items-stretch">
                {(columns ?? ["Title", "Artist"]).map((col, i) => (
                  <span key={col} className={`flex w-1/2 items-center py-2 ${i === 0 ? "pl-2 pr-4" : "pl-4"}`}>{col}</span>
                )).reduce<React.ReactNode[]>((acc, el, i) => {
                  if (i > 0) acc.push(<span key={`sep-${i}`} className="w-px self-stretch bg-zinc-600" />);
                  acc.push(el);
                  return acc;
                }, [])}
              </span>
              <span className="w-1/5" />
            </div>
            {page.map((item) => {
              const count = likeCounts[item.id] ?? 0;
              const isLiked = !!likeMap[item.id];

              return (
                <button
                  key={item.id}
                  onClick={() => setPopupItemId(item.id)}
                  className="group flex w-full select-none touch-manipulation items-stretch border-b border-zinc-600 first:border-t md:first:border-t-0 text-left transition-colors hover:bg-zinc-900/50"
                >
                  <span className={`flex min-w-0 ${singleColumn ? "w-4/5" : "w-4/5 flex-col md:flex-row md:items-stretch"}`}>
                    <span className={`min-w-0 truncate pl-2 pr-4 text-sm group-hover:text-red-400 ${singleColumn ? "py-5 leading-[1.4]" : "pt-5 md:flex md:w-1/2 md:items-center md:py-5"}`}>{item.name}</span>
                    {!singleColumn && (
                      <>
                        <span className="hidden w-px self-stretch bg-zinc-600 md:block" />
                        <span className="min-w-0 truncate pb-5 pl-2 text-sm text-zinc-400 group-hover:text-red-400 md:flex md:w-1/2 md:items-center md:py-5 md:pl-4">
                          {item.type === "Hi-Res" ? `${item.albumName} / ${item.artistName}` : item.artistName}
                        </span>
                      </>
                    )}
                  </span>
                  <span className="flex w-1/5 items-center justify-end gap-1 py-5 text-sm text-white">
                    {likeable ? (
                      <>
                        {isLiked ? (
                          <svg
                            className="h-3.5 w-3.5 shrink-0 text-red-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        ) : (
                          <svg
                            className="h-3.5 w-3.5 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        )}
                        <span className="min-w-8 text-center">{count}</span>
                      </>
                    ) : (
                      item.number != null && (
                        <>
                          <svg
                            className="h-3.5 w-3.5 shrink-0"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span>{item.number}</span>
                        </>
                      )
                    )}
                    <svg
                      className="ml-1 h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div className={`mt-6 flex justify-center gap-2 transition-opacity duration-500 ${measured ? "opacity-100" : "opacity-0"}`}>
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === activePage ? "bg-white" : "bg-zinc-600"
              }`}
            />
          ))}
        </div>
      )}

      {popupData && (
        <RecordPopup
          data={popupData}
          onClose={() => setPopupItemId(null)}
          onToggleLike={
            likeable
              ? () => toggleLike(popupData.id, popupData.type)
              : undefined
          }
        />
      )}
    </>
  );
}
