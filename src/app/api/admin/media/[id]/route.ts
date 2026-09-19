import { unlink } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import { fail, ok, parseRouteId } from "@/lib/admin-api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/media/[id] — видаляє файл з диска + рядок MediaAsset.
 * Якщо файлу фізично немає — все одно видаляє рядок.
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  try {
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) return fail("not_found", 404);

    // filename вже санітизований при аплоаді (без "/" і "..") — беремо basename
    // для додаткового захисту від path traversal.
    const base = asset.filename.split(/[\\/]/).pop() || asset.filename;
    const filePath = join(process.cwd(), "public", "uploads", base);

    try {
      await unlink(filePath);
    } catch {
      // Файлу немає (ENOENT) або недоступний — це не блокує видалення рядка.
    }

    await db.mediaAsset.delete({ where: { id } });
    return ok({ deleted: true, id, filename: asset.filename });
  } catch (e) {
    console.error("DELETE /api/admin/media/[id] error:", e);
    return fail("server_error", 500);
  }
}
