"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AccountPage() {
  const { bar } = useParams<{ bar: string }>();
  const [current, setCurrent] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword !== confirm) {
      setError("新しいパスワードが一致しません");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, newPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage(data.message);
      setCurrent("");
      setNewPassword("");
      setConfirm("");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/${bar}/admin`}
        className="mb-6 inline-block text-sm text-zinc-400 hover:text-white"
      >
        &larr; 管理画面に戻る
      </Link>
      <h1 className="mb-8 text-3xl font-bold text-white">パスワード変更</h1>

      {message && (
        <div className="mb-4 rounded border border-green-600 bg-green-900/30 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded border border-red-600 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            現在のパスワード
          </label>
          <input
            type="password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            新しいパスワード
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            新しいパスワード（確認）
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "変更中..." : "パスワードを変更"}
        </button>
      </form>
    </div>
  );
}
