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
    <>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 text-zinc-400 transition-colors hover:text-white"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b border-zinc-800 bg-zinc-950 px-4 py-4">
          <div className="mx-auto flex max-w-5xl flex-col gap-4">
            {menuItems.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-300 transition-colors hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-zinc-300 transition-colors hover:text-white"
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
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  Logout
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
