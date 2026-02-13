"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Artist {
  id: string;
  name: string;
  phoneticName: string | null;
  furigana: string | null;
}

export default function EditArtistPage() {
  const router = useRouter();
  const params = useParams();
  const bar = params.bar as string;
  const id = params.id as string;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then((res) => res.json())
      .then(setArtist);
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch(`/api/artists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        phoneticName: formData.get("phoneticName"),
        furigana: formData.get("furigana"),
      }),
    });

    setLoading(false);
    if (res.ok) {
      router.push(`/${bar}/artists/${id}`);
    } else {
      setError("保存に失敗しました");
    }
  }

  if (!artist) {
    return <div className="py-8 text-center text-zinc-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Edit Artist</h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={artist.name}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="phoneticName" className="block text-sm font-medium text-gray-700">
            Phonetic Name
          </label>
          <input
            id="phoneticName"
            name="phoneticName"
            type="text"
            defaultValue={artist.phoneticName || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="furigana" className="block text-sm font-medium text-gray-700">
            Furigana
          </label>
          <input
            id="furigana"
            name="furigana"
            type="text"
            defaultValue={artist.furigana || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "保存中..." : "Update"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
