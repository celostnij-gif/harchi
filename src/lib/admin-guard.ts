import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "./admin-auth";

/**
 * Server-side перевірка авторизації для /api/admin/* роутів
 * (дублює middleware — defensive). true → запит авторизовано.
 */
export async function requireAdminApi(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}
