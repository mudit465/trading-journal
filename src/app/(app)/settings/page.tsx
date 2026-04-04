import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your account</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Profile</h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="text-lg">{getInitials(session?.user?.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-zinc-100">{session?.user?.name}</p>
            <p className="text-sm text-zinc-500">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Setup instructions */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Setup</h2>
        <div className="space-y-3 text-sm text-zinc-500">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] text-indigo-400 font-bold">1</span>
            </div>
            <div>
              <p className="text-zinc-300 font-medium">Supabase database</p>
              <p className="mt-0.5">Run the SQL schema from <code className="text-xs bg-zinc-800 px-1 rounded">supabase/schema.sql</code> in your Supabase project to create all required tables.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] text-indigo-400 font-bold">2</span>
            </div>
            <div>
              <p className="text-zinc-300 font-medium">Google OAuth (optional)</p>
              <p className="mt-0.5">Add Google credentials to your <code className="text-xs bg-zinc-800 px-1 rounded">.env.local</code> file to enable Google sign-in.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] text-indigo-400 font-bold">3</span>
            </div>
            <div>
              <p className="text-zinc-300 font-medium">AI analysis (optional)</p>
              <p className="mt-0.5">Add your <code className="text-xs bg-zinc-800 px-1 rounded">OPENAI_API_KEY</code> to enable AI trade analysis on each trade.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-amber-400 font-medium mb-1">Environment variables needed</p>
        <pre className="text-xs text-amber-300/70 leading-relaxed whitespace-pre-wrap">
{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID= (optional)
GOOGLE_CLIENT_SECRET= (optional)
OPENAI_API_KEY= (optional)`}
        </pre>
      </div>
    </div>
  );
}
