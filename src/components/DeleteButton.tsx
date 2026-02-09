"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({
  apiPath,
  label = "Delete",
}: {
  apiPath: string;
  label?: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("本当に削除しますか？")) return;
    const res = await fetch(apiPath, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-600 hover:text-red-800"
    >
      {label}
    </button>
  );
}
