import { notFound } from "next/navigation";
import { Navigation } from "@/components/Navigation";

const validBars = ["shinjuku", "ebisu", "kagurazaka"];

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
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navigation bar={bar} />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
