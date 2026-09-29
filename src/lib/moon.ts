/**
 * Mesec — sve sto se racuna za karticu na pocetnoj i ekran Mesec.
 *
 * Cist racun, bez RN uvoza (pravilo 6): procenat osvetljenosti, oblik za
 * crtez, lunarni dan, sledeci mlad i pun Mesec, element i deo biljke.
 */
import * as Astronomy from 'astronomy-engine';
import type { Element, ZodiacSign } from '@/lib/zodiac';
import { houseOf, type NatalChart } from '@/lib/natal';

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

/**
 * Ilustracije Meseca: 30 slika, po jedna na svakih 12°. Slika n (1—30) je
 * napravljena za ugao sredine n-tog dana srednjeg ciklusa (`scripts/mesec-faze.ts`).
 * Bira se po UGLU, ne po `lunarDay`, da oblik na slici odgovara procentu pored nje.
 */
const SINODICKI = 29.530588;
export const MESEC_SLIKA_UGLOVI = Array.from({ length: 30 }, (_, i) => ((i + 0.5) / SINODICKI) * 360);

/** Redni broj slike 1—30 za ugao faze. */
export function mesecSlika(angle: number): number {
  const a = ((angle % 360) + 360) % 360;
  let najbliza = 1, razlika = Infinity;
  MESEC_SLIKA_UGLOVI.forEach((u, i) => {
    const d = Math.min(Math.abs(a - u), 360 - Math.abs(a - u));
    if (d < razlika) { razlika = d; najbliza = i + 1; }
  });
  return najbliza;
}

/** Znak u trenutku `date`: posle prelaska tog dana je sledeci. */
export function moonSignAt(
  day: { sign: ZodiacSign; ingress: { at: Date; sign: ZodiacSign } | null },
  date: Date
): ZodiacSign {
  return day.ingress && date >= day.ingress.at ? day.ingress.sign : day.sign;
}

/**
 * Oblasti lunarnog kalendara — iste kao u tekstovima astrologa (faza x znak x
 * oblast, `lib/lunar-texts.ts`). Tekstovi su u bazi (pravilo 7), ne u kodu.
 */
export const LUNAR_AREAS = [
  // Ikonice su u `components/oblast-ikona.tsx` (Ivanove, 28.9.2026).
  { key: 'ljubav', name: 'Ljubav' },
  { key: 'zdravlje', name: 'Zdravlje' },
  { key: 'karijera', name: 'Karijera' },
  { key: 'kuca', name: 'Kuća' },
  { key: 'basta', name: 'Bašta' },
] as const;

export type LunarArea = (typeof LUNAR_AREAS)[number]['key'];

/* ------------------------------------------------------------------------- *
 * FAZA DANA — za karticu "Mesec danas" (Premium).
 *
 * Glavne faze su TRENUCI: elongacija D = 0°, 90°, 180°, 270° (Mlad, Prva
 * cetvrt, Pun, Poslednja cetvrt). Ime glavne faze nosi kalendarski dan u kom
 * se desi tacan trenutak, po lokalnom vremenu. Ostali dani su "Rastuci Mesec"
 * (izmedju Mladog i Punog) ili "Opadajuci Mesec" (izmedju Punog i Mladog).
 *
 * Znak u naslovu: za glavnu fazu to je znak Meseca U TACNOM TRENUTKU faze;
 * za rastuci/opadajuci je znak u kom je Mesec sada.
 *
 * `Astronomy.MoonPhase` je upravo D: razlika geocentricnih ekliptickih duzina
 * Meseca i Sunca. Osvetljenost je `Illumination().phase_fraction` (fizicka;
 * od (1 − cos D)/2 odstupa manje od 1%).
 * ------------------------------------------------------------------------- */

export const MAIN_PHASES = [
  { angle: 0, name: 'Mlad Mesec', key: 'new' },
  { angle: 90, name: 'Prva četvrt', key: 'first' },
  { angle: 180, name: 'Pun Mesec', key: 'full' },
  { angle: 270, name: 'Poslednja četvrt', key: 'last' },
] as const;

export type PhaseKey = (typeof MAIN_PHASES)[number]['key'] | 'waxing' | 'waning';

export const PHASE_NAME: Record<PhaseKey, string> = {
  new: 'Mlad Mesec', first: 'Prva četvrt', full: 'Pun Mesec', last: 'Poslednja četvrt',
  waxing: 'Rastući Mesec', waning: 'Opadajući Mesec',
};

/**
 * PRIVREMENO (Ivan, 27.9.2026: "cekam tekstove, stavi nesto privremeno").
 * Jedna recenica po fazi dok astrolog ne posalje prave. NIJE astrologov tekst —
 * zameniti cim stignu.
 */
export const PHASE_SUMMARY_PRIVREMENO: Record<PhaseKey, string> = {
  new: 'Početak novog lunarnog ciklusa, dobar trenutak da postaviš nameru.',
  first: 'Prva prepreka na putu onoga što si započeo traži odluku i akciju.',
  full: 'Vrhunac ciklusa: osećanja su jača, a stvari izlaze na videlo.',
  last: 'Vreme da završiš, pospremiš i otpustiš ono što ti više ne treba.',
  waxing: 'Energija raste, pa se lakše gradi i započinje.',
  waning: 'Energija opada, pa je vreme za završavanje i odmor.',
};

/**
 * Teme kuca za red "Za tebe" (Mlad i Pun Mesec u natalnoj kuci).
 * POCETNE VREDNOSTI IZ BRIEFA — ceka potvrdu astrologa.
 */
export const HOUSE_THEMES: Record<number, string> = {
  1: 'ti i tvoje telo', 2: 'novac i vrednosti', 3: 'komunikacija i okolina',
  4: 'dom i porodica', 5: 'ljubav, kreativnost i deca', 6: 'posao i zdravlje',
  7: 'partnerstva', 8: 'zajednički novac i promene', 9: 'putovanja i učenje',
  10: 'karijera i ugled', 11: 'prijatelji i planovi', 12: 'odmor i unutrašnji svet',
};

/**
 * Kljuc faze u lunarnom kalendaru astrologa (`lunar.<faza>.<znak>.<oblast>`),
 * 7 faza: opadajuci je u tekstovima podeljen na grbav (posle Punog) i srp
 * (posle Poslednje cetvrti), rastuci nije.
 */
export type LunarTextPhase =
  | 'new' | 'waxing' | 'first_quarter' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

export type PhaseDay = {
  key: PhaseKey;
  /** Faza za izbor lunarnog teksta. */
  textPhase: LunarTextPhase;
  name: string;
  /** Tacan trenutak glavne faze, ako pada tog dana. */
  exactAt: Date | null;
  /** Longituda Meseca: u tacnom trenutku glavne faze, inace u `date`. */
  moonLongitude: number;
  /** Osvetljenost u procentima, ceo broj, u trenutku `date`. */
  illuminationPct: number;
  waxing: boolean;
  /** Elongacija D u trenutku `date`, za crtez. */
  angle: number;
  /** Prva sledeca glavna faza POSLE ovog dana. */
  next: { key: PhaseKey; name: string; at: Date };
};

function dayBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { start, end };
}

/** Geocentricna longituda Meseca u ekliptici datuma (ECT, pravilo 1). */
function moonLon(date: Date): number {
  const time = Astronomy.MakeTime(date);
  const eqj = Astronomy.GeoVector(Astronomy.Body.Moon, time, true);
  const ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(time), eqj);
  const lon = Astronomy.SphereFromVector(ect).lon;
  return ((lon % 360) + 360) % 360;
}

/** Faza lokalnog dana u kom je `date`, sa osvetljenoscu i smerom u trenutku `date`. */
export function phaseDay(date: Date = new Date()): PhaseDay {
  const { start, end } = dayBounds(date);
  const angle = Astronomy.MoonPhase(date);
  const fraction = Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction;
  const waxing = angle > 0 && angle < 180;

  let main: { key: PhaseKey; at: Date } | null = null;
  for (const p of MAIN_PHASES) {
    const hit = Astronomy.SearchMoonPhase(p.angle, start, 1.05);
    if (hit && hit.date >= start && hit.date < end) { main = { key: p.key, at: hit.date }; break; }
  }

  let next: PhaseDay['next'] | null = null;
  for (const p of MAIN_PHASES) {
    const hit = Astronomy.SearchMoonPhase(p.angle, end, 10);
    if (hit && (!next || hit.date < next.at)) next = { key: p.key, name: p.name, at: hit.date };
  }

  const key: PhaseKey = main ? main.key : waxing ? 'waxing' : 'waning';
  const textPhase: LunarTextPhase =
    key === 'first' ? 'first_quarter' : key === 'last' ? 'last_quarter'
    : key === 'waning' ? (angle < 270 ? 'waning_gibbous' : 'waning_crescent')
    : key;
  return {
    key,
    textPhase,
    name: PHASE_NAME[key],
    exactAt: main?.at ?? null,
    moonLongitude: moonLon(main?.at ?? date),
    illuminationPct: Math.round(fraction * 100),
    waxing,
    angle,
    next: next!,
  };
}

/**
 * Red "Za tebe": u koju NATALNU kucu (Placidus, Ivan 27.9.2026) pada Mlad ili
 * Pun Mesec tog dana. Samo za te dve faze i samo kad je vreme rodjenja poznato —
 * bez njega kuce nisu pouzdane (pravilo 5). Tekst po kuci jos ne postoji, pa
 * ekran red ne prikazuje dok ga nema.
 */
export function lunationHouse(
  phase: PhaseDay,
  chart: NatalChart,
  timeUnknown: boolean
): { house: number; theme: string } | null {
  if (timeUnknown || (phase.key !== 'new' && phase.key !== 'full')) return null;
  const house = houseOf(phase.moonLongitude, chart.houses);
  return { house, theme: HOUSE_THEMES[house] };
}
