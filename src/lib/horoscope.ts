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
import { findTransits, findHouseTransits, type Transit } from '@/lib/transits';
import type { ResolvedProfile } from '@/store/profile';

const DANI = ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota'];
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

export type PersonalDaily = {
  date: Date;
  name: string;
  /** Kratak pregled neba — isti za sve. */
  skyline: string;
  /** Tranziti na licnu kartu, poredjani po jacini. */
  entries: PersonalEntry[];
  /** Kroz koje natalne kuce prolaze spore planete danas. */
  houseHighlights: { house: number; planetName: string; glyph: string; contentKey: string }[];
};

export function buildPersonalDaily(
  resolved: ResolvedProfile,
  date: Date = new Date()
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

  return {
    date,
    name: resolved.profile.name,
    skyline:
      `Mesec u znaku ${moon.position.sign.name} · ${moonPhase(date).name}` +
      (retro.length ? ` · retrogradni: ${retro.map((r) => r.name).join(', ')}` : ''),
    entries,
    houseHighlights,
  };
}
