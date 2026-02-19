"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Admin = {
  id: string;
  name: string;
  createdAt: string;
};

export default function UsersPage() {
  const { bar } = useParams<{ bar: string }>();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setAdmins(await res.json());
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage(`${name} を追加しました`);
      setName("");
      setPassword("");
      fetchAdmins();
    }
  }

  async function handleDelete(admin: Admin) {
    if (!confirm(`${admin.name} を削除しますか？`)) return;
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/users/${admin.id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage(data.message);
      fetchAdmins();
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
      <h1 className="mb-8 text-3xl font-bold text-white">ユーザー管理</h1>

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

      {/* Admin list */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-white">管理者一覧</h2>
        <table className="w-full text-sm text-white">
          <thead>
            <tr className="border-b border-zinc-600 text-left text-zinc-400">
              <th className="py-2">ユーザー名</th>
              <th className="py-2">作成日</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-zinc-700">
                <td className="py-3">{admin.name}</td>
                <td className="py-3 text-zinc-400">
                  {new Date(admin.createdAt).toLocaleDateString("ja-JP")}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => handleDelete(admin)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Add admin form */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">
          管理者を追加
        </h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              ユーザー名
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              パスワード
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "追加中..." : "追加"}
          </button>
        </form>
      </section>
    </div>
  );
}
