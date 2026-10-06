/**
 * JEZIK TEKSTOVA ASTROLOGA (korpus) — tranziti, natal, lunarni (Ivan, 6.10.2026).
 *
 * Tabele korpusa imaju kolonu `jezik` (`supabase/prevod-jezik.sql`); srpski je original,
 * prevod postoji samo za jezike sa spiska ispod. Upit trazi jezik aplikacije I srpski, pa
 * za svaki kljuc uzima prevod, a srpski samo kad prevoda nema (tekst koji jos nije preveden,
 * ili ga astrolog tek dopisao) — da korisnik nikad ne ostane bez tumacenja.
 *
 * Bez ovog filtera upit dobije po red za svaki jezik istog kljuca, i u mapu upadne koji stigne
 * poslednji. Cist modul (pravilo 6): bez react-native uvoza.
 */
import { jezik, type Jezik } from '@/i18n/jezik';

/** Jezici na koje je korpus PREVEDEN i uvezen. Novi jezik se dodaje ovde tek posle uvoza. */
export const PREVEDEN_KORPUS: readonly Jezik[] = ['hr', 'bs'];

/** Jezik na kom se traze tekstovi astrologa: jezik aplikacije ako ima prevod, inace srpski. */
export function jezikKorpusa(j: Jezik = jezik()): Jezik {
  return PREVEDEN_KORPUS.includes(j) ? j : 'sr';
}

/** Sta ide u `.in('jezik', …)`: trazeni jezik i srpski kao rezerva. */
export function jeziciUpita(j: Jezik): Jezik[] {
  return j === 'sr' ? ['sr'] : [j, 'sr'];
}

/**
 * Od redova na vise jezika ostavlja po JEDAN za svaki kljuc: na jeziku `j` ako postoji, inace
 * srpski. Red bez `jezik` (baza pre kolone) racuna se kao srpski.
 */
export function poJeziku<T extends { jezik?: string | null }>(redovi: T[], j: Jezik, kljuc: (r: T) => string): T[] {
  const out = new Map<string, T>();
  for (const r of redovi) {
    const k = kljuc(r);
    const rj = r.jezik ?? 'sr';
    if (rj !== j && rj !== 'sr') continue;
    const ima = out.get(k);
    if (!ima || rj === j) out.set(k, r);
  }
  return [...out.values()];
}

/** Dodatak kljucu kesa: srpski ostaje bez dodatka, da stari kes na disku vazi i dalje. */
export function kesJezika(j: Jezik): string {
  return j === 'sr' ? '' : `${j}|`;
}
