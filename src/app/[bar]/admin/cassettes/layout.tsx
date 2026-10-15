import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function CassetteAdminLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ bar: string }>;
}) {
  if (!(await auth())) redirect("/login");
  if ((await params).bar !== "kagurazaka") notFound();
  return children;
}
