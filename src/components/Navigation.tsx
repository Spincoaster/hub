"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { NavMenu } from "@/components/NavMenu";
import { SearchBar } from "@/components/SearchBar";
import { BAR_NAMES, NAV } from "@/lib/labels";

const navigationMenus: Record<string, { href: string; label: string; external: boolean }[]> = {
  shinjuku: [
    { href: "/shinjuku", label: NAV.top, external: false },
    { href: "https://menu.spincoaster.com/shinjuku", label: NAV.drinkMenu, external: true },
    { href: "/shinjuku/records/artists", label: NAV.allRecords, external: false },
    { href: "/shinjuku/hi-res/artists", label: NAV.allHiRes, external: false },
    { href: "/shinjuku/records/popular", label: NAV.popularRecords, external: false },
    { href: "/shinjuku/hi-res/popular", label: NAV.popularHiRes, external: false },
  ],
  ebisu: [
    { href: "/ebisu", label: NAV.top, external: false },
    { href: "https://menu.spincoaster.com/ebisu", label: NAV.drinkMenu, external: true },
    { href: "/ebisu/records/artists", label: NAV.allRecords, external: false },
    { href: "/ebisu/records/popular", label: NAV.popularRecords, external: false },
  ],
  kagurazaka: [
    { href: "/kagurazaka", label: NAV.top, external: false },
    { href: "https://menu.spincoaster.com/kagurazaka", label: NAV.drinkMenu, external: true },
    { href: "/kagurazaka/records/artists", label: NAV.allRecords, external: false },
    { href: "/kagurazaka/records/popular", label: NAV.popularRecords, external: false },
  ],
  default: [
    { href: "/shinjuku", label: BAR_NAMES.shinjuku, external: false },
    { href: "/ebisu", label: BAR_NAMES.ebisu, external: false },
    { href: "/kagurazaka", label: BAR_NAMES.kagurazaka, external: false },
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

export function Navigation({ bar, isAdmin }: { bar?: string; isAdmin?: boolean }) {
  const menuItems = getMenuItems(bar);
  const homeHref = bar ? `/${bar}` : "/";
  const barLabel = bar ? capitalize(bar) : undefined;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-28 max-w-7xl items-center justify-between px-4">
        {/* Left spacer */}
        <div className="w-24" />

        {/* Center: Logo */}
        <Link href={homeHref} className="-ml-8 flex items-center">
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
          <SearchBar bar={bar} onOpen={() => setMenuOpen(false)} />
          <NavMenu menuItems={menuItems} barLabel={barLabel} open={menuOpen} onToggle={setMenuOpen} adminHref={isAdmin && bar ? `/${bar}/admin` : undefined} />
        </div>
      </div>
    </nav>
  );
}
