export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Делает валидный wa.me номер, ожидаем казахстанский формат */
export function waNumberToE164(whats?: string | null): string | null {
  if (!whats) return null;
  let d = onlyDigits(whats);
  if (d.startsWith("8")) d = "7" + d.slice(1);   // 8 → 7
  if (!d.startsWith("7")) d = "7" + d;           // на всякий случай
  if (d.length !== 11) return null;              // базовая проверка
  return d; // для wa.me нужен без +
}