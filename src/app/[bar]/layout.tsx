import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/Navigation";

const validBars = ["shinjuku", "ebisu", "kagurazaka"];

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bar: string }>;
}): Promise<Metadata> {
  const { bar } = await params;
  return {
    title: `Spincoaster Music Bar ${capitalize(bar)}`,
  };
}

export default async function BarLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ bar: string }>;
}) {
  const { bar } = await params;

  if (!validBars.includes(bar)) {
    notFound();
  }

  return (
    <div className="min-h-screen text-white">
      <Navigation bar={bar} />
      <main className="py-8">{children}</main>
    </div>
  );
}
