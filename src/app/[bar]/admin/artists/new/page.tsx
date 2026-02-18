"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function NewArtistPage() {
  const params = useParams();
  const router = useRouter();
  const bar = params.bar as string;

  const [name, setName] = useState("");
  const [phoneticName, setPhoneticName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          phoneticName: phoneticName || null,
          furigana: furigana || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      router.push(`/${bar}/admin/artists`);
    } catch {
      setError("作成に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex gap-2 text-sm text-zinc-400">
        <Link href={`/${bar}/admin`} className="hover:text-white hover:underline">Admin</Link>
        <span>/</span>
        <Link href={`/${bar}/admin/artists`} className="hover:text-white hover:underline">アーティスト一覧</Link>
        <span>/</span>
        <span className="text-zinc-300">新規作成</span>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-white">アーティスト新規作成</h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300">名前</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">読み (phonetic)</label>
          <input type="text" value={phoneticName} onChange={(e) => setPhoneticName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">ふりがな</label>
          <input type="text" value={furigana} onChange={(e) => setFurigana(e.target.value)} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "作成中..." : "作成"}
        </button>
      </form>
    </div>
  );
}
