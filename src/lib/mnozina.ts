/**
 * Srpska mnozina uz broj — jedno mesto za "1 dan / 2 dana / 5 meseci".
 * Cisto, bez RN uvoza (pravilo 6); provere u `scripts/check-oblasti.ts`.
 */
import { tr } from '@/i18n/jezik';

/** Tri oblika srpske mnozine; jezik sa drugim pravilima ima svoju funkciju u recniku. */
export { mnozina, type Oblici } from '@/i18n/sr/gramatika';

/** "21 dan", "22 dana", "11 dana" — po jeziku. */
export const dana = (n: number) => tr().gramatika.dana(n);
/** "1 mesec", "3 meseca", "12 meseci" — po jeziku. */
export const meseci = (n: number) => tr().gramatika.meseci(n);

/** Prosecan mesec u danima — za "Jos N meseci". */
const DANA_U_MESECU = 30.44;

/**
 * Koliko jos traje, od broja preostalih dana posle danasnjeg (0 = danas je
 * poslednji dan u orbisu). `null` = kraj je dalje od horizonta racuna.
 *   0 -> "Poslednji dan", do 30 -> "Jos N dana", preko 30 -> "Jos N meseci".
 */
export function josTraje(preostalo: number | null): string {
  const t = tr().datum;
  if (preostalo === null) return t.trajeGodinama;
  if (preostalo <= 0) return t.poslednjiDan;
  // "Traje još …" (Ivan, 28.9.2026) — samo "Još 23 dana" nije govorilo sta.
  if (preostalo <= 30) return t.trajeJos(dana(preostalo));
  return t.trajeJos(meseci(Math.max(1, Math.round(preostalo / DANA_U_MESECU))));
}

/** @deprecated Srpski oblici — za ekran `tr().gramatika` (`dana`, `meseci`, `tranzita`), da prati jezik. */
export const DAN: readonly [string, string, string] = ['dan', 'dana', 'dana'];
/** @deprecated vidi `DAN`. */
export const MESEC: readonly [string, string, string] = ['mesec', 'meseca', 'meseci'];
/** @deprecated vidi `DAN`. */
export const TRANZIT: readonly [string, string, string] = ['tranzit', 'tranzita', 'tranzita'];
