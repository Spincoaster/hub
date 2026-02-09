"use client";

import { useState } from "react";
import Link from "next/link";

type MenuItem = {
  href: string;
  label: string;
  external: boolean;
};

export function MobileMenu({
  menuItems,
  isLoggedIn,
}: {
  menuItems: MenuItem[];
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-zinc-600 dark:text-zinc-400"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-3">
            {menuItems.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
            {isLoggedIn && (
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-zinc-500 dark:text-zinc-400"
                >
                  Logout
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
