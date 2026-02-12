"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export function BackLink({ label, href, className }: { label: string; href: string; className?: string }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    const referrer = document.referrer;
    if (referrer && new URL(referrer).pathname === href) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`text-sm text-zinc-400 hover:text-white ${className ?? ""}`}
    >
      {label}
    </Link>
  );
}
