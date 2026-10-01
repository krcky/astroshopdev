/**
 * Srpska gramatika uz broj — mnozina. Drugi jezik ima svoja pravila (slovenacki dvojinu,
 * engleski dva oblika), pa se menja CELA funkcija, ne samo reci.
 */

/** Tri oblika: uz 1 (21, 31…), uz 2—4 (22—24…), sve ostalo (5—20, 11—14…). */
export type Oblici = readonly [jedan: string, dva: string, pet: string];

export function mnozina(n: number, [jedan, dva, pet]: Oblici): string {
  const d = Math.abs(n) % 10;
  const s = Math.abs(n) % 100;
  if (d === 1 && s !== 11) return jedan;
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return dva;
  return pet;
}

export const gramatika = {
  /** "21 dan", "22 dana", "11 dana". */
  dana: (n: number) => `${n} ${mnozina(n, ['dan', 'dana', 'dana'])}`,
  /** "1 mesec", "3 meseca", "12 meseci". */
  meseci: (n: number) => `${n} ${mnozina(n, ['mesec', 'meseca', 'meseci'])}`,
  /** Samo rec uz broj: "tranzit" / "tranzita". */
  tranzita: (n: number) => mnozina(n, ['tranzit', 'tranzita', 'tranzita']),
  /** Prvo slovo veliko, po pravilima jezika. */
  veliko: (x: string) => x.charAt(0).toLocaleUpperCase('sr') + x.slice(1),
  /** Oznaka jezika za `Intl` (cene, imena zemalja). */
  locale: 'sr-Latn-RS',
};
