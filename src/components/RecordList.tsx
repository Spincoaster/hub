"use client";

import { useState, useCallback } from "react";
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

export function RecordList({
  items,
  likeMap: initialLikeMap,
  likeCounts: initialLikeCounts,
  singleColumn,
}: {
  items: RecordItem[];
  likeMap?: Record<string, string>;
  likeCounts?: Record<string, number>;
  singleColumn?: boolean;
}) {
  const [popupItemId, setPopupItemId] = useState<string | null>(null);
  const [likeMap, setLikeMap] = useState<Record<string, string>>(
    initialLikeMap ?? {},
  );
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    initialLikeCounts ?? {},
  );

  const likeable = initialLikeMap !== undefined;

  const toggleLike = useCallback(
    async (itemId: string, type: "Record" | "Hi-Res") => {
      const likeId = likeMap[itemId];
      const isLiked = !!likeId;

      // Optimistic update
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
        // Rollback on failure
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

  // Derive popup data from current state
  const popupItem = popupItemId
    ? items.find((i) => i.id === popupItemId)
    : null;
  const popupData: PopupData | null = popupItem
    ? {
        id: popupItem.id,
        name: popupItem.name,
        artistName: popupItem.artistName,
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
      {items.map((item) => {
        const count = likeCounts[item.id] ?? 0;
        const isLiked = !!likeMap[item.id];

        return (
          <button
            key={item.id}
            onClick={() => setPopupItemId(item.id)}
            className="group flex w-full items-stretch border-b border-zinc-600 first:border-t md:first:border-t-0 text-left transition-colors hover:bg-zinc-900/50"
          >
            <span className={`flex min-w-0 ${singleColumn ? "w-4/5" : "w-4/5 flex-col md:flex-row md:items-stretch"}`}>
              <span className={`min-w-0 truncate pl-2 pr-4 text-sm ${singleColumn ? "py-5 leading-[1.4]" : "pt-5 md:flex md:w-1/2 md:items-center md:py-5"}`}>{item.name}</span>
              {!singleColumn && (
                <>
                  <span className="hidden w-px self-stretch bg-zinc-600 md:block" />
                  <span className="min-w-0 truncate pb-5 pl-2 text-sm text-zinc-400 md:flex md:w-1/2 md:items-center md:py-5 md:pl-4">
                    {item.type === "Hi-Res" ? `${item.albumName} / ${item.artistName}` : item.artistName}
                  </span>
                </>
              )}
            </span>
            <span className="flex w-1/5 items-center justify-end gap-2 py-5 text-sm text-white">
              {likeable ? (
                <>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(item.id, item.type);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        toggleLike(item.id, item.type);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {isLiked ? (
                      <svg
                        className="h-3.5 w-3.5 text-red-500"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    ) : (
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    )}
                  </span>
                  <span>{count}</span>
                </>
              ) : (
                item.number != null && (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
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
                className="ml-2 h-4 w-4 text-white"
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
