"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface FeatureItem {
  id: string;
  itemId: number | null;
  itemType: string | null;
  number: number | null;
  comment: string | null;
  itemData?: {
    name?: string;
    artist?: { name?: string } | null;
    album?: { name?: string } | null;
    owner?: { name?: string } | null;
    _count?: { likes: number };
  } | null;
}

interface Feature {
  id: string;
  number: number | null;
  name: string | null;
  description: string | null;
  externalLink: string | null;
  externalThumbnail: string | null;
  category: string | null;
  bar: number | null;
  featureItems: FeatureItem[];
}

interface SearchResult {
  id: string;
  name: string | null;
  artist?: { name?: string } | null;
  album?: { name?: string } | null;
  owner?: { name?: string } | null;
  _count?: { likes: number };
}

export default function FeatureEditPage() {
  const params = useParams();
  const router = useRouter();
  const bar = params.bar as string;
  const id = params.id as string;

  const [feature, setFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [number, setNumber] = useState<number | "">("");
  const [externalLink, setExternalLink] = useState("");
  const [externalThumbnail, setExternalThumbnail] = useState("");
  const [barValue, setBarValue] = useState<number | "">("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemType, setNewItemType] = useState<"Track" | "Record">("Track");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchFeature = useCallback(async () => {
    try {
      const res = await fetch(`/api/features/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Feature = await res.json();
      setFeature(data);
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setNumber(data.number ?? "");
      setExternalLink(data.externalLink ?? "");
      setExternalThumbnail(data.externalThumbnail ?? "");
      setBarValue(data.bar ?? "");
    } catch {
      setError("フィーチャーの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFeature();
  }, [fetchFeature]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/features/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          number: number === "" ? null : number,
          externalLink: externalLink || null,
          externalThumbnail: externalThumbnail || null,
          bar: barValue === "" ? null : barValue,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push(`/${bar}/features/${id}`);
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("このアイテムを削除しますか？")) return;

    try {
      const res = await fetch(`/api/feature-items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchFeature();
    } catch {
      setError("アイテムの削除に失敗しました");
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const endpoint =
          newItemType === "Track" ? "/api/tracks" : "/api/records";
        const res = await fetch(
          `${endpoint}?query=${encodeURIComponent(searchQuery)}`
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : data.data ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, newItemType]);

  async function handleAddItem(itemId: string) {
    try {
      const nextNumber = feature
        ? Math.max(0, ...feature.featureItems.map((i) => i.number ?? 0)) + 1
        : 1;
      const res = await fetch("/api/feature-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureId: id,
          itemId: parseInt(itemId),
          itemType: newItemType,
          number: nextNumber,
          comment: null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      setShowAddModal(false);
      setSearchQuery("");
      setSearchResults([]);
      await fetchFeature();
    } catch {
      setError("アイテムの追加に失敗しました");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">読み込み中...</p>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-400">フィーチャーが見つかりません</p>
      </div>
    );
  }

  const inputClass =
    "mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4">
        <Link
          href={`/${bar}/admin`}
          className="text-sm text-zinc-400 hover:text-white hover:underline"
        >
          &larr; Admin
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-white">
        フィーチャー編集
      </h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            番号
          </label>
          <input
            type="number"
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

        <div>
          <label className="block text-sm font-medium text-zinc-300">
            バー
          </label>
          <select
            value={barValue}
            onChange={(e) =>
              setBarValue(e.target.value === "" ? "" : parseInt(e.target.value))
            }
            className={inputClass}
          >
            <option value="">未設定</option>
            <option value="0">Shinjuku</option>
            <option value="1">Ebisu</option>
            <option value="2">Kagurazaka</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </form>

      <div className="border-t border-zinc-700 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">アイテム</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            アイテム追加
          </button>
        </div>

        {feature.featureItems.length === 0 ? (
          <p className="text-zinc-500">アイテムがありません。</p>
        ) : (
          <div className="space-y-3">
            {feature.featureItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-zinc-700 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">
                      #{item.number}
                    </span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {item.itemType}
                    </span>
                  </div>
                  {item.itemData && (
                    <div className="mt-1">
                      <p className="truncate text-sm text-white">
                        {item.itemData.name ?? ""}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {item.itemData.artist?.name ?? "—"}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {item.itemType === "Track" && item.itemData.album
                          ? item.itemData.album.name ?? "—"
                          : ""}
                        {item.itemType === "Record" && item.itemData.owner
                          ? item.itemData.owner.name ?? "—"
                          : ""}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {item.itemData._count?.likes ?? 0} likes
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="ml-4 shrink-0 text-sm text-red-400 hover:text-red-300"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-white">
              アイテム追加
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300">
                タイプ
              </label>
              <select
                value={newItemType}
                onChange={(e) =>
                  setNewItemType(e.target.value as "Track" | "Record")
                }
                className={inputClass}
              >
                <option value="Track">Track</option>
                <option value="Record">Record</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300">
                検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${newItemType}名で検索...`}
                className="mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searching && (
                <p className="mt-1 text-xs text-zinc-500">検索中...</p>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mb-4 max-h-96 overflow-y-auto rounded border border-zinc-700">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleAddItem(result.id)}
                    className="block w-full border-b border-zinc-800 px-4 py-3 text-left last:border-b-0 hover:bg-zinc-800"
                  >
                    <p className="text-sm text-zinc-200">
                      {result.name ?? "Untitled"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {result.artist?.name ?? "-"}
                      {result.album?.name ? ` / ${result.album.name}` : ""}
                      {result.owner?.name ? ` / ${result.owner.name}` : ""}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {result._count?.likes ?? 0} likes
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
