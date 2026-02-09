import Link from "next/link";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export default function InitialLetterPagination({
  basePath,
  currentPrefix,
}: {
  basePath: string;
  currentPrefix?: string;
}) {
  return (
    <nav className="mb-4 flex flex-wrap gap-1">
      <Link
        href={basePath}
        className={`rounded px-2 py-1 text-sm ${
          !currentPrefix
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        All
      </Link>
      {LETTERS.map((letter) => (
        <Link
          key={letter}
          href={`${basePath}?has_prefix=${letter}`}
          className={`rounded px-2 py-1 text-sm ${
            currentPrefix === letter
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {letter.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
