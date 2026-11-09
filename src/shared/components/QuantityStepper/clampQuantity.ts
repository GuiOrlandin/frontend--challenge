/** Limita a quantidade a um inteiro entre `min` e `max`; `min` vence quando `max < min`. */
export function clampQuantity(value: number, { min, max }: { min: number; max: number }): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.trunc(value)))
}
