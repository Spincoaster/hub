"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type NamedItem = { id: string; name: string | null };
type Cassette = {
  name: string;
  location: string;
  number: number;
  phoneticName: string | null;
  furigana: string | null;
  sideAFirstTrack: string | null;
  sideBFirstTrack: string | null;
  comment: string | null;
  ownerId: string | null;
  artist: NamedItem | null;
  rankingAdjustment: { scoreDelta: number } | null;
};
const inputClass = "mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function CassetteEditor() {
  const params = useParams();
  const router = useRouter();
  const bar = params.bar as string;
  const id = params.id as string | undefined;
  const [cassette, setCassette] = useState<Cassette | null>(null);
  const [owners, setOwners] = useState<NamedItem[]>([]);
  const [artist, setArtist] = useState<NamedItem | null>(null);
  const [artistQuery, setArtistQuery] = useState("");
  const [artists, setArtists] = useState<NamedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const read = async (url: string) => {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error("取得に失敗しました。");
          return res.json();
        };
        const [ownerData, item] = await Promise.all([
          read("/api/owners"),
          id ? read(`/api/cassettes/${id}`) : Promise.resolve(null),
        ]);
        setOwners(ownerData);
        setCassette(item);
        setArtist(item?.artist ?? null);
        setLoading(false);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "取得に失敗しました。");
      }
    }
    load();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!artistQuery.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artists?query=${encodeURIComponent(artistQuery.trim())}&limit=30`, { signal: controller.signal });
        if (!res.ok) throw new Error("アーティストの検索に失敗しました。");
        const data = await res.json();
        setArtists(data.data ?? []);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "検索に失敗しました。");
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [artistQuery]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!artist) { setError("アーティストを選択してください。"); return; }
    const form = new FormData(e.currentTarget);
    const body = {
      bar,
      name: form.get("name"), location: form.get("location"), number: Number(form.get("number")),
      phoneticName: form.get("phoneticName") || null, furigana: form.get("furigana") || null,
      sideAFirstTrack: form.get("sideAFirstTrack") || null, sideBFirstTrack: form.get("sideBFirstTrack") || null,
      comment: form.get("comment") || null, artistId: artist.id, ownerId: form.get("ownerId") || null,
      scoreDelta: Number(form.get("scoreDelta")),
    };
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(id ? `/api/cassettes/${id}` : "/api/cassettes", {
        method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "保存に失敗しました。");
      router.push(`/${bar}/admin/cassettes`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!id || !confirm("このカセットを削除しますか？ 特集への登録・いいね・ランキング補正も削除されます。シートに残っている場合は、次回同期で再登録されます。")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cassettes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました。");
      router.push(`/${bar}/admin/cassettes`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました。");
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href={`/${bar}/admin/cassettes`} className="text-sm text-zinc-400 hover:underline">カセット一覧に戻る</Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold">{id ? "カセット編集" : "カセット新規作成"}</h1>
      <p className="mb-6 text-sm text-zinc-400">
        作品情報は次回のシート同期で上書きされます。追加・変更・削除はシートにも反映してください。シートにない作品は削除対象になります。読み・ふりがな・ランキング補正は同期後も保持されます。
      </p>
      {error && <p role="alert" className="mb-4 rounded border border-red-400 bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}
      {loading ? (!error && <p className="text-zinc-400">読み込み中...</p>) : (
        <form onSubmit={save} className="space-y-4">
          <fieldset disabled={saving} className="space-y-4 disabled:opacity-60">
            <label className="block text-sm text-zinc-300">タイトル<input name="name" required defaultValue={cassette?.name ?? ""} className={inputClass} /></label>
            <label className="block text-sm text-zinc-300">場所<input name="location" required defaultValue={cassette?.location ?? ""} className={inputClass} /></label>
            <label className="block text-sm text-zinc-300">番号<input name="number" type="number" required min={1} max={2147483647} step={1} defaultValue={cassette?.number ?? ""} className={inputClass} /></label>
            <div>
              <label className="block text-sm text-zinc-300" htmlFor="cassette-artist">アーティスト</label>
              {artist && <p className="mt-2 text-sm">選択中: {artist.name}</p>}
              <input id="cassette-artist" value={artistQuery} onChange={(e) => { setArtistQuery(e.target.value); setArtists([]); }} placeholder="アーティスト名で検索..." className={inputClass} />
              {artists.length > 0 && <ul className="mt-2 max-h-48 overflow-y-auto border border-zinc-600">{artists.map((item) => <li key={item.id}><button type="button" onClick={() => { setArtist(item); setArtistQuery(""); setArtists([]); }} className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800">{item.name}</button></li>)}</ul>}
              <Link href={`/${bar}/admin/artists/new?context=cassettes`} target="_blank" className="mt-2 inline-block text-xs text-blue-400 underline">アーティストを新規作成</Link>
            </div>
            <label className="block text-sm text-zinc-300">所有者<select name="ownerId" defaultValue={cassette?.ownerId ?? ""} className={inputClass}><option value="">未設定</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></label>
            <label className="block text-sm text-zinc-300">A面1曲目<input name="sideAFirstTrack" defaultValue={cassette?.sideAFirstTrack ?? ""} className={inputClass} /></label>
            <label className="block text-sm text-zinc-300">B面1曲目<input name="sideBFirstTrack" defaultValue={cassette?.sideBFirstTrack ?? ""} className={inputClass} /></label>
            <label className="block text-sm text-zinc-300">コメント<textarea name="comment" rows={3} defaultValue={cassette?.comment ?? ""} className={inputClass} /></label>
            <label className="block text-sm text-zinc-300">読み仮名（phonetic）<input name="phoneticName" defaultValue={cassette?.phoneticName ?? ""} className={inputClass} /></label>
            <label className="block text-sm text-zinc-300">ふりがな<input name="furigana" defaultValue={cassette?.furigana ?? ""} className={inputClass} /></label>
            <label className="block text-sm text-zinc-300">ランキング補正<input name="scoreDelta" type="number" required step={1} min={-2147483648} max={2147483647} defaultValue={cassette?.rankingAdjustment?.scoreDelta ?? 0} className={inputClass} /></label>
            <div className="flex items-center justify-between">
              <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium hover:bg-blue-700">{saving ? "保存中..." : "保存"}</button>
              {id && <button type="button" onClick={remove} className="rounded-md border border-red-500 px-4 py-2 text-sm text-red-400 hover:bg-red-950">削除</button>}
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
