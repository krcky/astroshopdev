/**
 * Sklapa dnevni horoskop — BIRA sta ulazi, ne pise tekst.
 *
 * Tekstovi dolaze sa servera (`lib/transit-texts.ts`), jer korpus astrologa
 * ne sme u aplikaciju. Ovde se samo racuna sta je danas jako i redja po
 * vaznosti.
 *
 * Ranije je ovde stajao stub od pet pasusa koje sam napisao dok nije bilo
 * pravog sadrzaja. Izbacen je: stajao je na vrhu ekrana i ostavljao utisak
 * da je glas astrologa.
 */
import { findAspects, planetPositions, moonPhase, type Aspect } from '@/lib/astro';
import {
  findTransits, findHouseTransits, pickHero, pickBrief, splitBySpeed, transitEnd, moonDay,
  type Brief, type MoonDay, type HeroHistory, type HeroPick, type Transit,
} from '@/lib/transits';
import { upcomingSkyEvents, type SkyEvent } from '@/lib/sky-events';
import type { ResolvedProfile } from '@/store/profile';

const DANI = ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota'];
/** Genitiv, za "do 14. novembra". */
const MESECI_GEN = [
  'januara', 'februara', 'marta', 'aprila', 'maja', 'juna',
  'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra',
];

/**
 * "do 14. novembra", a ako je druge godine "do 3. marta 2027." — kad tranzit
 * traje. `null` (iza horizonta od ~3 godine) daje "još godinama".
 */
export function formatUntil(end: Date | null, today: Date = new Date()): string {
  if (!end) return 'još godinama';
  return `do ${formatDay(end, today)}`;
}

/** "14. novembra", a druge godine "3. marta 2027." — genitiv, za "od" i "do". */
export function formatDay(day: Date, today: Date = new Date()): string {
  const godina = day.getFullYear() === today.getFullYear() ? '' : ` ${day.getFullYear()}.`;
  return `${day.getDate()}. ${MESECI_GEN[day.getMonth()]}${godina}`;
}
/** Skracena imena meseci, za kalendarski listic: "okt". */
export const MESECI_KRATKO = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];

/** "14:05" po lokalnom vremenu uredjaja. */
export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const MESECI = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
];

/**
 * "Četvrtak, 24. septembar".
 *
 * `utc` cita UTC polja umesto lokalnih. Sluzi ekranu "Trenutno na nebu": tamo
 * se datum ispisuje uz sat NAD GRADOM IZ PROFILA, pa se dobija pomeren trenutak
 * (`zoneShift`) ciji je zid-sat upisan u UTC polja. Bez toga bi korisniku u
 * Becu, sa kartom rodjenja u Beogradu, oko ponoci pisao sat jednog a datum
 * drugog dana.
 */
export function formatDate(date: Date, utc = false): string {
  const dan = utc ? date.getUTCDay() : date.getDay();
  const broj = utc ? date.getUTCDate() : date.getDate();
  const mesec = utc ? date.getUTCMonth() : date.getMonth();
  const s = `${DANI[dan]}, ${broj}. ${MESECI[mesec]}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}


/* ------------------------------------------------------------------------- *
 * PERSONALIZOVANI HOROSKOP — tranziti na natalnu kartu.
 * Ovo je placeni sadrzaj: jedinstven po korisniku, ne po znaku.
 * ------------------------------------------------------------------------- */

export type PersonalEntry = {
  transit: Transit;
};

export type SlowTransit = Transit & { endsOn: Date | null };

export type PersonalDaily = {
  date: Date;
  name: string;
  /** Kratak pregled neba — isti za sve. */
  skyline: string;
  /** Tranziti na licnu kartu, poredjani po jacini. */
  entries: PersonalEntry[];
  /**
   * Sta ide u Hero na pocetnom ekranu — waterfall prioriteta iz `transits.ts`
   * (vladar -> kljucne tacke -> najegzaktniji), bez Meseca, sa pauzom od 7
   * dana. Racuna se za lokalnu ponoc, pa je isti ceo dan. Prioritet 4 znaci
   * da Hero-a danas nema.
   */
  hero: HeroPick;
  /** Faza i znak Meseca danas — za karticu Mesec. */
  moon: { phase: string; sign: string; glyph: string };
  /**
   * Kartica Mesec: znak na pocetku dana, prelazak u sledeci i Mesecevi aspekti
   * koji postaju egzaktni tog dana, sa najjacim. Isti ceo dan.
   */
  moonDay: MoonDay;
  /** Sledece promene na nebu: ulazak u znak ili u retrogradnost, do tri planete, po datumu. */
  skyEvents: SkyEvent[];
  /** "Danas ukratko": ide ti / koci te, bez Hero-a i bez Meseca, po orbisu. */
  brief: Brief;
  /** Svi danasnji tranziti podeljeni na brze i spore planete, po orbisu. */
  bySpeed: {
    fast: Transit[];
    /** Spori nose i dokle traju — prvi izlazak iz orbisa, `null` iza ~3 godine. */
    slow: SlowTransit[];
  };
  /** Kroz koje natalne kuce prolaze spore planete danas. */
  houseHighlights: { house: number; planetName: string; glyph: string; contentKey: string }[];
};

export function buildPersonalDaily(
  resolved: ResolvedProfile,
  date: Date = new Date(),
  /** Dnevnik prikazanih Hero-a (`store/hero-log.ts`) — bez njega nema pauze. */
  heroHistory: HeroHistory = {}
): PersonalDaily {
  // Tekstovi se NE spajaju ovde — dolaze sa servera, jer korpus ne sme u
  // aplikaciju. Ovde se samo bira KOJI tranziti ulaze u danasnji horoskop.
  // SVI tranziti, ne samo najjacih nekoliko. Besplatna verzija pokazuje
  // kratko tumacenje svakog; placa se dubina, ne pristup.
  const entries: PersonalEntry[] = findTransits(resolved.chart, date)
    .map((transit) => ({ transit }));

  const houseHighlights = findHouseTransits(resolved.chart, date)
    .filter((t) => t.score >= 0.9) // samo spore planete — one prave temu perioda
    .slice(0, 3)
    .map((t) => ({
      house: t.house,
      planetName: t.transiting.name,
      glyph: t.transiting.glyph,
      contentKey: t.contentKey,
    }));

  // Stanje neba je RACUNAT podatak, ne pisan tekst — faza Meseca i koje su
  // planete retrogradne. Zato ostaje u aplikaciji.
  const nebo = planetPositions(date);
  const moon = nebo.find((p) => p.key === 'moon')!;
  const retro = nebo.filter((p) => p.retrograde);

  const hero = pickHero(resolved.chart, date, resolved.timeUnknown, heroHistory);
  const brief = pickBrief(entries.map((e) => e.transit), hero.transit?.contentKey ?? null);
  const podeljeno = splitBySpeed(entries.map((e) => e.transit));
  const bySpeed = {
    fast: podeljeno.fast,
    // Kraj se racuna samo sporima — brzi prodju za nekoliko dana i to nikog ne zanima.
    slow: podeljeno.slow.map((t) => ({ ...t, endsOn: transitEnd(t, date) })),
  };

  return {
    date,
    name: resolved.profile.name,
    hero,
    brief,
    bySpeed,
    moonDay: moonDay(resolved.chart, date, resolved.timeUnknown),
    skyEvents: upcomingSkyEvents(resolved.chart, date, resolved.timeUnknown),
    moon: { phase: moonPhase(date).name, sign: moon.position.sign.name, glyph: moon.position.sign.glyph },
    skyline:
      `Mesec u znaku ${moon.position.sign.name} · ${moonPhase(date).name}` +
      (retro.length ? ` · retrogradni: ${retro.map((r) => r.name).join(', ')}` : ''),
    entries,
    houseHighlights,
  };
}
