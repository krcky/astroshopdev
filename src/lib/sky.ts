/**
 * "Trenutno na nebu" — stanje neba SADA, nad jednim mestom.
 *
 * Tehnicki je to ista matematika kao natalna karta, samo sa `new Date()` umesto
 * datuma rodjenja, pa se `buildNatalChart` koristi bez izmene.
 *
 * VAZNO — ovde NEMA pretvaranja lokalnog vremena u UTC i zato nema ni pravila 4
 * iz CLAUDE.md. `Date` je vec trenutak u UTC-u; zona ulazi u pricu tek kad
 * treba NAPISATI koliko je sati nad tim mestom. Zbog toga ovaj ekran radi i za
 * zone za koje `isOffsetReliable()` kaze da im ne znamo istoriju: pogresna
 * zona bi pokvarila ispisan sat, ali ne i nijedan stepen na karti.
 *
 * Mesto je grad iz profila. Nije trazena GPS lokacija: kuce se pomeraju 1° na
 * svaka 4 minuta, pa razlika izmedju Beograda i Novog Sada na ekranu ni ne
 * postoji, a sistemska dozvola za lokaciju bi trazila i razlog i objasnjenje
 * u prodavnici.
 */
import { findAspects, moonPhase, type Aspect, type PlanetPosition } from '@/lib/astro';
import { buildNatalChart, houseOf, type NatalChart } from '@/lib/natal';
import { computeSkyPoints, isDayChart, type SkyPoint } from '@/lib/points';
import { localBirthToUtc, zoneOffsetMinutes, type TimeZoneInfo } from '@/lib/timezone';

export type SkyNow = {
  /** Trenutak za koji je sve izracunato. */
  date: Date;
  chart: NatalChart;
  /** Cvor, Lilit, Tacka srece — sa kucom u kojoj leze. */
  points: SkyPoint[];
  /** Aspekti izmedju planeta. Izvedene tacke NE ulaze — vidi `points.ts`. */
  aspects: Aspect[];
  retrograde: PlanetPosition[];
  moonPhaseName: string;
  /** Sunce iznad horizonta. Menja formulu za Tacku srece. */
  dayChart: boolean;
};

export function buildSky(date: Date, latitude: number, longitude: number): SkyNow {
  // Vreme je poznato do sekunde, pa Placidus ima smisla. Na sirinama preko
  // ~66° `computeHouses` sam prelazi na Whole Sign i to oznaci u `fellBack`.
  const chart = buildNatalChart({ date, latitude, longitude }, 'placidus');

  const sun = chart.planets.find((p) => p.key === 'sun')!;
  const moon = chart.planets.find((p) => p.key === 'moon')!;
  const dayChart = isDayChart(sun.house);

  const points = computeSkyPoints(
    date,
    chart.houses.ascendant,
    sun.longitude,
    moon.longitude,
    dayChart
  ).map((p) => ({ ...p, house: houseOf(p.longitude, chart.houses) }));

  return {
    date,
    chart,
    points,
    aspects: findAspects(chart.planets),
    retrograde: chart.planets.filter((p) => p.retrograde),
    moonPhaseName: moonPhase(date).name,
    dayChart,
  };
}

/**
 * Koliko je sati nad tim mestom, u obliku "01:35".
 *
 * Ne koristi `Intl.DateTimeFormat` direktno nego `zoneOffsetMinutes`, koji je
 * vec pokriven testom (`npm run check:timezone`) i ima rezervno pravilo za
 * slucaj da uredjaj nema punu Intl bazu.
 */
export function zoneClock(date: Date, tz: TimeZoneInfo): string {
  const pomeren = zoneShift(date, tz);
  const h = String(pomeren.getUTCHours()).padStart(2, '0');
  const m = String(pomeren.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Trenutak pomeren tako da mu UTC polja pokazuju zid-sat tog mesta.
 *
 * Rezultat NIJE ispravan trenutak i ne sme u racun — sluzi samo ispisu, i to
 * uvek preko UTC gettera (`formatDate(…, true)`). Postoji da bi sat i datum na
 * ekranu pripadali istom mestu: korisniku u dijaspori uredjaj je u jednoj zoni,
 * a grad iz profila u drugoj.
 */
export function zoneShift(date: Date, tz: TimeZoneInfo): Date {
  return new Date(date.getTime() + zoneOffsetMinutes(date, tz) * 60_000);
}

/**
 * Isti sat, drugi dan — po ZID-SATU tog mesta.
 *
 * Ne sme prosto `+ 24h`: u noci kad se sat pomera to bi dalo 23:00 umesto
 * 00:00 sledeceg dana, i korisnik bi video da mu dugme "dan >" promasuje sat.
 * Zato se pomeraj radi nad zid-vremenom, pa se rezultat vraca u UTC preko
 * `localBirthToUtc` — istog puta kojim ide i vreme rodjenja, sa istim
 * pravilima za letnje vreme.
 *
 * Sekunde otpadaju (pretvaranje ide preko sati i minuta), pa se "dan >" i
 * "dan <" ponistavaju u minut.
 *
 * Dugme za SAT namerno ne ide ovuda nego dodaje 60 stvarnih minuta: u satu koji
 * se ponovi pri prelasku na zimsko vreme isti zid-sat postoji dvaput, pa bi
 * pomeranje po zid-vremenu tu stajalo u mestu.
 */
export function shiftDays(date: Date, tz: TimeZoneInfo, days: number): Date {
  const zid = new Date(zoneShift(date, tz).getTime() + days * 86400_000);
  return localBirthToUtc(
    zid.getUTCFullYear(),
    zid.getUTCMonth() + 1,
    zid.getUTCDate(),
    zid.getUTCHours(),
    zid.getUTCMinutes(),
    tz
  );
}
