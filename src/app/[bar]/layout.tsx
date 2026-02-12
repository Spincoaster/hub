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
    <div className="min-h-screen text-white">
      <Navigation bar={bar} />
      <main className="py-8">{children}</main>
    </div>
  );
}
