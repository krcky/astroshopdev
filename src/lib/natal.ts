/**
 * Natalna karta — ascendent, MC i kuce.
 *
 * astronomy-engine daje pozicije planeta ali NE daje kuce; ovo je matematika
 * koju moramo sami. Sve je u ECT sistemu (prava ekliptika datuma), isto kao
 * `astro.ts`, da bi se pozicije i kuce mogle porediti.
 *
 * Placidus je standard u zapadnoj astrologiji, ali se RASPADA blizu polova
 * (iznad ~66.5 stepeni geografske sirine tacke nikad ne izlaze/zalaze).
 * Tada automatski padamo na Whole Sign i to je oznaceno u rezultatu.
 */
import * as Astronomy from 'astronomy-engine';
import { norm360, signFromLongitude, SIGNS, type SignPosition } from '@/lib/zodiac';
import { planetPositions, type PlanetPosition } from '@/lib/astro';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const sin = (d: number) => Math.sin(d * DEG);
const cos = (d: number) => Math.cos(d * DEG);
const tan = (d: number) => Math.tan(d * DEG);
const asin = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) * RAD;
const atan2 = (y: number, x: number) => Math.atan2(y, x) * RAD;

export type BirthData = {
  /** Trenutak rodjenja. Mora biti tacan UTC — greska od 4 minuta pomeri ASC za 1 stepen. */
  date: Date;
  /** Geografska sirina, + sever. */
  latitude: number;
  /** Geografska duzina, + istok. */
  longitude: number;
};

/** Prava nagnutost ekliptike u trenutku, u stepenima. */
export function obliquity(date: Date): number {
  return Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl;
}

/**
 * RAMC — rektascenzija Medium Coeli (tacke na meridijanu), u stepenima.
 * To je lokalno zvezdano vreme izrazeno u stepenima.
 */
export function rightAscensionMC(date: Date, longitude: number): number {
  const gast = Astronomy.SiderealTime(date); // Greenwich, u zvezdanim satima
  return norm360((gast + longitude / 15) * 15);
}

/** Ekliptička longituda tacke NA EKLIPTICI koja ima datu rektascenziju. */
function eclipticFromRA(ra: number, eps: number): number {
  return norm360(atan2(sin(ra), cos(ra) * cos(eps)));
}

/** Medium Coeli — presek meridijana i ekliptike. */
export function midheaven(ramc: number, eps: number): number {
  return eclipticFromRA(ramc, eps);
}

/** Ascendent — tacka ekliptike koja izlazi na istocnom horizontu. */
export function ascendant(ramc: number, latitude: number, eps: number): number {
  return norm360(
    atan2(cos(ramc), -(sin(ramc) * cos(eps) + tan(latitude) * sin(eps)))
  );
}

export type HouseSystem = 'placidus' | 'whole-sign';

/**
 * Placidus medjukuspide (11, 12, 2, 3) resavaju se iterativno — nemaju
 * zatvorenu formu. Definicija: kuspida je tacka ciji je casovni ugao od MC
 * jednak zadatom delu njenog poludnevnog (ili polunocnog) luka.
 *
 * Vraca null ako tacka nikad ne izlazi (blizu polova) — tada Placidus ne postoji.
 */
function placidusIntermediate(
  ramc: number,
  latitude: number,
  eps: number,
  /** 11 | 12 | 2 | 3 */
  house: 11 | 12 | 2 | 3
): number | null {
  // n/3 dela luka; kuce 11 i 12 nad horizontom (poludnevni luk),
  // kuce 2 i 3 pod horizontom (polunocni luk, mereno unazad od IC).
  const above = house === 11 || house === 12;
  const n = house === 11 || house === 3 ? 1 : 2;

  let ra = ramc + (above ? n * 30 : 180 - n * 30);

  for (let i = 0; i < 100; i++) {
    const lambda = eclipticFromRA(ra, eps);
    const decl = asin(sin(eps) * sin(lambda));
    const t = tan(latitude) * tan(decl);
    if (Math.abs(t) > 1) return null; // cirkumpolarno — Placidus nije definisan
    const ad = asin(t); // ascenziona razlika

    // above: RA - RAMC = (n/3)(90 + AD)      poludnevni luk
    // below: RA - RAMC = 180 - (n/3)(90 - AD) polunocni luk
    const next = above
      ? ramc + (n / 3) * (90 + ad)
      : ramc + 180 - (n / 3) * (90 - ad);

    if (Math.abs(next - ra) < 1e-10) {
      ra = next;
      break;
    }
    ra = next;
  }

  return eclipticFromRA(ra, eps);
}

export type Houses = {
  system: HouseSystem;
  /** 12 kuspida u stepenima, indeks 0 = 1. kuca (ascendent). */
  cusps: number[];
  ascendant: number;
  midheaven: number;
  /** true ako je Placidus trazen ali nije bio moguc (polarna sirina). */
  fellBack: boolean;
};

export function computeHouses(
  birth: BirthData,
  system: HouseSystem = 'placidus'
): Houses {
  const eps = obliquity(birth.date);
  const ramc = rightAscensionMC(birth.date, birth.longitude);
  const asc = ascendant(ramc, birth.latitude, eps);
  const mc = midheaven(ramc, eps);

  const wholeSign = (): number[] => {
    // Cela 1. kuca je znak u kom je ascendent, od 0 stepeni tog znaka.
    const start = Math.floor(asc / 30) * 30;
    return Array.from({ length: 12 }, (_, i) => norm360(start + i * 30));
  };

  if (system === 'whole-sign') {
    return { system, cusps: wholeSign(), ascendant: asc, midheaven: mc, fellBack: false };
  }

  const c11 = placidusIntermediate(ramc, birth.latitude, eps, 11);
  const c12 = placidusIntermediate(ramc, birth.latitude, eps, 12);
  const c2 = placidusIntermediate(ramc, birth.latitude, eps, 2);
  const c3 = placidusIntermediate(ramc, birth.latitude, eps, 3);

  if (c11 === null || c12 === null || c2 === null || c3 === null) {
    return { system: 'whole-sign', cusps: wholeSign(), ascendant: asc, midheaven: mc, fellBack: true };
  }

  // Kuce 4-9 su tacne opozicije kuca 10-3.
  const cusps = [
    asc,               // 1
    c2,                // 2
    c3,                // 3
    norm360(mc + 180), // 4 (IC)
    norm360(c11 + 180),// 5
    norm360(c12 + 180),// 6
    norm360(asc + 180),// 7
    norm360(c2 + 180), // 8
    norm360(c3 + 180), // 9
    mc,                // 10
    c11,               // 11
    c12,               // 12
  ];

  return { system: 'placidus', cusps, ascendant: asc, midheaven: mc, fellBack: false };
}

/** U kojoj kuci (1—12) lezi data ekliptička longituda. */
export function houseOf(longitude: number, houses: Houses): number {
  const lon = norm360(longitude);
  for (let i = 0; i < 12; i++) {
    const start = houses.cusps[i];
    const end = houses.cusps[(i + 1) % 12];
    const span = norm360(end - start);
    const offset = norm360(lon - start);
    if (offset < span) return i + 1;
  }
  return 1;
}

export type NatalPlanet = PlanetPosition & { house: number };

export type NatalChart = {
  birth: BirthData;
  houses: Houses;
  planets: NatalPlanet[];
  ascendantSign: SignPosition;
  midheavenSign: SignPosition;
};

export function buildNatalChart(
  birth: BirthData,
  system: HouseSystem = 'placidus'
): NatalChart {
  const houses = computeHouses(birth, system);
  const planets = planetPositions(birth.date).map((p) => ({
    ...p,
    house: houseOf(p.longitude, houses),
  }));

  return {
    birth,
    houses,
    planets,
    ascendantSign: signFromLongitude(houses.ascendant),
    midheavenSign: signFromLongitude(houses.midheaven),
  };
}

/** Sunčev znak — ono sto ljudi zovu "moj znak". */
export function sunSign(chart: NatalChart) {
  return chart.planets.find((p) => p.key === 'sun')!.position.sign;
}

export { SIGNS };
