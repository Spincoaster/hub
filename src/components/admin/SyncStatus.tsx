"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface SyncJob {
  id: string;
  bar: number;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  result: string | null;
  error: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "bg-yellow-600 text-yellow-100",
    completed: "bg-green-700 text-green-100",
    failed: "bg-red-700 text-red-100",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-zinc-700 text-zinc-300"}`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
}

export function SyncStatus({
  barValue,
  latestSync,
}: {
  barValue: number;
  latestSync: SyncJob | null;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch(`/api/sync-records?bar=${barValue}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Sync failed");
      }
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setSyncing(false);
    }
  }

  let parsedResult: Record<string, unknown> | null = null;
  if (latestSync?.result) {
    try {
      parsedResult = JSON.parse(latestSync.result);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-lg border border-zinc-700 p-4">
      {latestSync ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <StatusBadge status={latestSync.status} />
            <span className="text-sm text-zinc-400">
              {formatDate(latestSync.startedAt)}
            </span>
            {latestSync.finishedAt && (
              <span className="text-sm text-zinc-500">
                ~ {formatDate(latestSync.finishedAt)}
              </span>
            )}
          </div>
          {parsedResult && (
            <div className="text-sm text-zinc-400">
              {parsedResult.sheetRows != null && (
                <span className="mr-4">
                  Rows: {String(parsedResult.sheetRows)}
                </span>
              )}
              {parsedResult.created != null && (
                <span className="mr-4">
                  Created: {String(parsedResult.created)}
                </span>
              )}
              {parsedResult.updated != null && (
                <span>Updated: {String(parsedResult.updated)}</span>
              )}
            </div>
          )}
          {latestSync.error && (
            <p className="text-sm text-red-400">{latestSync.error}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">同期履歴がありません</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      <button
        onClick={handleSync}
        disabled={syncing}
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync Now"}
      </button>
    </div>
  );
}
