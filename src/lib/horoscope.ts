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
import { tr } from '@/i18n/jezik';
import { findAspects, planetPositions, moonPhase, type Aspect } from '@/lib/astro';
import {
  findTransits, findHouseTransits, pickHero, pickBrief, splitBySpeed, transitEnd, moonDay,
  type Brief, type MoonDay, type HeroHistory, type HeroPick, type Transit,
} from '@/lib/transits';
import { upcomingSkyEvents, type SkyEvent } from '@/lib/sky-events';
import type { ResolvedProfile } from '@/store/profile';

/*
 * DATUM JE SVUDA ISTOG OBLIKA (Ivan, 29.9.2026): "Uto, 29. sep 2026" —
 * skracen dan, broj sa tackom, skracen mesec malim slovima, godina bez tacke.
 * Mesta se razlikuju samo po tome sta nose (dan u nedelji, godina), ne po
 * obliku. Verzali ("TVOJ DAN · UTO, 29. SEP 2026") dolaze iz stila `oznaka`,
 * ne iz teksta. Datum se NE sklapa u ekranu — samo kroz funkcije ispod.
 * Imena i oblik su u recniku (`i18n/sr/datum.ts`), po jeziku.
 */

/** Skracena imena meseci: "okt" — iz recnika, po jeziku. */
export const mesecKratko = (m: number): string => tr().datum.mesecKratko[m];

/**
 * Jedini sklapac datuma. "29. sep", uz `dan` "Uto, 29. sep", uz `godina`
 * "29. sep 2026". `utc` cita UTC polja (vidi `formatDate`).
 */
export function datum(date: Date, { dan = false, godina = false, utc = false }: { dan?: boolean; godina?: boolean; utc?: boolean } = {}): string {
  return tr().datum.oblik({
    dan: dan ? (utc ? date.getUTCDay() : date.getDay()) : null,
    broj: utc ? date.getUTCDate() : date.getDate(),
    mesec: utc ? date.getUTCMonth() : date.getMonth(),
    godina: godina ? (utc ? date.getUTCFullYear() : date.getFullYear()) : null,
  });
}

/** Datum rodjenja iz profila (mesec 1—12): "10. jul 1990". */
export function datumRodjenja(b: { year: number; month: number; day: number }): string {
  return tr().datum.oblik({ dan: null, broj: b.day, mesec: b.month - 1, godina: b.year });
}

/**
 * "do 14. nov", a ako je druge godine "do 3. mar 2027" — kad tranzit
 * traje. `null` (iza horizonta od ~3 godine) daje "još godinama".
 */
export function formatUntil(end: Date | null, today: Date = new Date()): string {
  if (!end) return tr().datum.josGodinama;
  return tr().datum.doDana(formatDay(end, today));
}

/** "14. nov", a druge godine "3. mar 2027" — za "od" i "do". */
export function formatDay(day: Date, today: Date = new Date()): string {
  return datum(day, { godina: day.getFullYear() !== today.getFullYear() });
}

/**
 * Opseg trajanja tranzita: "13. sep – 26. sep". Kad se zavrsava u drugoj godini
 * nego sto je poceo, godina ide uz drugi datum: "13. dec – 26. jan 2027"
 * (Ivan, 28.9.2026). Verzale daje stil `oznaka` na mestu prikaza.
 */
export function opsegDatuma(start: Date, end: Date): string {
  return tr().datum.opseg(datum(start), datum(end, { godina: end.getFullYear() !== start.getFullYear() }));
}

/**
 * Sat u danu po jeziku: "14:05", na engleskom "2:05 PM". JEDINO mesto koje ispisuje vreme
 * (uz `zoneClock`); vreme rodjenja ide kroz `sat()`. Snimak karte za astrologa ostaje 24h.
 */
export function sat(hour: number, minute: number): string {
  return tr().datum.sat(hour, minute);
}

/** "14:05" po lokalnom vremenu uredjaja. */
export function formatTime(date: Date): string {
  return sat(date.getHours(), date.getMinutes());
}

/**
 * "Čet, 24. sep" — dan u nedelji, bez godine.
 *
 * `utc` cita UTC polja umesto lokalnih. Sluzi ekranu "Trenutno na nebu": tamo
 * se datum ispisuje uz sat NAD GRADOM IZ PROFILA, pa se dobija pomeren trenutak
 * (`zoneShift`) ciji je zid-sat upisan u UTC polja. Bez toga bi korisniku u
 * Becu, sa kartom rodjenja u Beogradu, oko ponoci pisao sat jednog a datum
 * drugog dana.
 */
export function formatDate(date: Date, utc = false): string {
  return datum(date, { dan: true, utc });
}

/** "Uto, 29. sep 2026" — dan u nedelji i godina (oznaka "Tvoj dan"). */
export function formatDatumKratko(date: Date): string {
  return datum(date, { dan: true, godina: true });
}

/** "28. sep 2026" — sa godinom, bez dana u nedelji. `utc` kao kod `formatDate`. */
export function formatDatum(date: Date, utc = false): string {
  return datum(date, { godina: true, utc });
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
    skyline: tr().danas.horoskop.nebo(moon.position.sign.name, moonPhase(date).name, retro.map((r) => r.name)),
    entries,
    houseHighlights,
  };
}
