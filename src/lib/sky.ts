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
import { tr } from '@/i18n/jezik';
import { findAspects, moonPhase, type Aspect, type PlanetPosition } from '@/lib/astro';
import { ascendant, buildNatalChart, houseOf, obliquity, rightAscensionMC, type NatalChart } from '@/lib/natal';
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
  return tr().datum.sat(pomeren.getUTCHours(), pomeren.getUTCMinutes());
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

/**
 * Isti sat, dan izabran u kalendaru — po ZID-SATU tog mesta, kao `shiftDays`.
 * `mesec` je 1—12. Sat i minut ostaju oni koji su bili na ekranu.
 */
export function naDan(date: Date, tz: TimeZoneInfo, godina: number, mesec: number, dan: number): Date {
  const zid = zoneShift(date, tz);
  return localBirthToUtc(godina, mesec, dan, zid.getUTCHours(), zid.getUTCMinutes(), tz);
}

/*
 * Kalendar (`@react-native-community/datetimepicker`) radi u zoni UREDJAJA, a
 * ekran u zoni MESTA POSMATRANJA — korisniku u dijaspori to nisu iste zone.
 * Zato se kalendaru ne daje trenutak nego NOSILAC DANA: `Date` ciji su
 * lokalni dan, mesec i godina bas dan na zid-satu mesta. Iz kalendara se
 * cita samo taj dan (`izKalendara`), a sat se uzima sa ekrana. Nosilac nije
 * trenutak i ne sme u racun.
 */

/** Nosilac dana za kalendar. Podne, da ga letnje vreme uredjaja ne prebaci u drugi dan. */
export function danZaKalendar(date: Date, tz: TimeZoneInfo): Date {
  const zid = zoneShift(date, tz);
  return new Date(zid.getUTCFullYear(), zid.getUTCMonth(), zid.getUTCDate(), 12);
}

/** Dan izabran u kalendaru (nosilac) -> isti zid-sat mesta tog dana. */
export function izKalendara(date: Date, tz: TimeZoneInfo, izabrano: Date): Date {
  return naDan(date, tz, izabrano.getFullYear(), izabrano.getMonth() + 1, izabrano.getDate());
}

/** Da li je u kalendaru izabran bas dan koji je vec na ekranu. */
export function istiDanUKalendaru(date: Date, tz: TimeZoneInfo, izabrano: Date): boolean {
  const nosilac = danZaKalendar(date, tz);
  return nosilac.getFullYear() === izabrano.getFullYear()
    && nosilac.getMonth() === izabrano.getMonth()
    && nosilac.getDate() === izabrano.getDate();
}

/** Zvezdani dan u milisekundama: za toliko se ascendent obrne ceo krug. */
const ZVEZDANI_DAN_MS = 86_164_090.5;

/**
 * Trenutak u kome je ascendent za `stepeni` ISPRED (pozitivno) ili IZA (negativno) onog u `t0` — za
 * okretanje neba prstom na "Nebu" (Ivan, 8.10.2026): krug je ukljesten na ascendent (levo), pa se pri
 * promeni vremena okrece zodijak, i to NE ravnomerno (ascendent se krece 10—25° na sat, zavisno od znaka i
 * sirine). Zato se vreme ne racuna po 15° na sat, nego se trazi tacno ono u kome je ascendent tamo gde ga
 * prst vodi — krug prati prst.
 *
 * Ascendent raste sa vremenom (jedan krug = zvezdani dan), pa se resava bisekcijom unutar jednog dana, uz
 * cele krugove sa strane. Preko polarnog kruga (kuce padaju na Whole Sign) ascendent ne raste uvek,
 * pa tamo ide ravnomerno, 360° za zvezdani dan.
 */
export function vremeZaOkret(t0: Date, latitude: number, longitude: number, stepeni: number): Date {
  const celih = Math.floor(stepeni / 360);
  const ostatak = stepeni - celih * 360;
  const osnova = t0.getTime() + celih * ZVEZDANI_DAN_MS;
  if (Math.abs(latitude) > 66 || ostatak === 0) return new Date(osnova + (ostatak / 360) * ZVEZDANI_DAN_MS);

  const eps = obliquity(t0);
  const asc = (ms: number) => ascendant(rightAscensionMC(new Date(ms), longitude), latitude, eps);
  const asc0 = asc(t0.getTime());
  // Koliko je ascendent odmakao od `t0` (0..360), uz `ms` od `t0`.
  const odmak = (ms: number) => (((asc(t0.getTime() + ms) - asc0) % 360) + 360) % 360;

  let lo = 0;
  let hi = ZVEZDANI_DAN_MS;
  for (let i = 0; i < 26; i++) {
    const sredina = (lo + hi) / 2;
    if (odmak(sredina) < ostatak) lo = sredina;
    else hi = sredina;
  }
  return new Date(osnova + (lo + hi) / 2);
}
