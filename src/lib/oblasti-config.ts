/**
 * OCENE OBLASTI — sve vrednosti koje astrolog sme da menja, na jednom mestu.
 *
 * Racun je u `lib/oblasti.ts` i ne sadrzi nijedan broj koji nije ovde.
 * Ocena se prikazuje SAMO na pocetnoj, kartica iznad sazetka na slajdu "Danas ukratko"; tab
 * "Tranziti" je od 28.9.2026 obicna lista po vaznosti, bez oblasti (Ivan).
 *
 * Izvor: specifikacija ekrana "Tranziti" (Ivan, 28.9.2026). Sve je PREDLOG koji
 * ceka potvrdu astrologa. Opis za astrologa: `docs/ASTRO-LOGIKA.md`, poglavlje 11.
 */
import type { PlanetKey } from '@/lib/astro';
import type { Tone } from '@/lib/tone';

export type OblastKey = 'ljubav' | 'zdravlje' | 'karijera' | 'kuca';

export type OblastDef = {
  key: OblastKey;
  name: string;
  /** Ikona oblasti — isti emoji kao u lunarnom kalendaru (`LUNAR_AREAS`). */
  emoji: string;
  /** Kuce sa punom vezom. */
  houses: readonly number[];
  /** Kuce sa slabijom vezom (`VEZA.slabaKuca`). */
  weakHouses: readonly number[];
  /** Planete i tacke (`ascendant`, `midheaven`) — tranzitne ILI natalne. */
  points: readonly string[];
};

/** Tabela veze tranzita sa oblascu. */
export const OBLASTI: readonly OblastDef[] = [
  { key: 'ljubav', name: 'Ljubav', emoji: '❤️', houses: [5, 7], weakHouses: [], points: ['venus', 'moon', 'mars'] },
  { key: 'zdravlje', name: 'Zdravlje i lepota', emoji: '🌿', houses: [1, 6], weakHouses: [], points: ['sun', 'mars', 'ascendant'] },
  { key: 'karijera', name: 'Karijera i finansije', emoji: '💼', houses: [2, 10], weakHouses: [6, 8], points: ['jupiter', 'saturn', 'mercury', 'midheaven'] },
  { key: 'kuca', name: 'Kuća i bašta', emoji: '🏠', houses: [4], weakHouses: [], points: ['moon', 'saturn'] },
];

/**
 * Redosled oblasti na ekranu. Kad onboarding dobije korak sa interesovanjima,
 * njegov izbor se salje kao `redosled` / `iskljucene` u `oblastiDana`; ovo je
 * podrazumevano dok ga nema.
 */
export const PODRAZUMEVANI_REDOSLED: readonly OblastKey[] = ['ljubav', 'zdravlje', 'karijera', 'kuca'];

/** Jacina veze. Ako se poklopi vise pravila, uzima se NAJVECA. */
export const VEZA = {
  /** Tranzitna planeta prolazi kroz kucu oblasti, ili natalna tacka stoji u njoj. */
  kuca: 1.0,
  /** Isto, ali kroz slabiju kucu (karijera: 6 i 8). */
  slabaKuca: 0.5,
  /** Tranzitna ili natalna planeta je u listi planeta oblasti. */
  planeta: 0.5,
};

/** Jacina tranzitne planete (0—1). */
export const JACINA_PLANETE: Partial<Record<PlanetKey, number>> = {
  pluto: 1.0, neptune: 1.0, uranus: 1.0,
  saturn: 0.9, jupiter: 0.8, mars: 0.7,
  sun: 0.6, venus: 0.6, mercury: 0.6,
  // Mesec vazi samo ako se ukljuci `INCLUDE_MOON_TRANSITS`. NIJE iz specifikacije —
  // pretpostavka da ekran ne pukne; pre ukljucivanja pitati astrologa.
  moon: 0.5,
};

/** Jacina aspekta (0—1). */
export const JACINA_ASPEKTA: Record<string, number> = {
  conjunction: 1.0, opposition: 0.9, square: 0.9, trine: 0.7, sextile: 0.5,
};

/** Pogodjena (natalna) tacka koja pojacava tranzit, i za koliko. Vladar horoskopa se dodaje sam. */
export const KLJUCNE_TACKE: readonly string[] = ['sun', 'moon', 'ascendant', 'midheaven'];
export const KLJUCNA_TACKA_FAKTOR = 1.2;

/**
 * Blizina: 1 − BLIZINA_PAD × (udaljenost / orbis). Tacan aspekt daje 1,
 * ivica orbisa 1 − BLIZINA_PAD. Orbisi su isti kao za "Tvoj dan" (`TD_ORB`).
 */
export const BLIZINA_PAD = 0.5;

/** Ocena = OCENA_SREDINA + zbir doprinosa; doprinos = znak × jacina × veza × DOPRINOS_FAKTOR. */
export const OCENA_SREDINA = 3;
export const OCENA_MIN = 1;
export const OCENA_MAX = 5;
export const DOPRINOS_FAKTOR = 2;

/** Znak doprinosa po tonu. Mesovit tranzit se prikazuje, ali ne pomera ocenu. */
export const ZNAK_TONA: Record<Tone, number> = { povoljno: 1, izazovno: -1, mesovito: 0 };

/** Kratka oznaka uz ocenu. */
export const OZNAKA_OCENE: Record<number, string> = {
  5: 'Odličan dan', 4: 'Dobar dan', 3: 'Miran dan', 2: 'Oprezno', 1: 'Težak dan',
};

/**
 * Tranziti Meseca traju nekoliko sati i zatrpali bi listu — ne prikazuju se i
 * ne ulaze u ocene.
 */
export const INCLUDE_MOON_TRANSITS = false;

/** Mlad i Pun Mesec u natalnoj kuci — poseban red, samo na dan faze. */
export const LUNACIJA = {
  jacina: 0.5,
  new: { naslov: 'Novi početak', ton: 'povoljno' as Tone },
  full: { naslov: 'Vrhunac', ton: 'mesovito' as Tone },
};
