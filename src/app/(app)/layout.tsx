import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import type { Session } from "@/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar session={session as Session} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
