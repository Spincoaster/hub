import Link from "next/link";
import Image from "next/image";
import { NavMenu } from "@/components/NavMenu";
import { SearchBar } from "@/components/SearchBar";

const navigationMenus: Record<string, { href: string; label: string; external: boolean }[]> = {
  shinjuku: [
    { href: "/shinjuku", label: "Top", external: false },
    { href: "https://menu.spincoaster.com/shinjuku", label: "Drink Menu", external: true },
    { href: "/shinjuku/records/artists", label: "All Record List", external: false },
    { href: "/shinjuku/tracks/artists", label: "All Hi-Res List", external: false },
    { href: "/shinjuku/records/top100", label: "Record TOP 100", external: false },
    { href: "/shinjuku/tracks/top100", label: "Hi-Res TOP 100", external: false },
  ],
  ebisu: [
    { href: "/ebisu", label: "Top", external: false },
    { href: "https://menu.spincoaster.com/ebisu", label: "Drink Menu", external: true },
    { href: "/ebisu/records/artists", label: "All Record List", external: false },
    { href: "/ebisu/records/top100", label: "Record TOP 100", external: false },
  ],
  kagurazaka: [
    { href: "/kagurazaka", label: "Top", external: false },
    { href: "https://menu.spincoaster.com/kagurazaka", label: "Drink Menu", external: true },
    { href: "/kagurazaka/records/artists", label: "All Record List", external: false },
    { href: "/kagurazaka/records/top100", label: "Record TOP 100", external: false },
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

  const barLabel = bar ? capitalize(bar) : undefined;

  return (
    <nav className="relative z-50 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-28 max-w-5xl items-center justify-between px-4">
        {/* Left spacer */}
        <div className="w-24" />

        {/* Center: Logo */}
        <Link href={homeHref} className="-ml-4 flex items-center">
          <Image
            src="/spin_logo.png"
            alt="Spincoaster"
            width={160}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Right: Search + Menu */}
        <div className="flex w-24 items-center justify-end gap-3">
          <SearchBar bar={bar} />
          <NavMenu menuItems={menuItems} barLabel={barLabel} />
        </div>
      </div>
    </nav>
  );
}
