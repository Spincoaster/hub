import Link from "next/link";
import Image from "next/image";
import { NavMenu } from "@/components/NavMenu";

const navigationMenus: Record<string, { href: string; label: string; external: boolean }[]> = {
  shinjuku: [
    { href: "https://menu.spincoaster.com/shinjuku", label: "Drink Menu", external: true },
    { href: "/shinjuku/records", label: "Record TOP 100", external: false },
    { href: "/shinjuku/tracks", label: "Hi-Res TOP 100", external: false },
    { href: "/shinjuku/features", label: "Recommend", external: false },
    { href: "/shinjuku/new-arrivals", label: "New Arrival", external: false },
  ],
  ebisu: [
    { href: "https://menu.spincoaster.com/ebisu", label: "Drink Menu", external: true },
    { href: "/ebisu/records", label: "Record TOP 100", external: false },
    { href: "/ebisu/tracks", label: "Hi-Res TOP 100", external: false },
    { href: "/ebisu/features", label: "Recommend", external: false },
    { href: "/ebisu/new-arrivals", label: "New Arrival", external: false },
  ],
  kagurazaka: [
    { href: "https://menu.spincoaster.com/kagurazaka", label: "Drink Menu", external: true },
    { href: "/kagurazaka/records", label: "Record TOP 100", external: false },
    { href: "/kagurazaka/tracks", label: "Hi-Res TOP 100", external: false },
    { href: "/kagurazaka/features", label: "Recommend", external: false },
    { href: "/kagurazaka/new-arrivals", label: "New Arrival", external: false },
  ],
  default: [
    { href: "/shinjuku", label: "SHINJUKU", external: false },
    { href: "/ebisu", label: "EBISU", external: false },
    { href: "/kagurazaka", label: "KAGURAZAKA", external: false },
  ],
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getMenuItems(bar?: string) {
  if (bar && bar in navigationMenus) {
    return navigationMenus[bar];
  }
  return navigationMenus.default;
}

export function Navigation({ bar }: { bar?: string }) {
  const menuItems = getMenuItems(bar);
  const homeHref = bar ? `/${bar}` : "/";
  const searchHref = bar ? `/${bar}/search` : "/";
  const barLabel = bar ? capitalize(bar) : undefined;

  return (
    <nav className="relative border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Left spacer */}
        <div className="w-24" />

        {/* Center: Logo */}
        <Link href={homeHref} className="flex items-center">
          <Image
            src="/spin_logo.png"
            alt="Spincoaster"
            width={160}
            height={40}
            className="h-6 w-auto"
            priority
          />
        </Link>

        {/* Right: Search + Menu */}
        <div className="flex w-24 items-center justify-end gap-3">
          <Link href={searchHref} className="p-1 text-zinc-400 transition-colors hover:text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </Link>
          <NavMenu menuItems={menuItems} barLabel={barLabel} />
        </div>
      </div>
    </nav>
  );
}
