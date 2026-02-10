import Image from "next/image";
import Link from "next/link";

const shops = [
  { slug: "shinjuku", label: "SHINJUKU" },
  { slug: "ebisu", label: "EBISU" },
  { slug: "kagurazaka", label: "KAGURAZAKA" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Image
        src="/bar_logo.png"
        alt="SPINCOASTER MUSIC BAR"
        width={300}
        height={100}
        className="mb-8"
        priority
      />
      <h1 className="mb-12 text-center text-4xl font-bold tracking-wider text-zinc-100">
        MUSIC LIST
      </h1>
      <div className="flex w-full max-w-sm flex-col gap-4">
        {shops.map((shop) => (
          <Link
            key={shop.slug}
            href={`/${shop.slug}`}
            className="flex h-20 items-center justify-center rounded-lg border border-zinc-800 text-xl font-semibold tracking-widest text-zinc-200 transition-all hover:border-zinc-600 hover:bg-zinc-900"
          >
            {shop.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
