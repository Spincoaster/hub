"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

interface Option {
  id: string;
  name: string | null;
}

export default function EditTrackPage() {
  const params = useParams();
  const router = useRouter();
  const bar = params.bar as string;
  const id = params.id as string;

  const [name, setName] = useState("");
  const [phoneticName, setPhoneticName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [number, setNumber] = useState<number | "">("");
  const [artistId, setArtistId] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [albumQuery, setAlbumQuery] = useState("");
  const [artistResults, setArtistResults] = useState<Option[]>([]);
  const [albumResults, setAlbumResults] = useState<Option[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Option | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Option | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tracks/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setName(data.name ?? "");
        setPhoneticName(data.phoneticName ?? "");
        setFurigana(data.furigana ?? "");
        setNumber(data.number ?? "");
        if (data.artist) {
          setSelectedArtist({ id: data.artist.id, name: data.artist.name });
          setArtistId(data.artist.id);
        }
        if (data.album) {
          setSelectedAlbum({ id: data.album.id, name: data.album.name });
          setAlbumId(data.album.id);
        }
      })
      .catch(() => setError("取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!artistQuery.trim()) { setArtistResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artists?query=${encodeURIComponent(artistQuery.trim())}`);
        if (res.ok) setArtistResults(await res.json());
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [artistQuery]);

  useEffect(() => {
    if (!albumQuery.trim()) { setAlbumResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/albums?query=${encodeURIComponent(albumQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setAlbumResults(data.map((a: { id: string; name: string | null; artist?: { name?: string } }) => ({
            id: a.id,
            name: a.name ? `${a.name}${a.artist?.name ? ` (${a.artist.name})` : ""}` : null,
          })));
        }
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [albumQuery]);

  function selectArtist(artist: Option) {
    setSelectedArtist(artist);
    setArtistId(artist.id);
    setArtistQuery("");
    setArtistResults([]);
  }

  function selectAlbum(album: Option) {
    setSelectedAlbum(album);
    setAlbumId(album.id);
    setAlbumQuery("");
    setAlbumResults([]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/tracks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          phoneticName: phoneticName || null,
          furigana: furigana || null,
          number: number === "" ? null : number,
          artistId: artistId || null,
          albumId: albumId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push(`/${bar}/admin/tracks`);
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">読み込み中...</p>
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
        <Link href={`/${bar}/admin/tracks`} className="hover:text-white hover:underline">トラック一覧</Link>
        <span>/</span>
        <span className="text-zinc-300">編集</span>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-white">トラック編集</h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300">トラック名</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">読み仮名（phonetic）</label>
          <input type="text" value={phoneticName} onChange={(e) => setPhoneticName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">ふりがな</label>
          <input type="text" value={furigana} onChange={(e) => setFurigana(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">番号</label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value === "" ? "" : parseInt(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">アーティスト</label>
          {selectedArtist ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded bg-zinc-700 px-3 py-1 text-sm text-white">{selectedArtist.name}</span>
              <button type="button" onClick={() => { setSelectedArtist(null); setArtistId(""); }} className="text-sm text-red-400 hover:text-red-300">解除</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={artistQuery} onChange={(e) => setArtistQuery(e.target.value)} placeholder="アーティスト名で検索..." className={inputClass} />
              {artistResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-600 bg-zinc-800">
                  {artistResults.map((a) => (
                    <button key={a.id} type="button" onClick={() => selectArtist(a)} className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-700">{a.name}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">アルバム</label>
          {selectedAlbum ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded bg-zinc-700 px-3 py-1 text-sm text-white">{selectedAlbum.name}</span>
              <button type="button" onClick={() => { setSelectedAlbum(null); setAlbumId(""); }} className="text-sm text-red-400 hover:text-red-300">解除</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={albumQuery} onChange={(e) => setAlbumQuery(e.target.value)} placeholder="アルバム名で検索..." className={inputClass} />
              {albumResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-600 bg-zinc-800">
                  {albumResults.map((a) => (
                    <button key={a.id} type="button" onClick={() => selectAlbum(a)} className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-700">{a.name}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}
