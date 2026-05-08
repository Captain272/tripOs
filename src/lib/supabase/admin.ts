import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. NEVER import from a Client Component.
 * Use only in server-side routes that genuinely need to bypass RLS
 * (webhooks, system jobs, admin operations).
 *
 * Typed loosely (no generated Database type yet) — insert payloads are
 * runtime-validated by zod, so we accept the type-system limitation here.
 *
 * Cached on globalThis so we don't recreate per-request in dev.
 */
const globalForAdmin = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __triposAdminClient?: SupabaseClient<any, "public", "public", any, any>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdmin(): SupabaseClient<any, "public", "public", any, any> {
  if (typeof window !== "undefined") {
    throw new Error("supabase admin client must not be imported on the client");
  }
  if (!globalForAdmin.__triposAdminClient) {
    globalForAdmin.__triposAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
  }
  return globalForAdmin.__triposAdminClient;
}
