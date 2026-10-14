import Link from "next/link";
import { SEARCH } from "@/lib/labels";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export default function InitialLetterPagination({
  basePath,
  currentPrefix,
  showAll = false,
}: {
  basePath: string;
  currentPrefix?: string;
  showAll?: boolean;
}) {
  const selectedPrefix = currentPrefix?.toLowerCase() || "";
  const options = [
    ...(showAll ? [{ prefix: "", label: SEARCH.all }] : []),
    ...LETTERS.map((letter) => ({
      prefix: letter,
      label: letter.toUpperCase(),
    })),
    { prefix: "#", label: "#" },
  ];

  return (
    <nav aria-label="Filter by initial letter">
      <div className="grid grid-cols-7 gap-1.5 md:grid-cols-14">
        {options.map(({ prefix, label }) => {
          const selected = selectedPrefix === prefix;

          return (
            <Link
              key={prefix}
              href={prefix ? `${basePath}?has_prefix=${encodeURIComponent(prefix)}` : basePath}
              aria-current={selected ? "page" : undefined}
              className={`flex h-12 min-w-0 items-center justify-center rounded border font-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:h-11 ${
                prefix ? "text-lg" : "text-base"
              } ${
                selected
                  ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                  : "border-zinc-700 bg-transparent text-zinc-200 hover:border-zinc-500 hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
