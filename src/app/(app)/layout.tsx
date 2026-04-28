import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
   <div className="flex min-h-screen overflow-hidden">
  <aside className="hidden md:flex md:w-56">
    <Sidebar />
  </aside>

  <main className="flex-1 min-w-0 overflow-x-hidden">
    {children}
  </main>
</div>
  );
}
