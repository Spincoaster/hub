import Link from "next/link";
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { MobileMenu } from "@/components/MobileMenu";

const navigationMenus = {
  shinjuku: [
    {
      href: "https://menu.spincoaster.com/shinjuku",
      label: "Menu",
      external: true,
    },
    { href: "/shinjuku/features", label: "Feature", external: false },
    { href: "/shinjuku/artists", label: "Artists", external: false },
    { href: "/shinjuku/records", label: "Records", external: false },
    { href: "/shinjuku/tracks", label: "Tracks", external: false },
    { href: "/shinjuku/albums", label: "Albums", external: false },
    { href: "/shinjuku/owners", label: "Owners", external: false },
  ],
  ebisu: [
    {
      href: "https://menu.spincoaster.com/ebisu",
      label: "Drink Menus",
      external: true,
    },
    { href: "/ebisu/artists", label: "Artists", external: false },
    { href: "/ebisu/records", label: "Records", external: false },
    { href: "/ebisu/tracks", label: "Tracks", external: false },
    { href: "/ebisu/albums", label: "Albums", external: false },
    { href: "/ebisu/owners", label: "Owners", external: false },
  ],
  default: [
    { href: "/shinjuku", label: "SHINJUKU", external: false },
    { href: "/ebisu", label: "EBISU", external: false },
  ],
};

type Bar = "shinjuku" | "ebisu";

function isBar(value: string): value is Bar {
  return value === "shinjuku" || value === "ebisu";
}

function getMenuItems(bar?: string) {
  if (bar && isBar(bar)) {
    return navigationMenus[bar];
  }
  return navigationMenus.default;
}

export async function Navigation({ bar }: { bar?: string }) {
  const session = await auth();
  const menuItems = getMenuItems(bar);
  const homeHref = bar ? `/${bar}` : "/";
  const title = bar ? bar.toUpperCase() : "SPINCOASTER HUB";

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={homeHref}
          className="text-lg font-bold tracking-wider text-zinc-900 dark:text-zinc-100"
        >
          {title}
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-6 md:flex">
          {menuItems.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {item.label}
              </Link>
            )
          )}
          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Logout
              </button>
            </form>
          )}
        </div>

        {/* Mobile menu */}
        <MobileMenu
          menuItems={menuItems}
          isLoggedIn={!!session?.user}
        />
      </div>
    </nav>
  );
}
