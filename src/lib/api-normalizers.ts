export const asLoc = (v: unknown) => (v && typeof v === "object" ? v : null);

export const asIntOrNull = (v: unknown) =>
  Number.isFinite(Number(v)) ? Number(v) : null;

export const asFloatOrNull = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const asStrOrNull = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : null;

export const asStringArray = (v: unknown) =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];

/** Безопасная выборка из произвольного JSON объекта по ключу */
export const pick = <T = unknown>(obj: unknown, key: string, fallback: T | null = null): T | null => {
  if (!obj || typeof obj !== "object") return fallback;
  const v = (obj as any)[key];
  return (v === undefined ? fallback : (v as T));
};