/**
 * Deep-merge утиліта (pure, без залежностей).
 *
 * Правила:
 *  - patch перезаписує base;
 *  - масиви замінюються целиком (не мержаться поіндексно);
 *  - null/undefined значення у patch ігноруються (base залишається);
 *  - примітиви у patch перезаписують base.
 */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === null || patch === undefined) return base;
  if (
    Array.isArray(base) ||
    Array.isArray(patch) ||
    typeof base !== "object" ||
    typeof patch !== "object"
  ) {
    return patch as T;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (v === null || v === undefined) continue;
    out[k] =
      k in (base as Record<string, unknown>)
        ? deepMerge((base as Record<string, unknown>)[k], v)
        : v;
  }
  return out as T;
}
