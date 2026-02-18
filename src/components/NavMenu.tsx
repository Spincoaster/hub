"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const NoiseBackground = dynamic(() => import("@/components/NoiseBackground"), { ssr: false });

type MenuItem = {
  href: string;
  label: string;
  external: boolean;
};

function ArrowIcon() {
  return (
    <svg
      className="h-7 w-7 shrink-0 rounded-full border border-white p-0.5 text-white"
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
  open,
  onToggle,
  adminHref,
}: {
  menuItems: MenuItem[];
  barLabel?: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  adminHref?: string;
}) {

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      timeoutRef.current = setTimeout(() => setMounted(false), 500);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevent = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      window.removeEventListener("wheel", prevent);
      window.removeEventListener("touchmove", prevent);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => onToggle(!open)}
        className="p-1 hover:opacity-70"
        aria-label="Toggle menu"
      >
        <svg className="h-4 w-5" viewBox="0 0 52 39" fill="none">
          {/* Top line */}
          <line
            x1="0" y1="19.35" x2="52" y2="19.35"
            stroke="#fff" strokeMiterlimit={10} strokeWidth={5}
            className="transition-transform duration-500 ease-in-out"
            style={{
              transformOrigin: "26px 19.35px",
              transform: open ? "rotate(33deg)" : "translateY(-16.85px)",
            }}
          />
          {/* Middle line */}
          <line
            x1="0" y1="19.35" x2="52" y2="19.35"
            stroke="#fff" strokeMiterlimit={10} strokeWidth={5}
            className="transition-opacity duration-500 ease-in-out"
            style={{ opacity: open ? 0 : 1 }}
          />
          {/* Bottom line */}
          <line
            x1="0" y1="19.35" x2="52" y2="19.35"
            stroke="#fff" strokeMiterlimit={10} strokeWidth={5}
            className="transition-transform duration-500 ease-in-out"
            style={{
              transformOrigin: "26px 19.35px",
              transform: open ? "rotate(-33deg)" : "translateY(16.85px)",
            }}
          />
        </svg>
      </button>

      {/* Bar label in header row when open */}
      {mounted && barLabel && (
        <div className={`pointer-events-none absolute left-0 top-0 z-[60] flex h-64 items-center transition-opacity duration-500 md:h-28 ${visible ? "opacity-100" : "opacity-0"}`}>
          <span className="inline-block w-52 rounded-r-full bg-white px-4 py-1 text-center text-base font-semibold text-black md:w-64">
            {barLabel}
          </span>
        </div>
      )}

      {/* Menu dropdown */}
      {mounted && (
      <div className={`absolute inset-x-0 top-28 z-50 h-screen overflow-hidden bg-[#0a0a0a] transition-all duration-300 ease-in-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <NoiseBackground className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="relative mt-20 flex flex-col border-t border-white md:mt-0">
          {menuItems.map((item, i) => {
            const itemStyle: React.CSSProperties = {
              transition: "opacity 400ms ease-out, transform 400ms ease-out",
              transitionDelay: `${i * 80}ms`,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(-8px)",
            };
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
                className="flex items-center border-b border-white py-5 pl-6 pr-6 text-base text-white transition-colors hover:bg-zinc-900 md:pl-18"
                style={itemStyle}
                onClick={() => onToggle(false)}
              >
                {content}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center border-b border-white py-5 pl-6 pr-6 text-base text-white transition-colors hover:bg-zinc-900 md:pl-18"
                style={itemStyle}
                onClick={() => onToggle(false)}
              >
                {content}
              </Link>
            );
          })}
          {adminHref && (
            <>
              <Link
                href={adminHref}
                className="flex items-center border-b border-white py-5 pl-6 pr-6 text-base text-white transition-colors hover:bg-zinc-900 md:pl-18"
                style={{
                  transition: "opacity 400ms ease-out, transform 400ms ease-out",
                  transitionDelay: `${menuItems.length * 80}ms`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(-8px)",
                }}
                onClick={() => onToggle(false)}
              >
                <span>Admin</span>
                <span className="ml-8">
                  <ArrowIcon />
                </span>
              </Link>
              <Link
                href="/"
                className="flex items-center border-b border-white py-5 pl-6 pr-6 text-base text-white transition-colors hover:bg-zinc-900 md:pl-18"
                style={{
                  transition: "opacity 400ms ease-out, transform 400ms ease-out",
                  transitionDelay: `${(menuItems.length + 1) * 80}ms`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(-8px)",
                }}
                onClick={() => onToggle(false)}
              >
                <span>Switch Bar</span>
                <span className="ml-8">
                  <ArrowIcon />
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
      )}
    </>
  );
}
