/**
 * Uporedni horoskop, poredjenje PO ZNAKU SUNCA (Ivan, 14.10.2026; tab "Ostalo", `app/uporedni.tsx`).
 *
 * Ocena para je tabela 12 x 12 sa astroshop.rs/uporedni-horoskop (srce / pola srca / X). Ispostavilo se da
 * tabela zavisi SAMO od rastojanja dva znaka na krugu zodijaka, pa se racuna, ne prepisuje:
 *
 *   rastojanje 0, 2, 4, 6  (isti znak, sekstil, trigon, opozicija)  -> povoljno   (srce)
 *   rastojanje 1, 5        (susedni znak, kvinkunks)                 -> manje       (pola srca)
 *   rastojanje 3           (kvadrat)                                 -> nepovoljno  (X)
 *
 * Opozicija je dakle "odlican par", a jedini X je kvadrat. Ovo je izbor sajta/astrologa, ne nas; ako ga astrolog
 * promeni, menja se samo ovde i u `docs/ASTRO-LOGIKA.md`. Provera: `npm run check:uporedni` (svih 144 polja
 * prema tabeli sa sajta).
 *
 * Tekstovi (Ljubav / Prijateljstvo / Posao, 144 usmerena para) JOS NISU u aplikaciji: postoje na sajtu, a ulaze
 * kroz bazu kao ostali korpus (pravilo 7). Do tada ekran pokazuje samo ocenu.
 */
import { SIGNS } from '@/lib/zodiac';

export type OcenaPara = 'povoljno' | 'manje' | 'nepovoljno';

/** Rastojanje dva znaka na krugu, 0—6 (indeksi znakova, Ovan = 0). */
export function razmakZnakova(a: number, b: number): number {
  const d = Math.abs(a - b) % 12;
  return Math.min(d, 12 - d);
}

/** Ocena para po indeksima znakova (Ovan = 0 ... Ribe = 11). */
export function ocenaPara(a: number, b: number): OcenaPara {
  const d = razmakZnakova(a, b);
  if (d === 3) return 'nepovoljno';
  if (d === 1 || d === 5) return 'manje';
  return 'povoljno';
}

/** Ocena po kljucevima znakova (`SIGNS[].key`); `null` za nepoznat kljuc. */
export function ocenaZnakova(kljucA: string, kljucB: string): OcenaPara | null {
  const a = SIGNS.findIndex((s) => s.key === kljucA);
  const b = SIGNS.findIndex((s) => s.key === kljucB);
  if (a < 0 || b < 0) return null;
  return ocenaPara(a, b);
}

/** Oblasti tekstova astrologa za par (`lib/uporedni-texts.ts`, tabela `uporedni_texts`). */
export type OblastPara = 'ljubav' | 'prijateljstvo' | 'posao';

/** Redosled oblasti na ekranu. */
export const OBLASTI_PARA: readonly OblastPara[] = ['ljubav', 'prijateljstvo', 'posao'];

/** Kanonski kljuc teksta: uporedni.<prvi>.<drugi>.<oblast> (ne menja se posle uvoza). Prvi je znak u kom je "ti". */
export function uporedniKey(prvi: string, drugi: string, oblast: OblastPara): string {
  return `uporedni.${prvi}.${drugi}.${oblast}`;
}
