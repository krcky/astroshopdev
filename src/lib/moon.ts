/**
 * Mesec — sve sto se racuna za karticu na pocetnoj i ekran Mesec.
 *
 * Cist racun, bez RN uvoza (pravilo 6): procenat osvetljenosti, oblik za
 * crtez, lunarni dan, sledeci mlad i pun Mesec, element i deo biljke.
 */
import * as Astronomy from 'astronomy-engine';
import type { Element, ZodiacSign } from '@/lib/zodiac';

export type MoonState = {
  /** Ugao faze 0—360: 0 mlad, 90 prva cetvrt, 180 pun, 270 poslednja cetvrt. */
  angle: number;
  /** Osvetljeni deo diska, 0—1. */
  illumination: number;
  /** Raste (od mladog ka punom). */
  waxing: boolean;
  /** Lunarni dan 1—30: koliko je dana proslo od mladog Meseca, pocev od 1. */
  lunarDay: number;
  /** Sledeci mlad i pun Mesec posle `date`. */
  nextNew: Date;
  nextFull: Date;
};

const DAY = 86_400_000;

export function moonState(date: Date = new Date()): MoonState {
  const angle = Astronomy.MoonPhase(date);
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction;
  // Poslednji mlad: trazi se UNAZAD od `date` (negativan prozor). Pretraga unapred
  // od "pre 30 dana" je umela da nadje mlad iz prethodnog ciklusa (ciklus ~29,5 dana).
  const lastNew = Astronomy.SearchMoonPhase(0, date, -31)!;
  const lunarDay = Math.floor((date.getTime() - lastNew.date.getTime()) / DAY) + 1;
  return {
    angle,
    illumination,
    waxing: angle < 180,
    lunarDay: lunarDay > 30 ? 30 : lunarDay,
    nextNew: Astronomy.SearchMoonPhase(0, date, 35)!.date,
    nextFull: Astronomy.SearchMoonPhase(180, date, 35)!.date,
  };
}

/** "98%" — ceo procenat; 0 i 100 samo kad je bas tako. */
export function formatIllumination(f: number): string {
  const p = Math.round(f * 100);
  if (p === 100 && f < 1) return '99%';
  if (p === 0 && f > 0) return '1%';
  return `${p}%`;
}

/**
 * Deo biljke po elementu znaka u kom je Mesec — biodinamicki setveni kalendar
 * (Maria Thun): vatra plod, zemlja koren, vazduh cvet, voda list.
 * PRAVILO CEKA POTVRDU ASTROLOGA (27.9.2026).
 */
export const PLANT_PART: Record<Element, string> = {
  vatra: 'Plod', zemlja: 'Koren', vazduh: 'Cvet', voda: 'List',
};

export const ELEMENT_NAME: Record<Element, string> = {
  vatra: 'Vatra', zemlja: 'Zemlja', vazduh: 'Vazduh', voda: 'Voda',
};

export function moonElement(sign: ZodiacSign) {
  return { element: ELEMENT_NAME[sign.element], plant: PLANT_PART[sign.element] };
}

/**
 * SVG putanja osvetljenog dela diska poluprecnika `r` sa centrom u (r, r).
 *
 * Osvetljena strana je polukrug (desno dok raste, levo dok opada), a
 * terminator je polu-elipsa sa horizontalnim poluprecnikom r·|cos ugla|:
 * kod srpa se izvija ka osvetljenoj strani, kod grbavog Meseca ka tamnoj.
 * Na mladom Mesecu vraca prazan string — nema sta da se crta.
 */
export function moonLitPath(angle: number, r: number): string {
  const a = ((angle % 360) + 360) % 360;
  const rad = (a * Math.PI) / 180;
  const fraction = (1 - Math.cos(rad)) / 2;
  if (fraction < 0.005) return '';
  const top = `${r} 0`;
  const bottom = `${r} ${2 * r}`;
  if (fraction > 0.995) {
    return `M ${top} A ${r} ${r} 0 1 1 ${bottom} A ${r} ${r} 0 1 1 ${top} Z`;
  }
  const waxing = a < 180;
  const rx = (r * Math.abs(Math.cos(rad))).toFixed(3);
  const gibbous = fraction > 0.5;
  // SVG: y raste nadole, sweep=1 je u smeru kazaljke. Od vrha u smeru kazaljke = desna strana.
  const outerSweep = waxing ? 1 : 0;
  // Nazad od dna ka vrhu: sweep=1 ide levom stranom, sweep=0 desnom.
  const innerSweep = waxing ? (gibbous ? 1 : 0) : (gibbous ? 0 : 1);
  return `M ${top} A ${r} ${r} 0 0 ${outerSweep} ${bottom} A ${rx} ${r} 0 0 ${innerSweep} ${top} Z`;
}

/** Znak u trenutku `date`: posle prelaska tog dana je sledeci. */
export function moonSignAt(
  day: { sign: ZodiacSign; ingress: { at: Date; sign: ZodiacSign } | null },
  date: Date
): ZodiacSign {
  return day.ingress && date >= day.ingress.at ? day.ingress.sign : day.sign;
}

/**
 * Oblasti lunarnog kalendara — iste kao fajlovi astrologa (`lunarni/`, 12 znakova
 * x 5 oblasti). Tekstovi jos NISU uvezeni: postojeci fajlovi nisu najnovija
 * verzija. Kad stignu, idu u bazu kao i korpus tranzita (pravilo 7), ne u kod.
 */
export const LUNAR_AREAS = [
  // `emoji` je ikonica na pocetnoj (Ivan, 27.9.2026) — namerno emoji, ne `<Glyph>`.
  { key: 'ljubav', name: 'Ljubav', emoji: '❤️' },
  { key: 'zdravlje', name: 'Zdravlje', emoji: '🌿' },
  { key: 'karijera', name: 'Karijera', emoji: '💼' },
  { key: 'kuca', name: 'Kuća', emoji: '🏠' },
  { key: 'basta', name: 'Bašta', emoji: '🌷' },
] as const;

export type LunarArea = (typeof LUNAR_AREAS)[number]['key'];
