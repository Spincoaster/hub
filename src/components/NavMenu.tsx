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
        className="p-1 hover:opacity-70"
        aria-label="Toggle menu"
      >
        <svg className="h-4 w-5" viewBox="0 0 52 39" fill="none">
          {/* Top line */}
          <line
            x1="0" y1="19.35" x2="52" y2="19.35"
            stroke="#fff" strokeMiterlimit={10} strokeWidth={5}
            className="transition-transform duration-300 ease-in-out"
            style={{
              transformOrigin: "26px 19.35px",
              transform: open ? "rotate(33deg)" : "translateY(-16.85px)",
            }}
          />
          {/* Middle line */}
          <line
            x1="0" y1="19.35" x2="52" y2="19.35"
            stroke="#fff" strokeMiterlimit={10} strokeWidth={5}
            className="transition-opacity duration-300 ease-in-out"
            style={{ opacity: open ? 0 : 1 }}
          />
          {/* Bottom line */}
          <line
            x1="0" y1="19.35" x2="52" y2="19.35"
            stroke="#fff" strokeMiterlimit={10} strokeWidth={5}
            className="transition-transform duration-300 ease-in-out"
            style={{
              transformOrigin: "26px 19.35px",
              transform: open ? "rotate(-33deg)" : "translateY(16.85px)",
            }}
          />
        </svg>
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
        <div className="absolute inset-x-0 top-14 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
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
