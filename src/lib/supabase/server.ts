// src/lib/supabase/server.ts

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// ─────────────────────────────────────────────
// USER CLIENT (RLS enforced)
// ─────────────────────────────────────────────
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),

        setAll: (cookiesToSet: any[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // ignore in server components
          }
        },
      },
    }
  );
}

// ─────────────────────────────────────────────
// ADMIN CLIENT (BYPASSES RLS ⚠️ SERVER ONLY)
// ─────────────────────────────────────────────
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL in env"
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}