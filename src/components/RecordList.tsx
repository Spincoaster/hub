"use client";

import { useState, useCallback } from "react";
import { RecordPopup, type PopupData } from "@/components/RecordPopup";
import { recordListItemKey } from "@/lib/record-list-keys";


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
  const [popupItemKey, setPopupItemKey] = useState<string | null>(null);
  const [likeMap, setLikeMap] = useState<Record<string, string>>(
    initialLikeMap ?? {},
  );
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    initialLikeCounts ?? {},
  );

  const likeable = initialLikeMap !== undefined;
  const itemKey = (item: RecordItem) => recordListItemKey(item.id, item.type);
  const getLikeId = (item: RecordItem) => likeMap[itemKey(item)] ?? likeMap[item.id];
  const getLikeCount = (item: RecordItem) =>
    likeCounts[itemKey(item)] ?? likeCounts[item.id] ?? 0;

  const toggleLike = useCallback(
    async (item: RecordItem) => {
      const key = recordListItemKey(item.id, item.type);
      const likeId = likeMap[key] ?? likeMap[item.id];
      const isLiked = !!likeId;
      const previousCount = likeCounts[key] ?? likeCounts[item.id] ?? 0;

      // Optimistic update
      if (isLiked) {
        setLikeMap((prev) => {
          const next = { ...prev };
          delete next[key];
          delete next[item.id];
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [key]: Math.max(previousCount - 1, 0),
        }));
      } else {
        setLikeMap((prev) => ({ ...prev, [key]: "pending" }));
        setLikeCounts((prev) => ({
          ...prev,
          [key]: previousCount + 1,
        }));
      }

      try {
        if (isLiked) {
          const res = await fetch(`/api/likes/${likeId}`, { method: "DELETE" });
          if (!res.ok) throw new Error("delete failed");
          const data = await res.json();
          if (typeof data.likeCount === "number") {
            setLikeCounts((prev) => ({ ...prev, [key]: data.likeCount }));
          }
        } else {
          const body =
            item.type === "Record"
              ? { recordId: item.id }
              : { trackId: item.id };
          const res = await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error("create failed");
          const data = await res.json();
          setLikeMap((prev) => ({ ...prev, [key]: String(data.id) }));
          if (typeof data.likeCount === "number") {
            setLikeCounts((prev) => ({ ...prev, [key]: data.likeCount }));
          }
        }
      } catch {
        // Rollback on failure
        if (isLiked) {
          setLikeMap((prev) => ({ ...prev, [key]: likeId }));
          setLikeCounts((prev) => ({
            ...prev,
            [key]: previousCount,
          }));
        } else {
          setLikeMap((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setLikeCounts((prev) => ({
            ...prev,
            [key]: previousCount,
          }));
        }
      }
    },
    [likeCounts, likeMap],
  );

  // Derive popup data from current state
  const popupItem = popupItemKey
    ? items.find((i) => itemKey(i) === popupItemKey)
    : null;
  const popupData: PopupData | null = popupItem
    ? {
        id: popupItem.id,
        name: popupItem.name,
        artistName: popupItem.artistName,
        albumName: popupItem.albumName,
        number: popupItem.number,
        likeCount: getLikeCount(popupItem),
        type: popupItem.type,
        ownerName: popupItem.ownerName,
        location: popupItem.location,
        isLiked: likeable ? !!getLikeId(popupItem) : undefined,
        likeId: getLikeId(popupItem),
      }
    : null;

  return (
    <>
      {items.map((item) => {
        const key = itemKey(item);
        const count = getLikeCount(item);
        const isLiked = !!getLikeId(item);

        return (
          <button
            key={key}
            onClick={() => setPopupItemKey(key)}
            className="group flex w-full touch-manipulation items-stretch border-b border-zinc-600 first:border-t md:first:border-t-0 text-left transition-colors hover:bg-zinc-900/50"
          >
            <span className={`flex min-w-0 flex-1 ${singleColumn ? "" : "flex-col md:flex-row md:items-stretch"}`}>
              <span className={`min-w-0 pl-2 pr-4 text-sm group-hover:text-red-400 ${singleColumn ? "py-5 leading-[1.4]" : "pt-5 md:flex md:w-1/2 md:items-center md:py-5"}`}><span className="block truncate">{item.name}</span></span>
              {!singleColumn && (
                <>
                  <span className="hidden w-px self-stretch bg-zinc-600 md:block" />
                  <span className="min-w-0 pb-5 pl-2 text-sm text-zinc-400 group-hover:text-red-400 md:flex md:w-1/2 md:items-center md:py-5 md:pl-4">
                    <span className="block truncate">{item.type === "Hi-Res" ? `${item.albumName} / ${item.artistName}` : item.artistName}</span>
                  </span>
                </>
              )}
            </span>
            <span className="flex w-24 shrink-0 items-center justify-end gap-1 py-5 pr-2 text-sm text-white">
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

      {popupData && (
        <RecordPopup
          data={popupData}
          onClose={() => setPopupItemKey(null)}
          onToggleLike={
            likeable
              ? () => toggleLike(popupItem!)
              : undefined
          }
        />
      )}
    </>
  );
}
