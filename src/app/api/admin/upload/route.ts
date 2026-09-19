import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import { fail, ok } from "@/lib/admin-api";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg", "gif"] as const;

/** Санітизація імені файлу: лише [a-zA-Z0-9._-], обрізаємо до розумної довжини. */
function sanitizeFilename(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9._-]/g, "").slice(-80);
  return clean || "file";
}

/**
 * POST /api/admin/upload — multipart/form-data, поле "file" (зображення ≤5MB).
 * Зберігає в public/uploads/, створює/оновлює MediaAsset (upsert по filename).
 */
export async function POST(req: Request) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("bad_form_data", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail("file_required", 400);
  if (file.size === 0) return fail("file_empty", 400);
  if (file.size > MAX_SIZE) return fail("file_too_large", 400);

  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : "";
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return fail(
      `bad_file_type: allowed ${ALLOWED_EXTENSIONS.join(", ")}`,
      400
    );
  }

  try {
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });

    const filename = `${Date.now()}-${sanitizeFilename(file.name)}`;
    const filePath = join(dir, filename);

    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(filePath, bytes); // конфлікт імені → перезапис файлу

    const url = `/uploads/${filename}`;
    await db.mediaAsset.upsert({
      where: { filename },
      update: { url, size: file.size },
      create: { filename, url, size: file.size },
    });

    return ok({ url, filename, size: file.size }, 201);
  } catch (e) {
    console.error("POST /api/admin/upload error:", e);
    return fail("server_error", 500);
  }
}
