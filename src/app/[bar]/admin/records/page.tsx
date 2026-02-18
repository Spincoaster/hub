"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PAGE_SIZE = 50;

interface Record {
  id: string;
  name: string | null;
  location: string | null;
  number: string | null;
  artist: { id: string; name: string | null } | null;
  owner: { id: string; name: string | null } | null;
}

export default function AdminRecordsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bar = params.bar as string;
  const artistId = searchParams.get("artistId");

  const [records, setRecords] = useState<Record[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const search = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), bar });
      if (q.trim()) params.set("query", q.trim());
      if (artistId) params.set("artistId", artistId);
      const res = await fetch(`/api/records?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setRecords(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setError("取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [bar, artistId]);

  useEffect(() => {
    search(query, page);
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      search(query, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex gap-2 text-sm text-zinc-400">
        <Link
          href={`/${bar}/admin`}
          className="hover:text-white hover:underline"
        >
          Admin
        </Link>
        <span>/</span>
        <Link
          href={`/${bar}/admin/artists`}
          className="hover:text-white hover:underline"
        >
          アーティスト一覧
        </Link>
        <span>/</span>
        <span className="text-zinc-300">レコード一覧</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          レコード一覧
          <span className="ml-2 text-base font-normal text-zinc-400">({total}件)</span>
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="レコード名・アーティスト名で検索..."
          className="block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <p className="text-zinc-400">読み込み中...</p>
      ) : (
        <>
          {totalPages > 1 && (
            <div className="mb-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-zinc-600 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
              >
                &larr;
              </button>
              <span className="text-sm text-zinc-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-zinc-600 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
              >
                &rarr;
              </button>
            </div>
          )}

          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400">
                <th className="py-2 font-medium">レコード名</th>
                <th className="py-2 font-medium">アーティスト</th>
                <th className="py-2 font-medium">場所</th>
                <th className="py-2 font-medium">番号</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-zinc-800">
                  <td className="py-3">{record.name ?? "—"}</td>
                  <td className="py-3 text-zinc-400">
                    {record.artist ? (
                      <button onClick={() => router.push(`/${bar}/admin/artists/${record.artist!.id}`)} className="hover:text-blue-400 hover:underline">{record.artist.name ?? "—"}</button>
                    ) : "—"}
                  </td>
                  <td className="py-3 text-zinc-400">{record.location ?? "—"}</td>
                  <td className="py-3 text-zinc-400">{record.number ?? "—"}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => router.push(`/${bar}/admin/records/${record.id}/edit`)}
                      className="text-zinc-400 hover:text-blue-400"
                      title="編集"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    レコードが見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-zinc-600 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
              >
                &larr;
              </button>
              <span className="text-sm text-zinc-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-zinc-600 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
              >
                &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
