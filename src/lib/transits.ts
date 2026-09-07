/**
 * Tranziti — aspekti izmedju DANASNJIH pozicija planeta i NATALNE karte.
 *
 * Ovo je razlika izmedju besplatnog i placenog sadrzaja:
 *   besplatno  = danasnje nebo prema suncevom znaku (12 varijanti dnevno)
 *   placeno    = danasnje nebo prema tvojoj karti  (jedinstveno po korisniku)
 *
 * Orbite su UZE nego kod natalnih aspekata. Natalni aspekt traje ceo zivot pa
 * podnosi 6—8 stepeni; tranzit treba da opise JEDAN dan, pa preko ~3 stepena
 * prestaje da bude dogadjaj i postaje pozadina.
 */
import { planetPositions, ASPECTS, type PlanetPosition, type PlanetKey, type AspectDef } from '@/lib/astro';
import { houseOf, type NatalChart } from '@/lib/natal';
import { norm360 } from '@/lib/zodiac';

/** Koliko je vazno da BAS TA planeta tranzitira. Spore planete = redji, jaci dogadjaji. */
const TRANSIT_WEIGHT: Record<PlanetKey, number> = {
  moon: 0.3, sun: 0.6, mercury: 0.5, venus: 0.5, mars: 0.7,
  jupiter: 0.9, saturn: 1.0, uranus: 1.0, neptune: 0.9, pluto: 1.0,
};

/** Koliko je vazno da je BAS TA natalna tacka pogodjena. Licne planete i uglovi = najvise. */
const NATAL_WEIGHT: Record<string, number> = {
  sun: 1.0, moon: 1.0, ascendant: 1.0, midheaven: 0.9,
  mercury: 0.7, venus: 0.7, mars: 0.7,
  jupiter: 0.5, saturn: 0.5, uranus: 0.3, neptune: 0.3, pluto: 0.3,
};

/** Orbite za tranzite, u stepenima. */
const TRANSIT_ORB: Record<string, number> = {
  conjunction: 3, opposition: 3, square: 3, trine: 3, sextile: 2,
};

export type NatalTarget = {
  key: string;
  name: string;
  glyph: string;
  longitude: number;
};

/** Natalne planete + ascendent i MC kao mete tranzita. */
export function natalTargets(chart: NatalChart): NatalTarget[] {
  return [
    ...chart.planets.map((p) => ({ key: p.key as string, name: p.name, glyph: p.glyph, longitude: p.longitude })),
    { key: 'ascendant', name: 'Ascendent', glyph: 'ASC', longitude: chart.houses.ascendant },
    { key: 'midheaven', name: 'Medium Coeli', glyph: 'MC', longitude: chart.houses.midheaven },
  ];
}

function angleDelta(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

export type Transit = {
  transiting: PlanetPosition;
  natal: NatalTarget;
  aspect: AspectDef;
  orb: number;
  applying: boolean;
  score: number;
  /** Kljuc u bazi tekstova, npr. "transit.saturn.square.natal.venus". */
  contentKey: string;
};

export function findTransits(chart: NatalChart, date: Date = new Date()): Transit[] {
  const transiting = planetPositions(date);
  const targets = natalTargets(chart);
  const out: Transit[] = [];

  for (const t of transiting) {
    for (const n of targets) {
      const separation = Math.abs(angleDelta(t.longitude, n.longitude));

      for (const aspect of ASPECTS) {
        const maxOrb = TRANSIT_ORB[aspect.key];
        const orb = Math.abs(separation - aspect.angle);
        if (orb > maxOrb) continue;

        // Natalna karta je nepomicna; aspekt jaca ako se tranzitna planeta priblizava.
        const future = Math.abs(
          Math.abs(angleDelta(t.longitude + t.speed / 24, n.longitude)) - aspect.angle
        );

        out.push({
          transiting: t,
          natal: n,
          aspect,
          orb,
          applying: future < orb,
          score: (1 - orb / maxOrb) * TRANSIT_WEIGHT[t.key] * (NATAL_WEIGHT[n.key] ?? 0.3),
          contentKey: `transit.${t.key}.${aspect.key}.natal.${n.key}`,
        });
        break;
      }
    }
  }

  return out.sort((a, b) => b.score - a.score);
}

export type HouseTransit = {
  transiting: PlanetPosition;
  house: number;
  score: number;
  /** npr. "transit.saturn.in.house.7" */
  contentKey: string;
};

/** Kroz koju natalnu kucu prolazi svaka planeta danas. */
export function findHouseTransits(chart: NatalChart, date: Date = new Date()): HouseTransit[] {
  return planetPositions(date)
    .map((t) => ({
      transiting: t,
      house: houseOf(t.longitude, chart.houses),
      score: TRANSIT_WEIGHT[t.key],
      contentKey: `transit.${t.key}.in.house.${houseOf(t.longitude, chart.houses)}`,
    }))
    .sort((a, b) => b.score - a.score);
}

/** Solarni povratak — kad Sunce sledeci put pogodi natalnu longitudu (rodjendan po karti). */
export function daysToSolarReturn(chart: NatalChart, date: Date = new Date()): number {
  const natalSun = chart.planets.find((p) => p.key === 'sun')!.longitude;
  const currentSun = planetPositions(date).find((p) => p.key === 'sun')!.longitude;
  const degreesToGo = norm360(natalSun - currentSun);
  return Math.round(degreesToGo / 0.9856); // Sunce prelazi ~0.9856°/dan
}
