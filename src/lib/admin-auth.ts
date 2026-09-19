/**
 * Авторизація адмінки: HMAC-SHA256 токен у httpOnly cookie.
 * Використовує Web Crypto → працює і в Edge (middleware), і в Node (route handlers).
 */

export const ADMIN_COOKIE = "harchi_admin";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 днів

const encoder = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
  const s = atob(b64 + "=".repeat(pad));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function getSecret(): string {
  return process.env.ADMIN_TOKEN_SECRET || "dev-secret-change-me";
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Створює підписаний токен адміна */
export async function signAdminToken(username: string): Promise<string> {
  const payload = b64url(
    encoder.encode(
      JSON.stringify({ u: username, exp: Date.now() + TOKEN_TTL_MS })
    )
  );
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

/** Перевіряє токен (підпис + термін). true — валідний. */
export async function verifyAdminToken(token?: string | null): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const key = await hmacKey();
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig) as unknown as ArrayBuffer,
      encoder.encode(payload)
    );
    if (!ok) return false;
    const json = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    return typeof json.exp === "number" && json.exp > Date.now();
  } catch {
    return false;
  }
}

/** Перевірка креденшалів проти .env */
export function checkCredentials(
  username: string | undefined,
  password: string | undefined
): boolean {
  const u = process.env.ADMIN_USERNAME || "admin";
  const p = process.env.ADMIN_PASSWORD || "";
  return Boolean(password) && username === u && password === p;
}
