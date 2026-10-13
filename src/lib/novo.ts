/**
 * "NOVO" na tabovima pocetne (Ivan, 13.10.2026): ljubicasti kruzic sa brojem na dugmadima Mesec, Promene i Teme,
 * kao na "Prici dana" — koliko stvari na tom tabu korisnik jos nije video.
 *
 *  - Mesec: znak u kom je Mesec (isti koji pokazuje kartica "Mesec danas") — nov znak = 1;
 *  - Promene: svaka promena na nebu (`kljucPromene`) koja se pojavila u spisku;
 *  - Teme: svaki spori tranzit (`contentKey`) koji se pojavio u temama perioda.
 *
 * Prvi put se nista ne oznacava: zateceno stanje je polazno. Kad korisnik otvori tab, pamti se TACNO ono sto je tada na njemu (`store/novo-log.ts`), pa se stvar koja ode
 * i kasnije se vrati (tranzit posle retrogradnog hoda) opet broji kao nova. Cist racun, bez RN uvoza.
 */
import { dayKey } from '@/lib/transits';
import type { SkyEvent } from '@/lib/sky-events';

export type NovoTab = 'mesec' | 'promene' | 'teme';

/** Promena na nebu kao kljuc: planeta, vrsta, znak i dan — isti dogadjaj je isti kljuc dok god stoji u spisku. */
export function kljucPromene(e: SkyEvent): string {
  return `${e.planet.key}.${e.kind}.${e.sign.key}.${dayKey(e.at)}`;
}

/**
 * Koliko od `sada` korisnik nije video. `vidjeno` je ono sto je bilo na tabu kad ga je poslednji put otvorio.
 * BEZ DNEVNIKA (prvo pokretanje) nista nije novo (Ivan, 13.10.2026: "previse napadno kad su sve tu") — zateceno
 * stanje se upise kao polazno, pa se broji samo ono sto se pojavi kasnije.
 */
export function brojNovih(sada: readonly string[], vidjeno: readonly string[] | undefined): number {
  if (!vidjeno) return 0;
  const v = new Set(vidjeno);
  return sada.filter((k) => !v.has(k)).length;
}

/** Da li je spisak isti (redosled nije bitan) — da se dnevnik ne upisuje bez potrebe. */
export function istiKljucevi(a: readonly string[], b: readonly string[] | undefined): boolean {
  return !!b && a.length === b.length && brojNovih(a, b) === 0;
}
