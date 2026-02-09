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
  itemData?: { name?: string } | null;
}

interface Feature {
  id: string;
  number: number | null;
  name: string | null;
  description: string | null;
  externalLink: string | null;
  externalThumbnail: string | null;
  category: string | null;
  featureItems: FeatureItem[];
}

interface SearchResult {
  id: string;
  name: string | null;
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
  const [category, setCategory] = useState("");
  const [number, setNumber] = useState<number | "">("");
  const [externalLink, setExternalLink] = useState("");
  const [externalThumbnail, setExternalThumbnail] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemType, setNewItemType] = useState<"Track" | "Record">("Track");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [newItemComment, setNewItemComment] = useState("");

  const fetchFeature = useCallback(async () => {
    try {
      const res = await fetch(`/api/features/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Feature = await res.json();
      setFeature(data);
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setCategory(data.category ?? "");
      setNumber(data.number ?? "");
      setExternalLink(data.externalLink ?? "");
      setExternalThumbnail(data.externalThumbnail ?? "");
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
          category,
          number: number === "" ? null : number,
          externalLink: externalLink || null,
          externalThumbnail: externalThumbnail || null,
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

  async function handleSearchItems() {
    if (!searchQuery.trim()) return;
    setSearching(true);

    try {
      const endpoint =
        newItemType === "Track" ? "/api/tracks" : "/api/records";
      const res = await fetch(
        `${endpoint}?query=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.data ?? [];
      setSearchResults(items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

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
          comment: newItemComment || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      setShowAddModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setNewItemComment("");
      await fetchFeature();
    } catch {
      setError("アイテムの追加に失敗しました");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">フィーチャーが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4">
        <Link
          href={`/${bar}/features/${id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; 詳細に戻る
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        フィーチャー編集
      </h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            名前
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            説明
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              カテゴリ
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              番号
            </label>
            <input
              type="number"
              value={number}
              onChange={(e) =>
                setNumber(e.target.value === "" ? "" : parseInt(e.target.value))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            外部リンク
          </label>
          <input
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            外部サムネイル URL
          </label>
          <input
            type="url"
            value={externalThumbnail}
            onChange={(e) => setExternalThumbnail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </form>

      <div className="border-t border-gray-200 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">アイテム</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            アイテム追加
          </button>
        </div>

        {feature.featureItems.length === 0 ? (
          <p className="text-gray-500">アイテムがありません。</p>
        ) : (
          <div className="space-y-3">
            {feature.featureItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
              >
                <div>
                  <span className="mr-2 text-sm text-gray-400">
                    #{item.number}
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {item.itemType}
                  </span>
                  {item.itemData && (
                    <span className="ml-2 text-gray-900">
                      {item.itemData.name ?? ""}
                    </span>
                  )}
                  {item.comment && (
                    <p className="mt-1 text-sm text-gray-500 italic">
                      {item.comment}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              アイテム追加
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                タイプ
              </label>
              <select
                value={newItemType}
                onChange={(e) =>
                  setNewItemType(e.target.value as "Track" | "Record")
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Track">Track</option>
                <option value="Record">Record</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                検索
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchItems();
                    }
                  }}
                  placeholder={`${newItemType}名で検索...`}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearchItems}
                  disabled={searching}
                  className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  検索
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="mb-4 max-h-48 overflow-y-auto rounded border border-gray-200">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleAddItem(result.id)}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    {result.name ?? "Untitled"}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                コメント (任意)
              </label>
              <input
                type="text"
                value={newItemComment}
                onChange={(e) => setNewItemComment(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                  setNewItemComment("");
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
