"use client";

import { useRouter } from "next/navigation";

export interface Feature {
  id: string;
  number: number | null;
  name: string | null;
  description: string | null;
  externalLink: string | null;
  externalThumbnail: string | null;
  category: string | null;
  bar: number | null;
  _count: { featureItems: number };
}

export function FeatureManager({
  bar,
  features: initialFeatures,
}: {
  bar: string;
  features: Feature[];
}) {
  const router = useRouter();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => router.push(`/${bar}/features/new`)}
          className="rounded-md bg-blue-600 px-4 py-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規作成
        </button>
      </div>

      {initialFeatures.length === 0 ? (
        <p className="text-sm text-zinc-500">フィーチャーがありません。</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800/50 text-left text-zinc-400">
                <th className="w-12 px-4 py-4">#</th>
                <th className="px-4 py-4">Name</th>
                <th className="w-16 px-4 py-4">Items</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {initialFeatures.map((f) => (
                <tr
                  key={f.id}
                  className="cursor-pointer border-b border-zinc-800 hover:bg-zinc-800/30"
                  onClick={() => router.push(`/${bar}/features/${f.id}`)}
                >
                  <td className="px-4 py-4 text-zinc-500">
                    {f.number ?? "-"}
                  </td>
                  <td className="px-4 py-4 text-white">
                    {f.name ?? "Untitled"}
                  </td>
                  <td className="px-4 py-4 text-zinc-400">
                    {f._count.featureItems}
                  </td>
                  <td className="pr-4 text-zinc-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
