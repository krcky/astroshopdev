/**
 * Vladar horoskopa — planeta koja vlada znakom Ascendenta.
 *
 * TRADICIONALNI vladari su podrazumevani (astrolog, 27.9.2026): "svih 12
 * znakova/podznaka imaju jednako dinamican i zivopisan protok dnevnih tekstova".
 * Moderni (Uran, Neptun, Pluton) su spori — tranzit na njih ili od njih je
 * redak, pa bi Skorpija, Vodolija i Ribe retko videli oznaku vladara.
 *
 * `SIGNS[].rulerKey` u `zodiac.ts` je MODERAN i ostaje takav: koristi ga stari
 * Hero (besplatni korisnici) i prikaz u profilu. Ovde je zasebna tabela da se
 * ta dva ne pomesaju.
 */
import type { PlanetKey } from '@/lib/astro';
import type { NatalChart } from '@/lib/natal';

export type RulerSystem = 'traditional' | 'modern' | 'both';

/** Podesavanje u kodu, ne u aplikaciji. */
export const RULER_SYSTEM: RulerSystem = 'traditional';

const TRADITIONAL: Record<string, PlanetKey> = {
  aries: 'mars', taurus: 'venus', gemini: 'mercury', cancer: 'moon',
  leo: 'sun', virgo: 'mercury', libra: 'venus', scorpio: 'mars',
  sagittarius: 'jupiter', capricorn: 'saturn', aquarius: 'saturn', pisces: 'jupiter',
};

/** Samo znakovi gde se moderni vladar razlikuje. */
const MODERN: Partial<Record<string, PlanetKey>> = {
  scorpio: 'pluto', aquarius: 'uranus', pisces: 'neptune',
};

/** Vladar(i) znaka po sistemu. `both` vraca tradicionalnog pa modernog, bez ponavljanja. */
export function signRulers(signKey: string, system: RulerSystem = RULER_SYSTEM): PlanetKey[] {
  const t = TRADITIONAL[signKey];
  const m = MODERN[signKey] ?? t;
  if (system === 'traditional') return [t];
  if (system === 'modern') return [m];
  return t === m ? [t] : [t, m];
}

/**
 * Vladar(i) horoskopa. Bez vremena rodjenja nema Ascendenta, pa ni vladara
 * (pravilo 5) — prazna lista, ne pogadjanje.
 */
export function chartRulers(
  chart: NatalChart,
  timeUnknown: boolean,
  system: RulerSystem = RULER_SYSTEM
): PlanetKey[] {
  if (timeUnknown) return [];
  return signRulers(chart.ascendantSign.sign.key, system);
}

export type RulerRole = 'natal' | 'transiting';

/**
 * Da li je tranzit "tranzit vladara" i koja strana je vladar. Kad su obe
 * (npr. Jupiter na natalni Jupiter kod Riba), vazi natalna — nju tranzit dodiruje.
 */
export function rulerRole(
  transitingKey: string,
  natalKey: string,
  rulers: readonly string[]
): RulerRole | null {
  if (rulers.includes(natalKey)) return 'natal';
  if (rulers.includes(transitingKey)) return 'transiting';
  return null;
}
