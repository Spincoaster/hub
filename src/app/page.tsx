import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, BAR_NAMES } from "@/lib/labels";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

const shops = [
  { slug: "shinjuku", label: BAR_NAMES.shinjuku },
  { slug: "ebisu", label: BAR_NAMES.ebisu },
  { slug: "kagurazaka", label: BAR_NAMES.kagurazaka },
];

export default function Home() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center px-4">
      <Image
        src="/bar_logo.png"
        alt="SPINCOASTER MUSIC BAR"
        width={300}
        height={100}
        className="mb-6 w-[200px] md:w-[300px]"
        priority
      />
      <h1 className="mb-8 text-center text-3xl font-bold tracking-wider text-zinc-100 md:mb-12 md:text-4xl whitespace-pre-line">
        {SITE_NAME.replace(" ", "\n")}
      </h1>
      <div className="flex w-full max-w-sm flex-col gap-3 md:gap-4">
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
