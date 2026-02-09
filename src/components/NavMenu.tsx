"use client";

import { useState } from "react";
import Link from "next/link";

type MenuItem = {
  href: string;
  label: string;
  external: boolean;
};

function ArrowIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 rounded-full border border-zinc-600 p-0.5 text-zinc-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

export function NavMenu({
  menuItems,
  barLabel,
}: {
  menuItems: MenuItem[];
  barLabel?: string;
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

      {/* Bar label in header row when open */}
      {open && barLabel && (
        <div className="absolute left-4 top-0 flex h-14 items-center">
          <span className="rounded-full bg-white px-4 py-1 text-sm font-medium text-black">
            {barLabel}
          </span>
        </div>
      )}

      {/* Menu dropdown */}
      {open && (
        <div className="absolute inset-x-0 top-14 z-50 border-b border-zinc-800 bg-zinc-950">
          <div className="flex flex-col">
            {menuItems.map((item) => {
              const content = (
                <>
                  <span>{item.label}</span>
                  <span className="ml-8">
                    <ArrowIcon />
                  </span>
                </>
              );
              return item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center border-b border-zinc-800 px-6 py-4 text-sm text-white transition-colors hover:bg-zinc-900"
                  onClick={() => setOpen(false)}
                >
                  {content}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center border-b border-zinc-800 px-6 py-4 text-sm text-white transition-colors hover:bg-zinc-900"
                  onClick={() => setOpen(false)}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
