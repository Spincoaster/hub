"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Artist {
  id: string;
  name: string | null;
}

interface Album {
  id: string;
  name: string | null;
  artist: Artist | null;
}

export default function SearchPage() {
  const params = useParams();
  const bar = params.bar as string;

  const [query, setQuery] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(query.trim())}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setArtists(data.artists ?? []);
      setAlbums(data.albums ?? []);
    } catch {
      setArtists([]);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">検索</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="アーティスト名、アルバム名で検索..."
            className="block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "検索中..." : "検索"}
          </button>
        </div>
      </form>

      {searched && !loading && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-700">
              アーティスト ({artists.length})
            </h2>
            {artists.length === 0 ? (
              <p className="text-gray-500">結果がありません。</p>
            ) : (
              <div className="space-y-2">
                {artists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/${bar}/artists/${artist.id}`}
                    className="block rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:shadow-sm"
                  >
                    <span className="text-gray-900">
                      {artist.name ?? "Untitled"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-700">
              アルバム ({albums.length})
            </h2>
            {albums.length === 0 ? (
              <p className="text-gray-500">結果がありません。</p>
            ) : (
              <div className="space-y-2">
                {albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/${bar}/albums/${album.id}`}
                    className="block rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:shadow-sm"
                  >
                    <span className="text-gray-900">
                      {album.name ?? "Untitled"}
                    </span>
                    {album.artist && (
                      <span className="ml-2 text-sm text-gray-500">
                        / {album.artist.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
