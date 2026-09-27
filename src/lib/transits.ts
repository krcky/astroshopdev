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
import { planetPositions, bodyLongitude, ASPECTS, type PlanetPosition, type PlanetKey, type AspectDef } from '@/lib/astro';
import { houseOf, type NatalChart } from '@/lib/natal';
import { norm360, SIGNS, type ZodiacSign } from '@/lib/zodiac';

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
 * istom redosledu — OSIM na DAN EGZAKTNOSTI: dan kad je orbis manji nego dan
 * pre i dan posle. Vrhunac spore planete je dogadjaj koji se ne precutkuje.
 *
 * Ranije je pauzu probijao svaki dan sa orbisom ispod 0,3°. Spor Saturn je
 * ispod tog praga nedelju dana, pa je Hero bio isti ceo taj period (Ivanova
 * karta, Saturn kvadrat Mesec, 25—29.9.2026). Od 27.9.2026 (Ivan) probija
 * samo jedan dan; na istoj karti 13 razlicitih Hero-a u 15 dana.
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

/**
 * Najveci orbis na kom dan egzaktnosti jos probija pauzu. Lokalni minimum
 * orbisa postoji i kad planeta stane (stacionarna) daleko od tacnog aspekta —
 * to nije vrhunac i ne sme da ukine pauzu.
 */
export const EXACT_DAY_MAX_ORB = STRONG_ORB;

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

/** Da li je tranzit na pauzi: prikazan pre 1—7 dana, a danas mu nije dan egzaktnosti. */
function paused(t: Transit, history: HeroHistory, today: Date, exactToday: ReadonlySet<string>): boolean {
  const shown = history[t.contentKey];
  if (!shown) return false;
  const days = daysBetween(shown, today);
  if (days <= 0) return false; // prikazan danas — mora ostati isti ceo dan
  return days <= HERO_PAUSE_DAYS && !exactToday.has(t.contentKey);
}

/**
 * Kljucevi tranzita kojima je `date` DAN EGZAKTNOSTI: orbis u lokalnu ponoc
 * nije veci nego dan pre ni dan posle (i nije veci od `EXACT_DAY_MAX_ORB`).
 * Tranzit kog dan pre ili dan posle nema u orbisu je na ivici, ne na vrhuncu.
 */
export function exactDayKeys(chart: NatalChart, date: Date, today: Transit[]): Set<string> {
  const orbs = (d: Date) => {
    const m = new Map<string, number>();
    for (const t of findTransits(chart, localMidnight(d))) m.set(t.contentKey, t.orb);
    return m;
  };
  const dan = (o: number) => { const d = localMidnight(date); d.setDate(d.getDate() + o); return d; };
  const juce = orbs(dan(-1));
  const sutra = orbs(dan(1));
  const out = new Set<string>();
  for (const t of today) {
    const a = juce.get(t.contentKey);
    const b = sutra.get(t.contentKey);
    if (a !== undefined && b !== undefined && t.orb <= a && t.orb <= b && t.orb <= EXACT_DAY_MAX_ORB) out.add(t.contentKey);
  }
  return out;
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
  today: Date = new Date(),
  /** Kljucevi kojima je `today` dan egzaktnosti (`exactDayKeys`) — oni probijaju pauzu. */
  exactToday: ReadonlySet<string> = new Set()
): HeroPick {
  const usable = transits.filter(
    (t) =>
      // Mesec ima svoju karticu.
      t.transiting.key !== 'moon' &&
      // Bez vremena rodjenja ASC i MC otpadaju iz SVIH prioriteta — bolje
      // priznati nego staviti u Hero tranzit na tacku koja mozda nije tu.
      !(timeUnknown && (TIME_DEPENDENT as readonly string[]).includes(t.natal.key)) &&
      !paused(t, history, today, exactToday)
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
  const transits = findTransits(chart, localMidnight(date));
  // Susedni dani se racunaju samo ako ima sta da se probije — dnevnik prazan
  // (prvi dan, test) ne trazi jos dva prolaza kroz efemeride.
  const exact = Object.keys(history).length ? exactDayKeys(chart, date, transits) : new Set<string>();
  return pickHeroFrom(transits, heroRulers(chart, timeUnknown), timeUnknown, history, date, exact);
}

/**
 * Dnevnik kakav bi bio na dan `target` da je korisnik otvarao aplikaciju svaki
 * dan — za pregled drugih dana (dan-meni na pocetnoj).
 *
 * Bez ovoga bi pregled koristio DANASNJI dnevnik: sutra bi znalo samo za
 * danasnji Hero, prekosutra ne bi znalo za sutrasnji i ponovilo bi ga, a juce
 * bi videlo danasnji kao "prikazan kasnije" i pokazalo isti.
 *
 *   - danas: stvarni dnevnik, nepromenjen
 *   - buducnost: stvarni dnevnik, pa redom od sutra do dana pre `target` svaki
 *     dan bira Hero i upisuje ga — isto ono sto ce se desiti kad ti dani dodju
 *   - proslost: stvarni dnevnik ne pamti sta je tada bilo (kljuc cuva samo
 *     poslednji prikaz), pa se nedelja pre `target` odigra iz pocetka
 */
export function heroHistoryFor(
  chart: NatalChart,
  target: Date,
  history: HeroHistory,
  timeUnknown = false,
  today: Date = new Date()
): HeroHistory {
  const offset = daysBetween(dayKey(today), target);
  if (offset === 0) return history;
  const pocetak = offset > 0 ? 1 : offset - HERO_PAUSE_DAYS;
  const sim: HeroHistory = offset > 0 ? { ...history } : {};
  for (let o = pocetak; o < offset; o++) {
    const d = localMidnight(today);
    d.setDate(d.getDate() + o);
    const p = pickHero(chart, d, timeUnknown, sim);
    if (p.transit) sim[p.transit.contentKey] = dayKey(d);
  }
  return sim;
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
 * Kandidati za sazetak, poredjani po orbisu — SVI, ne prvih nekoliko.
 *
 * Ekran prikaze prva tri KOJA IMAJU tekst. Ogranicenje na pet kandidata je
 * jednom ostavilo "koci te" prazno: pet najegzaktnijih su bili tranziti na
 * ASC i MC, za koje tekstova nema.
 */
export function pickBrief(transits: Transit[], excludeKey: string | null = null): Brief {
  const cand = transits
    .filter((t) => t.transiting.key !== 'moon' && t.contentKey !== excludeKey)
    .sort((a, b) => a.orb - b.orb || Math.abs(a.transiting.speed) - Math.abs(b.transiting.speed));
  return {
    ide: cand.filter((t) => briefBucket(t) === 'ide'),
    koci: cand.filter((t) => briefBucket(t) === 'koci'),
  };
}

/* ------------------------------------------------------------------------- *
 * BRZI I SPORI — dve liste na pocetnom ekranu.
 *
 * Brze planete (Mesec, Sunce, Merkur, Venera, Mars) menjaju se iz dana u dan;
 * spore (Jupiter, Saturn, Uran, Neptun, Pluton) drze temu mesecima. Podela je
 * Ivanova specifikacija pocetnog ekrana (26.9.2026). Redosled unutar grupe je
 * po egzaktnosti, isto kao Hero i sazetak.
 * ------------------------------------------------------------------------- */

const FAST: readonly PlanetKey[] = ['moon', 'sun', 'mercury', 'venus', 'mars'];

export type BySpeed = { fast: Transit[]; slow: Transit[] };

export function splitBySpeed(transits: Transit[]): BySpeed {
  const byOrb = [...transits].sort(
    (a, b) => a.orb - b.orb || Math.abs(a.transiting.speed) - Math.abs(b.transiting.speed)
  );
  return {
    fast: byOrb.filter((t) => FAST.includes(t.transiting.key)),
    slow: byOrb.filter((t) => !FAST.includes(t.transiting.key)),
  };
}

/* ------------------------------------------------------------------------- *
 * DOKLE TRANZIT TRAJE.
 *
 * Natalna tacka miruje, pa se gleda samo tranzitna planeta: kog dana joj orbis
 * prvi put predje dozvoljeni. Korak je 5 dana, pa se poslednji prozor prodje
 * dan po dan — 10 puta manje racuna nego dan po dan od pocetka, a rezultat je
 * isti dan.
 *
 * Retrogradnost: spora planeta ume da izadje iz orbisa, vrati se i izadje
 * ponovo. Ovde se vraca PRVI izlazak — "dokle traje ovaj prolaz", ne "kad se
 * zauvek zavrsava". Horizont je ~3 godine; iza njega je `null` (Pluton na
 * konjunkciji ume da stoji i duze).
 * ------------------------------------------------------------------------- */

/** Dokle unapred se trazi kraj, u danima. */
const END_HORIZON_DAYS = 1100;
const END_STEP_DAYS = 5;

/** Poslednji dan (lokalna ponoc) u kom je tranzit jos u orbisu, ili null ako je iza horizonta. */
export function transitEnd(t: Transit, from: Date = new Date()): Date | null {
  const maxOrb = TRANSIT_ORB[t.aspect.key];
  const start = localMidnight(from);
  const orbOn = (days: number) => {
    const d = new Date(start); d.setDate(start.getDate() + days);
    const sep = Math.abs(angleDelta(bodyLongitude(t.transiting.key, d), t.natal.longitude));
    return Math.abs(sep - t.aspect.angle);
  };
  let lastIn = 0;
  for (let d = END_STEP_DAYS; d <= END_HORIZON_DAYS; d += END_STEP_DAYS) {
    if (orbOn(d) > maxOrb) {
      // Izasao negde u poslednjih 5 dana — nadji tacan dan.
      for (let k = lastIn + 1; k < d; k++) {
        if (orbOn(k) > maxOrb) break;
        lastIn = k;
      }
      const out = new Date(start); out.setDate(start.getDate() + lastIn);
      return out;
    }
    lastIn = d;
  }
  return null;
}

/* ------------------------------------------------------------------------- *
 * KARTICA MESEC — faza, znak i najjaci Mesecev tranzit DANA.
 *
 * Mesec obidje ceo zodijak za ~27 dana (12—15° na dan), pa njegov tranzit u
 * orbisu traje ~11 sati. Trenutak u kom se gleda bi zato odlucivao sta kartica
 * pokazuje: ujutru jedno, uvece drugo. Umesto toga se traze aspekti koji
 * postaju EGZAKTNI tokom tog lokalnog dana (ponoc—ponoc), sa satom — kartica je
 * ista ceo dan, kao i Hero.
 *
 * "Najjaci" (moj izbor, 27.9.2026, ceka potvrdu astrologa): prvo tezina natalne
 * mete (`NATAL_WEIGHT` — Sunce, Mesec, ASC pre ostalih), pa jacina aspekta
 * (`MOON_ASPECT_RANK`), pa raniji sat. Orbis ovde ne odlucuje: svi su egzaktni.
 *
 * Mesec je uvek direktan, pa je racun jednostavan: tacka aspekta P se pogodi
 * tog dana ako je Mesecu do nje ostalo manje nego sto ce preci do ponoci.
 * ------------------------------------------------------------------------- */

/** Jacina aspekta kad se mete izjednace po tezini: manji broj = jaci. */
const MOON_ASPECT_RANK: Record<string, number> = {
  conjunction: 0, opposition: 1, square: 2, trine: 3, sextile: 4,
};

export type MoonHit = Transit & { exactAt: Date };

export type MoonDay = {
  /** Znak u kom je Mesec u ponoc na pocetku dana. */
  sign: ZodiacSign;
  /** Prelazak u sledeci znak tokom dana, ako ga ima (Mesec menja znak na ~2,5 dana). */
  ingress: { at: Date; sign: ZodiacSign } | null;
  /** Svi Mesecevi aspekti na natalnu kartu koji postaju egzaktni tog dana, po satu. */
  hits: MoonHit[];
  /** Najjaci od njih, ili null ako tog dana nijedan ne postaje egzaktan. */
  strongest: MoonHit | null;
};

/**
 * Trenutak u [start, end) kad Mesec prede `delta` stepeni od `from`.
 * Polovljenje intervala: 20 koraka daje manje od desetinke sekunde.
 */
function moonAdvance(start: Date, end: Date, from: number, delta: number): Date {
  let lo = start.getTime();
  let hi = end.getTime();
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (norm360(bodyLongitude('moon', new Date(mid)) - from) < delta) lo = mid;
    else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

/** Mesec tog lokalnog dana prema natalnoj karti. `date` se svodi na lokalnu ponoc. */
export function moonDay(chart: NatalChart, date: Date = new Date(), timeUnknown = false): MoonDay {
  const start = localMidnight(date);
  // Sledeca ponoc preko kalendara, ne +24h — dan promene sata ima 23 ili 25 sati.
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  const from = bodyLongitude('moon', start);
  const travel = norm360(bodyLongitude('moon', end) - from);

  const signIndex = Math.floor(from / 30);
  const toBoundary = norm360((signIndex + 1) * 30 - from);
  const ingress = toBoundary < travel
    ? { at: moonAdvance(start, end, from, toBoundary), sign: SIGNS[(signIndex + 1) % 12] }
    : null;

  const targets = natalTargets(chart).filter(
    (n) => !(timeUnknown && (TIME_DEPENDENT as readonly string[]).includes(n.key))
  );
  const hits: MoonHit[] = [];
  for (const n of targets) {
    for (const aspect of ASPECTS) {
      // Svaki aspekt osim konjunkcije i opozicije ima dve tacke: ispred i iza mete.
      const points = aspect.angle === 0 || aspect.angle === 180
        ? [n.longitude + aspect.angle]
        : [n.longitude + aspect.angle, n.longitude - aspect.angle];
      for (const p of points) {
        const delta = norm360(p - from);
        if (delta >= travel) continue;
        const exactAt = moonAdvance(start, end, from, delta);
        const moon = planetPositions(exactAt).find((x) => x.key === 'moon')!;
        hits.push({
          transiting: moon,
          natal: n,
          aspect,
          orb: Math.abs(Math.abs(angleDelta(moon.longitude, n.longitude)) - aspect.angle),
          applying: false,
          score: TRANSIT_WEIGHT.moon * (NATAL_WEIGHT[n.key] ?? 0.3),
          contentKey: `transit.moon.${aspect.key}.natal.${n.key}`,
          exactAt,
        });
      }
    }
  }
  hits.sort((a, b) => a.exactAt.getTime() - b.exactAt.getTime());

  const strongest = [...hits].sort(
    (a, b) =>
      b.score - a.score ||
      MOON_ASPECT_RANK[a.aspect.key] - MOON_ASPECT_RANK[b.aspect.key] ||
      a.exactAt.getTime() - b.exactAt.getTime()
  )[0] ?? null;

  return { sign: SIGNS[signIndex], ingress, hits, strongest };
}
