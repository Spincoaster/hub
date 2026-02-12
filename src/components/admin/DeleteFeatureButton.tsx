"use client";

import { useRouter } from "next/navigation";

export function DeleteFeatureButton({ id, bar }: { id: string; bar: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("このフィーチャーを削除しますか？")) return;
    try {
      const res = await fetch(`/api/features/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push(`/${bar}/admin`);
    } catch {
      alert("削除に失敗しました");
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      削除
    </button>
  );
}
