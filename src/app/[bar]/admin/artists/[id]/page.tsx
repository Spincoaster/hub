"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Artist {
  id: string;
  name: string | null;
  phoneticName: string | null;
  furigana: string | null;
  albums: { id: string; name: string | null; _count?: { tracks: number } }[];
  records: { id: string; name: string | null; location: string | null; number: string | null; bar: number | null; owner: { name: string | null } | null }[];
  tracks: { id: string; name: string | null; number: number | null; album: { id: string; name: string | null } | null }[];
}

const BAR_VALUES: Record<string, number> = { shinjuku: 0, ebisu: 1, kagurazaka: 2 };

export default function ArtistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bar = params.bar as string;
  const id = params.id as string;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const barRecords = artist?.records.filter((r) => r.bar === BAR_VALUES[bar]) ?? [];

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setArtist(data))
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

  if (error || !artist) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded border border-red-400 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error ?? "アーティストが見つかりません"}
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
        <span className="text-zinc-300">詳細</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{artist.name ?? "—"}</h1>
        <Link
          href={`/${bar}/admin/artists/${id}/edit`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          編集
        </Link>
      </div>

      <div className="mb-8 space-y-2 text-sm">
        <div className="flex gap-4">
          <span className="w-24 text-zinc-400">読み</span>
          <span className="text-white">{artist.phoneticName ?? "—"}</span>
        </div>
        <div className="flex gap-4">
          <span className="w-24 text-zinc-400">ふりがな</span>
          <span className="text-white">{artist.furigana ?? "—"}</span>
        </div>
      </div>

      {/* アルバム */}
      {artist.albums.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-white">
            アルバム
            <span className="ml-2 text-sm font-normal text-zinc-400">({artist.albums.length}件)</span>
          </h2>
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400">
                <th className="py-2 font-medium">名前</th>
                <th className="w-12 py-2 text-center font-medium" title="トラック数">
                  <svg className="inline h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                </th>
              </tr>
            </thead>
            <tbody>
              {artist.albums.map((album) => (
                <tr key={album.id} className="border-b border-zinc-800">
                  <td className="py-3">
                    <button
                      onClick={() => router.push(`/${bar}/admin/albums/${album.id}`)}
                      className="hover:text-blue-400 hover:underline"
                    >
                      {album.name ?? "—"}
                    </button>
                  </td>
                  <td className="w-12 py-3 text-center text-zinc-400">{album._count?.tracks ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* トラック */}
      {artist.tracks.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-white">
            トラック
            <span className="ml-2 text-sm font-normal text-zinc-400">({artist.tracks.length}件)</span>
          </h2>
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400">
                <th className="py-2 font-medium">No.</th>
                <th className="py-2 font-medium">名前</th>
                <th className="py-2 font-medium">アルバム</th>
              </tr>
            </thead>
            <tbody>
              {artist.tracks.map((track) => (
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
                  <td className="py-3 text-zinc-400">
                    {track.album ? (
                      <button
                        onClick={() => router.push(`/${bar}/admin/albums/${track.album!.id}`)}
                        className="hover:text-blue-400 hover:underline"
                      >
                        {track.album.name ?? "—"}
                      </button>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* レコード */}
      {barRecords.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-white">
            レコード
            <span className="ml-2 text-sm font-normal text-zinc-400">({barRecords.length}件)</span>
          </h2>
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400">
                <th className="py-2 font-medium">名前</th>
                <th className="py-2 font-medium">場所</th>
                <th className="py-2 font-medium">番号</th>
              </tr>
            </thead>
            <tbody>
              {barRecords.map((record) => (
                <tr key={record.id} className="border-b border-zinc-800">
                  <td className="py-3">
                    <button
                      onClick={() => router.push(`/${bar}/admin/records/${record.id}/edit`)}
                      className="hover:text-blue-400 hover:underline"
                    >
                      {record.name ?? "—"}
                    </button>
                  </td>
                  <td className="py-3 text-zinc-400">{record.location ?? "—"}</td>
                  <td className="py-3 text-zinc-400">{record.number ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
