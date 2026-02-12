"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { RecordList } from "@/components/RecordList";

interface SearchRecord {
  id: string;
  name: string | null;
  number: number | null;
  artist: { id: string; name: string | null } | null;
  owner: { id: string; name: string | null } | null;
  location: string | null;
}

interface SearchTrack {
  id: string;
  name: string | null;
  number: number | null;
  artist: { id: string; name: string | null } | null;
  album: { id: string; name: string | null } | null;
}

function TableHeader({ columns }: { columns: string[] }) {
  return (
    <div className="hidden items-stretch border-b border-zinc-600 text-xs font-semibold text-white md:flex">
      <span className="flex w-4/5 items-stretch">
        {columns.map((col, i) => (
          <span key={col} className={`flex w-1/2 items-center py-2 ${i === 0 ? "pl-2 pr-4" : "pl-4"}`}>{col}</span>
        )).reduce<React.ReactNode[]>((acc, el, i) => {
          if (i > 0) acc.push(<span key={`sep-${i}`} className="w-px self-stretch bg-zinc-600" />);
          acc.push(el);
          return acc;
        }, [])}
      </span>
      <span className="w-1/5" />
    </div>
  );
}

export default function SearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bar = params.bar as string;
  const query = searchParams.get("query") ?? "";

  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [tracks, setTracks] = useState<SearchTrack[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likeMap, setLikeMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?query=${encodeURIComponent(q.trim())}&bar=${encodeURIComponent(bar)}`
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setRecords(data.records ?? []);
        setTracks(data.tracks ?? []);
        setLikeCounts(data.likeCounts ?? {});
        setLikeMap(data.likeMap ?? {});
      } catch {
        setRecords([]);
        setTracks([]);
        setLikeCounts({});
        setLikeMap({});
      } finally {
        setLoading(false);
      }
    },
    [bar]
  );

  useEffect(() => {
    if (query) doSearch(query);
  }, [query, doSearch]);

  const recordItems = records.map((r) => ({
    id: String(r.id),
    name: r.name ?? "—",
    artistName: r.artist?.name ?? "—",
    albumName: r.name ?? "—",
    number: r.number,
    type: "Record" as const,
    ownerName: r.owner?.name ?? undefined,
    location: r.location ?? undefined,
  }));

  const trackItems = tracks.map((t) => ({
    id: String(t.id),
    name: t.name ?? "—",
    artistName: t.artist?.name ?? "—",
    albumName: t.album?.name ?? "—",
    number: t.number,
    type: "Hi-Res" as const,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-normal tracking-tight md:text-5xl">
          Search results of {query}
        </h1>
        <p className="mt-2 text-sm text-white">
          {records.length} record, {tracks.length} track are found.
        </p>
      </div>

      {loading ? (
        <p className="mt-12 text-zinc-400">Searching...</p>
      ) : (
        <>
          {/* Records */}
          <section className="mt-8">
            <p className="mb-4 text-sm text-white">[ Record ]</p>
            {recordItems.length === 0 ? (
              <p className="text-zinc-400">No results found.</p>
            ) : (
              <>
                <TableHeader columns={["Title", "Artist"]} />
                <div className="border-t border-zinc-600 md:border-t-0">
                  <RecordList items={recordItems} likeMap={likeMap} likeCounts={likeCounts} />
                </div>
              </>
            )}
          </section>

          {/* Hi-Res */}
          <section className="mt-12">
            <p className="mb-4 text-sm text-white">[ Hi-Res ]</p>
            {trackItems.length === 0 ? (
              <p className="text-zinc-400">No results found.</p>
            ) : (
              <>
                <TableHeader columns={["Title", "Album / Artist"]} />
                <div className="border-t border-zinc-600 md:border-t-0">
                  <RecordList items={trackItems} likeMap={likeMap} likeCounts={likeCounts} />
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
