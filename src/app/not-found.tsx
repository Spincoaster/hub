import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center px-4 text-white">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-zinc-400">Page not found</p>
      <Link
        href="/"
        className="mt-8 text-sm text-white underline transition-colors hover:text-zinc-400"
      >
        &larr; Back to Top
      </Link>
    </div>
  );
}
