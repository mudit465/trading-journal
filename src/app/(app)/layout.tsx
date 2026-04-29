// src/app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Pass session down to the shell so Sidebar can show user avatar/name
  return <AppShell session={session}>{children}</AppShell>;
}
