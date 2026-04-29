// src/app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import type { Session } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  /*
   * This file stays a Server Component so `await auth()` works.
   * All client-side interactivity (drawer open/close) lives in AppShell.
   * Session is passed down so Sidebar can show the user's name/avatar.
   */
  // After the guard above, session and session.user are guaranteed to exist.
  // Cast to our own Session type to avoid the next-auth internal type mismatch.
  return (
    <AppShell session={session as unknown as Session}>
      {children}
    </AppShell>
  );
}