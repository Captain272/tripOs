"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser-side Supabase client. Uses the public anon key + the user's
 *  auth cookie. Never use this server-side. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
