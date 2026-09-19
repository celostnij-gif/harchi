"use client";

/** Fetch-хелпери для адмінки: 401 → редірект на логін; помилки → throw. */

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new Error("unauthorized");
  }
  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    data?: T;
  };
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json.data as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { cache: "no-store" }));
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  return parse<T>(
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  );
}

export async function apiUpload<T>(url: string, form: FormData): Promise<T> {
  return parse<T>(await fetch(url, { method: "POST", body: form }));
}
