import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export default async function BarPage({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const { bar } = await params;

  const newsEntries = await prisma.newsEntry.findMany({
    orderBy: { publishedAt: "desc" },
    take: 10,
  });
  const entries = serializeBigInt(newsEntries);

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-wider text-zinc-900 dark:text-zinc-100">
        {bar.toUpperCase()}
      </h1>

      {entries.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
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
      ) : (
        <p className="text-zinc-500 dark:text-zinc-400">
          ニュースはありません。
        </p>
      )}
    </div>
  );
}
