/**
 * Srpska mnozina uz broj — jedno mesto za "1 dan / 2 dana / 5 meseci".
 * Cisto, bez RN uvoza (pravilo 6); provere u `scripts/check-oblasti.ts`.
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

export const DAN: Oblici = ['dan', 'dana', 'dana'];
export const MESEC: Oblici = ['mesec', 'meseca', 'meseci'];

/** "21 dan", "22 dana", "11 dana". */
export const dana = (n: number) => `${n} ${mnozina(n, DAN)}`;
/** "1 mesec", "3 meseca", "12 meseci". */
export const meseci = (n: number) => `${n} ${mnozina(n, MESEC)}`;

/** Prosecan mesec u danima — za "Jos N meseci". */
const DANA_U_MESECU = 30.44;

/**
 * Koliko jos traje, od broja preostalih dana posle danasnjeg (0 = danas je
 * poslednji dan u orbisu). `null` = kraj je dalje od horizonta racuna.
 *   0 -> "Poslednji dan", do 30 -> "Jos N dana", preko 30 -> "Jos N meseci".
 */
export function josTraje(preostalo: number | null): string {
  if (preostalo === null) return 'Traje godinama';
  if (preostalo <= 0) return 'Poslednji dan';
  if (preostalo <= 30) return `Još ${dana(preostalo)}`;
  return `Još ${meseci(Math.max(1, Math.round(preostalo / DANA_U_MESECU)))}`;
}
