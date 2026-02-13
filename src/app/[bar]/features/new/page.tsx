"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BAR_VALUES } from "@/lib/utils";

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function FeatureNewPage() {
  const params = useParams();
  const router = useRouter();
  const bar = params.bar as string;
  const barValue = BAR_VALUES[bar];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [number, setNumber] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/features")
      .then((res) => (res.ok ? res.json() : {}))
      .then((grouped) => {
        const all = Object.values(grouped).flat() as { number?: number | null; bar?: number | null }[];
        const filtered = all.filter((f) => f.bar === barValue);
        const max = Math.max(0, ...filtered.map((f) => f.number ?? 0));
        setNumber(max + 1);
      })
      .catch(() => {});
  }, [barValue]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          number: number === "" ? null : number,
          bar: barValue,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      router.push(`/${bar}/features/${data.id}`);
    } catch {
      setError("作成に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <Link
          href={`/${bar}/admin`}
          className="text-sm text-zinc-400 hover:text-white hover:underline"
        >
          &larr; Admin
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-white">
        特集 新規作成
      </h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            番号
          </label>
          <input
            type="number"
            required
            value={number}
            onChange={(e) =>
              setNumber(e.target.value === "" ? "" : parseInt(e.target.value))
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300">
            名前
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300">
            説明
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
          />
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
