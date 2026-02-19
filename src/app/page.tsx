import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, BAR_NAMES } from "@/lib/labels";
import { RightUpArrow } from "@/components/icons/RightUpArrow";
import { AnimatedText } from "@/components/AnimatedText";
import { FadeIn } from "@/components/FadeIn";

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
    <div className="mx-auto flex min-h-dvh max-w-[1600px] flex-col justify-center px-6 py-12 md:flex-row md:items-center md:px-16 md:py-0">
      {/* Left content */}
      <div className="flex flex-col md:flex-1">
        {/* Title: SP 2 lines / PC 1 line */}
        <h1 className="text-7xl leading-[0.95] font-normal tracking-tight text-white md:text-[clamp(4rem,8vw,9rem)]">
          <AnimatedText text={SITE_NAME.replace(" ", "\n")} />
        </h1>

        {/* SP only: Logo centered */}
        <FadeIn delayMs={400} className="mt-10 mb-12 flex justify-center md:hidden">
          <Image
            src="/bar_logo.png"
            alt="Spincoaster Music Bar"
            width={200}
            height={200}
            className="w-[128px]"
            priority
          />
        </FadeIn>

        {/* Bar buttons */}
        <div className="flex w-full flex-col gap-6 pb-12 md:mt-14 md:max-w-[clamp(320px,30vw,540px)] md:gap-5 md:pb-0">
          {shops.map((shop, i) => (
            <FadeIn key={shop.slug} delayMs={500 + i * 100}>
              <Link
                href={`/${shop.slug}`}
                className="flex h-16 items-center justify-between rounded-full border border-white pl-10 pr-0 text-sm font-medium"
              >
                <span>{shop.slug.charAt(0).toUpperCase() + shop.slug.slice(1)}</span>
                <span className="relative ml-16 flex h-16 w-16 shrink-0 items-center justify-center">
                  <img src="/annulus.svg" alt="" className="absolute inset-0 h-full w-full" />
                  <RightUpArrow className="relative h-2.5 w-2.5" />
                </span>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* PC only: Logo right side */}
      <FadeIn delayMs={400} className="hidden shrink-0 items-center justify-center md:flex">
        <Image
          src="/bar_logo.png"
          alt="Spincoaster Music Bar"
          width={400}
          height={400}
          className="w-[clamp(200px,22vw,380px)]"
          priority
        />
      </FadeIn>
    </div>
  );
}
