"use client";

import { useEffect } from "react";
import { POPUP } from "@/lib/labels";

export type PopupData = {
  id: string;
  name: string;
  artistName: string;
  number: number | null;
  likeCount: number;
  type: "Record" | "Hi-Res";
  ownerName?: string;
  location?: string;
  isLiked?: boolean;
  likeId?: string;
};

export function RecordPopup({
  data,
  onClose,
  onToggleLike,
}: {
  data: PopupData;
  onClose: () => void;
  onToggleLike?: () => void;
}) {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", prevent);
      window.removeEventListener("touchmove", prevent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-xl border border-white bg-zinc-950/5 px-22 py-10 backdrop-blur-[4px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-medium">{data.name}</h2>
            <p className="mt-1 text-lg text-white">
              by {data.artistName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onToggleLike ? (
              <button onClick={onToggleLike} className="cursor-pointer">
                {data.isLiked ? (
                  <svg
                    className="h-6 w-6 text-red-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                )}
              </button>
            ) : (
              <svg
                className="h-6 w-6 text-red-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )}
            <span className={`text-2xl font-bold ${data.isLiked ? "text-red-500" : "text-white"}`}>
              {data.likeCount}
            </span>
          </div>
        </div>

        {/* Badge */}
        <div className="mb-4">
          <span className="rounded-full bg-white px-4 py-1 text-sm font-bold text-black">
            {data.type}
          </span>
        </div>


        {/* Request message */}
        <div className="mb-6 text-sm leading-snug text-white">
          {data.type === "Record" ? (
            <>
              <div className="space-y-0.5">
                <p>{POPUP.recordRequestEn1}</p>
                <p>{POPUP.recordRequestEn2}</p>
              </div>
              <div className="mt-3 space-y-0.5">
                <p>{POPUP.recordRequestJa1}</p>
                <p>{POPUP.recordRequestJa2}</p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-0.5">
                <p>{POPUP.trackRequestEn}</p>
              </div>
              <div className="mt-3 space-y-0.5">
                <p>{POPUP.trackRequestJa}</p>
              </div>
            </>
          )}
        </div>


        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {data.ownerName && (
              <p className="text-lg font-medium">{data.ownerName}</p>
            )}
            {data.location && (
              <p className="text-lg font-medium">{data.location}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-16 items-center gap-12 rounded-full border border-white bg-black pl-10 pr-0 text-lg font-medium text-white"
          >
            <span>{POPUP.close}</span>
            <span className="relative flex h-[62px] w-[62px] shrink-0 items-center justify-center">
              <img src="/annulus.svg" alt="" className="absolute inset-0 h-full w-full" />
              <svg
                className="relative h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M19 12H5M5 12l5-5M5 12l5 5" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
