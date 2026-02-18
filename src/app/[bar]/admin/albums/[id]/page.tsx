"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Album {
  id: string;
  name: string | null;
  phoneticName: string | null;
  furigana: string | null;
  artist: { id: string; name: string | null } | null;
  tracks: { id: string; name: string | null; number: number | null }[];
}

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bar = params.bar as string;
  const id = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/albums/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setAlbum(data))
      .catch(() => setError("取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">読み込み中...</p>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded border border-red-400 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error ?? "アルバムが見つかりません"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex gap-2 text-sm text-zinc-400">
        <Link href={`/${bar}/admin`} className="hover:text-white hover:underline">Admin</Link>
        <span>/</span>
        <Link href={`/${bar}/admin/artists`} className="hover:text-white hover:underline">アーティスト一覧</Link>
        <span>/</span>
        <Link href={`/${bar}/admin/albums`} className="hover:text-white hover:underline">アルバム一覧</Link>
        <span>/</span>
        <span className="text-zinc-300">詳細</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{album.name ?? "—"}</h1>
        <Link
          href={`/${bar}/admin/albums/${id}/edit`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          編集
        </Link>
      </div>

      <div className="mb-8 space-y-2 text-sm">
        <div className="flex gap-4">
          <span className="w-24 text-zinc-400">アーティスト</span>
          {album.artist ? (
            <button
              onClick={() => router.push(`/${bar}/admin/artists/${album.artist!.id}`)}
              className="text-white hover:text-blue-400 hover:underline"
            >
              {album.artist.name ?? "—"}
            </button>
          ) : (
            <span className="text-white">—</span>
          )}
        </div>
        <div className="flex gap-4">
          <span className="w-24 text-zinc-400">読み</span>
          <span className="text-white">{album.phoneticName ?? "—"}</span>
        </div>
        <div className="flex gap-4">
          <span className="w-24 text-zinc-400">ふりがな</span>
          <span className="text-white">{album.furigana ?? "—"}</span>
        </div>
      </div>

      {/* トラック */}
      {album.tracks.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-white">
            トラック
            <span className="ml-2 text-sm font-normal text-zinc-400">({album.tracks.length}件)</span>
          </h2>
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400">
                <th className="py-2 font-medium">No.</th>
                <th className="py-2 font-medium">名前</th>
              </tr>
            </thead>
            <tbody>
              {album.tracks.map((track) => (
                <tr key={track.id} className="border-b border-zinc-800">
                  <td className="py-3 text-zinc-400">{track.number ?? "—"}</td>
                  <td className="py-3">
                    <button
                      onClick={() => router.push(`/${bar}/admin/tracks/${track.id}/edit`)}
                      className="hover:text-blue-400 hover:underline"
                    >
                      {track.name ?? "—"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
