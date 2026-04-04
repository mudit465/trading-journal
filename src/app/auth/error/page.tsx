"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The sign in link is no longer valid.",
    Default: "An error occurred during sign in.",
  };

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-8">
        <TrendingUp className="h-5 w-5 text-indigo-400" />
        <span className="font-semibold text-zinc-100 tracking-tight">TradeLog</span>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
        </div>
        <h1 className="text-lg font-semibold text-zinc-100 mb-2">Authentication error</h1>
        <p className="text-sm text-zinc-500 mb-6">
          {errorMessages[error ?? "Default"] ?? errorMessages["Default"]}
        </p>
        <Button variant="primary" asChild>
          <Link href="/auth/login">Try again</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-zinc-500 text-sm text-center">Loading...</div>}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
