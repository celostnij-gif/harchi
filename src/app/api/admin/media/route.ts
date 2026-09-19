import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import { fail, ok } from "@/lib/admin-api";

export const runtime = "nodejs";

/** GET /api/admin/media — список медіа-активів (createdAt desc). */
export async function GET() {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  try {
    const assets = await db.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok(assets);
  } catch (e) {
    console.error("GET /api/admin/media error:", e);
    return fail("server_error", 500);
  }
}
