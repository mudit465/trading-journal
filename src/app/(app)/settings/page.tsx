// src/app/(app)/settings/page.tsx
import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Profile</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage your account and preferences
        </p>
      </div>

      {/* ── Profile ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Account</h2>

        <div className="flex items-center gap-4">
  <Avatar className="h-14 w-14">
    <AvatarImage src={session?.user?.image ?? undefined} />
    <AvatarFallback className="text-lg">
      {getInitials(session?.user?.name || "User")}
    </AvatarFallback>
  </Avatar>

          <div>
            <p className="font-medium text-zinc-100">
              {session?.user?.name ?? "User"}
            </p>
            <p className="text-sm text-zinc-500">
              {session?.user?.email ?? "No email"}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Appearance ── */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Appearance
        </h2>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}