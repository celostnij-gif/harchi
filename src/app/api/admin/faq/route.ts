import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import { fail, isUniqueConflict, ok } from "@/lib/admin-api";

export const runtime = "nodejs";

/** Повна форма FAQ-пункту (POST / PUT). */
const faqSchema = z.object({
  qUk: z.string().trim().min(1).max(500),
  qEn: z.string().trim().max(500).default(""),
  aUk: z.string().trim().min(1).max(5000),
  aEn: z.string().trim().max(5000).default(""),
  isActive: z.boolean().default(true),
  sort: z.number().int().default(0),
});

/** Часткова форма (PATCH). */
const faqPatchSchema = z.object({
  qUk: z.string().trim().min(1).max(500).optional(),
  qEn: z.string().trim().max(500).optional(),
  aUk: z.string().trim().min(1).max(5000).optional(),
  aEn: z.string().trim().max(5000).optional(),
  isActive: z.boolean().optional(),
  sort: z.number().int().optional(),
});

/** GET /api/admin/faq — усі пункти FAQ (сортування sort asc, id asc). */
export async function GET() {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  try {
    const items = await db.faqItem.findMany({
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    });
    return ok(items);
  } catch (e) {
    console.error("GET /api/admin/faq error:", e);
    return fail("server_error", 500);
  }
}

/** POST /api/admin/faq — створення пункту FAQ. */
export async function POST(req: Request) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_json", 400);
  }

  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const item = await db.faqItem.create({ data: parsed.data });
    revalidatePath("/");
    return ok(item, 201);
  } catch (e) {
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("POST /api/admin/faq error:", e);
    return fail("server_error", 500);
  }
}
