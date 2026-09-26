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

/* ------------------------------------------------------------------------- *
 * TRANZIT DANA — izbor onoga sto ide u Hero na pocetnom ekranu.
 *
 * Sistem prioriteta (waterfall), Ivanova specifikacija od 26.9.2026. Ide se
 * redom i staje na prvom prioritetu koji ima pogodak:
 *
 *   1. tranzit na VLADARA Ascendenta ili Sunca, ali samo JAK (orb <= 1,5°)
 *   2. tranzit na Ascendent, MC, Sunce ili Mesec
 *   3. najegzaktniji tranzit na bilo koju natalnu planetu
 *   4. nista od toga -> Hero se ne prikazuje
 *
 * Unutar prioriteta pobedjuje NAJMANJI ORBIS, ne skor iz `findTransits`.
 * Skor mesa tesnocu sa tezinama tela, pa bi Saturn na ivici orbisa pobedio
 * Veneru tacno na uglu; specifikacija trazi egzaktnost. Izjednacenje resava
 * sporija planeta (redji dogadjaj).
 *
 * MESEC NE ULAZI U HERO. Ima svoju karticu na pocetnom ekranu (faza, znak,
 * njegov najjaci tranzit), pa bi se ponavljao. Uz to, Mesecev tranzit traje
 * ~11 sati i tacno na uglu bi tukao sve u prvom prioritetu.
 *
 * PAUZA OD 7 DANA. Spor tranzit u orbisu stoji nedeljama i bez pauze bi bio
 * Hero svaki dan (simulacija na test karti: 50 od 60 dana isti Uran). Tranzit
 * prikazan u poslednjih 7 dana se preskace i pusta se sledeci kandidat po
 * istom redosledu — OSIM ako je danas na vrhuncu (orb < 0,3°): vrhunac spore
 * planete je dogadjaj koji se ne precutkuje. Ista simulacija sa pauzom: 46
 * promena u 60 dana, nijedan dan bez Hero-a.
 *
 * Racuna se za LOKALNU PONOC tog dana, ne za sadasnji trenutak: Hero mora da
 * bude isti ceo dan. Kljuc prikazan DANAS nikad nije "na pauzi" — inace bi se
 * posle upisa u dnevnik Hero promenio pred ocima korisnika.
 * ------------------------------------------------------------------------- */

/**
 * Prag "jakog" aspekta za prvi prioritet — polovina tranzitnog orbisa.
 * Bez praga bi vladar skoro uvek imao neki aspekt i nizi prioriteti ne bi
 * dolazili na red. Odluceno 26.9.2026: 1,5°.
 */
export const STRONG_ORB = 1.5;

/** Koliko dana tranzit ceka posle prikaza pre nego sto sme ponovo u Hero. */
export const HERO_PAUSE_DAYS = 7;

/** Orbis ispod kog je tranzit "na vrhuncu" i probija pauzu. */
export const PEAK_ORB = 0.3;

/** Kljucne tacke karte za drugi prioritet. */
const KEY_POINTS = ['ascendant', 'midheaven', 'sun', 'moon'] as const;

/** Mete koje zavise od vremena rodjenja — bez njega nisu pouzdane. */
const TIME_DEPENDENT = ['ascendant', 'midheaven'] as const;

export type HeroPriority = 1 | 2 | 3 | 4;

export type HeroPick =
  | {
      priority: 1 | 2 | 3;
      transit: Transit;
      /** Zasto bas ovaj — za prikaz i za dnevnik. Npr. "vladar Ascendenta (Ovan) je Mars". */
      reason: string;
    }
  | { priority: 4; transit: null; reason: string };

/**
 * Dnevnik prikazanih Hero-a: contentKey -> dan prikaza (`dayKey`).
 * Zivi u `store/hero-log.ts`; ovde je samo oblik, da izbor ostane cista funkcija.
 */
export type HeroHistory = Record<string, string>;

/** Ponoc tog dana po lokalnom vremenu uredjaja. */
export function localMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "2026-09-26" po lokalnom vremenu — kljuc dana u dnevniku. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Ceo broj dana od `from` do `to`, po lokalnim ponocima (0 = isti dan). */
export function daysBetween(from: string, to: Date): number {
  const [y, m, d] = from.split('-').map(Number);
  const a = new Date(y, m - 1, d).getTime();
  const b = localMidnight(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Vladari koji ulaze u prvi prioritet, sa objasnjenjem.
 *
 * Bez vremena rodjenja Ascendent nije pouzdan, pa se gleda samo vladar Sunca.
 * Vladar moze biti isto telo kao Sunce ili Mesec (Lav -> Sunce, Rak -> Mesec);
 * tada se prvi i drugi prioritet preklapaju i pobedjuje prvi, sto je u redu.
 */
export function heroRulers(
  chart: NatalChart,
  timeUnknown = false
): { key: string; reason: string }[] {
  const out: { key: string; reason: string }[] = [];
  if (!timeUnknown) {
    const s = chart.ascendantSign.sign;
    out.push({ key: s.rulerKey, reason: `vladar Ascendenta (${s.name}) je ${s.ruler}` });
  }
  const sun = chart.planets.find((p) => p.key === 'sun')!.position.sign;
  if (!out.some((r) => r.key === sun.rulerKey)) {
    out.push({ key: sun.rulerKey, reason: `vladar Sunca (${sun.name}) je ${sun.ruler}` });
  }
  return out;
}

/** Najmanji orbis; pri izjednacenju sporija tranzitna planeta. */
function mostExact(list: Transit[]): Transit | undefined {
  return [...list].sort(
    (a, b) => a.orb - b.orb || Math.abs(a.transiting.speed) - Math.abs(b.transiting.speed)
  )[0];
}

/** Da li je tranzit na pauzi: prikazan pre 1—7 dana, a nije na vrhuncu. */
function paused(t: Transit, history: HeroHistory, today: Date): boolean {
  const shown = history[t.contentKey];
  if (!shown) return false;
  const days = daysBetween(shown, today);
  if (days <= 0) return false; // prikazan danas — mora ostati isti ceo dan
  return days <= HERO_PAUSE_DAYS && t.orb >= PEAK_ORB;
}

/**
 * Cist izbor iz vec izracunate liste — bez efemerida i bez store-a, da moze u test.
 * `transits` je ono sto vrati `findTransits` za lokalnu ponoc.
 */
export function pickHeroFrom(
  transits: Transit[],
  rulers: { key: string; reason: string }[],
  timeUnknown = false,
  history: HeroHistory = {},
  today: Date = new Date()
): HeroPick {
  const usable = transits.filter(
    (t) =>
      // Mesec ima svoju karticu.
      t.transiting.key !== 'moon' &&
      // Bez vremena rodjenja ASC i MC otpadaju iz SVIH prioriteta — bolje
      // priznati nego staviti u Hero tranzit na tacku koja mozda nije tu.
      !(timeUnknown && (TIME_DEPENDENT as readonly string[]).includes(t.natal.key)) &&
      !paused(t, history, today)
  );

  // 1. vladar, samo jak aspekt
  const naVladara = usable.filter(
    (t) => t.orb <= STRONG_ORB && rulers.some((r) => r.key === t.natal.key)
  );
  const p1 = mostExact(naVladara);
  if (p1) {
    const r = rulers.find((r) => r.key === p1.natal.key)!;
    return { priority: 1, transit: p1, reason: r.reason };
  }

  // 2. Ascendent, MC, Sunce, Mesec
  const p2 = mostExact(usable.filter((t) => (KEY_POINTS as readonly string[]).includes(t.natal.key)));
  if (p2) return { priority: 2, transit: p2, reason: `tranzit na natalni ${p2.natal.name}` };

  // 3. najegzaktniji na bilo koju natalnu planetu
  const p3 = mostExact(usable);
  if (p3) return { priority: 3, transit: p3, reason: `najegzaktniji tranzit dana, orb ${p3.orb.toFixed(1)}°` };

  // 4. nista — Hero se ne prikazuje
  return { priority: 4, transit: null, reason: 'nema licnih tranzita u orbisu' };
}

/** Tranzit dana za datu kartu. `date` se svodi na lokalnu ponoc. */
export function pickHero(
  chart: NatalChart,
  date: Date = new Date(),
  timeUnknown = false,
  history: HeroHistory = {}
): HeroPick {
  return pickHeroFrom(
    findTransits(chart, localMidnight(date)),
    heroRulers(chart, timeUnknown),
    timeUnknown,
    history,
    date
  );
}

/* ------------------------------------------------------------------------- *
 * DANAS UKRATKO — "ide ti" i "koci te", po tri kratke recenice.
 *
 * Korpus ne deli tranzite na dobre i lose: svaki tekst ima i `positive` i
 * `challenge` recenicu. Podela je zato po ASPEKTU (astroloska konvencija, list
 * "4 Aspekti" u brief tabeli): trigon i sekstil su skladni, kvadrat i opozicija
 * napeti. Konjunkcija je "najjaca mesavina" i sama po sebi nije ni jedno ni
 * drugo, pa je deli TRANZITNA planeta: Sunce, Merkur, Venera i Jupiter idu u
 * "ide ti", Mars, Saturn, Uran, Neptun i Pluton u "koci te".
 *
 * PRAVILO ZA KONJUNKCIJU CEKA POTVRDU ASTROLOGA (26.9.2026). Ako ga promeni,
 * menja se samo `BENEFIC` ispod.
 *
 * Mesec ne ulazi (ima svoju karticu, a tekstova za njega jos nema). Hero se
 * izostavlja da se isti tranzit ne pojavi dvaput na ekranu. Unutar grupe
 * redosled je po egzaktnosti, kao i Hero.
 * ------------------------------------------------------------------------- */

export type BriefBucket = 'ide' | 'koci';

/** Tranzitne planete cija konjunkcija ide u "ide ti". */
const BENEFIC: readonly PlanetKey[] = ['sun', 'mercury', 'venus', 'jupiter'];

/** U koju grupu sazetka ide tranzit. */
export function briefBucket(t: Transit): BriefBucket {
  switch (t.aspect.key) {
    case 'trine':
    case 'sextile':
      return 'ide';
    case 'square':
    case 'opposition':
      return 'koci';
    default:
      return BENEFIC.includes(t.transiting.key) ? 'ide' : 'koci';
  }
}

export type Brief = { ide: Transit[]; koci: Transit[] };

/**
 * Kandidati za sazetak, do `limit` po grupi, poredjani po orbisu.
 *
 * Vraca se vise od tri jer neki tranziti nemaju tekst (ASC, MC, rupe u
 * korpusu); ekran prikaze prva tri KOJA IMAJU tekst.
 */
export function pickBrief(transits: Transit[], excludeKey: string | null = null, limit = 5): Brief {
  const cand = transits
    .filter((t) => t.transiting.key !== 'moon' && t.contentKey !== excludeKey)
    .sort((a, b) => a.orb - b.orb || Math.abs(a.transiting.speed) - Math.abs(b.transiting.speed));
  return {
    ide: cand.filter((t) => briefBucket(t) === 'ide').slice(0, limit),
    koci: cand.filter((t) => briefBucket(t) === 'koci').slice(0, limit),
  };
}
