import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { serializeBigInt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const newsEntries = await prisma.newsEntry.findMany({
    orderBy: { publishedAt: "desc" },
    take: 5,
  });
  const entries = serializeBigInt(newsEntries);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <main className="mx-auto max-w-5xl px-4 py-16">
        {/* Bar selection */}
        <section className="mb-20 text-center">
          <h1 className="mb-8 text-4xl font-bold tracking-wider text-zinc-900 dark:text-zinc-100">
            SPINCOASTER HUB
          </h1>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link
              href="/shinjuku"
              className="flex h-40 w-full max-w-xs items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-2xl font-semibold tracking-widest text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              SHINJUKU
            </Link>
            <Link
              href="/ebisu"
              className="flex h-40 w-full max-w-xs items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-2xl font-semibold tracking-widest text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              EBISU
            </Link>
          </div>
        </section>

        {/* News */}
        {entries.length > 0 && (
          <section>
            <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              News
            </h2>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {entries.map((entry) => (
                <li key={entry.id} className="py-4">
                  <a
                    href={entry.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="flex items-start gap-4">
                      {entry.thumbnail && (
                        <img
                          src={entry.thumbnail}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
                          {entry.title}
                        </p>
                        {entry.publishedAt && (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(entry.publishedAt).toLocaleDateString(
                              "ja-JP"
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
