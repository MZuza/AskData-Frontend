/**
 * Polska odmiana rzeczownika po liczebniku.
 * `plural(1, 'plik', 'pliki', 'plików')` → `plik`, 3 → `pliki`, 5 / 12 / 25 → `plików`.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) {
    return one;
  }
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}
