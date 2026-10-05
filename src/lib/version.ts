/** Compara versões `1.2.3` (partes faltantes valem 0). Negativo: `a` é mais antiga que `b`. */
export function compareVersions(a: string, b: string): number {
  const parse = (value: string) =>
    value
      .split('-')[0]!
      .split('.')
      .map((part) => Number.parseInt(part, 10) || 0);
  const left = parse(a);
  const right = parse(b);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}
