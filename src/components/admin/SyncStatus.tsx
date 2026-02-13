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

interface ChangeEntry {
  type: "created" | "updated" | "deleted" | "duplicated";
  name: string;
  artist: string;
  owner: string;
  number: number;
  fields?: string[];
}

function ChangeDetails({ changes }: { changes: ChangeEntry[] }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
        Changes ({changes.length})
      </summary>
      <ul className="mt-1 max-h-60 space-y-0.5 overflow-y-auto text-xs text-zinc-400">
        {changes.map((c, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span
              className={
                c.type === "created"
                  ? "text-green-400"
                  : c.type === "deleted"
                    ? "text-red-400"
                    : c.type === "duplicated"
                      ? "text-orange-400"
                      : "text-yellow-400"
              }
            >
              {c.type === "created" ? "+" : c.type === "deleted" ? "−" : c.type === "duplicated" ? "!" : "~"}
            </span>
            <span>
              #{c.number} {c.name}
              {c.artist ? ` / ${c.artist}` : ""}
              {c.owner ? ` (${c.owner})` : ""}
              {c.fields && c.fields.length > 0 && (
                <span className="ml-1 text-zinc-600">
                  [{c.fields.join(", ")}]
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </details>
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
            <div className="space-y-2">
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
                  <span className="mr-4">
                    Updated: {String(parsedResult.updated)}
                  </span>
                )}
                {parsedResult.deleted != null && (
                  <span className="mr-4">
                    Deleted: {String(parsedResult.deleted)}
                  </span>
                )}
                {parsedResult.duplicated != null && Number(parsedResult.duplicated) > 0 && (
                  <span className="text-orange-400">
                    Duplicated: {String(parsedResult.duplicated)}
                  </span>
                )}
              </div>
              {Array.isArray(parsedResult.changes) && parsedResult.changes.length > 0 && (
                <ChangeDetails changes={parsedResult.changes as ChangeEntry[]} />
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
        {syncing ? "同期中..." : "同期スタート"}
      </button>
    </div>
  );
}
