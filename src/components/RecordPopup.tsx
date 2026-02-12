"use client";

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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-xl border border-zinc-600 bg-zinc-950 p-6"
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
            <span className="text-2xl font-bold text-red-500">
              {data.likeCount}
            </span>
          </div>
        </div>

        {/* Badge */}
        <div className="mb-4">
          <span className="rounded-full border border-white px-4 py-1 text-sm">
            {data.type}
          </span>
        </div>

        {/* Divider */}
        <div className="mb-4 border-t border-zinc-700" />

        {/* Request message */}
        <div className="mb-6 space-y-2 text-sm leading-relaxed text-white">
          {data.type === "Record" ? (
            <>
              <p>
                このレコードからリクエストする場合はこの画面をスタッフにご提示ください。
              </p>
              <p>レコードをお持ちしますのでそこから１曲お選びいただけます。</p>
              <p className="mt-3">
                To request a track from this record, please show this screen to
                our staff.
              </p>
              <p>
                We will bring the record to you so you can choose one track.
              </p>
            </>
          ) : (
            <>
              <p>
                このトラックをリクエストする場合はこの画面をスタッフにご提示ください。
              </p>
              <p className="mt-3">
                To request this track, please show this screen to our staff.
              </p>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="mb-4 border-t border-zinc-700" />

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
            className="flex items-center gap-3 rounded-full bg-white py-2 pl-8 pr-2 text-lg font-medium text-black"
          >
            <span>Close</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
              <svg
                className="h-5 w-5"
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
