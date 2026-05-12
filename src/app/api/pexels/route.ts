import { NextRequest } from "next/server";
import { ok, fail, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/supabase/server";
import { hasPexels, searchPexels, searchPexelsMany } from "@/lib/pexels";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasPexels()) return fail("Image search is not configured (set PEXELS_API_KEY)", 503);
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return fail("q required", 400);
  const count = Number(req.nextUrl.searchParams.get("count") || "1");
  if (count > 1) {
    const photos = await searchPexelsMany(q, count);
    return ok({ photos });
  }
  const photo = await searchPexels(q);
  return ok({ photo: photo || null });
}
