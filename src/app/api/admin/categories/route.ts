import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import { fail, isUniqueConflict, ok } from "@/lib/admin-api";

export const runtime = "nodejs";

/** Повна форма категорії (POST / PUT). */
const categorySchema = z.object({
  slug: z.string().trim().min(1).max(120),
  nameUk: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).default(""),
  sort: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

/** Часткова форма (PATCH). */
const categoryPatchSchema = z.object({
  slug: z.string().trim().min(1).max(120).optional(),
  nameUk: z.string().trim().min(1).max(200).optional(),
  nameEn: z.string().trim().max(200).optional(),
  sort: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/** GET /api/admin/categories — список (?all=1 → включно з неактивними; ?q= пошук). */
export async function GET(req: Request) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  try {
    const url = new URL(req.url);
    const all = url.searchParams.get("all") === "1";
    const q = (url.searchParams.get("q") || "").trim();

    const where: Prisma.CategoryWhereInput = {
      ...(all ? {} : { isActive: true }),
      ...(q
        ? {
            OR: [
              { nameUk: { contains: q } },
              { nameEn: { contains: q } },
              { slug: { contains: q } },
            ],
          }
        : {}),
    };

    const categories = await db.category.findMany({
      where,
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    });
    return ok(categories);
  } catch (e) {
    console.error("GET /api/admin/categories error:", e);
    return fail("server_error", 500);
  }
}

/** POST /api/admin/categories — створення категорії. */
export async function POST(req: Request) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_json", 400);
  }

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const category = await db.category.create({ data: parsed.data });
    revalidatePath("/");
    return ok(category, 201);
  } catch (e) {
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("POST /api/admin/categories error:", e);
    return fail("server_error", 500);
  }
}
