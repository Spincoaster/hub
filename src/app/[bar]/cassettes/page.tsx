import { notFound, redirect } from "next/navigation";

export default async function CassettesPage({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const { bar } = await params;
  if (bar !== "kagurazaka") notFound();
  redirect(`/${bar}/cassettes/artists`);
}
