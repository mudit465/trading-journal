// src/lib/supabase/service.ts
import { createClient } from "@supabase/supabase-js";

// This client has full database access — ONLY use in server actions/API routes
// NEVER import this in client components
export function createServiceClient() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !secret) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment"
    );
  }

  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}