"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  parseAdminTableSort,
  SortableHeaderButton,
  type AdminTableSort,
} from "@/components/admin/SortableHeaderButton";

const PAGE_SIZE = 50;

interface Track {
  id: string;
  name: string | null;
  number: number | null;
  artist: { id: string; name: string | null } | null;
  album: { id: string; name: string | null } | null;
  _count?: { likes: number };
  rankingAdjustment?: { scoreDelta: number } | null;
}

export default function AdminTracksPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bar = params.bar as string;
  const artistId = searchParams.get("artistId");
  const albumId = searchParams.get("albumId");
  const sort = parseAdminTableSort(searchParams.get("sort"));

  const [tracks, setTracks] = useState<Track[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const search = useCallback(async (q: string, p: number, sortMode: AdminTableSort) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), bar });
      if (q.trim()) params.set("query", q.trim());
      if (artistId) params.set("artistId", artistId);
      if (albumId) params.set("albumId", albumId);
      if (sortMode !== "default") params.set("sort", sortMode);
      const res = await fetch(`/api/tracks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setTracks(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setError("取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [bar, artistId, albumId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query, page, sort);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, page, sort, search]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleSort(nextSort: AdminTableSort) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextSort === "default" || sort === nextSort) {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", nextSort);
    }
    setPage(1);
    const queryString = nextParams.toString();
    router.push(queryString ? `/${bar}/admin/tracks?${queryString}` : `/${bar}/admin/tracks`);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/tracks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      search(query, page, sort);
    } catch {
      setError("削除に失敗しました");
    }
  }

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
        {albumId ? (
          <>
            <Link
              href={`/${bar}/admin/albums${artistId ? `?artistId=${artistId}` : ""}`}
              className="hover:text-white hover:underline"
            >
              アルバム一覧
            </Link>
            <span>/</span>
          </>
        ) : null}
        <span className="text-zinc-300">トラック一覧</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Hi-Res トラック管理
          <span className="ml-2 text-base font-normal text-zinc-400">({total}件)</span>
        </h1>
        <Link
          href={`/${bar}/admin/tracks/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規作成
        </Link>
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
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="トラック名・アーティスト名で検索..."
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
                <th className="py-2 font-medium">No.</th>
                <th className="py-2">
                  <SortableHeaderButton
                    label="トラック名"
                    active={sort === "default"}
                    direction="asc"
                    title="トラック名で昇順に並べ替え"
                    onClick={() => handleSort("default")}
                  />
                </th>
                <th className="py-2 font-medium">アーティスト</th>
                <th className="py-2 font-medium">アルバム</th>
                <th className="w-20 py-2 text-right">
                  <SortableHeaderButton
                    label="いいね"
                    active={sort === "likes_desc"}
                    title="いいね数で降順に並べ替え"
                    onClick={() => handleSort("likes_desc")}
                  />
                </th>
                <th className="w-20 py-2 text-right">
                  <SortableHeaderButton
                    label="補正"
                    active={sort === "adjusted_likes_desc"}
                    title="補正込みのいいね数で降順に並べ替え"
                    onClick={() => handleSort("adjusted_likes_desc")}
                  />
                </th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id} className="border-b border-zinc-800">
                  <td className="py-3 text-zinc-400">{track.number ?? "—"}</td>
                  <td className="py-3">{track.name ?? "—"}</td>
                  <td className="py-3 text-zinc-400">
                    {track.artist ? (
                      <button onClick={() => router.push(`/${bar}/admin/artists/${track.artist!.id}`)} className="hover:text-blue-400 hover:underline">{track.artist.name ?? "—"}</button>
                    ) : "—"}
                  </td>
                  <td className="py-3 text-zinc-400">
                    {track.album ? (
                      <button onClick={() => router.push(`/${bar}/admin/albums/${track.album!.id}`)} className="hover:text-blue-400 hover:underline">{track.album.name ?? "—"}</button>
                    ) : "—"}
                  </td>
                  <td className="w-20 py-3 text-right text-zinc-400">{track._count?.likes ?? 0}</td>
                  <td className="w-20 py-3 text-right text-zinc-400">
                    {track.rankingAdjustment?.scoreDelta ?? 0}
                  </td>
                  <td className="py-3 text-right"><div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => router.push(`/${bar}/admin/tracks/${track.id}/edit`)}
                      className="text-zinc-400 hover:text-blue-400"
                      title="編集"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(track.id, track.name ?? "")}
                      className="text-zinc-400 hover:text-red-400"
                      title="削除"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div></td>
                </tr>
              ))}
              {tracks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    トラックが見つかりません
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
