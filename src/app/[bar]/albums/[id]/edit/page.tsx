"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Artist {
  id: string;
  name: string;
}

interface AlbumData {
  id: string;
  name: string;
  phoneticName: string | null;
  furigana: string | null;
  artistId: string | null;
  artist: Artist | null;
}

export default function EditAlbumPage() {
  const router = useRouter();
  const params = useParams();
  const bar = params.bar as string;
  const id = params.id as string;
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  useEffect(() => {
    fetch(`/api/albums/${id}`)
      .then((res) => res.json())
      .then((data: AlbumData) => {
        setAlbum(data);
        if (data.artist) setSelectedArtist(data.artist);
      });
  }, [id]);

  useEffect(() => {
    if (artistSearch.length < 1) {
      setArtists([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/artists?has_prefix=${encodeURIComponent(artistSearch.charAt(0))}`)
        .then((res) => res.json())
        .then((data: Artist[]) => {
          setArtists(
            data.filter((a) =>
              a.name?.toLowerCase().includes(artistSearch.toLowerCase())
            )
          );
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [artistSearch]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch(`/api/albums/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        phoneticName: formData.get("phoneticName"),
        furigana: formData.get("furigana"),
        artistId: selectedArtist?.id || null,
      }),
    });

    setLoading(false);
    if (res.ok) {
      router.push(`/${bar}/albums`);
    } else {
      setError("保存に失敗しました");
    }
  }

  if (!album) {
    return <div className="py-8 text-center text-zinc-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Edit Album</h1>

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
            defaultValue={album.name}
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
            defaultValue={album.phoneticName || ""}
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
            defaultValue={album.furigana || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Artist</label>
          {selectedArtist ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-1 text-sm">
                {selectedArtist.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedArtist(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="relative mt-1">
              <input
                type="text"
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
                placeholder="Search artist..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {artists.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white shadow-lg">
                  {artists.map((artist) => (
                    <li
                      key={artist.id}
                      onClick={() => {
                        setSelectedArtist(artist);
                        setArtistSearch("");
                        setArtists([]);
                      }}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50"
                    >
                      {artist.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
