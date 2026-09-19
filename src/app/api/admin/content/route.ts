import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import { fail, ok } from "@/lib/admin-api";

export const runtime = "nodejs";

const contentSchema = z.object({
  key: z.string().trim().min(1).max(120),
  data: z.record(z.string(), z.unknown()),
  visible: z.boolean(),
});

/** DEFENSIVE-парсинг збереженого JSON-рядка секції → обʼєкт. */
function parseSectionData(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Битий JSON у БД — повертаємо порожній обʼєкт, не падаємо.
  }
  return {};
}

/** GET /api/admin/content — усі секції [{key, data, visible, updatedAt}]. */
export async function GET() {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  try {
    const sections = await db.sectionContent.findMany({
      orderBy: { key: "asc" },
    });
    return ok(
      sections.map((s) => ({
        key: s.key,
        data: parseSectionData(s.data),
        visible: s.visible,
        updatedAt: s.updatedAt,
      }))
    );
  } catch (e) {
    console.error("GET /api/admin/content error:", e);
    return fail("server_error", 500);
  }
}

/** PUT /api/admin/content — upsert секції {key, data, visible}. */
export async function PUT(req: Request) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_json", 400);
  }

  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  const { key, data, visible } = parsed.data;

  try {
    const section = await db.sectionContent.upsert({
      where: { key },
      update: { data: JSON.stringify(data), visible },
      create: { key, data: JSON.stringify(data), visible },
    });
    revalidatePath("/");
    return ok({
      key: section.key,
      data: parseSectionData(section.data),
      visible: section.visible,
      updatedAt: section.updatedAt,
    });
  } catch (e) {
    console.error("PUT /api/admin/content error:", e);
    return fail("server_error", 500);
  }
}
