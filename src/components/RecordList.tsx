"use client";

import { useState } from "react";
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

export function RecordList({ items }: { items: RecordItem[] }) {
  const [popup, setPopup] = useState<PopupData | null>(null);

  return (
    <>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() =>
            setPopup({
              name: item.name,
              artistName: item.artistName,
              number: item.number,
              type: item.type,
              ownerName: item.ownerName,
              location: item.location,
            })
          }
          className="group flex w-full items-center border-b border-zinc-800 py-3 text-left transition-colors hover:bg-zinc-900/50"
        >
          <span className="w-2/5 truncate text-sm">{item.artistName}</span>
          <span className="w-2/5 truncate text-sm">{item.albumName}</span>
          <span className="flex w-1/5 items-center justify-end gap-1 text-sm text-zinc-400">
            {item.number != null && (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{String(item.number).padStart(3, "0")}</span>
              </>
            )}
            <svg
              className="ml-2 h-4 w-4 text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </button>
      ))}

      {popup && <RecordPopup data={popup} onClose={() => setPopup(null)} />}
    </>
  );
}
