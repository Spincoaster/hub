import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { auth } from "@/lib/auth";

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

  const session = await auth();

  return (
    <div className="min-h-screen text-white">
      <Navigation bar={bar} isAdmin={!!session} />
      <main className="pt-7 pb-4 md:py-8">{children}</main>
    </div>
  );
}
